#!/usr/bin/env node
// Markdown to written book item modifier. See scripts/README.md for the format.
//
//   node scripts/book_loot_gen.js            generate everything under src/books
//   node scripts/book_loot_gen.js --check    write nothing, exit 1 when generated files are out of date
//   node scripts/book_loot_gen.js a.md ...   only the books of the given source files
//
// mc-build runs it on every build through src/foxcraft_dungeon_loot/books.js.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NS = 'foxcraft_dungeon_loot';
const BOOK_DIR = path.join(ROOT, 'src', 'books');
const MODIFIER_DIR = path.join(ROOT, 'data', NS, 'item_modifier', 'random_loot', 'book');
const TABLE_DIR = path.join(ROOT, 'data', NS, 'loot_table', 'item', 'random_loot', 'book');
const LANG_DIR = path.join(ROOT, 'texturepack', 'assets', NS, 'lang');
const REFERENCE_LANG = 'en_us';

const MAX_TITLE = 32;
const MAX_PAGES = 100;
// A page is 14 lines of 114 pixels, so 19 W, 28 I, 38 l or 57 i fit a line. The editor also stops a page at 1024 characters.
const PAGE_LINES = 14;
const PAGE_WIDTH = 114;
const PAGE_EDIT_LENGTH = 1024;
// Advance widths per font: the vanilla fonts cached by scripts/fonts.js and the fonts of the resource pack, read on every run.
const { loadFonts, withNamespace, DEFAULT_FONT } = require('./fonts.js');
const FONTS = loadFonts();
const { highlight } = require('./highlight.js');
const { LORE_WIDTH, LORE_PIXELS, loreWidth, wrapAdvice, shortLines } = require('./lore.js');

const RARITY_COLORS = { common: 'white', uncommon: 'yellow', rare: 'aqua', epic: 'light_purple', mythic: 'green', cursed: 'red' };
const COLORS = ['black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'];

//region SNBT

