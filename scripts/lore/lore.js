'use strict';
/**
 * How wide a lore line may be. The tooltip has no fixed character count, so the limit is in pixels: 44 characters of
 * average English text in the default font. Shared by the book generator and the tests of item lore.
 */
const fs = require('fs');
const path = require('path');
const { loadFonts, DEFAULT_FONT } = require('../fonts/fonts.js');

const FONTS = loadFonts();
const LORE_WIDTH = 44;

// Letter frequencies in percent, and a space for about 18% of the characters
const ENGLISH = { e: 12.7, t: 9.1, a: 8.2, o: 7.5, i: 7.0, n: 6.7, s: 6.3, h: 6.1, r: 6.0, d: 4.3, l: 4.0, c: 2.8, u: 2.8, m: 2.4, w: 2.4, f: 2.2, g: 2.0, y: 2.0, p: 1.9, b: 1.5, v: 1.0, k: 0.8, j: 0.15, x: 0.15, q: 0.1, z: 0.07, ' ': 22 };

const glyphWidth = (ch, bold = false) => FONTS.widthOf(DEFAULT_FONT, ch, bold);

// Width in pixels of plain text, bold glyphs are a pixel wider
const loreWidth = (text, bold = false) => [...text].reduce((sum, ch) => sum + glyphWidth(ch, bold), 0);

const weights = Object.entries(ENGLISH);
const LORE_PIXELS = Math.round((LORE_WIDTH * weights.reduce((sum, [ch, f]) => sum + f * glyphWidth(ch), 0)) / weights.reduce((sum, [, f]) => sum + f, 0));

// The lang files of the resource pack, { locale: { key: template } } over all namespaces, read when first needed so a
// build that has just written them is seen
let langs = null;
function langsOf() {
    if (langs) return langs;
    langs = {};
    const assets = path.join(__dirname, '..', '..', 'texturepack', 'assets');
    for (const ns of fs.existsSync(assets) ? fs.readdirSync(assets) : []) {
        const dir = path.join(assets, ns, 'lang');
        if (!fs.existsSync(dir)) continue;
        for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
            Object.assign((langs[name.slice(0, -5)] ??= {}), JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')));
        }
    }
    return langs;
}

// The template of a translate component in a locale: its lang entry, else its fallback, else the key, as the game does
const templateOf = (component, locale) => langsOf()[locale]?.[component.translate] ?? component.fallback ?? component.translate;

// A template cut into its literal text and its %s, %n$s or %% placeholders, the arguments as indexes into with
function formatParts(template) {
    const parts = [];
    let next = 0;
    let last = 0;
    for (const m of template.matchAll(/%(?:(\d+)\$)?([sd%])/g)) {
        parts.push(template.slice(last, m.index));
        if (m[2] === '%') parts.push('%');
        else parts.push({ arg: m[1] ? Number(m[1]) - 1 : next++ });
        last = m.index + m[0].length;
    }
    parts.push(template.slice(last));
    return parts;
}

/**
 * Width in pixels of a text component on one line: a string, an object with text and extra, or a list whose first entry is
 * the parent of the rest. Only bold changes the width, and a child inherits it. A translate component is as wide as its
 * widest locale in the lang files of the resource pack.
 */
function componentWidth(component, bold = false) {
    if (typeof component === 'string') return loreWidth(component, bold);
    if (Array.isArray(component)) {
        if (!component.length) return 0;
        const parentBold = typeof component[0] === 'object' && component[0] && !Array.isArray(component[0]) && component[0].bold !== undefined ? component[0].bold : bold;
        return componentWidth(component[0], bold) + component.slice(1).reduce((sum, c) => sum + componentWidth(c, parentBold), 0);
    }
    if (component && typeof component === 'object') {
        const b = component.bold !== undefined ? component.bold : bold;
        const extra = (component.extra ?? []).reduce((sum, c) => sum + componentWidth(c, b), 0);
        if (component.translate === undefined) return loreWidth(component.text ?? '', b) + extra;
        const args = component.with ?? [];
        const width = (template) => formatParts(template).reduce((sum, p) => sum + (typeof p === 'string' ? loreWidth(p, b) : args[p.arg] === undefined ? 0 : componentWidth(args[p.arg], b)), 0);
        const locales = Object.keys(langsOf());
        return Math.max(width(templateOf(component, 'en_us')), ...locales.map((locale) => width(templateOf(component, locale)))) + extra;
    }
    return 0;
}

