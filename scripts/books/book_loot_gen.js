#!/usr/bin/env node
// Markdown to written book item modifier. See scripts/books/README.md for the format.
//
//   node scripts/books/book_loot_gen.js            generate everything under src/books
//   node scripts/books/book_loot_gen.js --check    write nothing, exit 1 when generated files are out of date
//   node scripts/books/book_loot_gen.js a.md ...   only the books of the given source files
//
// mc-build runs it on every build through src/foxcraft_dungeon_loot/books.js.
const fs = require('fs');
const YAML = require('yaml');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
// config.json mc.generatedDirectory, the folder name mc-build puts generated files in. Generated books use it too, so they
// are told apart from hand-written ones beside them.
const GENERATED_DIR = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).mc.generatedDirectory || '__generated__';
    } catch (e) {
        return '__generated__';
    }
})();
const NS = 'foxcraft_dungeon_loot';
const BOOK_DIR = path.join(ROOT, 'src', 'books');
// Generated files get a folder of their own, so a hand-written book modifier or table beside them is never cleaned up
const MODIFIER_DIR = path.join(ROOT, 'data', NS, 'item_modifier', 'random_loot', 'book', GENERATED_DIR);
const TABLE_DIR = path.join(ROOT, 'data', NS, 'loot_table', 'item', 'random_loot', 'book', GENERATED_DIR);
const LANG_DIR = path.join(ROOT, 'texturepack', 'assets', GENERATED_DIR, 'lang');
// Where the headings of every book and the page they are on go for the book viewer, gitignored with the rest of tests/.cache
const HEADINGS_FILE = path.join(ROOT, 'tests', '.cache', 'book_headings.json');
const REFERENCE_LANG = 'en_us';
// Mystery tables roll one generated book, there are no loot table tags: mystery_book/<tier> for the Mysterious Book of a tier and
// mystery_letter for the Message in a Bottle. Their names are not available as book ids. A book is a letter when the item model
// has "letter" in it, else a book, written or writable.
const MYSTERY_LETTER = 'mystery_letter';
const MYSTERY_BOOK_DIR = 'mystery_book';
const isLetter = (model) => /letter/i.test(String(model || ''));
// Share of the drops of each rarity, by the tier of the mystery table. A rarity without a book is skipped and the others keep
// their ratio to each other.
const TIER_WEIGHTS = {
    common: { common: 50, uncommon: 25, rare: 13, epic: 6, mythic: 3, cursed: 1 },
    uncommon: { uncommon: 50, common: 25, rare: 13, epic: 6, mythic: 3, cursed: 1 },
    rare: { rare: 50, uncommon: 25, epic: 13, common: 6, mythic: 3, cursed: 1 },
    epic: { rare: 50, epic: 25, uncommon: 13, mythic: 6, common: 3, cursed: 1 },
    mythic: { epic: 50, mythic: 25, rare: 13, uncommon: 6, common: 3, cursed: 1 },
    cursed: { cursed: 79, mythic: 10, epic: 5, rare: 3, uncommon: 2, common: 1 },
};
// Frontmatter keys, anything else is warned about. Title and author are required.
const FRONTMATTER_KEYS = ['title', 'author', 'rarity', 'lore', 'font', 'model', 'writable', 'data', 'styles', 'style', 'debug', 'generation', 'displaytitle'];
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
// Advance widths per font: the vanilla fonts cached by scripts/fonts/fonts.js and the fonts of the resource pack, read on every run by lore.js.
const { withNamespace, DEFAULT_FONT } = require('../fonts/fonts.js');
const { highlight } = require('./highlight.js');
const { FONTS, LORE_WIDTH, LORE_PIXELS, loreWidth, componentWidth, reflowLore, UNSPACED } = require('../lore/lore.js');
const { musicLines, FONT: MUSIC_FONT } = require('../music/music.js');
const COVER = require('../fonts/cover_to_font.js');

const RARITY_COLORS = { common: 'white', uncommon: 'yellow', rare: 'aqua', epic: 'light_purple', mythic: 'green', cursed: 'red' };
// Names of the loot tables that group books, random_book and random_<rarity>_book, so not usable as book ids
const RESERVED = new Set([MYSTERY_LETTER, MYSTERY_BOOK_DIR]);
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

// Frontmatter is plain YAML. Scalars of the free text keys stay text however YAML would type them, a title of 1984 is "1984".
// A compound or list where a text is expected, such as displayTitle: {text: Fancy, color: red}, is kept as its JSON, which the
// SNBT reader of the title takes as it is.
function frontmatterText(value) {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
}

// The lore lines of the lore key. A string is one line per line of text, so lore: | keeps the line breaks you write; a list gives
// one line per entry, a string or a component, a nested list of components counting as one line.
function frontmatterLore(value) {
    if (value === null || value === undefined) return [];
    if (typeof value === 'string') return value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!Array.isArray(value)) return [{ entry: value }];
    return value.map((entry) => ({ entry: entry !== null && typeof entry === 'object' ? entry : String(entry ?? '') }));
}

