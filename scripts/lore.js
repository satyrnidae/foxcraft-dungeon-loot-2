'use strict';
/**
 * How wide a lore line may be. The tooltip has no fixed character count, so the limit is in pixels: 44 characters of
 * average English text in the default font. Shared by the book generator and the tests of item lore.
 */
const { loadFonts, DEFAULT_FONT } = require('./fonts.js');

const FONTS = loadFonts();
const LORE_WIDTH = 44;

// Letter frequencies in percent, and a space for about 18% of the characters
const ENGLISH = { e: 12.7, t: 9.1, a: 8.2, o: 7.5, i: 7.0, n: 6.7, s: 6.3, h: 6.1, r: 6.0, d: 4.3, l: 4.0, c: 2.8, u: 2.8, m: 2.4, w: 2.4, f: 2.2, g: 2.0, y: 2.0, p: 1.9, b: 1.5, v: 1.0, k: 0.8, j: 0.15, x: 0.15, q: 0.1, z: 0.07, ' ': 22 };

const glyphWidth = (ch, bold = false) => FONTS.widthOf(DEFAULT_FONT, ch, bold);

// Width in pixels of plain text, bold glyphs are a pixel wider
const loreWidth = (text, bold = false) => [...text].reduce((sum, ch) => sum + glyphWidth(ch, bold), 0);

const weights = Object.entries(ENGLISH);
const LORE_PIXELS = Math.round((LORE_WIDTH * weights.reduce((sum, [ch, f]) => sum + f * glyphWidth(ch), 0)) / weights.reduce((sum, [, f]) => sum + f, 0));

/**
 * Width in pixels of a text component on one line: a string, an object with text and extra, or a list whose first entry is
 * the parent of the rest. Only bold changes the width, and a child inherits it.
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
        return loreWidth(component.text ?? '', b) + (component.extra ?? []).reduce((sum, c) => sum + componentWidth(c, b), 0);
    }
    return 0;
}

/** Greedy wrap of plain text into lines that fit, breaking after a space; a word longer than a line stays whole. */
function wrapLore(text, limit = LORE_PIXELS) {
    const lines = [];
    let line = '';
    for (const word of text.split(' ')) {
        const next = line ? `${line} ${word}` : word;
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
        if (!text || !next || TERMINAL.test(text)) continue;
        const word = next.split(' ')[0];
        if (lines[i].width + loreWidth(' ' + word) <= limit) short.push({ index: i, word });
    }
    return short;
}

module.exports = { LORE_WIDTH, LORE_PIXELS, loreWidth, componentWidth, wrapLore, wrapAdvice, shortLines };
