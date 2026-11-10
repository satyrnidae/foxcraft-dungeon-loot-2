// A ```music fence of a book as staff lines in foxcraft_dungeon_loot:staff_notation. See scripts/books/README.md for the
// notation. Each staff line is two spans: the staff and its ledger lines in grey, padding back to its start, then the bars,
// clefs, keys, times, notes and rests in black, every glyph set at its place with padding.
const FONT = 'foxcraft_dungeon_loot:staff_notation';
// The colors of the staff and of the symbols over it, unless the music sets its own with staff: or symbol:
const STAFF_COLOR = '#aaaaaa';
const NOTE_COLOR = '#000000';
const COLOR_NAMES = ['black', 'dark_blue', 'dark_green', 'dark_aqua', 'dark_red', 'dark_purple', 'gold', 'gray', 'dark_gray', 'blue', 'green', 'aqua', 'red', 'light_purple', 'yellow', 'white'];
// The font draws its 12x36 cells 30 high
const SCALE = 30 / 36;
const PAGE_WIDTH = 114;

// The clefs: the G and F clefs of the first row of notation.png, and the C clefs of the third row of staff.png, as tall as
// the staff like its bars. Each is named by its letter and the line it sits on, counted from the bottom: G2 is the
// treble clef, F4 the bass, C3 the alto. F3 and C5 are both baritone and read the same.
const CLEFS = {
    G2: 0xe000, G1: 0xe001, F3: 0xe002, F4: 0xe003, F5: 0xe004,
    C1: 0xed00, C2: 0xed01, C3: 0xed02, C4: 0xed03, C5: 0xed04,
};
const COMMON_TIME = 0xe005;
// The digits of a time signature, the upper ones above the middle line and the lower ones under it, set at the same place
const UPPER = { 8: 0xe00b, 6: 0xe00c, 4: 0xe00d, 3: 0xe00e, 2: 0xe00f };
const LOWER = { 8: 0xe006, 6: 0xe007, 4: 0xe008, 3: 0xe009, 2: 0xe00a };
// The staff and its ledger lines are the glyphs of staff.png in staff_notation: cells of three times the size, drawn as
// high, so their lines are a third as thick. Widths here are in the columns of the notes.
// Ledger lines by the note furthest out: C6 has two above, A5 and B5 one, C4 and B3 one below, A3 two. They are 8 columns
// wide, centered over a head of 6, one pixel left of it
const LEDGERS = { 16: 0xef02, 15: 0xef03, 14: 0xef03, 2: 0xef04, 1: 0xef04, 0: 0xef05 };
const LEDGER_COLUMNS = 8;
// Every note head is 6 columns wide, in columns 0 to 5 of its glyph
const HEAD_COLUMNS = 6;
// The staff segments by their width in the image: 12 for the staff and 3 to finish it under the bar that closes it
const SEGMENTS = { 3: 0xef00, 12: 0xef01 };
const LONG = 12;
const SHORT = 3;
// The bars, the second row of staff.png, as tall as the staff from its top line to its bottom one
const DOUBLE_BAR = 0xee00;
const START_REPEAT = 0xee01;
const END_REPEAT = 0xee02;
const STOP = 0xee03;
const BAR = 0xee04;
// ||| opening the music is the stop turned round, its thick line first
const START_STOP = 0xee05;
const opening = (token) => (token === '|||' ? START_STOP : BARS[token]);
const BARS = { '|': BAR, '||': DOUBLE_BAR, '|||': STOP, '||:': START_REPEAT, ':||': END_REPEAT };
// The bars are drawn over one staff that runs the whole line, from under the bar that opens it through the bar that
// closes it: past the gap between its lines into its last line, and no further than that line's right edge. By columns,
// where its last line starts and where it ends; the dots of a start repeat stand past them
const BAR_LINES = { [BAR]: [0, 1], [DOUBLE_BAR]: [2, 3], [STOP]: [2, 4], [START_REPEAT]: [3, 4], [END_REPEAT]: [4, 6], [START_STOP]: [3, 4] };
const staffThrough = (x, g) => staffUnder(x + BAR_LINES[g][0] * SCALE, x + BAR_LINES[g][1] * SCALE);
// Rests and notes by the denominator of their length. Notes are numbered 0 for A3 up to 16 for C6, as on a treble staff.
// Stems go up below B4 and down from it; the font has up stems from F5 down to A3 and down stems from C6 down to F4.
const RESTS = { 1: 0xe211, 2: 0xe212, 4: 0xe213, 8: 0xe214 };
const WHOLE = 0xe200;
const STEMS = { 2: [0xe300, 0xe30d], 4: [0xe400, 0xe40d], 8: [0xe500, 0xe50d] };
const MIDDLE = 8;
// Sharps, flats and naturals: C6 to A5 on the upper extension, G5 to D4 on the staff, C4 to A3 on the lower one. The
// naturals of both extensions follow the down stems of the half notes
// Two accidentals of a chord share a column a seventh or more apart
const ACCIDENTAL_SHARE = 6;
const ACCIDENTALS = { '#': [0xe21b, 0xe100, 0xe21e], b: [0xe215, 0xe10b, 0xe218], n: [0xe31b, 0xe116, 0xe31e] };
// The places of the sharps and flats of a key signature in order, by clef. Each clef moves the treble ones by where it puts
// its note, kept within a seventh that sits on the staff: treble and sub-bass alike, French violin like bass, baritone two
// places under bass, and the C clefs from soprano on the bottom line up to tenor on the fourth, as engraved
const KEY_SHARPS = {
    G2: [12, 9, 13, 10, 7, 11, 8], G1: [10, 7, 11, 8, 5, 9, 6], F3: [8, 5, 9, 6, 10, 7, 4], F4: [10, 7, 11, 8, 5, 9, 6], F5: [12, 9, 13, 10, 7, 11, 8],
    C1: [7, 11, 8, 12, 9, 13, 10], C2: [9, 6, 10, 7, 4, 8, 5], C3: [11, 8, 12, 9, 6, 10, 7], C4: [6, 10, 7, 11, 8, 12, 9], C5: [8, 5, 9, 6, 10, 7, 4],
};
const KEY_FLATS = {
    G2: [8, 11, 7, 10, 6, 9, 5], G1: [6, 9, 5, 8, 4, 7, 3], F3: [4, 7, 3, 6, 9, 5, 8], F4: [6, 9, 5, 8, 4, 7, 3], F5: [8, 11, 7, 10, 6, 9, 5],
    C1: [10, 13, 9, 12, 8, 11, 7], C2: [5, 8, 4, 7, 3, 6, 9], C3: [7, 10, 6, 9, 5, 8, 4], C4: [9, 12, 8, 11, 7, 10, 6], C5: [4, 7, 3, 6, 9, 5, 8],
};
// Sharps in a key, flats as negative
const KEYS = {
    C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F#': 6, 'C#': 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7,
    Am: 0, Em: 1, Bm: 2, 'F#m': 3, 'C#m': 4, 'G#m': 5, 'D#m': 6, 'A#m': 7, Dm: -1, Gm: -2, Cm: -3, Fm: -4, Bbm: -5, Ebm: -6, Abm: -7,
};
// Room after a glyph, in pixels: after a note or rest by its length, before which a line is stretched to the page
const AFTER_EVENT = { 1: 9, 2: 6, 4: 4, 8: 3 };
const AFTER_BAR = 3;
const AFTER_HEADER = 2;