// A YAML value as SNBT, for data written as a map. A string like 1b or 2.5f stays a typed number, any other string is quoted.
// {DungeonLootId:87} with no space after the colon reads in YAML as one key with no value, so that is told apart and refused.
function snbtOf(value) {
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (typeof value === 'string') return /^[+-]?(\d+\.?\d*|\.\d+)[bBsSlLfFdD]$/.test(value) ? value : JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(snbtOf).join(',')}]`;
    if (value !== null && typeof value === 'object') {
        const parts = Object.entries(value).map(([k, v]) => {
            if (v === null && k.includes(':')) throw new Error(`data key "${k}" needs a space after the colon, or put the whole compound in quotes`);
            return `${/^[A-Za-z0-9_.+-]+$/.test(k) ? k : JSON.stringify(k)}:${snbtOf(v)}`;
        });
        return `{${parts.join(',')}}`;
    }
    throw new Error('data in the frontmatter has an empty value');
}

// Splits a source file into { meta, body }. The block between the --- lines is YAML, data is a YAML map written out as SNBT, or an
// SNBT string in quotes.
function parseFrontmatter(text) {
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    const meta = { lore: [] };
    if (lines[0].trim() !== '---') return { meta, body: lines.join('\n') };
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === '---');
    if (end < 0) throw new Error('frontmatter is not closed with ---');
    let doc;
    try {
        doc = YAML.parse(lines.slice(1, end).join('\n'));
    } catch (e) {
        throw new Error(`frontmatter is not valid YAML: ${String(e.message).split('\n')[0]}`);
    }
    if (doc === null || doc === undefined) doc = {};
    if (typeof doc !== 'object' || Array.isArray(doc)) throw new Error('frontmatter needs key: value pairs');
    for (const [rawKey, value] of Object.entries(doc)) {
        const key = rawKey.toLowerCase();
        if (key === 'lore') {
            meta.lore.push(...frontmatterLore(value));
        } else if (key === 'data') {
            meta.data = (typeof value === 'string' ? value : snbtOf(value)).replace(/,\s*$/, '').replace(/\s*\n\s*/g, ' ').trim();
        } else if (key === 'styles' || key === 'style') {
            meta.styles = parseClasses(value);
        } else {
            meta[key] = frontmatterText(value).trim();
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
const TYPE_NAMES = ['body', 'header', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'bold', 'italic', 'underline', 'strikethrough', 'obfuscated', 'code', 'a', 'font', 'span', 'center', 'horiz', 'tally', 'drop'];

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

// In running text &nbsp; is a no-break space, &quot; &apos; &lt; &gt; and &amp; their characters, and &#160; or &#xA0; the code
// point. An unknown name stays as typed. Code spans are literal and never get here.
const TEXT_ENTITY = /^&(#x[0-9a-fA-F]{1,6}|#\d{1,7}|[A-Za-z]+);/;
const NAMED_ENTITIES = { ...ENTITIES, nbsp: ' ' };

function decodeTextEntity(name) {
    if (name[0] === '#') {
        const point = name[1] === 'x' || name[1] === 'X' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : undefined;
    }
    return Object.hasOwn(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : undefined;
}

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

// The name a heading goes by in a #link: its text in lowercase, every run of other characters one underscore
const anchorOf = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
const plainOf = (nodes) => nodes.map((part) => (typeof part === 'string' ? part : plainOf(part.content))).join('');

// An object component, a sprite or a head, is 8 pixels wide in a line of text
const OBJECT_WIDTH = 8;

/**
 * The component of an inline {{component}} that starts at text[start], the brace of the component itself: JSON or SNBT, braces
 * balanced outside strings. Returns { component, end } with end past the closing brace, or null when the braces do not close on
 * the line. A component that is not an object one stops the build, as the layout has no width for it.
 */
function readComponent(text, start) {
    let depth = 0;
    let quote = null;
    let end = -1;
    for (let i = start; i < text.length && text[i] !== '\n'; i++) {
        const c = text[i];
        if (quote) {
            if (c === '\\') i++;
            else if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === '{') depth++;
        else if (c === '}' && --depth === 0) {
            end = i + 1;
            break;
        }
    }
    if (end < 0) return null;
    const source = text.slice(start, end);
    let component;
    try {
        component = JSON.parse(source);
    } catch {
        try {
            component = parseSnbt(source);
        } catch (e) {
            throw new Error(`inline component ${source} is not JSON or SNBT: ${e.message}`);
        }
    }
    if (!component || typeof component !== 'object' || Array.isArray(component) || (component.sprite === undefined && component.player === undefined && component.object === undefined)) {
        throw new Error(`inline component ${source} is an object component, with a sprite or a player; the layout only knows their width`);
    }
    return { component, end };
}

// The click events a link target names besides a bare http or https link: page:3, copy:text, run:command and suggest:command
const LINK_ACTIONS = { page: 'change_page', copy: 'copy_to_clipboard', run: 'run_command', suggest: 'suggest_command' };
const LINK_KEYS = { change_page: 'page', copy_to_clipboard: 'value', run_command: 'command', suggest_command: 'command' };

// The click event of the target of a [text](target), as SNBT for eventFrom; undefined when it is none of the forms
function linkEvent(target) {
    if (target.startsWith('{')) return target;
    if (/^https?:\/\//i.test(target)) return `{action:open_url,url:${JSON.stringify(target)}}`;
    // #heading is a page link to the page of the heading, its number is set once the pages are cut, see resolveAnchors
    if (target.startsWith('#')) {
        const anchor = anchorOf(target.slice(1));
        if (!anchor) throw new Error(`link target "${target}" has no name for a heading`);
        return `{action:change_page,page:1,anchor:${JSON.stringify(anchor)}}`;
    }
    const m = /^(page|copy|run|suggest):([\s\S]*)$/.exec(target);
    if (!m) return undefined;
    const action = LINK_ACTIONS[m[1]];
    const value = action === 'change_page' ? m[2].trim() : JSON.stringify(m[2]);
    if (action === 'change_page' && !/^\d+$/.test(value)) throw new Error(`page: in a link takes a page number, not ${m[2]}`);
    return `{action:${action},${LINK_KEYS[action]}:${value}}`;
}

/**
 * Reads the (target "hover") of a [text](target "hover") that starts at text[start], the paren. A target is an http or https link,
 * page:N, copy:text, run:command, suggest:command or an SNBT click event in braces; the optional title in double or single quotes
 * is shown on hover. A target can hold balanced parentheses and a \) for a closing one. Returns { click, hover, end } or null when
 * it does not close on the line, in which case the bracket stays text.
 */
function parseLinkTarget(text, start) {
    let i = start + 1;
    while (text[i] === ' ') i++;
    let target = '';
    if (text[i] === '{') {
        let depth = 0;
        let quote = null;
        for (; i < text.length && text[i] !== '\n'; i++) {
            const c = text[i];
            target += c;
            if (quote) {
                if (c === '\\') target += text[++i] ?? '';
                else if (c === quote) quote = null;
            } else if (c === '"' || c === "'") quote = c;
            else if (c === '{') depth++;
            else if (c === '}' && --depth === 0) {
                i++;
                break;
            }
        }
        if (depth !== 0) return null;
    } else {
        let depth = 0;
        // run:, suggest: and copy: hold spaces, up to the closing paren or a quoted title
        const spaced = /^(copy|run|suggest):/.test(text.slice(i, i + 8));
        for (; i < text.length && text[i] !== '\n'; i++) {
            const c = text[i];
            if (/\s/.test(c) && (!spaced || /^[ \t]*["')]/.test(text.slice(i)))) break;
            if (c === '\\' && i + 1 < text.length) {
                target += text[++i];
                continue;
            }
            if (c === '(') depth++;
            else if (c === ')' && depth-- === 0) break;
            target += c;
        }
        // The depth went one under on the closing paren
    }
    while (text[i] === ' ') i++;
    let hover;
    const q = text[i];
    if (q === '"' || q === "'") {
        let j = i + 1;
        hover = '';
        for (; j < text.length && text[j] !== q && text[j] !== '\n'; j++) {
            if (text[j] === '\\' && j + 1 < text.length) j++;
            hover += text[j];
        }
        if (text[j] !== q) return null;
        i = j + 1;
        while (text[i] === ' ') i++;
    }
    if (text[i] !== ')' || !target) return null;
    return { target, hover, end: i + 1 };
}

// The characters each bitmap font of the pack draws, { 'ns:name': Set }, read once
let bitmapFonts;
function packBitmapFonts() {
    if (bitmapFonts) return bitmapFonts;
    bitmapFonts = new Map();
    const assets = path.join(ROOT, 'texturepack', 'assets');
    const walk = (dir, ns, prefix) => {
        for (const e of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
            if (e.isDirectory()) walk(path.join(dir, e.name), ns, `${prefix}${e.name}/`);
            else if (e.name.endsWith('.json')) {
                const json = JSON.parse(fs.readFileSync(path.join(dir, e.name), 'utf8'));
                const chars = new Set();
                for (const p of json.providers || []) if (p.type === 'bitmap') for (const c of (p.chars || []).join('')) if (c !== ' ') chars.add(c);
                if (chars.size) bitmapFonts.set(`${ns}:${prefix}${e.name.slice(0, -5)}`, chars);
            }
        }
    };
    if (fs.existsSync(assets)) for (const ns of fs.readdirSync(assets)) walk(path.join(assets, ns, 'font'), ns, '');
    return bitmapFonts;
}

/**
 * The font of an ![char](font), a font id like foxcraft_dungeon_loot:illustrations, without a namespace the pack's own. A bitmap
 * font of the pack must have the character, so a typo stops the build; other fonts are taken as they are.
 */
function imageFont(target, char) {
    const id = parseFont(target);
    const font = id.includes(':') ? id : `${NS}:${id}`;
    const chars = packBitmapFonts().get(font);
    if (chars && !chars.has(char)) throw new Error(`image "${target}": the font has no character ${JSON.stringify(char)}, it has ${[...chars].join('')}`);
    return font;
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
/**
 * Splits the content of a link label at its first pipe, Obsidian style: [hover|text]. Only the plain text of the label counts,
 * a pipe inside a code span or an object is not one. Returns { shown, hover }, with hover undefined when there is no pipe or
 * nothing left of it.
 */
function splitPipe(content) {
    const at = content.findIndex((part) => typeof part === 'string' && part.includes('|'));
    if (at < 0) return { shown: content, hover: undefined };
    const cut = content[at].indexOf('|');
    const hover = plainOf([...content.slice(0, at), content[at].slice(0, cut)]).trim();
    const shown = [content[at].slice(cut + 1).replace(/^ +/, ''), ...content.slice(at + 1)].filter((part) => part !== '');
    return { shown, hover: hover || undefined };
}

// Whether nothing but opening tags comes before index i on its line, as the start of a header or a <center>, which write no text
function firstOnLine(text, i) {
    return /^(<[a-z][^>]*>)*$/i.test(text.slice(text.lastIndexOf('\n', i - 1) + 1, i));
}

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
                    content.push(...INLINE_TYPES[typed[1]](text.slice(i + 1, close), classes, firstOnLine(text, i)));
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
                // The anchor is in the styles, the pages are cut from the glyphs and a node outside the styles does not survive that. It leaves in toComponent
                content.push({ styles: { ...headerStyles(name, classes), anchor: anchorOf(plainOf(sub.content)) }, content: sub.content, header: true });
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
        if (c === '!' && text[i + 1] === '[') {
            // ![char](font "hover") draws that character of the font, in the color of the text around it
            const alt = parseInline(text, i + 2, ']', classes);
            if (alt.closed && text[alt.end] === '(' && alt.content.length && alt.content.every((p) => typeof p === 'string')) {
                const image = parseLinkTarget(text, alt.end);
                if (image) {
                    const char = alt.content.join('');
                    flush();
                    const styles = { font: imageFont(image.target, char) };
                    if (image.hover !== undefined) styles.hover_event = eventFrom(`{action:show_text,value:${JSON.stringify(image.hover)}}`);
                    content.push({ styles, content: [char] });
                    i = image.end;
                    continue;
                }
            }
        }
        if (c === '{' && text[i + 1] === '{') {
            // {{"sprite":"item/diamond"}} is a component of the game as it is, 8 pixels of padding to the layout
            const raw = readComponent(text, i + 1);
            if (raw && text[raw.end] === '}') {
                flush();
                content.push({ styles: { ...PAD_STYLES, raw: raw.component }, content: [padding(OBJECT_WIDTH)], literal: true });
                i = raw.end + 1;
                continue;
            }
        }
        if (c === '[') {
            // [text](target "hover") is the short form of <a>; a bracket that is not followed by a closed (target) stays text
            const label = parseInline(text, i + 1, ']', classes);
            if (label.closed && text[label.end] === '(') {
                const link = parseLinkTarget(text, label.end);
                if (link) {
                    const click = linkEvent(link.target);
                    if (click === undefined) throw new Error(`link target "${link.target}" is an http or https link, page:N, copy:text, run:command, suggest:command or an event in braces`);
                    flush();
                    const styles = { ...classes.a, click_event: eventFrom(click) };
                    // [hover|text](target): the first pipe in the text of the label splits it, the left side is the hover and the right
                    // the text shown. It wins over a "hover" after the target, and no pipe leaves the label as it is
                    const { shown, hover } = splitPipe(label.content);
                    const text_ = hover !== undefined ? hover : link.hover;
                    if (text_ !== undefined) styles.hover_event = eventFrom(`{action:show_text,value:${JSON.stringify(text_)}}`);
                    content.push({ styles, content: shown });
                    i = link.end;
                    continue;
                }
            }
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
        if (c === '&') {
            const entity = TEXT_ENTITY.exec(text.slice(i, i + 12));
            const decoded = entity ? decodeTextEntity(entity[1]) : undefined;
            if (decoded !== undefined) {
                buffer += decoded;
                i += entity[0].length;
                continue;
            }
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

// An inline {{component}}, with the styles around it that it does not set itself
function rawComponent(own, around = {}) {
    const { raw, ...rest } = own;
    const inherited = Object.fromEntries(Object.entries({ ...around, ...rest }).filter(([k]) => ['color', 'shadow_color'].includes(k)));
    return { ...inherited, ...JSON.parse(JSON.stringify(raw)) };
}

// A literal span as a plain text component, the text of the code as it is
function literalComponent(node, styles = {}) {
    const plain = (nodes) => nodes.map((p) => (typeof p === 'string' ? p : plain(p.content))).join('');
    if (node.styles && node.styles.raw) return rawComponent(node.styles, styles);
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
        // A kerning node is literal text too, but no code
        const code = (p) => p && p.literal && !p.kern;
        if (code(parts[i])) {
            for (;;) {
                if (code(parts[end + 1])) end += 1;
                else if (/^\n+$/.test(parts[end + 1] || '') && code(parts[end + 2])) end += 2;
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
    // A heading's anchor is only for resolveAnchors, the game would not know the tag
    if (styles.anchor !== undefined) delete (styles = { ...styles }).anchor;
    if (content.length === 1 && content[0].styles && content[0].styles.raw) return rawComponent(content[0].styles, styles);
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
    if (parts.length === 1 && parts[0].literal && !parts[0].kern) return literalComponent(parts[0], styles);
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
function rawGlyphs(content, bold = false, font = DEFAULT_FONT, literal = false, nohyphen = false, center = null, lead = null, heading = false) {
    return content.flatMap((p) => {
        if (typeof p === 'string') return [...p].map((ch) => ({ ch, bold, font, literal, nohyphen, center, lead, heading }));
        const inner = rawGlyphs(p.content, p.styles.bold === undefined ? bold : p.styles.bold === true, p.styles.font ? withNamespace(p.styles.font) : font, literal || p.literal === true, nohyphen || p.nohyphen === true, center ?? (p.center === true ? p.styles.align ?? 'center' : null), p.styles.align ?? lead, heading || p.header === true);
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

// Whether applyKerning leaves a glyph alone: the nodes it skips, a literal one, and newlines and shaped Arabic. A glyph it leaves
// alone is drawn with the game's own spacing, so its width has none of the kerning of its font.
const unkerned = (g) => g.literal || g.ch === '\n' || (g.ch !== undefined && shapeOf(g.ch));
const widthOf = (g) => {
    const width = FONTS.widthOf(g.font, g.ch, g.bold);
    if (!unkerned(g)) return width;
    const { before, after } = FONTS.kerningOf(g.font, g.ch);
    return width - before - after;
};

// How far past the width of a glyph the game's line gets before the padding of its kerning pulls it back: kerning that closes up
// the next glyph is a backwards padding after the glyph, and the splitter checks the width after the glyph and before that padding
const peak = (g) => (unkerned(g) || !g.font || !g.ch ? 0 : Math.max(0, -FONTS.kerningOf(g.font, g.ch).after));

// The width a run of glyphs needs of a line: the furthest the splitter's count gets, which is its width plus that of the last
// glyph's peak, or a middle glyph's when more kerning follows it
const spanOf = (list) => {
    let x = 0;
    let far = 0;
    for (const g of list) {
        x += g.sw ?? widthOf(g);
        far = Math.max(far, x + peak(g));
    }
    return far;
};

// How the game's text renderer draws Arabic: each letter takes the form its neighbors give it, so a line is as wide as its
// shaped glyphs, which the splitter does not know, it measures the plain letters. scripts/books/arabic_shaping.json is made from
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
function layoutGlyphs(chars, reserve = false, limit = PAGE_WIDTH) {
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
        // The first glyph of a line stays on it however wide it is, as the game keeps it, there is nowhere else to put it
        while ((width + w + peak(g) > limit || drawn + drawnWidth(g) + peak(g) > limit) && g.ch !== ' ' && i > start) {
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
            if (spanOf(word) > PAGE_WIDTH) {
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
                const room = (b, taken) => {
                    const head = all.slice(from, b);
                    const hyphen = { ch: '-', bold: all[b - 1].bold, font: all[b - 1].font };
                    return taken + spanOf(head) <= PAGE_WIDTH && taken + sum(head) + widthOf(hyphen) + peak(hyphen) <= PAGE_WIDTH;
                };
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

// A line holds 9 pixels, a glyph of the default font sits 7 above its baseline. A font that reaches higher than a line
// draws over the lines above its own, one for every 9 pixels it reaches over the 7, at most the 13 a page has above its last
// line. The text has to leave those lines empty above a line it starts itself; the generator keeps them with the line at a page edge, and adds them above the rows an automatic wrap makes and the first line of a text, which is the top of its page.
const LINE_HEIGHT = 9;
const BASELINE = 7;
const linesAbove = (ascent) => (ascent > LINE_HEIGHT ? Math.min(Math.ceil((ascent - BASELINE) / LINE_HEIGHT), PAGE_LINES - 1) : 0);

/**
 * Empty lines above a line that starts a text or an automatic wrap and holds a glyph of a font reaching higher than a line, so it
 * does not draw over the row above it or the top of the page. A line after a newline gets none, the text leaves the empty lines
 * it needs. Empty lines that are there count. ascentOf gives how high a font reaches. Returns a copy of the tree.
 */
function reserveTall(content, ascentOf = (font, ch) => FONTS.ascentOf(font, ch)) {
    const tree = JSON.parse(JSON.stringify(content));
    for (let guard = 0; guard < 1000; guard++) {
        const { lines, chars } = layout(tree);
        let change = null;
        lines.forEach((line, k) => {
            if (change || !(line.soft || k === 0) || line.tstart === line.tend) return;
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

/**
 * Sets the spacing of scripts/fonts/font_kerning.json: a node of padding as wide as the difference before and after each glyph
 * whose font asks for other spacing than the game's own. The widths the layout used already count it, see FONTS.kerningOf, so
 * this runs last, on a finished page, or the padding would be counted twice. Code, padding, shaped Arabic and newlines are
 * left alone. The nodes are literal, plain text components that take no lang entry. Returns a copy of the content.
 */
function applyKerning(content, font = DEFAULT_FONT) {
    const pad = (width) => ({ styles: PAD_STYLES, content: [signedPadding(width)], literal: true, kern: true });
    return content.flatMap((part) => {
        if (typeof part !== 'string') {
            if (part.literal || part.kern) return [part];
            const inner = part.styles.font ? withNamespace(part.styles.font) : font;
            return [{ ...part, content: applyKerning(part.content, inner), ...(part.alt ? { alt: applyKerning(part.alt, inner) } : {}) }];
        }
        const out = [];
        let text = '';
        for (const ch of part) {
            const { before, after } = ch === '\n' || shapeOf(ch) ? { before: 0, after: 0 } : FONTS.kerningOf(font, ch);
            if (before) {
                if (text) out.push(text);
                out.push(pad(before));
                text = '';
            }
            text += ch;
            if (after) {
                out.push(text, pad(after));
                text = '';
            }
        }
        if (text) out.push(text);
        return out;
    });
}

//region List items

// A line that starts with a "- " or "1. " marker, after any indentation
const LIST_ITEM = /^( *)(-|\d+\.) /;
const hangPad = (width) => ({ styles: PAD_STYLES, content: [padding(Math.min(width, MAX_PAD))], hang: true });

/**
 * Hangs the list items of a tree: the text of an item, and of the lines hyphenate broke it onto, is broken here against the
 * width left of the line after its marker, and every line after the first starts with padding as wide as the marker. In a
 * numbered list every number takes the room of the widest one, so the text lines up from the first item on when a number
 * gains a digit further down; the padding goes after the marker. A list is a run of items of one kind and indentation with
 * only empty lines between them. Run it after hyphenate. Returns a copy of the tree.
 */
function hangLists(content) {
    const tree = JSON.parse(JSON.stringify(content));
    const all = glyphs(tree).map((g, place) => ({ ...g, place }));
    const plain = (g) => g.font !== CODE_FONT && g.font !== PAD_FONT && !g.literal;
    const sum = (list) => list.reduce((total, g) => total + (g.sw ?? widthOf(g)), 0);
    // The lines after newlines, as [from, to) into all
    const rows = [];
    for (let from = 0, i = 0; i <= all.length; i++) {
        if (i < all.length && all[i].ch !== '\n') continue;
        rows.push([from, i]);
        from = i + 1;
    }
    const runs = new Map();
    const items = [];
    let item = null;
    rows.forEach(([from, to], k) => {
        if (from === to) {
            item = null;
            return;
        }
        const marker = LIST_ITEM.exec(all.slice(from, to).map((g) => g.ch).join(''));
        const [before, end] = rows[k - 1] ?? [0, 0];
        if (marker && all.slice(from, from + marker[0].length).every(plain)) {
            const indent = marker[1].length;
            const kind = marker[2] === '-' ? '-' : '#';
            // A list ends where a shallower item starts, and a number does not continue a bullet list
            for (const at of [...runs.keys()]) if (at > indent) runs.delete(at);
            let run = runs.get(indent);
            if (!run || run.kind !== kind) runs.set(indent, (run = { kind, items: [] }));
            item = { width: sum(all.slice(from, from + marker[0].length)), rows: [[from + marker[0].length, to]], run };
            run.items.push(item);
            items.push(item);
        } else if (item && end > before && all[end - 1].ch === '-') {
            // The line hyphenate broke the word of the line above onto
            item.rows.push([from, to]);
        } else {
            item = null;
            runs.clear();
        }
    });
    const edits = [];
    for (const entry of items) {
        const column = Math.max(...entry.run.items.map((i) => i.width));
        // Less than this and the text has no room to wrap in
        if (PAGE_WIDTH - column < 20) continue;
        entry.rows.forEach(([from, to], n) => {
            if (from === to) return;
            if (n === 0 && entry.width < column) edits.push({ place: all[from].place, parts: [hangPad(column - entry.width)] });
            if (n > 0) edits.push({ place: all[from].place, parts: [hangPad(column)] });
            const text = all.slice(from, to);
            for (const line of layoutGlyphs(text, false, PAGE_WIDTH - column)) {
                if (line.soft && line.start < text.length) edits.push({ place: text[line.start].place, parts: ['\n', hangPad(column)] });
            }
        });
    }
    // From the end of the tree, so the places in front stay
    for (const edit of edits.sort((x, y) => y.place - x.place)) insertAt(tree, edit.place, edit.parts);
    return tree;
}

//endregion

// A number of decimal, 0x, 0o or 0b digits with _ between them, as its value; undefined when it is not one
function parseNumber(source) {
    const m = /^(-?)(0x[0-9a-f](?:_?[0-9a-f])*|0o[0-7](?:_?[0-7])*|0b[01](?:_?[01])*|\d(?:_?\d)*)$/i.exec(source.trim());
    return m ? Number(m[2].replace(/_/g, '')) * (m[1] ? -1 : 1) : undefined;
}

// The pixels of a `n`pad. A whole line of padding forwards, 114 pixels, is the same as a line break, so it stops at 113; a
// whole line back is not a break, so a step back goes to 114.
const MAX_PAD = PAGE_WIDTH - 1;
function padWidth(source) {
    const width = parseNumber(source);
    if (width === undefined) throw new Error(`\`${source}\`pad is not a number`);
    if (width > MAX_PAD || width < -PAGE_WIDTH) throw new Error(`\`${source}\`pad is ${width}px, padding goes from -${PAGE_WIDTH} to ${MAX_PAD}`);
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

