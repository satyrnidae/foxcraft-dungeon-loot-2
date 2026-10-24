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
// Generated files get a folder of their own, so a hand-written book modifier or table beside them is never cleaned up
const MODIFIER_DIR = path.join(ROOT, 'data', NS, 'item_modifier', 'random_loot', 'book', 'generated');
const TABLE_DIR = path.join(ROOT, 'data', NS, 'loot_table', 'item', 'random_loot', 'book', 'generated');
const LANG_DIR = path.join(ROOT, 'texturepack', 'assets', 'generated', 'lang');
const REFERENCE_LANG = 'en_us';
// Loot table that rolls one of the generated books, there are no loot table tags. The name is not available as a book id.
const ALL_TABLE = 'random_book';
// Frontmatter keys, anything else is warned about. Title and author are required.
const FRONTMATTER_KEYS = ['title', 'author', 'rarity', 'lore', 'font', 'model', 'writable', 'data', 'styles', 'debug'];
const REQUIRED_KEYS = ['title', 'author'];

// writable: true makes a book and quill. Its pages are plain strings, so it has no author and keeps no formatting
const isWritable = (meta) => String(meta.writable).toLowerCase() === 'true';
const requiredKeys = (meta) => (isWritable(meta) ? ['title'] : REQUIRED_KEYS);

// Project dev flag, config.json mc.dev. Books with debug: true are only generated when it is set.
function devMode() {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).mc.dev === true;
    } catch (e) {
        return false;
    }
}

const MAX_TITLE = 32;
const MAX_PAGES = 100;
// A page is 14 lines of 114 pixels, so 19 W, 28 I, 38 l or 57 i fit a line. The editor also stops a page at 1024 characters.
const PAGE_LINES = 14;
const PAGE_WIDTH = 114;
const PAGE_EDIT_LENGTH = 1024;
// Advance widths per font: the vanilla fonts cached by scripts/fonts.js and the fonts of the resource pack, read on every run by lore.js.
const { withNamespace, DEFAULT_FONT } = require('./fonts.js');
const { highlight } = require('./highlight.js');
const { FONTS, LORE_WIDTH, LORE_PIXELS, loreWidth, componentWidth, reflowLore, UNSPACED } = require('./lore.js');
const { musicLines, FONT: MUSIC_FONT } = require('./music.js');

const RARITY_COLORS = { common: 'white', uncommon: 'yellow', rare: 'aqua', epic: 'light_purple', mythic: 'green', cursed: 'red' };
// Names of the loot tables that group books, random_book and random_<rarity>_book, so not usable as book ids
const RESERVED = new Set([ALL_TABLE, ...Object.keys(RARITY_COLORS).map((r) => `random_${r}_book`)]);
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