function accidental(kind, p) {
    const [upper, staff, lower] = ACCIDENTALS[kind];
    if (p >= 14) return upper + 16 - p;
    if (p >= 3) return staff + 13 - p;
    return lower + 2 - p;
}

// The glyph of a note with its stem down or up, or the other way when the font has no such stem for it
function noteGlyph({ p, len }, down) {
    if (len === 1) return WHOLE + 16 - p;
    const [up, dn] = STEMS[len];
    return (down && p >= 5) || p > 12 ? dn + 16 - p : up + 12 - p;
}

// Which way a note stems: the way of its chord, the other way with i, up with d, down with p
const stemDown = (n, down) => ({ i: !down, d: false, p: true })[n.stem] ?? down;

// The words of the notation: // and a lone # start a comment, parentheses are words of their own
function words(code) {
    return code.split('\n').flatMap((line) => {
        const all = line.replace(/\/\/.*$/, '').replace(/[()]/g, ' $& ').split(/\s+/).filter(Boolean);
        const hash = all.indexOf('#');
        return hash < 0 ? all : all.slice(0, hash);
    });
}

/** The notation as a list of items: bars, clefs, keys, times and events, each event a chord of notes, a rest or glyphs. */
function parse(code) {
    const items = [];
    let chord = null;
    let raw = false;
    for (const word of words(code)) {
        const wasRaw = raw;
        raw = false;
        if (word === '(') {
            if (chord) throw new Error('music: a chord inside a chord');
            chord = [];
            continue;
        }
        if (word === ')') {
            if (!chord || !chord.length) throw new Error('music: ) without a chord to close');
            items.push({ type: 'event', notes: chord, len: Math.max(...chord.map((n) => n.len)) });
            chord = null;
            continue;
        }
        const note = /^([#bn]?)(\d{1,2})-(1|2|4|8)([idp]?)$/.exec(word);
        if (note) {
            const n = { p: Number(note[2]), len: Number(note[3]), acc: note[1], stem: note[4], word };
            if (n.p > 16) throw new Error(`music: "${word}" is above 16, C6`);
            if (chord) chord.push(n);
            else items.push({ type: 'event', notes: [n], len: n.len });
            continue;
        }
        if (chord) throw new Error(`music: only notes go in a chord, not "${word}"`);
        const rest = /^R-?(1|2|4|8)$/.exec(word);
        const clef = /^Clef(\w+)$/.exec(word);
        if (clef && !Object.hasOwn(CLEFS, clef[1])) throw new Error(`music: "${word}" is not a clef, one of ${Object.keys(CLEFS).map((c) => 'Clef' + c).join(', ')}`);
        const time = /^TS(?:C|(\d)\/(\d))$/.exec(word);
        // A glyph is written \uXXXX, or as itself
        const glyphs = /^(\\u[0-9a-fA-F]{4})+$/.test(word) ? word.split('\\u').slice(1).map((h) => parseInt(h, 16)) : /^[\ue000-\uf8ff]+$/.test(word) && [...word].map((c) => c.charCodeAt(0));
        if (rest) items.push({ type: 'event', glyphs: [RESTS[rest[1]]], len: Number(rest[1]) });
        else if (clef) items.push({ type: 'clef', clef: clef[1] });
        else if (word === 'TSC') items.push({ type: 'time', glyphs: [COMMON_TIME] });
        else if (time) {
            if (!UPPER[time[1]] || !LOWER[time[2]]) throw new Error(`music: the font has no time ${time[1]}/${time[2]}, the upper number is one of ${Object.keys(UPPER)} and the lower one of ${Object.keys(LOWER)}`);
            items.push({ type: 'time', glyphs: [UPPER[time[1]], LOWER[time[2]]] });
        } else if (word in KEYS) items.push({ type: 'key', key: KEYS[word] });
        else if (word in BARS) items.push({ type: 'bar', bar: word });
        else if (/^(staff|symbol):/i.test(word)) {
            const [layer, value] = [word.slice(0, word.indexOf(':')).toLowerCase(), word.slice(word.indexOf(':') + 1).toLowerCase()];
            if (!COLOR_NAMES.includes(value) && !/^#[0-9a-f]{6}$/.test(value)) throw new Error(`music: "${word}" is not a color, a name such as gray or #rrggbb`);
            if (items.some((it) => it.type === 'color' && it.layer === layer)) throw new Error(`music: the ${layer} color is set twice`);
            items.push({ type: 'color', layer, color: value });
        }
        else if (glyphs) {
            // Glyphs written one after another join up, as the three of the glockenspiel triplet
            if (wasRaw) items[items.length - 1].glyphs.push(...glyphs);
            else items.push({ type: 'event', glyphs, raw: true, len: 4 });
            raw = true;
        } else throw new Error(`music: "${word}" is not a note, rest, bar, clef, key, time, color or \\u glyph`);
    }
    if (chord) throw new Error('music: a chord is not closed');
    return items;
}

// The glyphs of the staff font, its segments and ledger lines, are staff, drawn in its color; all others are symbols
const isStaff = (g) => g >= 0xef00 && g <= 0xef05;

/**
 * The staff segments that cover from 0 on to under the bar that closes the line, lo being its left edge and hi its right:
 * 12 pixel segments end to end, each stepping the 10 pixels it draws, and a 3 pixel one after them when they stop short
 * of lo. None overlaps another or reaches past hi. The bar is drawn over the end, so it needs no fraction of a pixel.
 * Null when they cannot end there, as on a line not yet stretched to the page.
 */
function staffUnder(lo, hi) {
    const drawn = (w) => w * SCALE;
    const marks = [];
    let x = 0;
    for (; x < lo - 0.01 && x + drawn(LONG) <= hi + 0.01; x += drawn(LONG)) marks.push({ x, g: SEGMENTS[LONG] });
    if (x < lo - 0.01 && x + drawn(SHORT) >= lo - 0.01 && x + drawn(SHORT) <= hi + 0.01) {
        marks.push({ x, g: SEGMENTS[SHORT] });
        x += drawn(SHORT);
    }
    return x >= lo - 0.01 ? marks : null;
}

/**
 * Lays out one staff line: the bar it opens with, its items and the bar it closes with. extra pixels are shared out
 * over the room after its events, to stretch it to the page, and with pin the closing bar goes to the right edge of the
 * page, where the staff under it ends. Returns the marks of both spans and how wide it is.
 */
function layoutLine({ open, items, close }, widthOf, extra = 0, pin = false) {
    const adv = (g) => widthOf(String.fromCharCode(g));
    const occ = (g) => adv(g) - 1;
    const staff = [];
    const ink = [];
    // Extra room is shared out by length, a whole note or rest taking 8 parts to an eighth's 1
    const weight = (it) => 8 / it.len;
    const total = items.filter((it) => it.type === 'event').reduce((sum, it) => sum + weight(it), 0);
    let done = 0;
    let clef = 'G2';
    ink.push({ x: 0, g: open });
    let x = occ(open) + AFTER_BAR;
    for (const it of items) {
        if (it.type === 'bar') {
            ink.push({ x, g: BARS[it.bar] });
            x += occ(BARS[it.bar]) + AFTER_BAR;
        } else if (it.type === 'clef') {
            clef = it.clef;
            ink.push({ x, g: CLEFS[clef] });
            x += occ(CLEFS[clef]) + AFTER_HEADER;
        } else if (it.type === 'key') {
            const places = (it.key > 0 ? KEY_SHARPS : KEY_FLATS)[clef].slice(0, Math.abs(it.key));
            for (const p of places) {
                const g = accidental(it.key > 0 ? '#' : 'b', p);
                ink.push({ x, g });
                x += occ(g);
            }
            if (places.length) x += AFTER_HEADER;
        } else if (it.type === 'time') {
            it.glyphs.forEach((g) => ink.push({ x, g }));
            x += Math.max(...it.glyphs.map(occ)) + AFTER_BAR;
        } else {
            const share = Math.floor((extra * (done + weight(it))) / total) - Math.floor((extra * done) / total);
            done += weight(it);
            // The event sits in the middle of its room: half goes before it, less what the bar or note before leaves
            const gap = Math.max(1, AFTER_EVENT[it.len] + share);
            const before = Math.max(0, Math.floor((gap - AFTER_BAR) / 2));
            const room = gap - before;
            x += before;
            if (it.glyphs) {
                for (const g of it.glyphs) {
                    (isStaff(g) ? staff : ink).push({ x, g });
                    x += occ(g);
                }
                x += room;
                continue;
            }
            // A chord stems the way its note furthest from the middle line does, unless a note says otherwise
            const far = it.notes.reduce((a, n) => (Math.abs(n.p - MIDDLE) > Math.abs(a.p - MIDDLE) || (Math.abs(n.p - MIDDLE) === Math.abs(a.p - MIDDLE) && n.p > a.p) ? n : a));
            const down = far.p >= MIDDLE;
            // Accidentals in columns left of the heads, as engraved: the highest goes nearest, then the lowest, the next
            // highest and the next lowest, inwards, each in the nearest column where none is closer than a seventh to it
            const marked = it.notes.filter((n) => n.acc).sort((a, b) => b.p - a.p);
            const columns = [];
            for (let lo = 0, hi = marked.length - 1, top = true; lo <= hi; top = !top) {
                const n = top ? marked[lo++] : marked[hi--];
                const column = columns.find((c) => c.every((m) => Math.abs(m.p - n.p) >= ACCIDENTAL_SHARE));
                if (column) column.push(n);
                else columns.push([n]);
            }
            const widths = columns.map((c) => Math.max(...c.map((n) => occ(accidental(n.acc, n.p)))));
            let left = x + widths.reduce((sum, w) => sum + w, 0);
            const head = left + (columns.length ? 1 : 0);
            columns.forEach((c, k) => {
                left -= widths[k];
                c.forEach((n) => ink.push({ x: left, g: accidental(n.acc, n.p) }));
            });
            const heads = it.notes.map((n) => noteGlyph(n, stemDown(n, down)));
            heads.forEach((g) => ink.push({ x: head, g }));
            const top = Math.max(...it.notes.map((n) => n.p));
            const bottom = Math.min(...it.notes.map((n) => n.p));
            const ledger = head - Math.round(((LEDGER_COLUMNS - HEAD_COLUMNS) / 2) * SCALE);
            if (top >= 14) staff.push({ x: ledger, g: LEDGERS[top] });
            if (bottom <= 2) staff.push({ x: ledger, g: LEDGERS[bottom] });
            x = head + Math.max(...heads.map(occ)) + room;
        }
    }
    // Pinned, the closing bar goes to the right edge of the page, or as near as the staff can end inside it, taking up to
    // 4 pixels of the room before it
    if (pin) {
        let at = Math.max(x, PAGE_WIDTH - adv(close));
        while (at > x - 4 && !staffThrough(at, close)) at--;
        x = at;
    }
    ink.push({ x, g: close });
    // The staff first, the ledger lines over it
    const marks = [...(staffThrough(x, close) || []), ...staff];
    const width = Math.max(...[...marks, ...ink].map(({ x: at, g }) => at + adv(g)));
    return { staff: marks, ink, width };
}

// Padding glyphs of foxcraft_dungeon_loot:padding for a width either way, \uf801 is 1px up to \uf840 64px and \uf881 to
// \uf8c0 the same backwards
function pad(n) {
    const back = n < 0 ? 0x80 : 0;
    let left = Math.abs(n);
    let out = '';
    for (const w of [64, 32, 16, 8, 4, 2, 1]) {
        while (left >= w) {
            out += String.fromCharCode(0xf800 + back + w);
            left -= w;
        }
    }
    return out;
}

// Glyphs each set at its x with padding from where the one before left off, and with back, padding back to the start
// after the last, so the next span is drawn over them
function setAt(marks, widthOf, back) {
    let at = 0;
    let text = '';
    for (const { x, g } of marks) {
        text += pad(x - at) + String.fromCharCode(g);
        at = x + widthOf(String.fromCharCode(g));
    }
    return back ? text + pad(-at) : text;
}

// The room to add after the events of a line so it reaches across the page, or to take out so it fits, null when even
// 1 pixel after each is too wide
function fill(line, widthOf) {
    const natural = layoutLine(line, widthOf).width;
    if (natural <= PAGE_WIDTH) return PAGE_WIDTH - natural;
    let extra = 0;
    for (let width = natural; width > PAGE_WIDTH; width = layoutLine(line, widthOf, extra).width) {
        if (extra < -PAGE_WIDTH * 4) return null;
        extra -= width - PAGE_WIDTH;
    }
    return extra;
}

/**
 * The staff lines of a music fence as markup lines. A fence is one staff line across the page, the room after its notes
 * shared out to reach it, or taken in as far as 1 pixel when it is wider. Only music that does not fit then is broken over more lines, at a
 * bar, or between notes when a bar is wider than the page; every line opens and closes with a bar and gets the clef and
 * key back, each across the page too. widthOf(ch) is the advance of a glyph of the font.
 */
function musicLines(code, widthOf) {
    const all = parse(code);
    // The colors hold for the whole block, wherever they are written in it
    const colors = Object.fromEntries(all.filter((it) => it.type === 'color').map((it) => [it.layer, it.color]));
    const items = all.filter((it) => it.type !== 'color');
    const font = (color, text) => `<font face="${FONT}" color="${color}" literal="1">${text}</font>`;
    const render = (l, extra) => {
        const laid = layoutLine(l, widthOf, extra, true);
        if (!laid.staff.some((m) => m.g === SEGMENTS[LONG] || m.g === SEGMENTS[SHORT])) throw new Error('music: no staff fits the line');
        return font(colors.staff || STAFF_COLOR, setAt(laid.staff, widthOf, true)) + (laid.ink.length ? font(colors.symbol || NOTE_COLOR, setAt(laid.ink, widthOf)) : '');
    };
    const body = items.slice(items[0] && items[0].type === 'bar' ? 1 : 0);
    const tail = body.length && body[body.length - 1].type === 'bar' ? body.pop().bar : null;
    const whole = { open: items[0] && items[0].type === 'bar' ? opening(items[0].bar) : BAR, items: body, close: tail ? BARS[tail] : BAR };
    const extra = fill(whole, widthOf);
    if (extra !== null) return [render(whole, extra)];

    const fits = (line) => layoutLine(line, widthOf).width <= PAGE_WIDTH;
    const lines = [];
    let i = 0;
    let open = BAR;
    if (items[0] && items[0].type === 'bar') {
        open = opening(items[0].bar);
        i = 1;
    }
    let clef = null;
    let key = 0;
    let line = { open, items: [], close: BAR };
    // A new line after one that closes at the given bar token, with the clef and key unless the items after set their own.
    // A double bar or start repeat opens it again, any other bar a plain one
    const next = (token, rest) => {
        lines.push(line);
        const header = [];
        const before = rest.slice(0, rest.findIndex((it) => it.type === 'event') >>> 0);
        if (clef && !before.some((it) => it.type === 'clef')) header.push({ type: 'clef', clef });
        if (key && !before.some((it) => it.type === 'key')) header.push({ type: 'key', key });
        line = { open: { '||:': START_REPEAT, '||': DOUBLE_BAR }[token] || BAR, items: header, close: BAR };
    };
    const track = (it) => {
        if (it.type === 'clef') clef = it.clef;
        if (it.type === 'key') key = it.key;
    };
    while (i < items.length) {
        // The items up to and with the next bar
        let end = i;
        while (end < items.length && items[end].type !== 'bar') end++;
        const chunk = items.slice(i, end);
        const closing = items[end];
        const tryLine = { ...line, items: [...line.items, ...chunk], close: closing ? (closing.bar === '||:' ? BAR : BARS[closing.bar]) : BAR };
        if (!fits(tryLine) && line.items.some((it) => it.type === 'event')) {
            const token = line.items.length && line.items[line.items.length - 1].type === 'bar' ? line.items.pop().bar : '|';
            line.close = token === '||:' ? BAR : BARS[token];
            next(token, chunk);
            continue;
        }
        if (fits(tryLine)) {
            line.items.push(...chunk);
        } else {
            // A bar wider than the page, broken between its events
            for (const it of chunk) {
                const longer = { ...line, items: [...line.items, it] };
                if (!fits(longer)) {
                    if (!line.items.some((x) => x.type === 'event')) throw new Error('music: a note does not fit on a line with its clef and key');
                    next('|', [it]);
                }
                line.items.push(it);
                track(it);
            }
        }
        chunk.forEach(track);
        if (closing) line.items.push(closing);
        i = end + 1;
    }
    // The last bar closes the last line, a plain one when the music ends without
    const last = line.items[line.items.length - 1];
    if (last && last.type === 'bar') line.close = BARS[line.items.pop().bar];
    lines.push(line);

    // A staff reaches two lines above its own, the empty lines it needs between one staff line and the next
    return lines.flatMap((l, n) => [...(n ? ['', ''] : []), render(l, fill(l, widthOf) ?? 0)]);
}

module.exports = { musicLines, parse, layoutLine, staffUnder, HEAD_COLUMNS, FONT };