// A line of the cover of the book screen, cut from texturepack/assets/foxcraft_dungeon_loot/textures/gui/cover.png into the font of cover.json
// by scripts/fonts/cover_to_font.js. A line is two glyphs: the body from the left of the text to the right edge of the art, and a
// strip of the art left of the text. The game keeps the first glyph of a line however wide it is, and breaks the line at any other glyph
// that takes it past the width of the page, so the body, which reaches 17 pixels over the width, has to come first, and the strip is
// drawn after a step back. The text of the line is written after the nodes and draws over the cover, the nodes end where they start.
const COVER_FONT = `${NS}:cover`;
const COVER_STYLES = { font: COVER_FONT, bold: false, italic: false, underlined: false, strikethrough: false, obfuscated: false, color: 'white' };
// Padding of any width, in steps the padding font has glyphs for
function longPadding(px) {
    let out = '';
    while (px) {
        const step = Math.max(-127, Math.min(127, px));
        out += signedPadding(step);
        px -= step;
    }
    return out;
}
function coverNodes(source, atLineStart) {
    const n = parseNumber(source);
    if (n === undefined || n < 0 || n >= COVER.LINES) throw new Error(`\`${source}\`cover is not a line of the cover, 0 to ${COVER.LINES - 1}`);
    if (!atLineStart) throw new Error(`\`${source}\`cover has to be first on its line, the game breaks a line at a glyph that is not, if it takes the line past its width`);
    const right = FONTS.widthOf(COVER_FONT, COVER.RIGHT(n), false);
    const left = FONTS.widthOf(COVER_FONT, COVER.LEFT_GLYPH(n), false);
    const pad = (px) => ({ styles: PAD_STYLES, content: [longPadding(px)] });
    return [
        { styles: COVER_STYLES, content: [COVER.RIGHT(n)] },
        pad(-(right + COVER.LEFT)),
        { styles: COVER_STYLES, content: [COVER.LEFT_GLYPH(n)] },
        pad(COVER.LEFT - left),
    ].filter((node) => node.content[0] !== '');
}