/** The text of a component on one line as a locale reads it, en_us by default. */
function componentText(component, locale = 'en_us') {
    if (typeof component === 'string') return component;
    if (Array.isArray(component)) return component.map((c) => componentText(c, locale)).join('');
    if (!component || typeof component !== 'object') return '';
    const extra = (component.extra ?? []).map((c) => componentText(c, locale)).join('');
    if (component.translate === undefined) return (component.text ?? '') + extra;
    const args = component.with ?? [];
    return formatParts(templateOf(component, locale)).map((p) => (typeof p === 'string' ? p : args[p.arg] === undefined ? '' : componentText(args[p.arg], locale))).join('') + extra;
}

// Han, kana and full-width characters, written without spaces, so a line may break between any two of them
const UNSPACED = '[\\u3000-\\u30ff\\u3400-\\u9fff\\uff00-\\uffef]';

/** Greedy wrap of plain text into lines that fit, breaking after a space or between unspaced characters; a word longer than a line stays whole. */
function wrapLore(text, limit = LORE_PIXELS) {
    const lines = [];
    let line = '';
    for (const [, space, word] of text.matchAll(new RegExp(`( *)(${UNSPACED}|(?:(?!${UNSPACED})[^ ])+)`, 'g'))) {
        const next = line ? `${line}${space}${word}` : word;
        if (line && loreWidth(next) > limit) {
            lines.push(line);
            line = word;
        } else {
            line = next;
        }
    }
    if (line) lines.push(line);
    return lines;
}

// The advice for a line that is too wide: where to break it
const wrapAdvice = (text) => {
    const lines = wrapLore(text);
    return lines.length > 1 ? `wrap after "${lines[0].split(' ').slice(-2).join(' ')}": ${lines.map((l) => `"${l}"`).join(' / ')}` : 'no space to wrap at';
};

// A line that ends a sentence, a clause with a colon or semicolon, or a quotation, may stop short
const TERMINAL = /[.!?:;\u2026]["')\]\u201d\u2019]*$/;

/**
 * Lines that wrap too early. A line with a next line that does not end in terminating punctuation goes on in the next one,
 * so when the first word of the next line still fits within the limit it belongs here. Takes { text, width } per line,
 * in order, and returns { index, word } for each line that is cut short; the word is the one to move up.
 */
function shortLines(lines, limit = LORE_PIXELS) {
    const short = [];
    for (let i = 0; i + 1 < lines.length; i++) {
        const text = lines[i].text.trim();
        const next = lines[i + 1].text.trim();
        // The Rarity line is its own stanza, never a continuation
        if (!text || !next || TERMINAL.test(text) || /^Rarity:/.test(next)) continue;
        const word = next.split(' ')[0];
        if (lines[i].width + loreWidth(' ' + word) <= limit) short.push({ index: i, word });
    }
    return short;
}

/**
 * Reflows a whole lore block. A line that does not end in terminating punctuation goes on in the next one, so the two
 * are joined before wrapping; an empty line, a sentence end and the Rarity line keep their breaks. Returns the new lines.
 */
function reflowLore(lines, limit = LORE_PIXELS) {
    const out = [];
    let paragraph = '';
    const flush = () => {
        if (paragraph) out.push(...wrapLore(paragraph, limit));
        paragraph = '';
    };
    lines.forEach((raw, i) => {
        const text = raw.trim();
        if (!text) {
            flush();
            out.push('');
            return;
        }
        paragraph = paragraph ? `${paragraph} ${text}` : text;
        const next = (lines[i + 1] || '').trim();
        if (TERMINAL.test(text) || !next || /^Rarity:/.test(next)) flush();
    });
    flush();
    return out;
}

module.exports = { FONTS, LORE_WIDTH, LORE_PIXELS, loreWidth, componentWidth, componentText, wrapLore, wrapAdvice, shortLines, reflowLore, UNSPACED };