// How many [ and { are still open at the end of the text, not counting the ones in quoted strings
function nestingOpen(text) {
    let depth = 0;
    let quote = null;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') i++;
            else if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '[' || c === '{') depth++;
        else if (c === ']' || c === '}') depth--;
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
                let value = m[2].trim();
                if (value.startsWith('[')) {
                    // lore: [ "line", {"text": "component"} ] over as many lines as it takes to close the list; each entry is kept as it is
                    while (nestingOpen(value) > 0 && n + 1 < frontmatter.length) value += '\n' + frontmatter[++n];
                    if (nestingOpen(value) !== 0) throw new Error('lore in the frontmatter is not closed');
                    let list;
                    try {
                        list = parseSnbt(value.replace(/,\s*$/, ''));
                    } catch (e) {
                        throw new Error(`lore is not a valid JSON or SNBT list: ${e.message}`);
                    }
                    meta.lore.push(...list.map((entry) => ({ entry })));
                } else if (value) meta.lore.push(value);
            } else if (key === 'data') {
                // An SNBT compound over as many lines as it takes to close its braces, kept as the SNBT string
                let text = m[2];
                while (nestingOpen(text) > 0 && n + 1 < frontmatter.length) text += '\n' + frontmatter[++n];
                if (nestingOpen(text) !== 0) throw new Error('data in the frontmatter is not closed');
                meta.data = text.replace(/,\s*$/, '').replace(/\s*\n\s*/g, ' ').trim();
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

// An item model is a resource location of an item definition, assets/<namespace>/items/<path>.json. A trailing .json is dropped
function parseModel(value) {
    const id = String(value).trim().replace(/\.json$/, '');
    if (!/^([a-z0-9_.-]+:)?[a-z0-9/._-]+$/.test(id)) throw new Error(`model "${value}" is not a resource location, lowercase letters, digits and _ . - / only`);
    return id.includes(':') ? id : `${NS}:${id}`;
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
const ALIGNS = ['left', 'center', 'right'];
const TYPE_NAMES = ['body', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bold', 'italic', 'underline', 'strikethrough', 'obfuscated', 'code', 'a', 'font', 'span', 'center', 'horiz', 'tally'];

const CLASS_FLAGS = { bold: 'bold', italic: 'italic', underline: 'underlined', underlined: 'underlined', strikethrough: 'strikethrough', obfuscated: 'obfuscated' };

/**
 * The styles of the frontmatter, { name: { color, font, bold, italic, underline, strikethrough, obfuscated, shadow_color, align } },
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
            } else if (key === 'char') {
                // Not a component style: the glyph horizontalLine draws a line of, unwrapAlign drops it
                if (typeof value !== 'string' || [...value].length !== 1 || value === '\n') throw new Error(`style "${name}": char is one character, such as "~" or " "`);
                styles.char = value;
            } else if (key === 'align') {
                // Not a component style: alignLines aligns a line that starts with this text, unwrapAlign drops it
                if (!ALIGNS.includes(value)) throw new Error(`style "${name}": align is ${ALIGNS.join(', ')}`);
                styles.align = value;
            } else {
                throw new Error(`style "${name}": unknown ${key}, one of color, font, shadow_color, align, char, ${Object.keys(CLASS_FLAGS).join(', ')}`);
            }
        }
        classes[name] = styles;
    }
    return classes;
}

// How each level of header looks unless the stylesheet says otherwise, header and then its level are added to that. A
// false flag is kept, so a header in italic text is upright. Only h1 is centered, the others leave align to the text
// around them. class="header" without a level is bold and underlined.
const HEADER_LEVELS = {
    header: { bold: true, underlined: true },
    h1: { align: 'center', bold: true, underlined: true, italic: false },
    h2: { bold: true, underlined: true, italic: false },
    h3: { bold: false, underlined: true, italic: true },
    h4: { bold: false, underlined: true, italic: false },
    h5: { bold: true, underlined: false, italic: false },
    h6: { bold: false, underlined: false, italic: true },
};
const headerStyles = (name, classes) => ({ ...HEADER_LEVELS[name], ...classes.header, ...(name === 'header' ? {} : classes[name]) });

// The styles of a class attribute, several names apply in order. class=".url" is the style .url, the dot is needed.
// The built-in classes go without one: class="h1" is the look of a header of that level, class="header" of any header
// and class="center" the style align: center, which centers the lines the text starts.
function classStyles(attrs, classes) {
    const styles = {};
    for (const name of (attrs.class || '').split(/\s+/).filter(Boolean)) {
        if (/^(h[1-6]|header)$/.test(name)) {
            Object.assign(styles, headerStyles(name, classes));
            continue;
        }
        if (name === 'center') {
            Object.assign(styles, { align: 'center', ...classes.center });
            continue;
        }
        if (!name.startsWith('.')) throw new Error(`class "${name}" needs its dot, class=".${name}"; only the built-in h1 to h6, header and center go without one`);
        if (!classes[name]) throw new Error(`unknown class "${name}", the frontmatter has ${Object.keys(classes).filter((k) => k.startsWith('.')).join(', ') || 'none'}`);
        Object.assign(styles, classes[name]);
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
            // \uXXXX or \u{X...} is the code point, for glyphs of a font that no keyboard types
            const code = /^\\u(?:([0-9a-fA-F]{4})|\{([0-9a-fA-F]{1,6})\})/.exec(text.slice(i, i + 10));
            const point = code && parseInt(code[1] || code[2], 16);
            if (code && point <= 0x10ffff) {
                buffer += String.fromCodePoint(point);
                i += code[0].length;
                continue;
            }
            buffer += text[i + 1];
            i += 2;
            continue;
        }
        if (c === '`') {
            // Inline code is literal, an opener without a closer on the line stays a backtick
            const close = text.indexOf('`', i + 1);
            if (close > i + 1 && !text.slice(i + 1, close).includes('\n')) {
                flush();
                // A type of INLINE_TYPES right after the code, with no letter or digit after it, makes the code that type; `n`padding
                // is code and the word padding. What follows the type stays text, a space only for the types of INLINE_EATS_SPACE
                const typed = /^([a-z]+)(?![a-zA-Z0-9])/.exec(text.slice(close + 1));
                if (typed && Object.hasOwn(INLINE_TYPES, typed[1])) {
                    content.push(...INLINE_TYPES[typed[1]](text.slice(i + 1, close), classes));
                    i = close + 1 + typed[0].length + (INLINE_EATS_SPACE.has(typed[1]) && text[close + 1 + typed[0].length] === ' ' ? 1 : 0);
                    continue;
                }
                content.push({ styles: { font: CODE_FONT, ...classes.code }, content: [text.slice(i + 1, close)] });
                i = close + 1;
                continue;
            }
        }
        const tag = /^<(font|a|filter|span|style|center|h[1-6])(\s[^>]*)?>/i.exec(text.slice(i));
        if (tag) {
            const name = tag[1].toLowerCase();
            const attrs = parseAttributes(tag[2] || '');
            const sub = parseInline(text, i + tag[0].length, `</${name}>`, classes);
            if (!sub.closed) throw new Error(`<${name}> is not closed`);
            flush();
            if (/^h[1-6]$/.test(name)) {
                content.push({ styles: headerStyles(name, classes), content: sub.content, header: true });
            } else if (name === 'center') {
                // The center type and the styles of its classes, alignLines aligns every line it is on. Like a block, the newline right
                // after <center> and the one right before </center> are not lines of their own
                const inner = sub.content.slice();
                if (typeof inner[0] === 'string') inner[0] = inner[0].replace(/^\n/, '');
                if (typeof inner[inner.length - 1] === 'string') inner[inner.length - 1] = inner[inner.length - 1].replace(/\n$/, '');
                content.push({ styles: { ...classes.center, ...classStyles(attrs, classes) }, content: inner.filter((p) => p !== ''), center: true });
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

// The characters of the tree as the reader sees them, each with whether it is bold and its font, an inner font wins.
// center is set inside a <center>, to its alignment, lead by a style with align, to that, which an inner style with an align overrides.
function glyphs(...args) {
    return shapeGlyphs(rawGlyphs(...args));
}
function rawGlyphs(content, bold = false, font = DEFAULT_FONT, literal = false, nohyphen = false, center = null, lead = null) {
    return content.flatMap((p) => {
        if (typeof p === 'string') return [...p].map((ch) => ({ ch, bold, font, literal, nohyphen, center, lead }));
        const inner = rawGlyphs(p.content, p.styles.bold === undefined ? bold : p.styles.bold === true, p.styles.font ? withNamespace(p.styles.font) : font, literal || p.literal === true, nohyphen || p.nohyphen === true, center ?? (p.center === true ? p.styles.align ?? 'center' : null), p.styles.align ?? lead);
        if (p.alt && inner.length) reserveRoom(inner, p, bold, font);
        return inner;
    });
}

// A <filter> span can read wider filtered than raw. Its last glyph gets reserve, the pixels the filtered text is wider, which a
// text cut into lines for both readings counts (see layoutGlyphs) but never draws, and delta, how much wider it is, less if it
// is narrower, which the padding of the filtered reading makes up for (see alignLines). each is measured as drawn, shaped on its own.
function reserveRoom(inner, part, bold, font) {
    const width = (list) => shapeGlyphs(list.map((g) => ({ ...g }))).reduce((sum, g) => sum + (g.sw ?? widthOf(g)), 0);
    const filtered = rawGlyphs(part.alt, part.styles.bold === undefined ? bold : part.styles.bold === true, part.styles.font ? withNamespace(part.styles.font) : font);
    const extra = width(filtered) - width(inner);
    if (extra > 0) inner[inner.length - 1].reserve = extra;
    if (extra !== 0) inner[inner.length - 1].delta = extra;
}

const widthOf = ({ ch, bold, font }) => FONTS.widthOf(font, ch, bold);

// How the game's text renderer draws Arabic: each letter takes the form its neighbors give it, so a line is as wide as its
// shaped glyphs, which the splitter does not know, it measures the plain letters. scripts/arabic_shaping.json is made from
// the game's own shaper by tests/java/ArabicShapingTable.java. A glyph of a shaped text gets sw, its width as drawn.
const SHAPING = require('./arabic_shaping.json');
const shapeOf = (ch) => SHAPING.letters[ch.codePointAt(0).toString(16)];
// A mark over a letter, which the letters around it join through
const isMark = (ch) => /^\p{Mn}$/u.test(ch);
// The lam-alef ligatures, which join the letter before them and no other
const isLigature = (ch) => /^[ﻵ-ﻼ]$/.test(ch);
const joinsAfter = (ch) => !!shapeOf(ch) && shapeOf(ch)[2] !== shapeOf(ch)[0];
const joinsBefore = (ch) => isLigature(ch) || (!!shapeOf(ch) && shapeOf(ch)[1] !== shapeOf(ch)[0]);

/**
 * Writes the lam-alef ligature of a text out, as the shaper would make it. The shaper turns the two letters into one, so
 * the line is a character shorter than the styles the game keeps for it, and every style after the ligature in the line (marks in between included)
 * lands one glyph early: the padding after it would be drawn in the font of the text. A ligature that is already in the
 * text is left alone by the shaper, and no styles shift. Tags are skipped when looking for the letter before.
 */
function ligate(text) {
    if (!/\u0644\p{Mn}*[\u0622\u0623\u0625\u0627]/u.test(text)) return text;
    let out = '';
    let joined = false;
    for (let i = 0; i < text.length; ) {
        const tag = text[i] === '<' ? /^<\/?[a-z][^>]*>/i.exec(text.slice(i)) : null;
        if (tag) {
            out += tag[0];
            i += tag[0].length;
            continue;
        }
        // The marks between the two letters stay, after the ligature
        const lam = text[i] === '\u0644' ? /^\u0644(\p{Mn}*)([\u0622\u0623\u0625\u0627])/u.exec(text.slice(i)) : null;
        const ligature = lam ? SHAPING.ligatures[lam[2].charCodeAt(0).toString(16)] : null;
        if (ligature) {
            out += String.fromCharCode(parseInt(ligature[joined ? 1 : 0], 16)) + lam[1];
            i += lam[0].length;
            joined = false;
            continue;
        }
        if (!isMark(text[i])) joined = joinsAfter(text[i]);
        out += text[i++];
    }
    return out;
}
function shapeGlyphs(chars) {
    const drawn = (g, form) => FONTS.widthOf(g.font, String.fromCodePoint(parseInt(form, 16)), g.bold);
    // The letter next to chars[i] on a side, past the marks
    const beside = (i, step) => {
        for (let n = i + step; n >= 0 && n < chars.length; n += step) if (!isMark(chars[n].ch)) return chars[n];
        return null;
    };
    chars.forEach((g, i) => {
        const shape = shapeOf(g.ch);
        if (!shape) return;
        const prev = beside(i, -1);
        const next = beside(i, 1);
        // A mark takes its medial form between two letters that join through it, its own reach does not count
        const mark = isMark(g.ch);
        const fromPrev = prev && joinsAfter(prev.ch) && (mark || joinsBefore(g.ch));
        const toNext = next && (mark || joinsAfter(g.ch)) && joinsBefore(next.ch);
        g.sw = drawn(g, shape[fromPrev ? (toNext ? 3 : 1) : toNext ? 2 : 0]);
    });
    return chars;
}

/**
 * Lays text out like the book screen: a newline is a forced line break, a line that overflows breaks after its last space,
 * or in the word when it has none. Bold glyphs are a pixel wider. Returns { lines, length }, a line being
 * { start, end, tstart, tend, soft }: glyph indexes without the space or newline that ended it, the same trimmed of the
 * spaces at its ends, and whether the line starts at a wrap. Does not remove anything, see layout.
 */
function layoutGlyphs(chars, reserve = false) {
    const lines = [];
    let start = 0;
    // The width as the splitter counts it, and as the glyphs are drawn: a line has to fit both ways
    let width = 0;
    let drawn = 0;
    let lastSpace = -1;
    let soft = false;
    const push = (end, next, nextSoft) => {
        lines.push({ start, end, soft });
        start = next;
        soft = nextSoft;
    };
    // What a glyph takes of a line, and with reserve what the filtered reading of its span needs after it
    const room = (g) => (reserve ? g.reserve ?? 0 : 0);
    const drawnWidth = (g) => (g.sw ?? widthOf(g)) + room(g);
    for (let i = 0; i < chars.length; i++) {
        const g = chars[i];
        if (g.ch === '\n') {
            push(i, i + 1, false);
            width = 0;
            drawn = 0;
            lastSpace = -1;
            continue;
        }
        const w = widthOf(g) + room(g);
        // A word carried onto a new line can still be wider than it, as after the indent of a paragraph, and breaks again
        while ((width + w > PAGE_WIDTH || drawn + drawnWidth(g) > PAGE_WIDTH) && g.ch !== ' ') {
            if (lastSpace >= start) push(lastSpace, lastSpace + 1, true);
            else push(i, i, true);
            // Carry the word that overflowed onto the new line
            width = chars.slice(start, i).reduce((sum, c) => sum + widthOf(c) + room(c), 0);
            drawn = chars.slice(start, i).reduce((sum, c) => sum + drawnWidth(c), 0);
            lastSpace = -1;
        }
        if (g.ch === ' ') lastSpace = i;
        width += w;
        drawn += drawnWidth(g);
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
function layout(content, reserve = false) {
    const chars = glyphs(content).map((g, place) => ({ ...g, place }));
    const length = chars.length;
    const dropped = new Set();
    for (;;) {
        const lines = layoutGlyphs(chars, reserve);
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

// Puts the string, or a list of strings and nodes, in the tree before the glyph with the given index, outside the span
// that starts there
function insertAt(content, target, text) {
    const parts = [].concat(text);
    let pos = 0;
    const walk = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
            const part = nodes[i];
            if (typeof part === 'string') {
                const chars = [...part];
                if (target >= pos && target < pos + chars.length) {
                    const before = chars.slice(0, target - pos).join('');
                    const after = chars.slice(target - pos).join('');
                    if (typeof text === 'string') nodes[i] = before + text + after;
                    else nodes.splice(i, 1, ...[before, ...parts, after].filter((p) => p !== ''));
                    return true;
                }
                pos += chars.length;
            } else {
                if (target === pos) {
                    nodes.splice(i, 0, ...parts);
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
function reserveTall(content, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const tree = JSON.parse(JSON.stringify(content));
    for (let guard = 0; guard < 1000; guard++) {
        const { lines, chars } = layout(tree);
        let change = null;
        lines.forEach((line, k) => {
            if (change || line.tstart === line.tend) return;
            const need = linesAbove(Math.max(...chars.slice(line.tstart, line.tend).filter((g) => g.ch !== ' ').map((g) => ascentOf(g.font, g.ch)), 0));
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

// Blank glyphs of the padding font, each as wide as the low bits of its code point say: \uf801 is 1 pixel, \uf840 64.
// The padding turns off the formats that would draw on it, an underline or strikethrough of the text around it.
const PAD_FONT = `${NS}:padding`;
const PAD_STYLES = { font: PAD_FONT, bold: false, underlined: false, strikethrough: false, obfuscated: false };
const padding = (width) =>
    [64, 32, 16, 8, 4, 2, 1]
        .filter((w) => (width >= w ? ((width -= w), true) : false))
        .map((w) => String.fromCharCode(0xf800 + w))
        .join('');
// Padding either way, the backwards glyphs being 0x80 past the forwards ones
const signedPadding = (width) => (width < 0 ? [...padding(-width)].map((c) => String.fromCharCode(c.charCodeAt(0) + 0x80)).join('') : padding(width));

// A number of decimal, 0x, 0o or 0b digits with _ between them, as its value; undefined when it is not one
function parseNumber(source) {
    const m = /^(-?)(0x[0-9a-f](?:_?[0-9a-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|\d(?:_?\d)*)$/i.exec(source.trim());
    return m ? Number(m[2].replace(/_/g, '')) * (m[1] ? -1 : 1) : undefined;
}

// The pixels of a `n`pad. A whole line of padding, 114 pixels, is the same as a line break, so it stops at 113.
const MAX_PAD = PAGE_WIDTH - 1;
function padWidth(source) {
    const width = parseNumber(source);
    if (width === undefined) throw new Error(`\`${source}\`pad is not a number`);
    if (Math.abs(width) > MAX_PAD) throw new Error(`\`${source}\`pad is ${width}px, padding goes up to ${MAX_PAD}`);
    return width;
}

// Tally marks, each 4 vertical ticks and then a crosswise one over them, a group of 5, in the font of tallies.png: the tick is
// the first glyph, the cross the second.
const TALLY_FONT = `${NS}:tallies`;
const TALLY_STYLES = { font: TALLY_FONT, bold: false, underlined: false, strikethrough: false, obfuscated: false };
const TICK = '\ue000';
const CROSS = '\ue001';
// The color of the marks unless the tally type of the stylesheet says otherwise
const TALLY_COLOR = 'dark_gray';
const TALLY_GAP = 2;
const MAX_TALLY = 1000;

// The count of a `n`tally: a number as for pad, or the tally itself, IIIII with spaces anywhere between
function tallyCount(source) {
    const code = source.trim();
    const count = /^[I ]+$/.test(code) ? code.replace(/ /g, '').length : parseNumber(code);
    if (count === undefined || count < 0) throw new Error(`\`${source}\`tally is not a number or tallies of I`);
    if (count > MAX_TALLY) throw new Error(`\`${source}\`tally is ${count}, tallies go up to ${MAX_TALLY}`);
    return count;
}

// The nodes of a count in groups of 5, the cross stepped back to sit in the middle of the four ticks before it, so it
// reaches out on both sides of them: the group starts that far in, and ends where the ticks or the cross do, then a gap.
// A run of groups too wide for the page goes on over lines of its own, broken here, since a wrap between the ticks and
// the cross would split a group. Their width is measured from the start of a line.
function tallyNodes(count, classes = {}) {
    const tick = FONTS.widthOf(TALLY_FONT, TICK, false);
    const cross = FONTS.widthOf(TALLY_FONT, CROSS, false);
    const start = Math.floor((4 * tick - cross) / 2);
    const lead = Math.max(0, -start);
    const end = Math.max(4 * tick, start + cross);
    const nodes = [];
    const styles = { ...TALLY_STYLES, color: TALLY_COLOR, ...classes.tally };
    const glyphs = (text) => nodes.push({ styles, content: [text] });
    const pad = (px) => px && nodes.push({ styles: PAD_STYLES, content: [signedPadding(px)] });
    let x = 0;
    // A unit of the given width goes after the gap, on the line it fits, else on the next
    const place = (width, draw) => {
        if (x && x + TALLY_GAP + width > MAX_PAD) {
            nodes.push('\n');
            x = 0;
        } else if (x) {
            pad(TALLY_GAP);
            x += TALLY_GAP;
        }
        draw();
        x += width;
    };
    for (let g = 0; g < Math.floor(count / 5); g++) {
        place(lead + end, () => {
            pad(lead);
            glyphs(TICK.repeat(4));
            pad(start - 4 * tick);
            glyphs(CROSS);
            pad(end - (start + cross));
        });
    }
    if (count % 5) place((count % 5) * tick, () => glyphs(TICK.repeat(count % 5)));
    return nodes;
}

// The types of inline code, by the word after its closing backtick, each giving the nodes that stand for the code.
// `n`pad is n pixels of padding, negative to step back. `n`tally is n tallies, see tallyNodes.
const INLINE_TYPES = {
    pad: (code) => {
        const width = padWidth(code);
        return width ? [{ styles: PAD_STYLES, content: [signedPadding(width)] }] : [];
    },
    tally: (code, classes) => tallyNodes(tallyCount(code), classes),
};
// The types that take one space after them with them, as `n`pad does; the others leave it in the text
const INLINE_EATS_SPACE = new Set(['pad']);

// The locales written right to left. Their text is aligned to the right unless a style says otherwise, and an alignment a
// book writes for text that starts at the left is mirrored: left is right there and right is left, center stays.
const RTL_LOCALES = ['ar_sa', 'he_il'];
const MIRROR = { left: 'right', right: 'left', center: 'center' };
const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;

/**
 * Aligns every line that holds a glyph of a <center>, or starts with a glyph of a style with align, to the left, center or
 * right: a line that starts at a wrap starts at a newline instead, so the overflow is aligned on its own, and padding goes
 * on the left of the line, all that is left of it for the right, half of that for the center. A style with align that
 * starts mid-line leaves that line alone, the lines it wraps onto start with it and are aligned. In a right to left locale
 * the alignments are mirrored and every other line is aligned to the right too, but those that hold padding, code or
 * music, which are laid out by hand. Lines are done from the last up, padding a line that fits does not move the wraps
 * above it. Returns a copy of the tree with the <center> marks and align styles gone.
 *
 * The game draws every line from the left edge, whichever way it reads. A line that reads right to left, as the first
 * letter with a direction decides, is drawn with its end at the left, so its padding goes after the text, where it is at
 * the left too.
 */
function alignLines(content, rtl = false) {
    const tree = JSON.parse(JSON.stringify(content));
    const { lines, chars } = layout(tree, rtl);
    for (const line of [...lines].reverse()) {
        const text = chars.slice(line.tstart, line.tend);
        if (!text.length) continue;
        const written = text[0].lead ?? text.find((g) => g.center)?.center ?? null;
        const laidOut = text.some((g) => g.font === PAD_FONT || g.font === TALLY_FONT || g.font === CODE_FONT || g.font === MUSIC_FONT);
        const align = written ? (rtl ? MIRROR[written] : written) : rtl && !laidOut ? 'right' : 'left';
        if (align === 'left') continue;
        const room = PAGE_WIDTH - text.reduce((sum, g) => sum + (g.sw ?? widthOf(g)), 0);
        // The line of the filtered reading is wider by the delta of the spans on it, so it gets that much less padding
        const delta = rtl ? text.reduce((sum, g) => sum + (g.delta ?? 0), 0) : 0;
        const strong = text.find((g) => /^\p{L}$/u.test(g.ch) && g.font !== PAD_FONT);
        const reads = strong ? RTL_LETTER.test(strong.ch) : rtl;
        // A right to left mark first, a padding after a left to right run would join it, and be drawn after it, not at the left edge
        const padOf = (space) => ({ styles: PAD_STYLES, content: [(reads ? '\u200f' : '') + padding(Math.max(0, Math.min(MAX_PAD, align === 'center' ? Math.floor(space / 2) : space)))] });
        const raw = padOf(room);
        const filtered = padOf(room - delta);
        const pad = raw.content[0].length > (reads ? 1 : 0) || filtered.content[0].length > (reads ? 1 : 0);
        // Where the two differ the padding is a filter span of its own: the filtered reading shows the other one
        const node = JSON.stringify(raw) === JSON.stringify(filtered) ? raw : { styles: {}, content: [raw], alt: [filtered] };
        if (pad && reads && !insertAt(tree, chars[line.tend - 1].place + 1, [node])) tree.push(node);
        const parts = [...(line.soft ? ['\n'] : []), ...(pad && !reads ? [node] : [])];
        if (parts.length) insertAt(tree, chars[line.tstart].place, parts);
    }
    return unwrapAlign(tree);
}

/**
 * Breaks the lines of a text with Arabic in it for good, so the game does not wrap them by the width of the plain letters
 * when they are drawn wider: a newline goes where each line starts at a wrap, as alignLines does. Returns the tree.
 */
function hardWrap(content) {
    const { lines, chars } = layout(content, true);
    if (!chars.some((g) => g.sw !== undefined)) return content;
    const tree = JSON.parse(JSON.stringify(content));
    for (const line of [...lines].reverse()) if (line.soft && line.tstart < line.tend) insertAt(tree, chars[line.tstart].place, '\n');
    return tree;
}

// The tree without the marks of <center> nodes and the align of styles, the alt of a filter too. A <center> without a
// class is gone, its text stays where it is.
function unwrapAlign(content) {
    return content.flatMap((part) => {
        if (typeof part === 'string') return [part];
        const inner = unwrapAlign(part.content);
        const { align: _, char: __, ...styles } = part.styles;
        const node = { ...part, styles, content: inner, ...(part.alt ? { alt: unwrapAlign(part.alt) } : {}) };
        // A style that only aligned leaves nothing to style
        if ('align' in part.styles && !Object.keys(styles).length && !part.alt && !part.literal) return inner;
        if (!part.center) return [node];
        if (!Object.keys(styles).length) return inner;
        const { center, ...kept } = node;
        return [kept];
    });
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
                if (part.id !== undefined) node.id = part.id;
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
function paginate(content, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const pager = pagerOf(content, ascentOf);
    const ranges = [];
    for (let at = pager.first(0); at < pager.lines.length; ) {
        let end = Math.min(at + PAGE_LINES, pager.lines.length);
        // The empty lines above a tall line go to the next page with it
        while (end > at + 1 && pager.splitsReserve(end)) end--;
        ranges.push([at, end]);
        at = pager.first(end);
    }
    return ranges.map(([from, to]) => pager.slice(from, to)).filter(Boolean);
}

/**
 * The lines of a tree as pages are cut from them. first(n) is the line a page that starts at line n really starts at:
 * empty lines at the top of a page are dropped, except the ones a tall glyph below them needs to sit in place.
 * slice(from, to) is the page of those lines without the empty lines at its end, or null when none are left.
 */
function pagerOf(content, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const { lines, chars, dropped } = layout(content);
    const empty = (n) => lines[n].tstart === lines[n].tend;
    const keeps = (n) => {
        let next = n;
        while (next < lines.length && empty(next)) next++;
        if (next === lines.length) return false;
        const need = linesAbove(Math.max(...chars.slice(lines[next].tstart, lines[next].tend).filter((g) => g.ch !== ' ').map((g) => ascentOf(g.font, g.ch)), 0));
        return next - n <= need;
    };
    const first = (n) => {
        while (n < lines.length && lines[n].start === lines[n].end && !keeps(n)) n++;
        return n;
    };
    const slice = (from, to) => {
        while (to > from && lines[to - 1].start === lines[to - 1].end) to--;
        return to > from ? sliceTree(content, chars[lines[from].start].place, chars[lines[to - 1].end - 1].place + 1, dropped) : null;
    };
    // Whether a page that ends before line `to` keeps the empty lines a tall glyph after it needs, at the bottom of the
    // page instead of above that glyph at the top of the next
    const splitsReserve = (to) => {
        if (to === 0 || to >= lines.length || !empty(to - 1)) return false;
        let next = to;
        while (next < lines.length && empty(next)) next++;
        if (next === lines.length) return false;
        const need = linesAbove(Math.max(...chars.slice(lines[next].tstart, lines[next].tend).filter((g) => g.ch !== ' ').map((g) => ascentOf(g.font, g.ch)), 0));
        return next - to < need;
    };
    return { lines, chars, empty, first, slice, splitsReserve };
}

// Where the spans of a tree start and end, in glyph places and in the order they come. The padding of <center> is left
// out, its count depends on where the lines wrap.
function spanEdges(content) {
    const edges = [];
    let pos = 0;
    const walk = (nodes) => {
        for (const part of nodes) {
            if (typeof part === 'string') {
                pos += [...part].length;
                continue;
            }
            const pad = part.rule || (part.styles && part.styles.font === PAD_FONT);
            if (!pad) edges.push(pos);
            walk(part.content);
            if (!pad) edges.push(pos);
        }
    };
    walk(content);
    return { edges, length: pos };
}

/**
 * Pages of the same section in several locales, cut so that each page holds the same spans, or the same parts of them,
 * in every locale: page n of a translation then has the lang keys and %n$s of page n of the reference. A cut is placed by
 * the spans before it, and inside the text between two span edges by how far into that text it is, so a longer
 * translation pulls the cuts of the shorter one back. Returns a list of pages per locale, or null when no common cut
 * fits a page, as when the spans differ.
 */
function paginateTogether(contents, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const all = contents.map((content) => {
        const pager = pagerOf(content, ascentOf);
        const { edges, length } = spanEdges(content);
        // The span edges up to a glyph place, and that place as span edges and the fraction of the text to the next one
        const before = (place) => edges.filter((e) => e <= place).length;
        const progress = (place) => {
            const k = before(place);
            const from = k ? edges[k - 1] : 0;
            const to = k < edges.length ? edges[k] : length;
            return k + (to > from ? (place - from) / (to - from) : 0);
        };
        return { pager, edges, before, progress };
    });
    if (new Set(all.map((a) => a.edges.length)).size > 1) return null;
    // A cut before line `to` of a page that starts at line `from`: the last glyph left on the page and the first glyph
    // after it decide which spans are cut, null when the page would be empty
    const cutOf = (a, from, to) => {
        const { lines, chars, empty } = a.pager;
        let last = to - 1;
        while (last >= from && empty(last)) last--;
        if (last < from) return null;
        let next = to;
        while (next < lines.length && empty(next)) next++;
        if (next === lines.length) return { to, end: true, key: 'end', progress: Infinity };
        const x = chars[lines[last].tend - 1].place;
        const y = chars[lines[next].tstart].place;
        return { to, end: false, key: `${a.before(x)}:${a.before(y)}`, progress: a.progress(y) };
    };
    const pages = all.map(() => []);
    const at = all.map((a) => a.pager.first(0));
    for (let guard = 0; at.some((n, i) => n < all[i].pager.lines.length); guard++) {
        if (guard > 10000 || at.some((n, i) => n >= all[i].pager.lines.length)) return null;
        const cuts = all.map((a, i) => {
            const list = [];
            for (let to = at[i] + 1; to <= Math.min(at[i] + PAGE_LINES, a.pager.lines.length); to++) {
                const cut = cutOf(a, at[i], to);
                // The chat-filtered reading of the page has to fit too, an alt can be longer than its text
                if (cut && !a.pager.splitsReserve(to) && layout(variant(a.pager.slice(at[i], to), true)).lines.length <= PAGE_LINES) list.push(cut);
            }
            return list;
        });
        if (cuts.some((list) => !list.length)) return null;
        // The locale that gets the least far on a full page sets how far all go; each still has its first cut
        const reach = Math.min(...cuts.map((list) => Math.max(...list.map((c) => c.progress))));
        const allowed = cuts.map((list) => list.filter((c, n) => n === 0 || c.progress <= reach));
        const common = allowed[0].map((c) => c.key).filter((key) => allowed.every((list) => list.some((c) => c.key === key)));
        if (!common.length) return null;
        // The farthest common cut, each locale filling its page as far as that cut lets it
        const key = common[common.length - 1];
        all.forEach((a, i) => {
            const cut = allowed[i].filter((c) => c.key === key).pop();
            pages[i].push(a.pager.slice(at[i], cut.to));
            at[i] = a.pager.first(cut.to);
        });
    }
    return pages;
}

const hasCut = (content) => content.some((part) => typeof part !== 'string' && (part.cut === true || hasCut(part.content)));

/**
 * Like paginate, and a page also has to fit when read with chat filtering, where a filter can show a longer text than it hides,
 * and does not end inside a filter span.
 */
function paginateFit(content, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const pager = pagerOf(content, ascentOf);
    const pages = [];
    for (let at = pager.first(0); at < pager.lines.length; ) {
        const fits = (to) => {
            if (pager.splitsReserve(to)) return false;
            const page = pager.slice(at, to);
            // A page edge inside a filter span would leave the span unfiltered
            return !page || (!hasCut(page) && layout(variant(page, true)).lines.length <= PAGE_LINES);
        };
        let end = Math.min(at + PAGE_LINES, pager.lines.length);
        while (end > at + 1 && !fits(end)) end--;
        const page = pager.slice(at, end);
        if (page) pages.push(page);
        at = pager.first(end);
    }
    return pages;
}

// Adjacent strings joined, empty ones dropped
function joinText(content) {
    const parts = [];
    for (const part of content) {
        if (typeof part === 'string') {
            if (typeof parts[parts.length - 1] === 'string') parts[parts.length - 1] += part;
            else if (part) parts.push(part);
        } else {
            parts.push(part);
        }
    }
    return parts;
}

// Span numbers in the order of the text; the padding of a locale, which has none, goes after
const byId = (a, b) => (typeof a === 'number' && typeof b === 'number' ? a - b : typeof a === 'number' ? -1 : typeof b === 'number' ? 1 : String(a) < String(b) ? -1 : 1);

/**
 * The text component of one page, as every locale reads it. contents is the content of the page in each locale, or null where
 * a locale has no such page. The arguments are every span any locale has on the page, by span number, so a locale that cuts
 * its pages elsewhere still finds its spans on the page and writes its text as the template of its own lang entry, %n$s
 * for the spans it has. langs[i] gets the entries of locale i. The component takes the fallback and the style of the
 * locale at ref.
 */
function unionComponent(contents, key, langs, ref) {
    const parts = contents.map((content) => content && joinText(content));
    const idOf = (i, part, n) => (part.id !== undefined ? part.id : `~${i}.${n}`);
    const nodes = new Map();
    parts.forEach((list, i) => {
        if (!list) return;
        list.forEach((part, n) => {
            if (typeof part === 'string') return;
            const id = idOf(i, part, n);
            if (!nodes.has(id)) nodes.set(id, []);
            nodes.get(id)[i] = part;
        });
    });
    const ids = [...nodes.keys()].sort(byId);
    const templates = parts.map((list, i) => list && list.map((part, n) => (typeof part === 'string' ? escapePercent(part) : `%${ids.indexOf(idOf(i, part, n)) + 1}$s`)).join(''));
    templates.forEach((template, i) => template !== null && (langs[i][key] = template));
    const base = templates[ref] !== null ? ref : templates.findIndex((template) => template !== null);
    const component = { translate: key, fallback: templates[base] };
    if (ids.length) {
        component.with = ids.map((id, n) => {
            const found = nodes.get(id);
            const node = found[ref] || found.find(Boolean);
            if (node.literal) return literalComponent(node);
            const child = unionComponent(found.map((f) => f && f.content), `${key}.${n + 1}`, langs, ref);
            return Object.assign(child, node.styles);
        });
    }
    return component;
}

/** A page as unionComponent, with the style of the whole text, the WHOLE node every page is inside, on the page itself. */
function unionPage(contents, key, langs, ref) {
    const wrapped = contents.find((content) => content && content.length === 1 && content[0].id === WHOLE);
    const inner = contents.map((content) => content && (content.length === 1 && content[0].id === WHOLE ? content[0].content : content));
    const component = unionComponent(inner, key, langs, ref);
    contents.forEach((content, i) => content === null && (langs[i][key] = ''));
    return wrapped ? Object.assign(component, (contents[ref] ? contents[ref][0] : wrapped[0]).styles) : component;
}

//endregion

//region Books

// A line of only --- is a manual page break. Between them a newline in the source is a line break, so a blank line is an empty line,
// and a line that is too long wraps by itself. Spans do not reach across a page break.
const escapeMarkup = (s) => s.replace(/[\\*_~|<`]/g, '\\$&');

// The lines of a code block as markup: literal spans in the code font, colored by the language of the fence when the
// highlighter knows it. A code line keeps its indentation and is never a heading.
function codeLines(language, lines) {
    const code = lines.map((l) => l.replace(/\s+$/, '')).join('\n');
    const rows = (language && highlight(code, language)) || code.split('\n').map((l) => (l ? [{ text: l, color: undefined }] : []));
    return rows.map((row) => row.map(({ text, color }) => `<font face="${CODE_FONT}"${color ? ` color="${color}"` : ''} literal="1">${escapeMarkup(text)}</font>`).join(''));
}

// The lines of a block as markup, a music block as staff lines and any other as code
const blockLines = (language, lines) => (language === 'music' ? musicLines(lines.join('\n'), (ch) => FONTS.widthOf(MUSIC_FONT, ch, false)) : codeLines(language, lines));

// Fenced code blocks in the lines of a section become the markup of their code lines, the fence lines are dropped
function fenceCode(lines) {
    const out = [];
    let block = null;
    for (const line of lines) {
        const fence = /^\s*```(\S*)/.exec(line);
        if (fence && !block) {
            block = { language: fence[1], lines: [] };
        } else if (fence) {
            out.push(...blockLines(block.language, block.lines));
            block = null;
        } else if (block) {
            block.lines.push(line);
        } else {
            out.push(line);
        }
    }
    if (block) out.push(...blockLines(block.language, block.lines));
    return out;
}

// Splits on a <br> anywhere in the text, except in code: a fenced block, or an inline `code` span on a line, so code that
// shows one stays in one piece. A line of --- is a horizontal line, see horizontalLine.
const PAGE_BREAK = /^<br\s*\/?>/i;

function splitOnBreaks(body) {
    const sections = [[]];
    const add = (text) => sections[sections.length - 1].push(text);
    let fenced = false;
    for (const line of body.split('\n')) {
        const fence = /^\s*```/.test(line);
        if (fence) fenced = !fenced;
        if (fence || fenced) {
            add(line);
            continue;
        }
        // The pieces of the line between its breaks; a break ends the section the line is in, and the rest starts the next
        let from = 0;
        for (let i = 0; i < line.length; ) {
            if (line[i] === '\\') {
                i += 2;
            } else if (line[i] === '`' && line.indexOf('`', i + 1) > i + 1) {
                i = line.indexOf('`', i + 1) + 1;
            } else if (line[i] === '<' && PAGE_BREAK.test(line.slice(i))) {
                add(line.slice(from, i));
                sections.push([]);
                i += PAGE_BREAK.exec(line.slice(i))[0].length;
                // The spaces after a break are not an indent of the next page
                while (line[i] === ' ') i++;
                from = i;
            } else {
                i++;
            }
        }
        add(line.slice(from));
    }
    return sections.map((lines) => lines.join('\n'));
}

function splitSections(body) {
    return splitOnBreaks(body.replace(/\r\n/g, '\n'))
        .map((section) =>
            fenceCode(section.split('\n'))
                .map((line) => line.replace(/\s+$/, ''))
                // A heading is bold and underlined and always has an empty line under it
                .flatMap((line, n, lines) => (/^#{1,6}\s+/.test(line) ? [line.replace(/^(#{1,6})\s+(.*)$/, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`), ...(lines[n + 1] === '' ? [] : [''])] : [line]))
                .join('\n')
                // The line break that ends the --- line goes, the empty lines after it are paginate's to keep or drop
                .replace(/^\n|\n+$/g, '')
        )
        .filter(Boolean);
}

// Every page of the body, a list of trees. Sections fill pages on their own, 14 lines each. A font wraps the whole text,
// a <font face> inside still wins. Without align, <center> leaves its lines where they are, as a book and quill does.
function pagesOf(body, font = null, hyphenator = null, classes = {}, align = true, rtl = false) {
    return sectionsOf(body, font, hyphenator, classes, align, rtl).flatMap((tree) => paginate(tree));
}

// Every node of the parsed text gets a number, in the order the spans come. A translation has the same spans in the same
// order, so a number is the same span in every locale, wherever its pages end. What a filter shows instead is free to differ
// between locales: its spans are named by the filter, their place in the text and their style. The padding and hyphens added
// later have no number. WHOLE is the style of the whole text.
const WHOLE = 'whole';
function assignIds(content, next) {
    for (const part of content) {
        if (typeof part === 'string') continue;
        part.id = next++;
        next = assignIds(part.content, next);
        if (part.alt) assignAltIds(part.alt, `${part.id}a`);
    }
    return next;
}
function assignAltIds(content, prefix) {
    content.forEach((part, n) => {
        if (typeof part === 'string') return;
        part.id = `${prefix}${n}${JSON.stringify(part.styles)}`;
        assignAltIds(part.content, `${part.id}.`);
    });
}

// A line of only --- is a horizontal line across the page: one glyph of foxcraft_dungeon_loot:rule, 113 pixels of line and
// the pixel after it, so there is no gap in it, as there is between hyphens. The color of the horiz style tints it; it is
// never bold, a bold glyph would be a pixel wider than the page and wrap. A horiz style with a font or a char of its own
// gets that character instead, a hyphen unless char says otherwise, as many as fit 114 pixels, a bold one being a pixel
// wider, and touching, see join. When they do not fit evenly the last one starts early, after padding that steps back, over the one before it, so the
// line is exactly as wide as the page: a line any wider would wrap, and any shorter would not reach the edge. A space
// with underline or strikethrough is a line too. over is the styles of a <style> around the --- line, laid over horiz.
// The pieces are literal, they are not text to translate.
const RULE_FONT = `${NS}:rule`;
function horizontalLine(classes, over = {}) {
    // The char of horiz, else the one of the body, and a style around the line wins over both
    const { char, ...style } = { ...(classes.body?.char === undefined ? {} : { char: classes.body.char }), ...classes.horiz, ...over };
    if (!style.font && char === undefined) return [{ styles: { ...style, font: RULE_FONT, bold: false }, content: ['\ue000'], literal: true, rule: true }];
    const font = style.font ? withNamespace(style.font) : DEFAULT_FONT;
    const mark = char ?? '-';
    const bold = (style.bold ?? classes.body?.bold) === true;
    // A space that ends the line is dropped, so the last mark of a blank is a no-break space, which has a width of its own
    const end = /\s/.test(mark) ? '\u00a0' : mark;
    // A glyph is followed by a pixel without ink, so each mark but the last is followed by padding that steps back over it,
    // and the marks touch; a blank has no ink to join. The last keeps its pixel, it is where the line ends
    const join = /\S/.test(mark) ? 1 : 0;
    const advance = FONTS.widthOf(font, mark, bold) - join;
    const endAdvance = FONTS.widthOf(font, end, bold);
    const count = Math.max(0, Math.ceil((PAGE_WIDTH - endAdvance) / advance));
    const excess = count * advance + endAdvance - PAGE_WIDTH;
    const piece = (text) => ({ styles: { font: DEFAULT_FONT, ...style }, content: [text], literal: true, rule: true });
    const back = (width) => ({ styles: PAD_STYLES, content: [signedPadding(-width)], literal: true, rule: true });
    const front = Array.from({ length: count }).flatMap(() => (join ? [piece(mark), back(join)] : [piece(mark)]));
    return [...front, ...(excess ? [back(excess)] : []), piece(end)];
}

// The lines that split a section into parts: a <vcenter>, or a horizontal line, which a <style> around the --- may restyle
const LINE_MARKS = /^(<vcenter>|---|<style(?:\s[^>]*)?>\s*---\s*<\/style>)[ \t]*(?:\n|$)/m;

// What a text tree holds in the order of its glyphs: where each <vcenter> is, and where each header starts
function textMarks(content) {
    const marks = [];
    let pos = 0;
    const walk = (nodes) => {
        for (const part of nodes) {
            if (typeof part === 'string') {
                pos += [...part].length;
                continue;
            }
            if (part.vcenter) marks.push({ kind: 'vcenter', at: pos });
            const mark = part.header ? { kind: 'header', at: pos, end: pos } : null;
            if (mark) marks.push(mark);
            walk(part.content);
            if (mark) mark.end = pos;
        }
    };
    walk(content);
    return marks;
}

const withoutVcenter = (content) =>
    content.filter((part) => !part.vcenter).map((part) => (typeof part === 'string' ? part : { ...part, content: withoutVcenter(part.content) }));

function centerVertically(tree, marks) {
    const clean = withoutVcenter(tree);
    const centers = marks.filter((m) => m.kind === 'vcenter');
    if (!centers.length || paginate(clean).length !== 1) return clean;
    const { lines, chars } = layout(clean);
    const empty = (n) => lines[n].tstart === lines[n].tend;
    // The line a place of the tree starts or falls in
    const lineAt = (at) => {
        const c = chars.findIndex((g) => g.place >= at);
        return c < 0 ? lines.length : lines.findIndex((l) => c >= l.start && c <= l.end);
    };
    const firstLine = lines.findIndex((_, n) => !empty(n));
    const lastLine = lines.length - 1 - [...lines].reverse().findIndex((_, n) => !empty(lines.length - 1 - n));
    const spare = PAGE_LINES - (lastLine - firstLine + 1);
    if (spare <= 0) return clean;
    const headers = marks.filter((m) => m.kind === 'header');
    const glyphList = glyphs(clean);
    // The lines of the text under each: from its first line with something on it, up to the next header that has text above it
    const regions = centers.map((m) => {
        let from = Math.max(lineAt(m.at), firstLine);
        while (from <= lastLine && empty(from)) from++;
        // Under a header the text goes up to the next header, a <vcenter> of the page itself up to the end of the page
        const under = headers.some((h) => h.end <= m.at && glyphList.slice(h.end, m.at).every((g) => /\s/.test(g.ch)));
        const next = under ? headers.map((h) => lineAt(h.at)).find((h) => h > from) : undefined;
        let to = (next ?? lastLine + 1) - 1;
        while (to > from && empty(to)) to--;
        return { from, to, last: next === undefined };
    });
    const blank = () => [{ styles: PAD_STYLES, content: [padding(1)] }, '\n'];
    const fill = (count) => Array.from({ length: count }).flatMap(blank);
    const edits = [];
    regions.forEach((r, n) => {
        const share = Math.floor(spare / regions.length) + (n < spare % regions.length ? 1 : 0);
        const above = Math.floor(share / 2);
        if (r.from > lastLine) return;
        edits.push({ at: chars[lines[r.from].start].place, text: fill(above) });
        // Under the text, before the line that follows it, unless that is where the page ends
        if (!r.last) edits.push({ at: chars[lines[r.to + 1].start].place, text: fill(share - above) });
    });
    // From the end of the tree, so the places in front stay
    const result = JSON.parse(JSON.stringify(clean));
    for (const e of edits.sort((a, b) => b.at - a.at)) if (e.text.length) insertAt(result, e.at, e.text);
    return result;
}

// The tree of every section of the body, laid out and ready to be cut into pages
function sectionsOf(body, font = null, hyphenator = null, classes = {}, align = true, rtl = false) {
    let nextId = 0;
    return splitSections(ligate(body)).map((text) => {
        // The parts between the <vcenter> and --- lines, each its own text, with a mark or a horizontal line where one was
        const pieces = text.split(LINE_MARKS);
        const content = pieces.flatMap((part, n) => {
            if (n % 2 && part !== '<vcenter>') {
                const tag = /^<style((?:\s[^>]*)?)>/.exec(part);
                return [...horizontalLine(classes, tag ? classStyles(parseAttributes(tag[1]), classes) : {}), '\n'];
            }
            if (n % 2) return [{ styles: {}, content: [], vcenter: true }];
            const parsed = parseInline(part, 0, null, classes).content;
            nextId = assignIds(parsed, nextId);
            return parsed;
        });
        const base = { ...(font ? { font } : {}), ...classes.body };
        const tree = reserveTall(unwrapNoHyphen(hyphenate(Object.keys(base).length ? [{ id: WHOLE, styles: base, content }] : content, hyphenator)));
        const wrapped = hardWrap(tree);
        const laidOut = align ? alignLines(wrapped, rtl) : unwrapAlign(wrapped);
        // A book and quill has no padding glyphs to hold the empty lines
        return centerVertically(laidOut, align ? textMarks(laidOut) : []);
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

// Keys a translation takes from the reference book when it does not set them
const INHERITED_KEYS = ['rarity', 'model', 'styles'];

// The locale folder of a source and the group folder under it, if any: <locale>/<id>.md or <locale>/<group>/<id>.md
function placeOf(file) {
    const dir = path.dirname(file);
    const grouped = !/^[a-z]{2,3}_[a-z]{2}$/i.test(path.basename(dir));
    const localeDir = grouped ? path.dirname(dir) : dir;
    return { locale: path.basename(localeDir), group: grouped ? path.basename(dir) : null, root: path.dirname(localeDir) };
}

function readSource(file) {
    const { meta, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
    const { locale, group, root } = placeOf(file);
    const reference = path.join(root, REFERENCE_LANG, ...(group ? [group] : []), path.basename(file));
    if (locale !== REFERENCE_LANG && fs.existsSync(reference)) {
        const base = parseFrontmatter(fs.readFileSync(reference, 'utf8')).meta;
        for (const key of INHERITED_KEYS) if (meta[key] === undefined && base[key] !== undefined) meta[key] = base[key];
    }
    if (meta.font) {
        try {
            parseFont(meta.font);
        } catch (e) {
            throw new Error(`${file}: frontmatter ${e.message}`);
        }
    }
    if (meta.data !== undefined) {
        let data;
        try {
            data = parseSnbt(meta.data);
        } catch (e) {
            throw new Error(`${file}: frontmatter data is not valid SNBT: ${e.message}`);
        }
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${file}: frontmatter data is an SNBT compound, like {DungeonLootId:87}`);
    }
    if (meta.model) {
        try {
            parseModel(meta.model);
        } catch (e) {
            throw new Error(`${file}: frontmatter ${e.message}`);
        }
    }
    if (meta.writable !== undefined && !/^(true|false)$/i.test(String(meta.writable))) throw new Error(`${file}: frontmatter writable is true or false`);
    // A writable book's pages are not hyphenated, a hyphen would stay in the text the player edits
    const hyphenator = isWritable(meta) ? null : hyphenatorOf(locale);
    // A book and quill shows its text in the default font, the glyphs of the padding would not be blank there
    const sections = sectionsOf(body, meta.font || null, hyphenator, meta.styles || {}, !isWritable(meta), RTL_LOCALES.includes(locale));
    return { meta, sections, pages: sections.flatMap((tree) => paginate(tree)) };
}

// The spans of the sections of a source, numbers and styles in order, what a translation has to share with the reference
const spansOf = (source) => {
    const out = [];
    const walk = (nodes) =>
        nodes.forEach((part) => {
            if (typeof part === 'string') return;
            if (part.id !== undefined && part.id !== WHOLE) out.push(`${part.id}:${JSON.stringify(part.styles)}:${part.alt ? 1 : 0}:${part.literal ? 1 : 0}`);
            walk(part.content);
        });
    source.sections.forEach(walk);
    return out.join('\n');
};

/**
 * The sources of one book in the reference locale and its translations, each with its pages cut on its own, to fill every
 * page, and the page components all of them are read with: a page lists the spans of every locale that has them on it, see
 * unionComponent, and a locale with fewer pages has empty ones at the end. A translation whose spans are not the ones of the
 * reference cannot be matched to it and is left out, with a warning.
 */
function alignSources(files, warnings) {
    const sources = files.map((file) => readSource(file));
    if (sources.length < 2 || isWritable(sources[0].meta)) return sources;
    const used = [0];
    for (let i = 1; i < sources.length; i++) {
        if (spansOf(sources[i]) === spansOf(sources[0])) used.push(i);
        else warnings.push(`${files[i]}: the spans are not the ones of ${files[0]}, in the same order, so its pages are not translated`);
    }
    const own = sources.map((source) => source.sections.flatMap((tree) => paginateFit(tree)));
    const count = Math.max(...used.map((i) => own[i].length));
    const langs = used.map(() => ({}));
    const raw = (n) => used.map((i) => (own[i][n] ? variant(own[i][n], false) : null));
    const filtered = (n) => used.map((i) => (own[i][n] ? variant(own[i][n], true, () => warnings.push(`${files[i]}: page ${n + 1} has a <filter> span cut by the page break, it stays unfiltered`)) : null));
    const components = [];
    const id = (file) => path.basename(file, '.md');
    for (let n = 0; n < count; n++) {
        const reads = raw(n);
        reads.forEach((tree, k) => {
            const { length } = tree ? layout(tree) : { length: 0 };
            if (length > PAGE_EDIT_LENGTH) warnings.push(`${files[used[k]]}: page ${n + 1} has ${length} characters, the editor stops at ${PAGE_EDIT_LENGTH}`);
        });
        const page = unionPage(reads, `book.${NS}.${id(files[0])}.page.${n + 1}`, langs, 0);
        // A page that reads the same filtered stays a plain component, the game filters it to the same text
        const filters = filtered(n);
        const differs = reads.some((tree, k) => tree && JSON.stringify(tree) !== JSON.stringify(filters[k]));
        components.push(differs ? { raw: page, filtered: unionPage(filters, `book.${NS}.${id(files[0])}.filtered.${n + 1}`, langs, 0) } : page);
    }
    return sources.map((source, i) => {
        const k = used.indexOf(i);
        return { ...source, pages: own[i], union: k < 0 ? { count: 0, components: [], lang: {} } : { count, components, lang: langs[k] } };
    });
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

// A lore line is plain text, or JSON/SNBT for a text component when it starts with { or [. Plain text is shown as is, in the
// default lore style. Returns { raw, component, text, width }: text is what a line reads as, empty for a component that is not
// plain text, so the wrap checks leave it alone
function loreEntries(meta) {
    return meta.lore.map((item) => {
        if (typeof item === 'object') {
            const raw = JSON.stringify(item.entry);
            if (typeof item.entry === 'string') return { raw: item.entry, component: item.entry, text: item.entry, width: loreWidth(item.entry), plain: true };
            return { raw, component: item.entry, text: '', width: componentWidth(item.entry), plain: false };
        }
        const raw = item;
        if (!/^[{[]/.test(raw)) return { raw, component: raw, text: raw, width: loreWidth(raw), plain: true };
        let component;
        try {
            component = parseSnbt(raw);
        } catch (e) {
            throw new Error(`lore line ${raw} is not valid JSON or SNBT: ${e.message}`);
        }
        return { raw, component, text: '', width: componentWidth(component), plain: false };
    });
}

/**
 * The lines of the lore as the item shows them, { text } for plain text and { component } for a component line. Plain
 * text is wrapped to the width: a frontmatter line is joined with the next unless it ends a sentence or the next is empty,
 * and broken where the next word does not fit, so the frontmatter needs no wrapping of its own. A component line keeps its place and ends the text before it.
 * With a count, the text is wrapped narrower until it takes that many lines, so a translation that wraps into fewer lines
 * than another locale still fills every line the item has; empty lines make up the rest when it cannot.
 */
function wrappedLore(meta, count = 0) {
    const rows = loreEntries(meta);
    const wrap = (limit) => {
        const out = [];
        let run = [];
        const flush = () => out.push(...reflowLore(run.splice(0), limit).map((text) => ({ text })));
        for (const row of rows) {
            if (row.plain) run.push(row.text);
            else {
                flush();
                out.push({ component: row.component });
            }
        }
        flush();
        return out;
    };
    let lines = wrap(LORE_PIXELS);
    if (lines.length < count) {
        // Fewer lines for a wider limit; the widest limit that still takes count lines
        let lo = 1;
        let hi = LORE_PIXELS;
        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (wrap(mid).length >= count) lo = mid;
            else hi = mid - 1;
        }
        if (wrap(lo).length === count) lines = wrap(lo);
        while (lines.length < count) lines.push({ text: '' });
    }
    return lines;
}

// A plain lore line is a lang key, book.<namespace>.<id>.lore.<n>, so a translation gives it its own words. A component
// line stays as it is. count is the number of lines of the locale whose lore wraps into the most.
function loreLines(meta, id, lang, count = 0) {
    const lines = wrappedLore(meta, count).map((line, n) => {
        if (line.component !== undefined) return line.component;
        const key = `book.${NS}.${id}.lore.${n + 1}`;
        lang[key] = escapePercent(line.text);
        return { translate: key, fallback: escapePercent(line.text) };
    });
    // The rarity byte and the Rarity line come from the shared item modifier rarity/<name>. It runs before this one, as a
    // modifier of the table entry, and appends the line, so the lore of the book is inserted above it
    return lines;
}

// The item name in the color of the rarity, not italic, as the other items of the pack have it. The name has no filtered
// side, so it takes the filtered title when there is one. An SNBT title keeps its own colors and styles, the rarity only
// fills in what it leaves out.
// A plain name is a lang key, so a translation names the item in its own words.
function itemName(title, rarity, key, lang) {
    const base = { color: RARITY_COLORS[rarity], italic: false };
    if (!title.rich) {
        const text = title.filtered || title.text;
        lang[key] = escapePercent(text);
        return { translate: key, fallback: escapePercent(text), ...base };
    }
    return { text: '', ...base, extra: [].concat(title.rich) };
}

// The text of a page as the reader sees it, with none of the formatting
const plainText = (tree) => glyphs(tree).map((g) => g.ch).join('');

// A book and quill keeps plain strings, so the formatting, fonts, title and author are lost. The title is the item name
function buildWritable(id, source, title, file, warnings) {
    const { meta } = source;
    for (const key of ['author', 'font', 'styles']) if (meta[key]) warnings.push(`${file}: ${key} does nothing in a writable book`);
    const pages = source.pages.map((tree) => variant(tree, false));
    const filtered = source.pages.map((tree) => variant(tree, true));
    const texts = pages.map((tree, n) => {
        const raw = plainText(tree);
        if (raw.length > PAGE_EDIT_LENGTH) warnings.push(`${file}: page ${n + 1} has ${raw.length} characters, the editor stops at ${PAGE_EDIT_LENGTH}`);
        const other = plainText(filtered[n]);
        return other === raw ? raw : { raw, filtered: other };
    });
    if (texts.length > MAX_PAGES) warnings.push(`${file}: ${texts.length} pages, a book takes ${MAX_PAGES}`);
    const rarity = rarityOf(meta);
    const set = { 'minecraft:writable_book_content': { pages: texts } };
    const lang = {};
    set['minecraft:custom_name'] = title.rich && !rarity ? title.rich : itemName(title, rarity, `book.${NS}.${id}.title`, lang);
    if (meta.model) set['minecraft:item_model'] = parseModel(meta.model);
    const functions = [{ type: 'minecraft:set_components', components: set }];
    // The SNBT string form, a JSON compound would turn small ints into bytes
    if (meta.data) functions.push({ type: 'minecraft:set_custom_data', tag: meta.data });
    const lore = loreLines(meta, id, lang, source.loreCount);
    if (lore.length) functions.push({ type: 'minecraft:set_lore', lore, mode: 'insert' });
    return { modifier: { type: 'minecraft:sequence', functions }, lang, warnings };
}

/** Item modifier JSON and lang entries for one book in one locale. */
function buildBook(id, file, source = readSource(file)) {
    const warnings = [];
    const { meta } = source;
    const pages = source.union ? new Array(source.union.count) : source.pages.map((tree) => variant(tree, false));
    const lang = {};
    const title = titleOf(meta);
    if (!title.text) throw new Error(`${file}: title is missing`);
    for (const [kind, text] of [['title', title.text], ['filtered title', title.filtered]]) {
        if (text && text.length > MAX_TITLE) warnings.push(`${file}: ${kind} is ${text.length} characters, the book takes ${MAX_TITLE}`);
    }
    if (pages.length > MAX_PAGES) warnings.push(`${file}: ${pages.length} pages, a book takes ${MAX_PAGES}`);
    if (isWritable(meta)) return buildWritable(id, source, title, file, warnings);
    let components;
    if (source.union) {
        // The pages of a book with translations are made together by alignSources
        components = source.union.components;
        Object.assign(lang, source.union.lang);
    } else {
        components = pageComponents(pages, id, 'page', lang, warnings, file);

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
    }
    // Plain lore is wrapped by wrappedLore, only a word or a component line too wide for a line is left
    for (const row of loreEntries(meta)) {
        if (!row.plain) {
            if (row.width > LORE_PIXELS) warnings.push(`${file}: lore line is ${row.width} pixels, ${LORE_PIXELS} fit, the width of ${LORE_WIDTH} average characters: ${row.raw}`);
            continue;
        }
        for (const word of row.text.split(new RegExp(` |(?<=${UNSPACED})|(?=${UNSPACED})`))) if (loreWidth(word) > LORE_PIXELS) warnings.push(`${file}: lore word "${word}" is ${loreWidth(word)} pixels, wider than the ${LORE_PIXELS} of a line`);
    }

    const content = { title: title.filtered ? { raw: title.text, filtered: title.filtered } : { raw: title.text }, author: meta.author, pages: components, resolved: true };
    const set = { 'minecraft:written_book_content': content };
    const rarity = rarityOf(meta);
    if (rarity) set['minecraft:custom_name'] = itemName(title, rarity, `book.${NS}.${id}.title`, lang);
    else if (title.rich) set['minecraft:custom_name'] = title.rich;
    if (meta.model) set['minecraft:item_model'] = parseModel(meta.model);
    const functions = [{ type: 'minecraft:set_components', components: set }];
    // The SNBT string form, a JSON compound would turn small ints into bytes
    if (meta.data) functions.push({ type: 'minecraft:set_custom_data', tag: meta.data });
    const lore = loreLines(meta, id, lang, source.loreCount);
    if (lore.length) functions.push({ type: 'minecraft:set_lore', lore, mode: 'insert' });
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

// Private-use characters, the glyphs of fonts such as staff_notation, are written as \uXXXX so they stay readable in the output
const json = (value) => JSON.stringify(value, null, 2).replace(/[\ue000-\uf8ff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) + '\n';

// One book of the generated ones, equal odds
// An empty list is a table without pools, which drops nothing. A table entry that points at one still counts as picked, so
// the tables of all books list the books themselves and not the rarity tables.
function allTable(ids, paths = {}) {
    if (!ids.length) return { pools: [] };
    return { pools: [{ rolls: 1, entries: ids.map((id) => ({ type: 'minecraft:loot_table', value: `${NS}:item/random_loot/book/generated/${paths[id] || id}` })) }] };
}

// The rarity is the shared item modifier rarity/<name>, in the entry so that it runs before the modifier of the book
function tableFor(id, writable = false, rarity = null, rel = id) {
    const entry = { type: 'minecraft:item', name: writable ? 'minecraft:writable_book' : 'minecraft:written_book' };
    if (rarity) entry.modifier = [`${NS}:rarity/${rarity}`];
    return { pools: [{ rolls: 1, entries: [entry] }], modifier: `${NS}:random_loot/book/generated/${rel}` };
}

// Markdown files directly in a locale folder or in a group folder, such as an author's, one level down, as paths relative to it
function bookFiles(localeDir) {
    const files = [];
    for (const entry of fs.readdirSync(localeDir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
        if (entry.isDirectory()) for (const name of fs.readdirSync(path.join(localeDir, entry.name)).sort()) files.push(path.join(entry.name, name));
        else files.push(entry.name);
    }
    return files;
}

// { locale: { id: { file } } } from src/books/<locale>/[<group>/]<id>.md. A book needs a title and an author and anything else in
// the frontmatter is warned about. A debug book is left out unless dev is set, in every locale.
function findSources(dir, warnings = [], dev = devMode()) {
    const found = {};
    if (!fs.existsSync(dir)) return found;
    const hidden = new Set();
    for (const localeDir of fs.readdirSync(dir, { withFileTypes: true })) {
        if (!localeDir.isDirectory()) continue;
        const books = (found[localeDir.name] = {});
        for (const rel of bookFiles(path.join(dir, localeDir.name))) {
            const name = path.basename(rel);
            const m = /^(.+?)\.md$/.exec(name);
            if (!m) continue;
            const file = path.join(dir, localeDir.name, rel);
            const text = fs.readFileSync(file, 'utf8');
            // A markdown file without frontmatter, such as a README, is not a book
            if (!text.trimStart().startsWith('---')) continue;
            if (RESERVED.has(m[1])) throw new Error(`${file}: ${m[1]} is the loot table of a group of generated books, pick another book id`);
            if (!/^[a-z0-9_.-]+$/.test(m[1])) throw new Error(`${file}: the file name is the book id and a resource path, lowercase letters, digits and _ . - only`);
            if (m[1].endsWith('_filtered')) {
                warnings.push(`${file}: ignored, filtering is inline now with <filter as="...">text</filter>`);
                continue;
            }
            let meta;
            try {
                meta = parseFrontmatter(text).meta;
            } catch (e) {
                throw new Error(`${file}: ${e.message}`);
            }
            for (const key of requiredKeys(meta)) if (!String(meta[key] || '').trim()) throw new Error(`${file}: frontmatter ${key} is required`);
            if (meta.font !== undefined) warnings.push(`${file}: the frontmatter font is deprecated, use styles: { body: { font: ${meta.font} } }`);
            for (const key of Object.keys(meta)) if (!FRONTMATTER_KEYS.includes(key)) warnings.push(`${file}: unsupported frontmatter key "${key}", one of ${FRONTMATTER_KEYS.join(', ')}`);
            if (String(meta.debug).toLowerCase() === 'true' && !dev) hidden.add(m[1]);
            else if (meta.debug !== undefined && !/^(true|false)$/i.test(String(meta.debug))) throw new Error(`${file}: frontmatter debug is true or false`);
            if (books[m[1]]) throw new Error(`${file}: the book id ${m[1]} is also used by ${books[m[1]].file}, ids are unique across group folders`);
            books[m[1]] = { file, rel: (path.dirname(rel) === '.' ? '' : path.dirname(rel).split(path.sep).join('/') + '/') + m[1], writable: isWritable(meta), rarity: meta.rarity ? String(meta.rarity).toLowerCase() : null, debug: String(meta.debug).toLowerCase() === 'true' };
        }
    }
    for (const books of Object.values(found)) for (const id of hidden) delete books[id];
    return found;
}

/**
 * Generates every book. Returns { changed, warnings }; changed lists the files written or removed, or in check mode the ones out of date.
 * Options: check, only (source files to limit the modifiers to), and the directories for tests.
 */
function generate(options = {}) {
    const { check = false, bookDir = BOOK_DIR, modifierDir = MODIFIER_DIR, tableDir = TABLE_DIR, langDir = LANG_DIR, dev } = options;
    const only = options.only && options.only.map((f) => path.resolve(f));
    const changed = [];
    const warnings = [];
    const sources = findSources(bookDir, warnings, dev);
    const references = sources[REFERENCE_LANG] || {};
    const langs = {};
    // A book with translations has its pages cut in all its locales together, so they share the lang keys
    const aligned = new Map();
    for (const id of Object.keys(references)) {
        const files = [references[id].file, ...Object.entries(sources).filter(([locale, books]) => locale !== REFERENCE_LANG && books[id]).map(([, books]) => books[id].file)];
        if (files.length < 2) continue;
        // Every locale has the lore lines of the one whose lore wraps into the most
        const both = alignSources(files, warnings);
        const loreCount = Math.max(...both.map((source) => wrappedLore(source.meta).length));
        both.forEach((source, i) => aligned.set(files[i], { ...source, loreCount }));
    }
    const builds = new Map();
    const buildOnce = (id, file) => {
        if (!builds.has(file)) builds.set(file, buildBook(id, file, aligned.get(file)));
        return builds.get(file);
    };

    for (const [locale, books] of Object.entries(sources)) {
        langs[locale] = {};
        for (const [id, book] of Object.entries(books)) {
            if (locale !== REFERENCE_LANG && !references[id]) throw new Error(`${book.file}: no ${REFERENCE_LANG} book called ${id}`);
            const built = buildOnce(id, book.file);
            warnings.push(...built.warnings);
            Object.assign(langs[locale], built.lang);
            if (locale === REFERENCE_LANG) {
                if (only && !only.includes(path.resolve(book.file))) continue;
                const modifier = path.join(modifierDir, book.rel + '.json');
                if (emit(modifier, json(built.modifier), check)) changed.push(modifier);
                const table = path.join(tableDir, book.rel + '.json');
                if (emit(table, json(tableFor(id, book.writable, book.rarity, book.rel)), check)) changed.push(table);
            } else if (!aligned.has(book.file)) {
                const reference = Object.keys(buildOnce(id, references[id].file).lang);
                if (reference.join() !== Object.keys(built.lang).join()) {
                    warnings.push(`${book.file}: formatting differs from the ${REFERENCE_LANG} book, translated text lines up only where the spans do`);
                }
            }
        }
    }

    // The table of all books lists them whatever the source filter is
    // Debug books have their own table and give function, but never drop at random
    const random = Object.keys(references).filter((id) => !references[id].debug).sort();
    const paths = Object.fromEntries(Object.entries(references).map(([id, book]) => [id, book.rel]));
    const aggregates = { [ALL_TABLE]: random };
    for (const rarity of Object.keys(RARITY_COLORS)) aggregates[`random_${rarity}_book`] = random.filter((id) => references[id].rarity === rarity);
    for (const [name, ids] of Object.entries(aggregates)) {
        const file = path.join(tableDir, name + '.json');
        if (emit(file, json(allTable(ids, paths)), check)) changed.push(file);
    }

    // Modifiers and tables are all made here, so one without a source is left over from a book that was removed or renamed
    if (!only) {
        const rels = new Set(Object.values(references).map((book) => book.rel));
        for (const dir of [modifierDir, tableDir]) {
            if (!fs.existsSync(dir)) continue;
            for (const name of fs.readdirSync(dir, { recursive: true })) {
                const rel = name.split(path.sep).join('/');
                if (!rel.endsWith('.json') || rels.has(rel.slice(0, -5)) || (dir === tableDir && rel.slice(0, -5) in aggregates)) continue;
                const stale = path.join(dir, name);
                if (!fs.statSync(stale).isFile()) continue;
                if (!check) fs.unlinkSync(stale);
                changed.push(stale);
            }
            // A group folder left empty by a moved or removed book
            if (!check) for (const entry of fs.readdirSync(dir, { withFileTypes: true })) if (entry.isDirectory() && !fs.readdirSync(path.join(dir, entry.name)).length) fs.rmdirSync(path.join(dir, entry.name));
        }
    }

    // The lang files of the generated namespace belong to this script, hand-written keys go in the other namespaces
    for (const [locale, entries] of Object.entries(langs)) {
        const file = path.join(langDir, locale + '.json');
        if (emit(file, json(entries), check)) changed.push(file);
    }
    for (const id of FONTS.missing) warnings.push(`font ${id} is not defined by the game or texturepack/assets, its glyphs are measured as 9 pixels`);
    return { changed, warnings };
}

//endregion

module.exports = { generate, findSources, parseSnbt, parseClasses, parseFrontmatter, parseInline, splitSections, pagesOf, sectionsOf, paginate, paginateTogether, wrappedLore, toComponent, buildBook, layout, reserveTall, hyphenate, unwrapNoHyphen, RARITY_COLORS, LORE_WIDTH, LORE_PIXELS, loreWidth, loreEntries };

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