// The lines of the cover reach over the lines above them, the first up over the margin of the page, which is no text to make room for
const baseAscentOf = FONTS.ascentOf;
FONTS.ascentOf = (font, ch) => (font === COVER_FONT ? 0 : baseAscentOf(font, ch));

// A potion icon in the font of potion.json, 8x8 like an object component: the bottle of the type in white, then a step back
// as wide as the bottle with its kerning, then the overlay in the color, which is the liquid the bottle shows through.
const POTION_FONT = `${NS}:potion`;
const POTION_STYLES = { font: POTION_FONT, bold: false, underlined: false, strikethrough: false, obfuscated: false };
const POTION_OVERLAY = '';
const POTION_BOTTLES = { normal: '', splash: '', lingering: '' };

// The nodes of a `type color`potion: the type is normal, splash or lingering, the color a built-in name or #rrggbb
function potionNodes(source) {
    const [type, color, ...rest] = source.trim().split(/\s+/);
    if (!Object.hasOwn(POTION_BOTTLES, type) || !color || rest.length) {
        throw new Error(`\`${source}\`potion is not a type and a color, as \`splash red\`potion; the types are ${Object.keys(POTION_BOTTLES).join(', ')}`);
    }
    const bottle = POTION_BOTTLES[type];
    return [
        { styles: { ...POTION_STYLES, color: 'white' }, content: [bottle] },
        { styles: PAD_STYLES, content: [signedPadding(-FONTS.widthOf(POTION_FONT, bottle, false))] },
        { styles: { ...POTION_STYLES, color: parseColor(color) }, content: [POTION_OVERLAY] },
    ];
}

// The types of inline code, by the word after its closing backtick, each giving the nodes that stand for the code.
// `n`pad is n pixels of padding, negative to step back. `n`tally is n tallies, see tallyNodes. `type color`potion is a potion icon.
const INLINE_TYPES = {
    potion: (code) => potionNodes(code),
    cover: (code, classes, atLineStart) => coverNodes(code, atLineStart),
    pad: (code) => {
        const width = padWidth(code);
        return width ? [{ styles: PAD_STYLES, content: [signedPadding(width)] }] : [];
    },
    tally: (code, classes) => tallyNodes(tallyCount(code), classes),
    drop: (code, classes) => dropCapNodes(code, classes),
};
// The types that take one space after them with them, as `n`pad does; the others leave it in the text
const INLINE_EATS_SPACE = new Set(['pad', 'drop', 'cover']);

// `T`drop is a drop cap, the text of the code in the font of the drop style of the stylesheet. Its place on the first line is
// padding as wide as the cap, measured from the font, and applyDropCaps moves the cap itself to the start of the second line, once
// the wraps are known: a tall font draws up over the first line, so the text of both lines starts after it.
function dropCapNodes(code, classes) {
    const styles = classes.drop;
    if (!styles || !styles.font) throw new Error(`\`${code}\`drop needs a drop style with a font in the stylesheet`);
    const width = [...code].reduce((sum, ch) => sum + FONTS.widthOf(styles.font, ch, !!styles.bold), 0);
    return [{ styles: PAD_STYLES, content: [padding(width)], dropcap: { styles, content: [code], width } }];
}

// The locales written right to left. Their text is aligned to the right unless a style says otherwise, and an alignment a
// book writes for text that starts at the left is mirrored: left is right there and right is left, center stays.
const RTL_LOCALES = ['ar_sa', 'he_il'];
const MIRROR = { left: 'right', right: 'left', center: 'center' };
const RTL_LETTER = /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}]/u;

// How far a line reaches from its start: the furthest the pen gets, so glyphs stacked with a backwards padding count by where
// they end and not by the sum of their advances, which that padding shortens
//
// Kerning that pulls the next glyph closer is a backwards padding after the glyph, so the game's line is as wide as the glyph
// before that padding, a pixel more than the widths here, which fold it in. The splitter wraps at that peak, so the peak counts
// too, or a line aligned to fit the page exactly loses its last glyph to a wrap.
// How many glyphs at the start of a line are the nodes of a `n`cover: the body glyph, the step back, the strip and the step that
// returns to the start of the line, 0 for a line that does not start with the cover
function coverPrefix(text) {
    if (!text.length || text[0].font !== COVER_FONT) return 0;
    let x = 0;
    for (let n = 0; n < text.length; n++) {
        const g = text[n];
        if (g.font !== COVER_FONT && g.font !== PAD_FONT) return 0;
        x += g.sw ?? widthOf(g);
        if (x === 0 && n > 0) return n + 1;
    }
    return 0;
}