// Reads SNBT into plain values, enough for click and hover events and a rich title.
function parseSnbt(source) {
    let i = 0;
    const fail = (what) => {
        throw new Error(`SNBT: ${what} at ${i} in ${source}`);
    };
    const ws = () => {
        while (i < source.length && /\s/.test(source[i])) i++;
    };
    const quoted = () => {
        const q = source[i++];
        let out = '';
        while (i < source.length && source[i] !== q) {
            if (source[i] === '\\') i++;
            out += source[i++];
        }
        if (source[i++] !== q) fail('unterminated string');
        return out;
    };
    // Keys are plain words. A value may also be an unquoted id or link or #color, which the game would want in quotes
    const bare = (chars = /[A-Za-z0-9_.+\-]/) => {
        const start = i;
        while (i < source.length && chars.test(source[i])) i++;
        if (i === start) fail('unexpected character');
        return source.slice(start, i);
    };
    const value = () => {
        ws();
        const c = source[i];
        if (c === '{') {
            i++;
            const out = {};
            ws();
            while (source[i] !== '}') {
                ws();
                const key = source[i] === '"' || source[i] === "'" ? quoted() : bare();
                ws();
                if (source[i++] !== ':') fail('expected :');
                out[key] = value();
                ws();
                if (source[i] === ',') i++;
                ws();
                if (i >= source.length) fail('unterminated compound');
            }
            i++;
            return out;
        }
        if (c === '[') {
            i++;
            const out = [];
            ws();
            while (source[i] !== ']') {
                out.push(value());
                ws();
                if (source[i] === ',') i++;
                ws();
                if (i >= source.length) fail('unterminated list');
            }
            i++;
            return out;
        }
        if (c === '"' || c === "'") return quoted();
        const token = bare(/[A-Za-z0-9_.+\-:/#]/);
        if (token === 'true') return true;
        if (token === 'false') return false;
        if (/^[+-]?(\d+\.?\d*|\.\d+)[bBsSlLfFdD]?$/.test(token)) return Number(token.replace(/[bBsSlLfFdD]$/, ''));
        return token;
    };
    const result = value();
    ws();
    if (i < source.length) fail('trailing text');
    return result;
}

//endregion

//region Frontmatter

function unquote(value) {
    const m = /^(["'])(.*)\1$/.exec(value);
    return m ? m[2] : value;
}

// Splits a source file into { meta, body }. Values run to the end of the line; lore is the indented block under it.
// Braces and brackets still open at the end of the text, those inside a string do not count
function bracesOpen(text) {
    let depth = 0;
    let quote = null;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') i++;
            else if (c === quote) quote = null;
        } else if (c === '"' || c === "'") {
            quote = c;
        } else if (c === '{' || c === '[') {
            depth++;
        } else if (c === '}' || c === ']') {
            depth--;
        }
    }
    return depth;
}

function parseFrontmatter(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const meta = { lore: [] };
    if (lines[0].trim() !== '---') return { meta, body: lines.join('\n') };
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === '---');
    if (end < 0) throw new Error('frontmatter is not closed with ---');
    let key = null;
    const frontmatter = lines.slice(1, end);
    for (let n = 0; n < frontmatter.length; n++) {
        const line = frontmatter[n];
        const m = /^([A-Za-z_]+):\s*(.*)$/.exec(line);
        if (m && !/^\s/.test(line)) {
            key = m[1].toLowerCase();
            if (key === 'lore') {
                if (m[2].trim()) meta.lore.push(m[2].trim());
            } else if (key === 'styles') {
                // A compound over as many lines as it takes to close its braces
                let text = m[2];
                while (bracesOpen(text) > 0 && n + 1 < frontmatter.length) text += '\n' + frontmatter[++n];
                if (bracesOpen(text) !== 0) throw new Error('styles in the frontmatter is not closed');
                meta.styles = parseClasses(parseSnbt(text));
            } else {
                meta[key] = unquote(m[2].trim());
            }
        } else if (key === 'lore' && line.trim()) {
            meta.lore.push(line.trim());
        }
    }
    return { meta, body: lines.slice(end + 1).join('\n') };
}

//endregion

//region Inline markdown

// Marker, the style it sets. Order matters, the doubled ones come first.
const MARKERS = [
    ['**', { bold: true }],
    ['__', { underlined: true }],
    ['~~', { strikethrough: true }],
    ['||', { obfuscated: true }],
    ['*', { italic: true }],
    ['_', { italic: true }],
];

// Code, inline or in a block, is set in this font
const CODE_FONT = `${NS}:pixel_mono`;

const isWord = (c) => c !== undefined && /[A-Za-z0-9]/.test(c);

// A font id is a resource location, anything else makes the text fail to load in the game
function parseFont(value) {
    const id = String(value).trim();
    if (!/^([a-z0-9_.-]+:)?[a-z0-9/._-]+$/.test(id)) throw new Error(`font "${value}" is not a resource location, lowercase letters, digits and _ . - / only`);
    return id;
}

function parseColor(value) {
    const v = value.trim().toLowerCase();
    if (COLORS.includes(v) || /^#[0-9a-f]{6}$/.test(v)) return v;
    throw new Error(`unknown color "${value}"`);
}

// "#AARRGGBB" or "#RRGGBB" to the signed int a text component takes as shadow_color
function parseShadow(value) {
    const m = /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.exec(value.trim());
    if (!m) throw new Error(`shadow "${value}" is not an argb hex code`);
    const argb = m[1].length === 6 ? 'ff' + m[1] : m[1];
    return parseInt(argb, 16) | 0;
}

// The names of the styles that are not classes: the format types, which override what they look like by default
const MARKER_TYPES = { '**': 'bold', __: 'underline', '~~': 'strikethrough', '||': 'obfuscated', '*': 'italic', _: 'italic' };
const TYPE_NAMES = ['body', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bold', 'italic', 'underline', 'strikethrough', 'obfuscated', 'code', 'a', 'font', 'span'];

const CLASS_FLAGS = { bold: 'bold', italic: 'italic', underline: 'underlined', underlined: 'underlined', strikethrough: 'strikethrough', obfuscated: 'obfuscated' };

/**
 * The styles of the frontmatter, { name: { color, font, bold, italic, underline, strikethrough, obfuscated, shadow_color } },
 * as { name: component styles }. A flag that is false is kept: it turns off what the text around it has. shadow_color is
 * an integer or an #aarrggbb code.
 */
function parseClasses(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('styles needs a compound of named styles');
    const classes = {};
    for (const [name, def] of Object.entries(raw)) {
        if (!/^\.[A-Za-z_][\w-]*$/.test(name) && !TYPE_NAMES.includes(name)) throw new Error(`style "${name}" is not a class, .name, or one of ${TYPE_NAMES.join(', ')}`);
        if (!def || typeof def !== 'object' || Array.isArray(def)) throw new Error(`style "${name}" needs a compound`);
        const styles = {};
        for (const [key, value] of Object.entries(def)) {
            if (CLASS_FLAGS[key]) {
                if (typeof value !== 'boolean') throw new Error(`style "${name}": ${key} is true or false`);
                styles[CLASS_FLAGS[key]] = value;
            } else if (key === 'color') {
                styles.color = parseColor(String(value));
            } else if (key === 'font') {
                styles.font = parseFont(value);
            } else if (key === 'shadow_color') {
                styles.shadow_color = typeof value === 'number' ? value | 0 : parseShadow(String(value));
            } else {
                throw new Error(`style "${name}": unknown ${key}, one of color, font, shadow_color, ${Object.keys(CLASS_FLAGS).join(', ')}`);
            }
        }
        classes[name] = styles;
    }
    return classes;
}

// The styles of a class attribute, several names apply in order. class="url" is the style .url
function classStyles(attrs, classes) {
    const styles = {};
    for (const name of (attrs.class || '').split(/\s+/).filter(Boolean)) {
        const key = '.' + name.replace(/^\./, '');
        if (!classes[key]) throw new Error(`unknown class "${name}", the frontmatter has ${Object.keys(classes).filter((k) => k.startsWith('.')).join(', ') || 'none'}`);
        Object.assign(styles, classes[key]);
    }
    return styles;
}

const ENTITIES = { quot: '"', apos: "'", lt: '<', gt: '>', amp: '&' };

// An attribute value reads &quot; &apos; &lt; &gt; and &amp; as the characters, so a value can hold its own quote
const decodeEntities = (value) => value.replace(/&(quot|apos|lt|gt|amp);/g, (_, name) => ENTITIES[name]);

function parseAttributes(source) {
    const attrs = {};
    for (const m of source.matchAll(/([A-Za-z_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[m[1].toLowerCase()] = decodeEntities(m[2] !== undefined ? m[2] : m[3]);
    return attrs;
}

function eventFrom(raw) {
    const event = parseSnbt(raw);
    if (!event || typeof event !== 'object' || !event.action) throw new Error(`event needs an action: ${raw}`);
    // The game only decodes http and https links; any other scheme, mailto: for one, makes the whole text fail to load
    if (String(event.action).replace(/^minecraft:/, '') === 'open_url' && !/^https?:\/\//i.test(String(event.url))) throw new Error(`open_url only takes an http or https link, not ${event.url}; copy_to_clipboard can carry an email address`);
    return event;
}

function anchorStyles(attrs) {
    const styles = {};
    let click = attrs.on_click;
    if (click === undefined && attrs.href !== undefined) click = /^\s*\{/.test(attrs.href) ? attrs.href : `{action:open_url,url:"${attrs.href}"}`;
    if (click !== undefined) styles.click_event = eventFrom(click);
    if (attrs.on_hover !== undefined) styles.hover_event = eventFrom(attrs.on_hover);
    return styles;
}

function fontStyles(attrs) {
    const styles = {};
    if (attrs.color !== undefined) styles.color = parseColor(attrs.color);
    if (attrs.face !== undefined) styles.font = parseFont(attrs.face);
    if (attrs.shadow !== undefined) styles.shadow_color = parseShadow(attrs.shadow);
    return styles;
}

/**
 * Parses inline markdown into a tree: an array of strings and { styles, content } nodes. Parses on to the closer when given
 * and reports whether it was found; an opener without a closer stays literal.
 */
function parseInline(text, start, closer, classes = {}) {
    const content = [];
    let buffer = '';
    const flush = () => {
        if (buffer) content.push(buffer);
        buffer = '';
    };
    let i = start;
    while (i < text.length) {
        if (closer && text.startsWith(closer, i)) {
            // Underscores inside a word are just underscores
            // A doubled marker after a space opens a span of its own, as in *italic **bold** italic*
            const opensDouble = closer.length === 1 && text[i + 1] === closer && /\s/.test(text[i - 1] || ' ');
            if (!opensDouble && !(closer === '_' && isWord(text[i - 1]) && isWord(text[i + 1]))) {
                flush();
                return { content, end: i + closer.length, closed: true };
            }
        }
        const c = text[i];
        if (c === '\\' && i + 1 < text.length) {
            buffer += text[i + 1];
            i += 2;
            continue;
        }
        if (c === '`') {
            // Inline code is literal, an opener without a closer on the line stays a backtick
            const close = text.indexOf('`', i + 1);
            if (close > i + 1 && !text.slice(i + 1, close).includes('\n')) {
                flush();
                content.push({ styles: { font: CODE_FONT, ...classes.code }, content: [text.slice(i + 1, close)] });
                i = close + 1;
                continue;
            }
        }
        const tag = /^<(font|a|filter|span|style|h[1-6])(\s[^>]*)?>/i.exec(text.slice(i));
        if (tag) {
            const name = tag[1].toLowerCase();
            const attrs = parseAttributes(tag[2] || '');
            const sub = parseInline(text, i + tag[0].length, `</${name}>`, classes);
            if (!sub.closed) throw new Error(`<${name}> is not closed`);
            flush();
            if (/^h[1-6]$/.test(name)) {
                // A header, bold and underlined unless the stylesheet says otherwise
                content.push({ styles: { bold: true, underlined: true, ...classes.header, ...classes[name] }, content: sub.content });
            } else if (name === 'style') {
                // The styles of the named classes from the frontmatter
                if (!attrs.class) throw new Error('<style> needs a class="..." attribute');
                content.push({ styles: classStyles(attrs, classes), content: sub.content });
            } else if (name === 'span') {
                // No style; the words inside are not hyphenated, see hyphenate
                content.push({ styles: { ...classes.span, ...classStyles(attrs, classes) }, content: sub.content, nohyphen: true });
            } else if (name === 'filter') {
                if (attrs.as === undefined) throw new Error('<filter> needs an as="..." attribute');
                // No style of its own; alt is what the chat filter shows instead of the content
                content.push({ styles: {}, content: sub.content, alt: parseInline(attrs.as, 0, null, classes).content });
            } else {
                // A literal span is code: its text goes in as it is, not through a lang key
                content.push({ styles: { ...(name === 'a' ? classes.a : attrs.literal !== undefined ? classes.code : classes.font), ...classStyles(attrs, classes), ...(name === 'font' ? fontStyles(attrs) : anchorStyles(attrs)) }, content: sub.content, ...(name === 'font' && attrs.literal !== undefined ? { literal: true } : {}) });
            }
            i = sub.end;
            continue;
        }
        const marker = MARKERS.find(([m]) => text.startsWith(m, i));
        if (marker) {
            const [m, styles] = marker;
            const next = text[i + m.length];
            const intraWord = m === '_' && isWord(text[i - 1]);
            if (!intraWord && next !== undefined && !/\s/.test(next)) {
                const sub = parseInline(text, i + m.length, m, classes);
                if (sub.closed) {
                    flush();
                    content.push({ styles: { ...styles, ...classes[MARKER_TYPES[m]] }, content: sub.content });
                    i = sub.end;
                    continue;
                }
            }
            buffer += m;
            i += m.length;
            continue;
        }
        buffer += c;
        i++;
    }
    flush();
    return { content, end: i, closed: false };
}

//endregion

//region Text components

const escapePercent = (s) => s.replace(/%/g, '%%');

// A literal span as a plain text component, the text of the code as it is
function literalComponent(node, styles = {}) {
    const plain = (nodes) => nodes.map((p) => (typeof p === 'string' ? p : plain(p.content))).join('');
    return { text: plain(node.content), ...styles, ...node.styles };
}

// The lines of a code block are literal nodes with newlines between them. They go into one component of their own, so
// the text around the block has a single %n$s for all of it. The block has a lang key of its own for the template that
// joins the lines, the code in its entries stays as it is.
function codeComponent(items, key, lang, styles = {}) {
    let template = '';
    const withs = [];
    for (const item of items) {
        if (typeof item === 'string') {
            template += escapePercent(item);
        } else {
            withs.push(literalComponent(item));
            template += `%${withs.length}$s`;
        }
    }
    lang[key] = template;
    return { translate: key, fallback: template, with: withs, ...styles };
}

// A run of two or more literal pieces, with only newlines between them, becomes one node { code: items }
function groupCode(parts) {
    const out = [];
    for (let i = 0; i < parts.length; i++) {
        let end = i;
        if (parts[i].literal) {
            for (;;) {
                if (parts[end + 1] && parts[end + 1].literal) end += 1;
                else if (/^\n+$/.test(parts[end + 1] || '') && parts[end + 2] && parts[end + 2].literal) end += 2;
                else break;
            }
        }
        if (end > i) {
            out.push({ code: parts.slice(i, end + 1) });
            i = end;
        } else {
            out.push(parts[i]);
        }
    }
    return out;
}

/**
 * Turns a tree into translatable text components. A run of plain text is a translate component with the text as fallback;
 * formatted spans inside it become %n$s arguments, each its own translate component. Fills lang with key -> template.
 * A span that holds only one other span is merged into it, so stacked formatting is one component.
 */
function toComponent(content, key, lang, styles = {}) {
    const parts = [];
    for (const part of content) {
        if (typeof part === 'string') {
            if (typeof parts[parts.length - 1] === 'string') parts[parts.length - 1] += part;
            else if (part) parts.push(part);
        } else {
            parts.push(part);
        }
    }
    parts.splice(0, parts.length, ...groupCode(parts));
    if (parts.length === 1 && parts[0].code) return codeComponent(parts[0].code, key, lang, styles);
    if (parts.length === 1 && parts[0].literal) return literalComponent(parts[0], styles);
    if (parts.length === 1 && typeof parts[0] !== 'string') {
        return toComponent(parts[0].content, key, lang, { ...styles, ...parts[0].styles });
    }
    let template = '';
    const withs = [];
    for (const part of parts) {
        if (typeof part === 'string') {
            template += escapePercent(part);
        } else {
            withs.push(part);
            template += `%${withs.length}$s`;
        }
    }
    lang[key] = template;
    const component = { translate: key, fallback: template };
    if (withs.length) component.with = withs.map((node, n) => (node.code ? codeComponent(node.code, `${key}.${n + 1}`, lang) : node.literal ? literalComponent(node) : toComponent(node.content, `${key}.${n + 1}`, lang, node.styles)));
    return Object.assign(component, styles);
}

// The characters of the tree as the reader sees them, each with whether it is bold and its font, an inner font wins
function glyphs(content, bold = false, font = DEFAULT_FONT, literal = false, nohyphen = false) {
    return content.flatMap((p) =>
        typeof p === 'string'
            ? [...p].map((ch) => ({ ch, bold, font, literal, nohyphen }))
            : glyphs(p.content, p.styles.bold === undefined ? bold : p.styles.bold === true, p.styles.font ? withNamespace(p.styles.font) : font, literal || p.literal === true, nohyphen || p.nohyphen === true)
    );
}

const widthOf = ({ ch, bold, font }) => FONTS.widthOf(font, ch, bold);

/**
 * Lays text out like the book screen: a newline is a forced line break, a line that overflows breaks after its last space,
 * or in the word when it has none. Bold glyphs are a pixel wider. Returns { lines, length }, a line being
 * { start, end, tstart, tend, soft }: glyph indexes without the space or newline that ended it, the same trimmed of the
 * spaces at its ends, and whether the line starts at a wrap. Does not remove anything, see layout.
 */
function layoutGlyphs(chars) {
    const lines = [];
    let start = 0;
    let width = 0;
    let lastSpace = -1;
    let soft = false;
    const push = (end, next, nextSoft) => {
        lines.push({ start, end, soft });
        start = next;
        soft = nextSoft;
    };
    for (let i = 0; i < chars.length; i++) {
        const g = chars[i];
        if (g.ch === '\n') {
            push(i, i + 1, false);
            width = 0;
            lastSpace = -1;
            continue;
        }
        const w = widthOf(g);
        if (width + w > PAGE_WIDTH && g.ch !== ' ') {
            if (lastSpace >= start) push(lastSpace, lastSpace + 1, true);
            else push(i, i, true);
            // Carry the word that overflowed onto the new line
            width = chars.slice(start, i).reduce((sum, c) => sum + widthOf(c), 0);
            lastSpace = -1;
        }
        if (g.ch === ' ') lastSpace = i;
        width += w;
    }
    push(chars.length, chars.length, false);

    for (const line of lines) {
        line.tstart = line.start;
        if (line.soft) while (line.tstart < line.end && chars[line.tstart].ch === ' ') line.tstart++;
        line.tend = line.end;
        while (line.tend > line.tstart && chars[line.tend - 1].ch === ' ') line.tend--;
    }
    return lines;
}

/**
 * The layout of a tree after trimming. A line that starts at a wrap loses the spaces at its start, a line that starts at
 * a newline keeps its indentation. Every line loses the spaces at its end. A trim changes where the text
 * wraps, so each time the first line that needs one is cut and the layout starts over, until no line does.
 * Returns { lines, chars, dropped, length }: lines index into chars, the glyphs that are left, each with its place in
 * the tree, and dropped is the set of places that were cut. length counts the glyphs of the tree before the cut.
 */
function layout(content) {
    const chars = glyphs(content).map((g, place) => ({ ...g, place }));
    const length = chars.length;
    const dropped = new Set();
    for (;;) {
        const lines = layoutGlyphs(chars);
        const line = lines.find((l) => l.tstart > l.start || l.tend < l.end);
        if (!line) return { lines, chars, dropped, length };
        // Cut the tail first so the head indexes stay put
        for (const [from, to] of [[line.tend, line.end], [line.start, line.tstart]]) {
            for (let n = from; n < to; n++) dropped.add(chars[n].place);
            chars.splice(from, to - from);
        }
    }
}

// A word that is wider than a whole line cannot be moved to the next line to fit, the game breaks it between two letters.
// Where the hyphenator knows a syllable break, it breaks there instead and the hyphen goes into the text. The break is
// the last one that fits with its hyphen in what is left of the line the word comes after, so "By Valentina" becomes "By
// Val-" and "entina". Without one that fits there it is the last one that fits a line of its own, and without any the
// word breaks between letters. A word that fits a line is never hyphenated, "By" and "Valentina" wrap at the space. A
// hyphenator is { hyphenate(word) -> syllables } or null for a locale without patterns. Code and the text of a
// <span> are never hyphenated.
// Returns a copy of the tree.
const HYPHEN_MIN_LEFT = 2;
const HYPHEN_MIN_RIGHT = 2;

function hyphenate(content, hyphenator) {
    if (!hyphenator) return content;
    const tree = JSON.parse(JSON.stringify(content));
    const isLetter = (g) => /^\p{L}$/u.test(g.ch) && !g.literal && !g.nohyphen && g.font !== CODE_FONT;
    const sum = (list) => list.reduce((total, g) => total + widthOf(g), 0);
    for (let guard = 0; guard < 10000; guard++) {
        const all = glyphs(tree).map((g, place) => ({ ...g, place }));
        const { lines, chars } = layout(tree);
        const index = new Map(chars.map((g, n) => [g.place, n]));
        let change = null;
        for (let from = 0; from < all.length && change === null; ) {
            if (all[from].ch === ' ' || all[from].ch === '\n') {
                from++;
                continue;
            }
            let to = from;
            while (to < all.length && all[to].ch !== ' ' && all[to].ch !== '\n') to++;
            const word = all.slice(from, to);
            if (sum(word) > PAGE_WIDTH) {
                // The syllable breaks inside the word, as indexes into all
                const breaks = [];
                for (let at = from; at < to; ) {
                    if (!isLetter(all[at])) {
                        at++;
                        continue;
                    }
                    let stop = at;
                    while (stop < to && isLetter(all[stop])) stop++;
                    let offset = at;
                    for (const part of hyphenator.hyphenate(all.slice(at, stop).map((g) => g.ch).join('')).slice(0, -1)) {
                        offset += [...part].length;
                        breaks.push(offset);
                    }
                    at = stop;
                }
                const usable = breaks.filter((b) => b >= from + HYPHEN_MIN_LEFT && b <= to - HYPHEN_MIN_RIGHT);
                // What the line the word comes after has used, a word at the start of a wrapped line comes after the one above
                const j = index.get(from);
                const k = lines.findIndex((l) => j >= l.tstart && j < l.tend);
                const first = k > 0 && lines[k].soft && lines[k].tstart === j ? lines[k - 1] : lines[k];
                const used = sum(all.slice(chars[first.tstart].place, from));
                const room = (b, taken) => taken + sum(all.slice(from, b)) + widthOf({ ch: '-', bold: all[b - 1].bold, font: all[b - 1].font }) <= PAGE_WIDTH;
                const pick = [...usable].reverse().find((b) => room(b, used)) ?? [...usable].reverse().find((b) => room(b, 0));
                if (pick !== undefined) change = all[pick].place;
            }
            from = to;
        }
        if (change === null) return tree;
        insertAt(tree, change, '-\n');
    }
    throw new Error('hyphenate does not settle');
}

// The tree without the marks of span nodes, which only tell hyphenate to leave the text alone. A span with no style of
// its own is gone, its text stays where it is.
function unwrapNoHyphen(content) {
    return content.flatMap((part) => {
        if (typeof part === 'string') return [part];
        const inner = unwrapNoHyphen(part.content);
        if (!part.nohyphen) return [{ ...part, content: inner }];
        if (!Object.keys(part.styles).length) return inner;
        const { nohyphen, ...kept } = part;
        return [{ ...kept, content: inner }];
    });
}

// A line holds 9 pixels, a glyph of the default font sits 7 above its baseline. A font that reaches higher than a line
// takes the lines above its own, one for every 9 pixels it reaches over the 7, at most the 13 a page has above its last
// line. A font that reaches further leaks over the top of the page.
const LINE_HEIGHT = 9;
const BASELINE = 7;
const linesAbove = (ascent) => (ascent > LINE_HEIGHT ? Math.min(Math.ceil((ascent - BASELINE) / LINE_HEIGHT), PAGE_LINES - 1) : 0);

// Puts the string in the tree before the glyph with the given index, outside the span that starts there
function insertAt(content, target, text) {
    let pos = 0;
    const walk = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
            const part = nodes[i];
            if (typeof part === 'string') {
                const chars = [...part];
                if (target >= pos && target < pos + chars.length) {
                    nodes[i] = chars.slice(0, target - pos).join('') + text + chars.slice(target - pos).join('');
                    return true;
                }
                pos += chars.length;
            } else {
                if (target === pos) {
                    nodes.splice(i, 0, text);
                    return true;
                }
                if (walk(part.content)) return true;
            }
        }
        return false;
    };
    return walk(content);
}

/**
 * Empty lines above a line that holds a glyph of a font reaching higher than a line, so it does not draw over the text
 * above it. Empty lines that are there count. ascentOf
 * gives how high a font reaches. Returns a copy of the tree.
 */
function reserveTall(content, ascentOf = (font) => FONTS.ascentOf(font)) {
    const tree = JSON.parse(JSON.stringify(content));
    for (let guard = 0; guard < 1000; guard++) {
        const { lines, chars } = layout(tree);
        let change = null;
        lines.forEach((line, k) => {
            if (change || line.tstart === line.tend) return;
            const need = linesAbove(Math.max(...chars.slice(line.tstart, line.tend).filter((g) => g.ch !== ' ').map((g) => ascentOf(g.font)), 0));
            if (!need) return;
            let empty = 0;
            while (k - empty - 1 >= 0 && lines[k - empty - 1].tstart === lines[k - empty - 1].tend) empty++;
            if (need > empty) change = { place: chars[line.tstart].place, count: need - empty + (line.soft ? 1 : 0) };
        });
        if (!change) return tree;
        insertAt(tree, change.place, '\n'.repeat(change.count));
    }
    throw new Error('reserveTall does not settle');
}

// The part of the tree between two glyph indexes, spans cut to fit, empty ones and the dropped glyph indexes left out.
// A filter span keeps its alt, and is marked cut when the page edge falls inside it.
function sliceTree(content, from, to, drop = new Set()) {
    let pos = 0;
    const walk = (nodes) => {
        const out = [];
        for (const part of nodes) {
            if (typeof part === 'string') {
                const piece = [...part].filter((_, n) => pos + n >= from && pos + n < to && !drop.has(pos + n)).join('');
                if (piece) out.push(piece);
                pos += [...part].length;
            } else {
                const first = pos;
                const inner = walk(part.content);
                if (!inner.length) continue;
                const node = { styles: part.styles, content: inner };
                if (part.literal) node.literal = true;
                if (part.alt) Object.assign(node, { alt: part.alt }, first >= from && pos <= to ? {} : { cut: true });
                out.push(node);
            }
        }
        return out;
    };
    return walk(content);
}

/**
 * The tree as one of its two readings: the raw text, or the chat-filtered text with each filter span replaced by its alt.
 * A filter span has no style, so either way it melts into its parent. A cut span stays raw, onCut is told.
 */
function variant(content, filtered, onCut = () => {}) {
    return content.flatMap((part) => {
        if (typeof part === 'string') return [part];
        if (part.alt === undefined) return [{ ...part, content: variant(part.content, filtered, onCut) }];
        if (filtered && part.cut) onCut();
        return variant(filtered && !part.cut ? part.alt : part.content, filtered, onCut);
    });
}

/**
 * Fills pages with lines, PAGE_LINES each. A page does not start with an empty line and does not end with one, so a
 * paragraph gap that falls on a page edge vanishes.
 */
function paginate(content, ascentOf = (font) => FONTS.ascentOf(font)) {
    const { lines, chars, dropped } = layout(content);
    const pages = [];
    let page = [];
    const flush = () => {
        while (page.length && page[page.length - 1].start === page[page.length - 1].end) page.pop();
        if (page.length) {
            pages.push(sliceTree(content, chars[page[0].start].place, chars[page[page.length - 1].end - 1].place + 1, dropped));
        }
        page = [];
    };
    // Empty lines at the top of a page are dropped, except the ones a tall glyph below them needs to sit in place
    const keeps = (n) => {
        let next = n;
        while (next < lines.length && lines[next].tstart === lines[next].tend) next++;
        if (next === lines.length) return false;
        const need = linesAbove(Math.max(...chars.slice(lines[next].tstart, lines[next].tend).filter((g) => g.ch !== ' ').map((g) => ascentOf(g.font)), 0));
        return next - n <= need;
    };
    for (const [n, line] of lines.entries()) {
        if (!page.length && line.start === line.end && !keeps(n)) continue;
        page.push(line);
        if (page.length === PAGE_LINES) flush();
    }
    flush();
    return pages;
}

//endregion

//region Books

// <br> is a manual page break. Between them a newline in the source is a line break, so a blank line is an empty line,
// and a line that is too long wraps by itself. Spans do not reach across a <br>.
const escapeMarkup = (s) => s.replace(/[\\*_~|<`]/g, '\\$&');

// The lines of a code block as markup: literal spans in the code font, colored by the language of the fence when the
// highlighter knows it. A code line keeps its indentation and is never a heading.
function codeLines(language, lines) {
    const code = lines.map((l) => l.replace(/\s+$/, '')).join('\n');
    const rows = (language && highlight(code, language)) || code.split('\n').map((l) => (l ? [{ text: l, color: undefined }] : []));
    return rows.map((row) => row.map(({ text, color }) => `<font face="${CODE_FONT}"${color ? ` color="${color}"` : ''} literal="1">${escapeMarkup(text)}</font>`).join(''));
}

// Fenced code blocks in the lines of a section become the markup of their code lines, the fence lines are dropped
function fenceCode(lines) {
    const out = [];
    let block = null;
    for (const line of lines) {
        const fence = /^\s*```(\S*)/.exec(line);
        if (fence && !block) {
            block = { language: fence[1], lines: [] };
        } else if (fence) {
            out.push(...codeLines(block.language, block.lines));
            block = null;
        } else if (block) {
            block.lines.push(line);
        } else {
            out.push(line);
        }
    }
    if (block) out.push(...codeLines(block.language, block.lines));
    return out;
}

function splitSections(body) {
    return body
        .replace(/\r\n/g, '\n')
        .split(/<br\s*\/?>/i)
        .map((section) =>
            fenceCode(section.split('\n'))
                .map((line) => line.replace(/\s+$/, ''))
                // A heading is bold and underlined and always has an empty line under it
                .flatMap((line, n, lines) => (/^#{1,6}\s+/.test(line) ? [line.replace(/^(#{1,6})\s+(.*)$/, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`), ...(lines[n + 1] === '' ? [] : [''])] : [line]))
                .join('\n')
                // The line break that ends the <br> line goes, the empty lines after it are paginate's to keep or drop
                .replace(/^\n|\n+$/g, '')
        )
        .filter(Boolean);
}

// Every page of the body, a list of trees. Sections fill pages on their own, 14 lines each. A font wraps the whole text,
// a <font face> inside still wins.
function pagesOf(body, font = null, hyphenator = null, classes = {}) {
    return splitSections(body).flatMap((section) => {
        const content = parseInline(section, 0, null, classes).content;
        const base = { ...(font ? { font } : {}), ...classes.body };
        return paginate(reserveTall(unwrapNoHyphen(hyphenate(Object.keys(base).length ? [{ styles: base, content }] : content, hyphenator))));
    });
}

// Syllable patterns per locale folder, a locale without any is not hyphenated
const HYPHENATORS = {};
function hyphenatorOf(locale) {
    if (!(locale in HYPHENATORS)) {
        const patterns = { en_us: 'hyphenation.en-us' }[locale];
        HYPHENATORS[locale] = patterns ? new (require('hypher'))(require(patterns)) : null;
    }
    return HYPHENATORS[locale];
}

function readSource(file) {
    const { meta, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    if (meta.font) {
        try {
            parseFont(meta.font);
        } catch (e) {
            throw new Error(`${file}: frontmatter ${e.message}`);
        }
    }
    return { meta, pages: pagesOf(body, meta.font || null, hyphenatorOf(path.basename(path.dirname(file))), meta.styles || {}) };
}

// numbers are the page indexes, when the list is a subset of the pages
function pageComponents(pages, id, kind, lang, warnings, file, numbers = pages.map((_, n) => n)) {
    return pages.map((tree, i) => {
        const n = numbers[i];
        const { length } = layout(tree);
        if (length > PAGE_EDIT_LENGTH) warnings.push(`${file}: page ${n + 1} has ${length} characters, the editor stops at ${PAGE_EDIT_LENGTH}`);
        return toComponent(tree, `book.${NS}.${id}.${kind}.${n + 1}`, lang);
    });
}

const TITLE_FILTER = /<filter\s+as=(?:"([^"]*)"|'([^']*)')\s*>(.*?)<\/filter>/gi;

// A title in SNBT also sets the item name, the book title itself is plain text. A plain title takes
// <filter as="...">text</filter> for the chat-filtered title; custom_name has no filtered side, so an SNBT one does not.
function titleOf(meta) {
    const raw = meta.title || '';
    if (/^\s*[{[]/.test(raw)) {
        const rich = parseSnbt(raw);
        const flat = (c) => (typeof c === 'string' ? c : Array.isArray(c) ? c.map(flat).join('') : (c.text || '') + (c.extra ? flat(c.extra) : ''));
        const text = flat(rich);
        if (/<filter/i.test(text)) throw new Error('<filter> does not work in an SNBT title, the item name has no filtered side');
        return { text, filtered: null, rich };
    }
    const text = raw.replace(TITLE_FILTER, (_, a, b, content) => content);
    const filtered = raw.replace(TITLE_FILTER, (_, a, b) => (a !== undefined ? a : b));
    if (/<\/?filter/i.test(text)) throw new Error('title has a <filter> that is not <filter as="...">text</filter>');
    return { text, filtered: filtered === text ? null : filtered, rich: null };
}

function rarityOf(meta) {
    if (!meta.rarity) return null;
    const name = meta.rarity.toLowerCase();
    if (!RARITY_COLORS[name]) throw new Error(`unknown rarity "${meta.rarity}", one of ${Object.keys(RARITY_COLORS).join('|')}`);
    return name;
}

function loreLines(meta) {
    const lines = [...meta.lore];
    const name = rarityOf(meta);
    if (name) lines.push(['Rarity: ', { text: name[0].toUpperCase() + name.slice(1), color: RARITY_COLORS[name], italic: true }]);
    return lines;
}

// The item name in the color of the rarity, not italic, as the other items of the pack have it. The name has no filtered
// side, so it takes the filtered title when there is one. An SNBT title keeps its own colors and styles, the rarity only
// fills in what it leaves out.
function itemName(title, rarity) {
    const base = { color: RARITY_COLORS[rarity], italic: false };
    if (!title.rich) return { text: title.filtered || title.text, ...base };
    return { text: '', ...base, extra: [].concat(title.rich) };
}

/** Item modifier JSON and lang entries for one book in one locale. */
function buildBook(id, file) {
    const warnings = [];
    const source = readSource(file);
    const { meta } = source;
    const pages = source.pages.map((tree) => variant(tree, false));
    const lang = {};
    const title = titleOf(meta);
    if (!title.text) throw new Error(`${file}: title is missing`);
    for (const [kind, text] of [['title', title.text], ['filtered title', title.filtered]]) {
        if (text && text.length > MAX_TITLE) warnings.push(`${file}: ${kind} is ${text.length} characters, the book takes ${MAX_TITLE}`);
    }
    if (pages.length > MAX_PAGES) warnings.push(`${file}: ${pages.length} pages, a book takes ${MAX_PAGES}`);
    let components = pageComponents(pages, id, 'page', lang, warnings, file);

    // The filtered reading cuts pages where the raw one does. A page that reads the same stays a plain component, the game
    // filters it to the same text
    const filtered = source.pages.map((tree, n) => variant(tree, true, () => warnings.push(`${file}: page ${n + 1} has a <filter> span cut by the page break, it stays unfiltered`)));
    const differs = pages.map((_, n) => n).filter((n) => JSON.stringify(filtered[n]) !== JSON.stringify(pages[n]));
    for (const n of differs) {
        const lines = layout(filtered[n]).lines.length;
        if (lines > PAGE_LINES) warnings.push(`${file}: page ${n + 1} has ${lines} lines when filtered, a page takes ${PAGE_LINES}`);
    }
    if (differs.length) {
        const own = pageComponents(differs.map((n) => filtered[n]), id, 'filtered', lang, warnings, file, differs);
        components = components.map((raw, n) => (differs.includes(n) ? { raw, filtered: own[differs.indexOf(n)] } : raw));
    }
    const loreRows = meta.lore.map((text) => ({ text, width: loreWidth(text) }));
    for (const { index, word } of shortLines(loreRows)) warnings.push(`${file}: lore line "${loreRows[index].text}" has no ending punctuation and "${word}" from the next line fits`);
    for (const line of meta.lore) if (loreWidth(line) > LORE_PIXELS) warnings.push(`${file}: lore line is ${loreWidth(line)} pixels, ${LORE_PIXELS} fit, the width of ${LORE_WIDTH} average characters: "${line}", ${wrapAdvice(line)}`);

    const content = { title: title.filtered ? { raw: title.text, filtered: title.filtered } : { raw: title.text }, author: meta.author || 'Unknown', pages: components, resolved: true };
    const set = { 'minecraft:written_book_content': content };
    const rarity = rarityOf(meta);
    if (rarity) set['minecraft:custom_name'] = itemName(title, rarity);
    else if (title.rich) set['minecraft:custom_name'] = title.rich;
    const functions = [{ type: 'minecraft:set_components', components: set }];
    const lore = loreLines(meta);
    if (lore.length) functions.push({ type: 'minecraft:set_lore', lore, mode: 'append' });
    return { modifier: { type: 'minecraft:sequence', functions }, lang, warnings };
}

//endregion

//region Files

function eolOf(file) {
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('\r\n') ? '\r\n' : '\n';
}

// Writes the file when the content changed and returns whether it differs; in check mode nothing is written.
function emit(file, text, check) {
    const out = text.replace(/\n/g, eolOf(file));
    if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === out) return false;
    if (!check) {
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, out);
    }
    return true;
}

const json = (value) => JSON.stringify(value, null, 2) + '\n';

function tableFor(id) {
    return { pools: [{ rolls: 1, entries: [{ type: 'minecraft:item', name: 'minecraft:written_book' }] }], modifier: `${NS}:random_loot/book/${id}` };
}

// { locale: { id: { file } } } from src/books/<locale>/<id>.md
function findSources(dir, warnings = []) {
    const found = {};
    if (!fs.existsSync(dir)) return found;
    for (const localeDir of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!localeDir.isDirectory()) continue;
        const books = (found[localeDir.name] = {});
        for (const name of fs.readdirSync(path.join(dir, localeDir.name)).sort()) {
            const m = /^(.+?)\.md$/.exec(name);
            if (!m) continue;
            const file = path.join(dir, localeDir.name, name);
            // A markdown file without frontmatter, such as a README, is not a book
            if (!fs.readFileSync(file, 'utf8').trimStart().startsWith('---')) continue;
            if (m[1].endsWith('_filtered')) warnings.push(`${file}: ignored, filtering is inline now with <filter as="...">text</filter>`);
            else books[m[1]] = { file };
        }
    }
    return found;
}

/**
 * Generates every book. Returns { changed, warnings }; changed lists the files written, or in check mode the ones out of date.
 * Options: check, only (source files to limit the modifiers to), and the directories for tests.
 */
function generate(options = {}) {
    const { check = false, bookDir = BOOK_DIR, modifierDir = MODIFIER_DIR, tableDir = TABLE_DIR, langDir = LANG_DIR } = options;
    const only = options.only && options.only.map((f) => path.resolve(f));
    const changed = [];
    const warnings = [];
    const sources = findSources(bookDir, warnings);
    const references = sources[REFERENCE_LANG] || {};
    const langs = {};

    for (const [locale, books] of Object.entries(sources)) {
        langs[locale] = {};
        for (const [id, book] of Object.entries(books)) {
            if (locale !== REFERENCE_LANG && !references[id]) throw new Error(`${book.file}: no ${REFERENCE_LANG} book called ${id}`);
            const built = buildBook(id, book.file);
            warnings.push(...built.warnings);
            Object.assign(langs[locale], built.lang);
            if (locale === REFERENCE_LANG) {
                if (only && !only.includes(path.resolve(book.file))) continue;
                const modifier = path.join(modifierDir, id + '.json');
                if (emit(modifier, json(built.modifier), check)) changed.push(modifier);
                const table = path.join(tableDir, id + '.json');
                // The loot table is plain boilerplate, written once
                if (!fs.existsSync(table) && emit(table, json(tableFor(id)), check)) changed.push(table);
            } else {
                const reference = Object.keys(buildBook(id, references[id].file).lang);
                if (reference.join() !== Object.keys(built.lang).join()) {
                    warnings.push(`${book.file}: formatting differs from the ${REFERENCE_LANG} book, translated text lines up only where the spans do`);
                }
            }
        }
    }

    // Every key under book.<namespace>. belongs to this script, the rest of a lang file is kept
    for (const [locale, entries] of Object.entries(langs)) {
        const file = path.join(langDir, locale + '.json');
        const kept = {};
        if (fs.existsSync(file)) {
            for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(file, 'utf8')))) if (!k.startsWith(`book.${NS}.`)) kept[k] = v;
        }
        if (emit(file, json({ ...kept, ...entries }), check)) changed.push(file);
    }
    for (const id of FONTS.missing) warnings.push(`font ${id} is not defined by the game or texturepack/assets, its glyphs are measured as 9 pixels`);
    return { changed, warnings };
}

//endregion

module.exports = { generate, parseSnbt, parseClasses, parseFrontmatter, parseInline, splitSections, pagesOf, toComponent, buildBook, layout, reserveTall, hyphenate, unwrapNoHyphen, RARITY_COLORS, LORE_WIDTH, LORE_PIXELS, loreWidth };

if (require.main === module) {
    const args = process.argv.slice(2);
    const check = args.includes('--check');
    const only = args.filter((a) => !a.startsWith('--'));
    let result;
    try {
        result = generate({ check, only: only.length ? only : undefined });
    } catch (e) {
        console.error(`book_loot_gen: ${e.message}`);
        process.exit(1);
    }
    for (const w of result.warnings) console.warn(`warning: ${w}`);
    for (const f of result.changed) console.log(`${check ? 'out of date' : 'wrote'} ${path.relative(ROOT, f)}`);
    if (check && result.changed.length) process.exit(1);
}