function reach(text) {
    let x = 0;
    let far = 0;
    for (const g of text) {
        const w = g.sw ?? widthOf(g);
        far = Math.max(far, x + w + peak(g));
        x += w;
        far = Math.max(far, x);
    }
    return far;
}

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
        const whole = chars.slice(line.tstart, line.tend);
        // The line of a cover starts with the glyphs of the cover and padding that steps back to where the line began, which have to stay
        // first and are no width of the text: it is aligned from what comes after them
        const lead = coverPrefix(whole);
        const text = whole.slice(lead);
        if (!text.length) continue;
        const written = text[0].lead ?? text[0].center ?? null;
        const laidOut = text.some((g) => g.font === PAD_FONT || g.font === TALLY_FONT || g.font === POTION_FONT || g.font === COVER_FONT || g.font === CODE_FONT || g.font === MUSIC_FONT);
        const align = written ? (rtl ? MIRROR[written] : written) : rtl && !laidOut ? 'right' : 'left';
        if (align === 'left') {
            // Runs of text that start mid-line with align center or right go to the middle or the right edge of the same line,
            // each with the padding in front of it: `1<center>2</center><style class=".right">3</style>` is 1, 2 and 3 spread
            // across the line. Runs go in order, and a run that has no room left stays where it falls
            if (!rtl && !laidOut) {
                const modeOf = (g) => g.lead ?? g.center ?? 'left';
                const runs = [];
                text.forEach((g, n) => {
                    const mode = modeOf(g);
                    if (!runs.length || runs[runs.length - 1].mode !== mode) runs.push({ mode, from: n });
                    runs[runs.length - 1].to = n + 1;
                });
                let x = 0;
                const pads = [];
                for (const run of runs) {
                    const w = reach(text.slice(run.from, run.to));
                    const pad = run.mode === 'center' ? Math.floor((PAGE_WIDTH - w) / 2) - x : run.mode === 'right' ? PAGE_WIDTH - x - w : 0;
                    if (pad > 0 && run.from > 0) {
                        pads.push({ place: text[run.from].place, pad });
                        x += pad;
                    }
                    x += w;
                }
                for (const { place, pad } of pads.reverse()) insertAt(tree, place, [{ styles: PAD_STYLES, content: [padding(Math.min(MAX_PAD, pad))] }]);
            }
            continue;
        }
        const room = PAGE_WIDTH - reach(text);
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
        // The padding goes after the cover, at the start of the text; the end of a line before is a newline, which goes first
        const parts = [...(line.soft ? ['\n'] : []), ...(pad && !reads && !lead ? [node] : [])];
        if (pad && !reads && lead) insertAt(tree, chars[line.tstart + lead].place, [node]);
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
    return pageRanges(pager).map(([from, to]) => pager.slice(from, to)).filter(Boolean);
}

// The [from, to) lines of every page of a pager
function pageRanges(pager) {
    const ranges = [];
    for (let at = pager.first(0); at < pager.lines.length; ) {
        let end = Math.min(at + PAGE_LINES, pager.lines.length);
        // The empty lines above a tall line go to the next page with it
        while (end > at + 1 && (pager.splitsReserve(end) || pager.splitsHeading(end, at))) end--;
        ranges.push([at, end]);
        at = pager.first(end);
    }
    return ranges;
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
    // Whether a heading is inked on the line: a # header has glyphs marked heading and nothing else but spaces and the padding that centers it
    const isHeading = (n) => {
        if (empty(n)) return false;
        const line = chars.slice(lines[n].tstart, lines[n].tend);
        return line.some((g) => g.heading) && line.every((g) => g.ch === ' ' || g.heading || g.font === PAD_FONT);
    };
    // Whether a page from line `from` that ends before line `to` ends on a heading with its text on the next page: the last lines of
    // the page are headings and the empty lines under them, and something follows. A heading goes to the next page with the
    // first line of its paragraph, or with its subheading and that line, unless that would leave the page with nothing but headings
    const splitsHeading = (to, from) => {
        if (to <= from || to >= lines.length) return false;
        let next = to;
        while (next < lines.length && empty(next)) next++;
        if (next === lines.length) return false;
        let k = to - 1;
        let heading = false;
        while (k >= from && (empty(k) || isHeading(k))) {
            if (!empty(k)) heading = true;
            k--;
        }
        return heading && k >= from;
    };
    return { lines, chars, empty, first, slice, splitsReserve, splitsHeading };
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
                if (cut && !a.pager.splitsReserve(to) && !a.pager.splitsHeading(to, at[i]) && layout(variant(a.pager.slice(at[i], to), true)).lines.length <= PAGE_LINES) list.push(cut);
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
    return fitRanges(pager).map(([from, to]) => pager.slice(from, to));
}

// The [from, to) lines of every page paginateFit makes of a pager, the ones that are not empty
function fitRanges(pager) {
    const ranges = [];
    for (let at = pager.first(0); at < pager.lines.length; ) {
        const fits = (to) => {
            if (pager.splitsReserve(to) || pager.splitsHeading(to, at)) return false;
            const page = pager.slice(at, to);
            // A page edge inside a filter span would leave the span unfiltered
            return !page || (!hasCut(page) && layout(variant(page, true)).lines.length <= PAGE_LINES);
        };
        let end = Math.min(at + PAGE_LINES, pager.lines.length);
        while (end > at + 1 && !fits(end)) end--;
        if (pager.slice(at, end)) ranges.push([at, end]);
        at = pager.first(end);
    }
    return ranges;
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
            // The anchor of a heading is only for resolveAnchors, as in toComponent
            const { anchor, ...styles } = node.styles;
            return Object.assign(child, styles);
        });
    }
    return component;
}

// The formats the padding turns off, which only matter where something around it has them on
const OFF_FLAGS = ['bold', 'italic', 'underlined', 'strikethrough', 'obfuscated'];

// Drops the 'false' of a format that nothing around the component turns on, it would be the default anyway. The arguments of a
// component are inside it, so they inherit what it has on
function pruneOffFlags(component, inherited = {}) {
    const on = { ...inherited };
    for (const flag of OFF_FLAGS) {
        if (component[flag] === false && !inherited[flag]) delete component[flag];
        else if (component[flag] !== undefined) on[flag] = component[flag] === true;
    }
    if (component.with) component.with.forEach((child) => pruneOffFlags(child, on));
    return component;
}

/** A page as unionComponent, with the style of the whole text, the WHOLE node every page is inside, on the page itself. */
function unionPage(contents, key, langs, ref) {
    const wrapped = contents.find((content) => content && content.length === 1 && content[0].id === WHOLE);
    const inner = contents.map((content) => content && (content.length === 1 && content[0].id === WHOLE ? content[0].content : content));
    const component = unionComponent(inner, key, langs, ref);
    contents.forEach((content, i) => content === null && (langs[i][key] = ''));
    return pruneOffFlags(wrapped ? Object.assign(component, (contents[ref] ? contents[ref][0] : wrapped[0]).styles) : component);
}

//endregion

//region Books

// A line of only --- is a manual page break. Between them a newline in the source is a line break, so a blank line is an empty line,
// and a line that is too long wraps by itself. Spans do not reach across a page break.
const escapeMarkup = (s) => s.replace(/[\\*_~|<`]/g, '\\$&');

// The lines of a code block as markup: literal spans in the code font, colored by the language of the fence when the
// highlighter knows it. A code line keeps its indentation and is never a heading.
// A code line of 10 or more hyphens or equals signs and nothing else, as in the divider of a pasted license, is a horizontal line
// of that character in the code font, as wide as the page, instead of a long run of glyphs that wraps
const CODE_DIVIDER = /^\s*([-=])\1{9,}$/;

function codeLines(language, lines) {
    const code = lines.map((l) => l.replace(/\s+$/, '')).join('\n');
    const rows = (language && highlight(code, language)) || code.split('\n').map((l) => (l ? [{ text: l, color: undefined }] : []));
    return rows.map((row, n) => {
        const divider = CODE_DIVIDER.exec(lines[n].replace(/\s+$/, ''));
        if (divider) return `<style font="${CODE_FONT}" char="${divider[1]}">---</style>`;
        return row.map(({ text, color }) => `<font face="${CODE_FONT}"${color ? ` color="${color}"` : ''} literal="1">${escapeMarkup(text)}</font>`).join('');
    });
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

// A --- line, or one inside a <style>, at the start of the text: what a heading may sit directly on
// A # header that starts with a line of the cover: the empty line a header gets has no piece of the cover, and shifts the lines under it
const COVER_HEADING = /^#{1,6}\s+`[^`\n]*`cover(?![a-zA-Z0-9])/;
const HORIZONTAL_LINE_NEXT = /^(---|<style(?:\s[^>]*)?>\s*---\s*<\/style>)[ \t]*(?:\n|$)/;

function splitSections(body) {
    return splitOnBreaks(body.replace(/\r\n/g, '\n'))
        .map((section) =>
            fenceCode(section.split('\n'))
                .map((line) => line.replace(/\s+$/, ''))
                // A heading is bold and underlined and always has an empty line under it, unless a horizontal line comes right after it
                .flatMap((line, n, lines) => (/^#{1,6}\s+/.test(line) ? [line.replace(/^(#{1,6})\s+(.*)$/, (_, hashes, text) => `<h${hashes.length}>${text}</h${hashes.length}>`), ...(lines[n + 1] === '' || COVER_HEADING.test(line) || HORIZONTAL_LINE_NEXT.test(lines.slice(n + 1, n + 4).join('\n')) ? [] : [''])] : [line]))
                .join('\n')
                // The line break that ends the --- line goes, the empty lines after it are paginate's to keep or drop
                .replace(/^\n|\n+$/g, '')
        )
        .filter(Boolean);
}

/**
 * Keeps the start of a link together: the game breaks a line at a space only, so the spaces in the first quarter of the width of
 * a link become no-break spaces. A link that has to wrap then wraps where it has already shown most of itself, and never leaves its
 * icon, or an icon and a short word, alone at the end of a line. The rest of the link wraps like any text. The no-break space
 * is a pixel wider than a space in the default font, the layout measures the text as it is. base is the style of the whole
 * text, for the font a link inherits. Returns a copy of the tree.
 */
const LINK_BIND = 0.25;
function bindLinks(content, base = {}, bold = base.bold === true, font = base.font ? withNamespace(base.font) : DEFAULT_FONT) {
    return content.map((part) => {
        if (typeof part === 'string' || part.literal) return part;
        const inBold = part.styles.bold === undefined ? bold : part.styles.bold === true;
        const inFont = part.styles.font ? withNamespace(part.styles.font) : font;
        if (!part.styles.click_event) return { ...part, content: bindLinks(part.content, base, inBold, inFont), ...(part.alt ? { alt: bindLinks(part.alt, base, inBold, inFont) } : {}) };
        const list = glyphs([part], bold, font);
        const total = list.reduce((sum, g) => sum + (g.sw ?? widthOf(g)), 0);
        const bind = new Set();
        let x = 0;
        list.forEach((g, n) => {
            if (g.ch === ' ' && x < total * LINK_BIND) bind.add(n);
            x += g.sw ?? widthOf(g);
        });
        if (!bind.size) return part;
        // The glyphs are the characters of the content in order, the alt of a filter has none of its own
        let n = 0;
        const walk = (parts, literal) =>
            parts.map((p) => {
                if (typeof p !== 'string') return { ...p, content: walk(p.content, literal || p.literal === true) };
                return [...p].map((ch) => (n++, ch === ' ' && !literal && bind.has(n - 1) ? '\u00a0' : ch)).join('');
            });
        return { ...part, content: walk(part.content, false) };
    });
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

// The lines that split a section into parts: a <vcenter> or <vbottom>, or a horizontal line, which a <style> around the --- may restyle
const LINE_MARKS = /^(<vcenter>|<vbottom>|---|<style(?:\s[^>]*)?>\s*---\s*<\/style>)[ \t]*(?:\n|$)/m;

// What a text tree holds in the order of its glyphs: where each <vcenter> and <vbottom> is, and where each header starts
function textMarks(content) {
    const marks = [];
    let pos = 0;
    const walk = (nodes) => {
        for (const part of nodes) {
            if (typeof part === 'string') {
                pos += [...part].length;
                continue;
            }
            if (part.vmark) marks.push({ kind: part.vmark, at: pos });
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
    content.filter((part) => !part.vmark).map((part) => (typeof part === 'string' ? part : { ...part, content: withoutVcenter(part.content) }));

function centerVertically(tree, marks) {
    const clean = withoutVcenter(tree);
    if (!marks.some((m) => m.kind !== 'header')) return clean;
    const pager = pagerOf(clean);
    const { lines, chars, empty } = pager;
    // The line a place of the tree starts or falls in
    const lineAt = (at) => {
        const c = chars.findIndex((g) => g.place >= at);
        return c < 0 ? lines.length : lines.findIndex((l) => c >= l.start && c <= l.end);
    };
    const centers = marks.filter((m) => m.kind !== 'header');
    const headers = marks.filter((m) => m.kind === 'header');
    const glyphList = glyphs(clean);
    const lastLine = lines.length - 1 - [...lines].reverse().findIndex((_, n) => !empty(lines.length - 1 - n));
    // The lines of the text under each: from its first line with something on it, up to the next header that has text above it
    const regions = centers.map((m) => {
        let from = lineAt(m.at);
        while (from <= lastLine && empty(from)) from++;
        // Under a header the text goes up to the next header, a <vcenter> or <vbottom> of the page itself up to the end of the text
        const under = headers.some((h) => h.end <= m.at && glyphList.slice(h.end, m.at).every((g) => /\s/.test(g.ch)));
        // and any region ends where the next <vcenter> or <vbottom> starts
        const stops = [...(under ? headers : []), ...centers.filter((c) => c.at > m.at)].map((h) => lineAt(h.at)).filter((h) => h > from);
        const next = stops.length ? Math.min(...stops) : undefined;
        let to = (next ?? lastLine + 1) - 1;
        while (to > from && empty(to)) to--;
        return { from, to, bottom: m.kind === 'vbottom' };
    });
    const blank = () => [{ styles: PAD_STYLES, content: [padding(1)] }, '\n'];
    const fill = (count) => Array.from({ length: count }).flatMap(blank);
    const edits = [];
    // Each page is aligned on its own, and a region that spans a page boundary is ignored. The pages are the ones the book is
    // cut into, paginateFit's, which end early around a <filter> span; the spare lines are what the longer of the page and
    // its chat-filtered reading leaves
    for (const [pageFrom, pageTo] of fitRanges(pager)) {
        const first = lines.findIndex((_, n) => n >= pageFrom && !empty(n));
        let last = Math.min(pageTo, lines.length) - 1;
        while (last > first && empty(last)) last--;
        if (first < 0 || first >= pageTo) continue;
        const page = pager.slice(pageFrom, pageTo);
        const filtered = page ? layout(variant(page, true)).lines.length : 0;
        const spare = PAGE_LINES - Math.max(last - first + 1, filtered);
        const onPage = regions.filter((r) => r.from >= pageFrom && r.from <= last && r.to <= last);
        if (spare <= 0 || !onPage.length) continue;
        // The first <vbottom> goes first: it sits on the last line, so the whitespace above it is what is left for the <vcenter>s
        // before it, which share that and center in it. Without one before it, the <vbottom> takes the whitespace itself, and
        // nothing is left for what comes after it
        const bottom = onPage.findIndex((r) => r.bottom);
        const taking = onPage.filter((r, n) => (bottom < 0 ? true : !r.bottom && n < bottom));
        if (bottom >= 0 && !taking.length) taking.push(onPage[bottom]);
        onPage.forEach((r) => {
            const n = taking.indexOf(r);
            if (n < 0) return;
            const share = Math.floor(spare / taking.length) + (n < spare % taking.length ? 1 : 0);
            // <vbottom> puts all of the spare lines above the text, <vcenter> half
            const above = r.bottom ? share : Math.floor(share / 2);
            edits.push({ at: chars[lines[r.from].start].place, text: fill(above) });
            // Under the text, before the line that follows it, unless that is where the page ends
            if (r.to < last) edits.push({ at: chars[lines[r.to + 1].start].place, text: fill(share - above) });
        });
    }
    // Nothing to do on any page
    if (!edits.length) return clean;
    // From the end of the tree, so the places in front stay
    const result = JSON.parse(JSON.stringify(clean));
    for (const e of edits.sort((a, b) => b.at - a.at)) if (e.text.length) insertAt(result, e.at, e.text);
    return result;
}

// The first drop cap padding in the tree that applyDropCaps has not moved yet, with where its first glyph is
function findDropCap(content) {
    let pos = 0;
    const walk = (nodes) => {
        for (const part of nodes) {
            if (typeof part === 'string') {
                pos += [...part].length;
                continue;
            }
            if (part.dropcap) return part;
            const found = walk(part.content);
            if (found) return found;
        }
        return null;
    };
    const node = walk(content);
    return node ? { node, at: pos } : null;
}

/**
 * Moves each drop cap of `n`drop to the start of the line after the padding it left on its first line, a newline in front of
 * it where that line starts at a wrap. The padding is as wide as the cap, so the text of the first line and of the lines
 * after the cap start at the same place. A paragraph of one line has no second line, the cap goes over its padding there.
 * Returns a copy of the tree.
 */
function applyDropCaps(content) {
    const tree = JSON.parse(JSON.stringify(content));
    for (let guard = 0; guard < 1000; guard++) {
        const found = findDropCap(tree);
        if (!found) return tree;
        const { node, at } = found;
        const { dropcap: cap } = node;
        delete node.dropcap;
        const { lines, chars } = layout(tree);
        const c = chars.findIndex((g) => g.place >= at);
        const row = c < 0 ? -1 : lines.findIndex((l) => c >= l.start && c <= l.end);
        const next = lines[row + 1];
        const capNode = { styles: cap.styles, content: cap.content };
        if (next && next.soft && next.tstart < next.tend) insertAt(tree, chars[next.tstart].place, ['\n', capNode]);
        else insertAt(tree, at + [...node.content.join('')].length, [{ styles: PAD_STYLES, content: [signedPadding(-cap.width)] }, capNode]);
    }
    throw new Error('applyDropCaps does not settle');
}

// The tree of every section of the body, laid out and ready to be cut into pages
function sectionsOf(body, font = null, hyphenator = null, classes = {}, align = true, rtl = false) {
    let nextId = 0;
    return splitSections(ligate(body)).map((text) => {
        // The parts between the <vcenter> and --- lines, each its own text, with a mark or a horizontal line where one was
        const pieces = text.split(LINE_MARKS);
        const content = pieces.flatMap((part, n) => {
            if (n % 2 && !/^<v(center|bottom)>/.test(part)) {
                const tag = /^<style((?:\s[^>]*)?)>/.exec(part);
                // font and char on the tag give the line that font and mark, as classes can, so a divider can be made of any glyph
                const attrs = tag ? parseAttributes(tag[1]) : {};
                const own = { ...(attrs.font === undefined ? {} : { font: attrs.font }), ...(attrs.char === undefined ? {} : { char: attrs.char }) };
                return [...horizontalLine(classes, tag ? { ...classStyles(attrs, classes), ...own } : {}), '\n'];
            }
            if (n % 2) return [{ styles: {}, content: [], vmark: part.slice(1, 8) === 'vcenter' ? 'vcenter' : 'vbottom' }];
            const parsed = parseInline(part, 0, null, classes).content;
            nextId = assignIds(parsed, nextId);
            return parsed;
        });
        const base = { ...(font ? { font } : {}), ...classes.body };
        const whole = Object.keys(base).length ? [{ id: WHOLE, styles: base, content }] : content;
        // Right to left lines are aligned to the right by alignLines, a hanging indent would be on the wrong side
        const hung = (c) => (rtl ? c : hangLists(c));
        const tree = reserveTall(applyDropCaps(unwrapNoHyphen(hung(hyphenate(bindLinks(whole, base), hyphenator)))));
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
const INHERITED_KEYS = ['rarity', 'model', 'styles', 'generation'];

// The generation of a written book: 0 original, 1 copy, 2 copy of a copy, 3 tattered, as the number or the name. The game omits 0
const GENERATIONS = ['original', 'copy', 'copyofacopy', 'tattered'];
function parseGeneration(value) {
    const text = String(value).trim().toLowerCase();
    const n = /^[0-3]$/.test(text) ? Number(text) : GENERATIONS.indexOf(text.replace(/[\s_-]+/g, ''));
    if (n < 0) throw new Error(`generation is 0 to 3, or original, copy, copy of a copy, tattered, not "${value}"`);
    return n;
}

// The locale folder of a source and the group folder under it, if any: <locale>/<id>.md or <locale>/<group>/<id>.md
function placeOf(file) {
    const dir = path.dirname(file);
    const grouped = !/^[a-z]{2,3}_[a-z]{2}$/i.test(path.basename(dir));
    const localeDir = grouped ? path.dirname(dir) : dir;
    return { locale: path.basename(localeDir), group: grouped ? path.basename(dir) : null, root: path.dirname(localeDir) };
}

/**
 * Sets the page of every #heading link to the first page that has the heading. The link text is the same on every page it
 * can land on, so this does not move a page break. Each locale resolves against its own headings, a translation names the
 * heading as it is written there.
 */
function resolveAnchors(pages, file) {
    const where = new Map();
    // A set: a click event shared by several nodes of one link is resolved once, its anchor is gone after that
    const links = new Set();
    const walk = (nodes, page) => {
        for (const part of nodes) {
            if (typeof part === 'string') continue;
            const anchor = part.styles && part.styles.anchor;
            if (anchor && !where.has(anchor)) where.set(anchor, page);
            const event = part.styles && part.styles.click_event;
            if (event && event.anchor !== undefined) links.add(event);
            walk(part.content, page);
            if (part.alt) walk(part.alt, page);
        }
    };
    pages.forEach((tree, n) => walk(Array.isArray(tree) ? tree : [tree], n + 1));
    for (const event of links) {
        if (!where.has(event.anchor)) throw new Error(`${file}: link to #${event.anchor}, no heading of that name; headings are ${[...where.keys()].join(', ') || 'missing'}`);
        event.page = where.get(event.anchor);
        delete event.anchor;
    }
}

/**
 * Prefixes an error message with file:line, the format editors and terminals open. The line comes from what the message names:
 * a class, a style, a `n`cover line or a frontmatter key; a message that names nothing findable gets the file alone.
 */
function locate(file, message) {
    const own = `${file}: `;
    const text = message.startsWith(own) ? message.slice(own.length) : message;
    let lines;
    try {
        lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    } catch (e) {
        return own + text;
    }
    // First line matching, 1-based, 0 for none
    const find = (test) => lines.findIndex(test) + 1;
    let line = 0;
    let m;
    if ((m = /class "\.?([^"]+)"/.exec(text))) line = find((l) => l.includes(`class=".${m[1]}"`) || l.includes(`class="${m[1]}"`));
    else if ((m = /^style "([^"]+)"/.exec(text))) line = find((l) => l.trim().replace(/^"|"?:.*$/g, '') === m[1]);
    else if ((m = /^`(.+?)`cover/.exec(text))) line = find((l) => l.startsWith('`' + m[1] + '`cover'));
    else if ((m = /^(styles|data|lore|font) |frontmatter (\w+)/.exec(text))) line = find((l) => l.toLowerCase().startsWith((m[1] || m[2]).toLowerCase() + ':'));
    else if (/^SNBT/.test(text)) line = find((l) => /^(styles|style|data|lore)\s*:/i.test(l));
    return `${file}${line ? ':' + line : ''}: ${text}`;
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
    if (meta.generation !== undefined) {
        try {
            parseGeneration(meta.generation);
        } catch (e) {
            throw new Error(`${file}: frontmatter ${e.message}`);
        }
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
            if (part.id !== undefined && part.id !== WHOLE) out.push(`${part.id}:${JSON.stringify(part.styles, (k, v) => (k === 'anchor' || k === 'page' ? undefined : v))}:${part.alt ? 1 : 0}:${part.literal ? 1 : 0}`);
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
    for (const i of used) resolveAnchors(own[i], files[i]);
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
        // A page that reads the same filtered stays a plain component, the game filters it to the same text
        const filters = filtered(n);
        const differs = reads.some((tree, k) => tree && JSON.stringify(tree) !== JSON.stringify(filters[k]));
        const kerned = (trees) => trees.map((tree) => tree && applyKerning(tree));
        const page = unionPage(kerned(reads), `book.${NS}.${id(files[0])}.page.${n + 1}`, langs, 0);
        components.push(differs ? { raw: page, filtered: unionPage(kerned(filters), `book.${NS}.${id(files[0])}.filtered.${n + 1}`, langs, 0) } : page);
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
        return pruneOffFlags(toComponent(applyKerning(tree), `book.${NS}.${id}.${kind}.${n + 1}`, lang));
    });
}

const TITLE_FILTER = /<filter\s+as=(?:"([^"]*)"|'([^']*)')\s*>(.*?)<\/filter>/gi;

// A title in SNBT also sets the item name, the book title itself is plain text. A plain title takes
// <filter as="...">text</filter> for the chat-filtered title; custom_name has no filtered side, so an SNBT one does not.
function titleOf(meta) {
    const result = titleParts(meta);
    // displayTitle is only the item name, so it has no 32 character limit and no filtered side
    if (meta.displaytitle) {
        const display = titleParts({ title: String(meta.displaytitle) });
        if (display.filtered || /<\/?filter/i.test(display.text)) throw new Error('<filter> does not work in displayTitle, the item name has no filtered side');
        result.display = { text: display.text, rich: display.rich };
    }
    return result;
}

// A plain title and displayTitle read \n, \t, \\ and \uXXXX as the characters, so a name can have a line break. SNBT titles have
// their own escapes. Anything else after a backslash stays as typed.
const TITLE_ESCAPE = /\\(n|t|\\|u[0-9a-fA-F]{4})/g;
const decodeTitleEscapes = (text) => text.replace(TITLE_ESCAPE, (_, code) => (code === 'n' ? '\n' : code === 't' ? '\t' : code === '\\' ? '\\' : String.fromCharCode(parseInt(code.slice(1), 16))));

function titleParts(meta) {
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
    return { text: decodeTitleEscapes(text), filtered: filtered === text ? null : decodeTitleEscapes(filtered), rich: null };
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
    const rich = title.display ? title.display.rich : title.rich;
    if (!rich) {
        const text = title.display ? title.display.text : title.filtered || title.text;
        lang[key] = escapePercent(text);
        return { translate: key, fallback: escapePercent(text), ...base };
    }
    return { text: '', ...base, extra: [].concat(rich) };
}

// The custom_name of a book, or null to leave the name to the game, which derives it from the book's title. A rich title or
// displayTitle without a rarity is the name as written; a plain displayTitle always sets one, since the title is not the name.
function nameOf(title, rarity, key, lang) {
    const rich = title.display ? title.display.rich : title.rich;
    if (rich && !rarity) return rich;
    return rarity || title.display ? itemName(title, rarity, key, lang) : null;
}

// The text of a page as the reader sees it, with none of the formatting
const plainText = (tree) => glyphs(tree).map((g) => g.ch).join('');

// A book and quill keeps plain strings, so the formatting, fonts, title and author are lost. The title is the item name
function buildWritable(id, source, title, file, warnings) {
    const { meta } = source;
    for (const key of ['author', 'font', 'styles', 'generation']) if (meta[key]) warnings.push(`${file}: ${key} does nothing in a writable book`);
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
    set['minecraft:custom_name'] = nameOf(title, rarity, `book.${NS}.${id}.title`, lang) ?? itemName(title, rarity, `book.${NS}.${id}.title`, lang);
    if (meta.model) set['minecraft:item_model'] = parseModel(meta.model);
    const functions = [{ type: 'minecraft:set_components', components: set }];
    // The SNBT string form, a JSON compound would turn small ints into bytes
    if (meta.data) functions.push({ type: 'minecraft:set_custom_data', tag: meta.data });
    const lore = loreLines(meta, id, lang, source.loreCount);
    if (lore.length) functions.push({ type: 'minecraft:set_lore', lore, mode: 'insert' });
    return { modifier: { type: 'minecraft:sequence', functions }, lang, warnings };
}

/**
 * The # headers of the page trees as [page, names] pairs, read from the source text and not the pixels. A header cut by the
 * page break is one heading, listed on the page it starts on.
 */
function headingsOf(trees, filtered) {
    const found = [];
    let last = null;
    trees.forEach((tree, n) => {
        const names = [];
        const walk = (nodes) => {
            for (const part of nodes) {
                if (typeof part === 'string') continue;
                // The pages are cut from glyphs, which keep the styles of a header and its anchor but not the header flag
                if (part.styles && part.styles.anchor !== undefined) names.push({ anchor: part.styles.anchor, name: plainOf(part.content).replace(/[\ue000-\uf8ff]/g, '').replace(/\s+/g, ' ').trim() });
                else walk(part.content);
            }
        };
        walk(variant(Array.isArray(tree) ? tree : [tree], filtered));
        // The header at the start of a page is the tail of the one the previous page ended on
        const kept = names.filter((h, k) => !(k === 0 && last !== null && h.anchor === last));
        if (kept.length) found.push([n + 1, kept.map((h) => h.name)]);
        if (names.length) last = names[names.length - 1].anchor;
    });
    return found;
}

/** Item modifier JSON and lang entries for one book in one locale. */
function buildBook(id, file, source = readSource(file)) {
    const warnings = [];
    const { meta } = source;
    if (!source.union && !isWritable(meta)) resolveAnchors(source.pages, file);
    const pages = source.union ? new Array(source.union.count) : source.pages.map((tree) => variant(tree, false));
    const lang = {};
    const title = titleOf(meta);
    if (!title.text) throw new Error(`${file}: title is missing`);
    for (const [kind, text] of [['title', title.text], ['filtered title', title.filtered]]) {
        if (text && text.length > MAX_TITLE) warnings.push(`${file}: ${kind} is ${text.length} characters, the book takes ${MAX_TITLE}`);
    }
    // An item name is one tooltip line, the game draws a newline in it as a missing glyph box
    for (const [kind, text] of [['title', title.text], ['filtered title', title.filtered], ['displayTitle', title.display && title.display.text]]) {
        if (text && text.includes('\n')) warnings.push(`${file}: ${kind} has a newline, an item name or title is one line and the game draws the break as a box`);
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
    if (meta.generation !== undefined && parseGeneration(meta.generation) > 0) content.generation = parseGeneration(meta.generation);
    const set = { 'minecraft:written_book_content': content };
    const rarity = rarityOf(meta);
    const name = nameOf(title, rarity, `book.${NS}.${id}.title`, lang);
    if (name) set['minecraft:custom_name'] = name;
    if (meta.model) set['minecraft:item_model'] = parseModel(meta.model);
    const functions = [{ type: 'minecraft:set_components', components: set }];
    // The SNBT string form, a JSON compound would turn small ints into bytes
    if (meta.data) functions.push({ type: 'minecraft:set_custom_data', tag: meta.data });
    const lore = loreLines(meta, id, lang, source.loreCount);
    if (lore.length) functions.push({ type: 'minecraft:set_lore', lore, mode: 'insert' });
    return { modifier: { type: 'minecraft:sequence', functions }, lang, warnings, headings: { raw: headingsOf(source.pages, false), filtered: headingsOf(source.pages, true) } };
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
const json = (value) => JSON.stringify(value, null, 2).replace(/[\u00a0\ue000-\uf8ff]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`) + '\n';

// One book of the generated ones by tier weights, equal odds within a rarity. A rarity is an inline loot table so its weight
// does not depend on how many books it has. An empty list is a table without pools, which drops nothing. A table entry that
// points at one still counts as picked, so the tables list the books themselves.
function mysteryTable(books, tier, paths = {}) {
    const entries = [];
    for (const [rarity, weight] of Object.entries(TIER_WEIGHTS[tier])) {
        const ids = books.filter((book) => (book.rarity || 'common') === rarity).map((book) => book.id);
        if (!ids.length) continue;
        const value = { pools: [{ rolls: 1, entries: ids.map((id) => ({ type: 'minecraft:loot_table', value: `${NS}:item/random_loot/book/${GENERATED_DIR}/${paths[id] || id}` })) }] };
        entries.push({ type: 'minecraft:loot_table', weight, value });
    }
    return entries.length ? { pools: [{ rolls: 1, entries }] } : { pools: [] };
}

// The rarity is the shared item modifier rarity/<name>, in the entry so that it runs before the modifier of the book
function tableFor(id, writable = false, rarity = null, rel = id) {
    const entry = { type: 'minecraft:item', name: writable ? 'minecraft:writable_book' : 'minecraft:written_book' };
    if (rarity) entry.modifier = [`${NS}:rarity/${rarity}`];
    return { pools: [{ rolls: 1, entries: [entry] }], modifier: `${NS}:random_loot/book/${GENERATED_DIR}/${rel}` };
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
                throw new Error(locate(file, e.message));
            }
            for (const key of requiredKeys(meta)) if (!String(meta[key] || '').trim()) throw new Error(`${file}: frontmatter ${key} is required`);
            if (meta.font !== undefined) warnings.push(`${file}: the frontmatter font is deprecated, use styles: { body: { font: ${meta.font} } }`);
            for (const key of Object.keys(meta)) if (!FRONTMATTER_KEYS.includes(key)) warnings.push(`${file}: unsupported frontmatter key "${key}", one of ${FRONTMATTER_KEYS.join(', ')}`);
            if (String(meta.debug).toLowerCase() === 'true' && !dev) hidden.add(m[1]);
            else if (meta.debug !== undefined && !/^(true|false)$/i.test(String(meta.debug))) throw new Error(`${file}: frontmatter debug is true or false`);
            if (books[m[1]]) throw new Error(`${file}: the book id ${m[1]} is also used by ${books[m[1]].file}, ids are unique across group folders`);
            books[m[1]] = { file, rel: (path.dirname(rel) === '.' ? '' : path.dirname(rel).split(path.sep).join('/') + '/') + m[1], writable: isWritable(meta), letter: isLetter(meta.model), rarity: meta.rarity ? String(meta.rarity).toLowerCase() : null, debug: String(meta.debug).toLowerCase() === 'true' };
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
    const { check = false, bookDir = BOOK_DIR, modifierDir = MODIFIER_DIR, tableDir = TABLE_DIR, langDir = LANG_DIR, dev, headingsFile = options.modifierDir ? null : HEADINGS_FILE } = options;
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
    const headings = {};
    const buildOnce = (id, file) => {
        if (!builds.has(file)) {
            try {
                builds.set(file, buildBook(id, file, aligned.get(file)));
            } catch (e) {
                throw new Error(locate(file, e.message));
            }
        }
        return builds.get(file);
    };

    for (const [locale, books] of Object.entries(sources)) {
        langs[locale] = {};
        for (const [id, book] of Object.entries(books)) {
            if (locale !== REFERENCE_LANG && !references[id]) throw new Error(`${book.file}: no ${REFERENCE_LANG} book called ${id}`);
            const built = buildOnce(id, book.file);
            warnings.push(...built.warnings);
            Object.assign(langs[locale], built.lang);
            if (built.headings) headings[`${locale}/${book.rel}`] = built.headings;
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
    const aggregates = {};
    const listed = (letter) => random.filter((id) => references[id].letter === letter).map((id) => ({ id, rarity: references[id].rarity }));
    for (const tier of Object.keys(TIER_WEIGHTS)) aggregates[`${MYSTERY_BOOK_DIR}/${tier}`] = mysteryTable(listed(false), tier, paths);
    aggregates[MYSTERY_LETTER] = mysteryTable(listed(true), 'common', paths);
    for (const [name, table] of Object.entries(aggregates)) {
        const file = path.join(tableDir, name + '.json');
        if (emit(file, json(table), check)) changed.push(file);
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
    // The viewer reads the headings from here, only the real run writes them
    if (headingsFile && !check) emit(headingsFile, json(headings), false);
    for (const id of FONTS.missing) warnings.push(`font ${id} is not defined by the game or texturepack/assets, its glyphs are measured as 9 pixels`);

    return { changed, warnings };
}

//endregion

module.exports = { GENERATED_DIR, applyKerning, generate, findSources, parseSnbt, parseClasses, parseFrontmatter, parseInline, splitSections, pagesOf, sectionsOf, paginate, paginateTogether, wrappedLore, toComponent, buildBook, layout, reserveTall, hyphenate, unwrapNoHyphen, RARITY_COLORS, LORE_WIDTH, LORE_PIXELS, loreWidth, loreEntries };

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
