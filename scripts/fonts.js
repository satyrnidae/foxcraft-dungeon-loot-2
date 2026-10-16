#!/usr/bin/env node
// Glyph advance widths per font, for laying out book pages.
//
// Vanilla fonts are read from the client jar once and cached in scripts/font_widths.json, so builds need no jar:
//   node scripts/fonts.js [path/to/client.jar]
// Fonts of the resource pack, texturepack/assets/<namespace>/font/<name>.json, are read on every run from their own
// bitmap and space providers. TrueType and unihex providers cannot be measured here, their glyphs get a guessed width.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const CACHE = path.join(__dirname, 'font_widths.json');
const PACK_ASSETS = path.join(ROOT, 'texturepack', 'assets');
const DEFAULT_FONT = 'minecraft:default';
const DEFAULT_SPACE = 4;
const UNKNOWN_WIDTH = 9;
const DEFAULT_JAR = path.join(process.env.APPDATA || '', '.minecraft', 'versions', '26.3', '26.3.jar');

//region PNG and zip

/** Decodes a PNG into { width, height, inked(x, y) }, inked being whether the pixel is not transparent. */
function decodePng(buf) {
    if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
    let pos = 8;
    let header = null;
    let palette = null;
    let trns = null;
    const data = [];
    while (pos < buf.length) {
        const length = buf.readUInt32BE(pos);
        const type = buf.toString('latin1', pos + 4, pos + 8);
        const body = buf.subarray(pos + 8, pos + 8 + length);
        if (type === 'IHDR') header = { width: body.readUInt32BE(0), height: body.readUInt32BE(4), depth: body[8], color: body[9], interlace: body[12] };
        else if (type === 'PLTE') palette = body;
        else if (type === 'tRNS') trns = body;
        else if (type === 'IDAT') data.push(body);
        pos += 12 + length;
    }
    if (!header || header.interlace) throw new Error('interlaced PNGs are not supported');
    const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.color];
    const bits = channels * header.depth;
    const bpp = Math.max(1, bits >> 3);
    const stride = Math.ceil((header.width * bits) / 8);
    const raw = zlib.inflateSync(Buffer.concat(data));
    const px = Buffer.alloc(stride * header.height);
    for (let y = 0; y < header.height; y++) {
        const filter = raw[y * (stride + 1)];
        for (let i = 0; i < stride; i++) {
            const x = raw[y * (stride + 1) + 1 + i];
            const a = i >= bpp ? px[y * stride + i - bpp] : 0;
            const b = y > 0 ? px[(y - 1) * stride + i] : 0;
            const c = i >= bpp && y > 0 ? px[(y - 1) * stride + i - bpp] : 0;
            let v;
            if (filter === 0) v = x;
            else if (filter === 1) v = x + a;
            else if (filter === 2) v = x + b;
            else if (filter === 3) v = x + ((a + b) >> 1);
            else {
                const p = a + b - c;
                const pa = Math.abs(p - a);
                const pb = Math.abs(p - b);
                const pc = Math.abs(p - c);
                v = x + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
            }
            px[y * stride + i] = v & 255;
        }
    }
    // Sample n of pixel x in row y, as stored. 16 bit samples are cut to their high byte.
    const sample = (x, y, n) => {
        const index = x * channels + n;
        if (header.depth === 8) return px[y * stride + index];
        if (header.depth === 16) return px[y * stride + index * 2];
        const bit = index * header.depth;
        return (px[y * stride + (bit >> 3)] >> (8 - header.depth - (bit & 7))) & ((1 << header.depth) - 1);
    };
    const inked = (x, y) => {
        if (header.color === 6) return sample(x, y, 3) > 0;
        if (header.color === 4) return sample(x, y, 1) > 0;
        if (header.color === 3) {
            const i = sample(x, y, 0);
            return trns && i < trns.length ? trns[i] > 0 : true;
        }
        for (let n = 0; n < channels; n++) if (sample(x, y, n) > 0) return true;
        return false;
    };
    return { width: header.width, height: header.height, inked };
}

/** Reads the entries of a zip as { name: () => Buffer }, enough for a client jar. */
function openZip(file) {
    const buf = fs.readFileSync(file);
    let end = buf.length - 22;
    while (end >= 0 && buf.readUInt32LE(end) !== 0x06054b50) end--;
    if (end < 0) throw new Error(`${file} is not a zip`);
    const count = buf.readUInt16LE(end + 10);
    let pos = buf.readUInt32LE(end + 16);
    const entries = {};
    for (let n = 0; n < count; n++) {
        const method = buf.readUInt16LE(pos + 10);
        const size = buf.readUInt32LE(pos + 20);
        const nameLength = buf.readUInt16LE(pos + 28);
        const extra = buf.readUInt16LE(pos + 30);
        const comment = buf.readUInt16LE(pos + 32);
        const local = buf.readUInt32LE(pos + 42);
        const name = buf.toString('utf8', pos + 46, pos + 46 + nameLength);
        entries[name] = () => {
            const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
            const body = buf.subarray(start, start + size);
            return method === 0 ? body : zlib.inflateRawSync(body);
        };
        pos += 46 + nameLength + extra + comment;
    }
    return entries;
}

//endregion

//region Providers

const withNamespace = (id) => (id.includes(':') ? id : 'minecraft:' + id);

/**
 * The advance widths of one font as { char: width }, the first provider that has a glyph wins. readFont gives the JSON of a
 * font id, readTexture the PNG buffer of a texture id such as minecraft:font/ascii.png.
 */
function measureFont(fontId, readFont, readTexture, seen = new Set()) {
    const widths = {};
    if (seen.has(fontId)) return widths;
    seen.add(fontId);
    const font = readFont(fontId);
    if (!font) throw new Error(`font ${fontId} not found`);
    for (const provider of font.providers || []) {
        if (provider.type === 'reference') {
            const inner = measureFont(withNamespace(provider.id), readFont, readTexture, seen);
            for (const [ch, w] of Object.entries(inner)) widths[ch] ??= w;
        } else if (provider.type === 'space') {
            for (const [ch, w] of Object.entries(provider.advances || {})) widths[ch] ??= w;
        } else if (provider.type === 'bitmap') {
            const png = decodePng(readTexture(withNamespace(provider.file)));
            const rows = provider.chars.map((r) => [...r]);
            const cols = Math.max(...rows.map((r) => r.length));
            const cellW = png.width / cols;
            const cellH = png.height / rows.length;
            const scale = (provider.height ?? 8) / cellH;
            rows.forEach((row, r) => {
                row.forEach((ch, c) => {
                    if (ch === '\u0000') return;
                    let right = -1;
                    for (let x = 0; x < cellW; x++) {
                        for (let y = 0; y < cellH; y++) {
                            if (png.inked(c * cellW + x, r * cellH + y)) {
                                right = x;
                                break;
                            }
                        }
                    }
                    if (right >= 0) widths[ch] ??= Math.trunc(0.5 + (right + 1) * scale) + 1;
                });
            });
        }
    }
    return widths;
}

// Widths grouped by value, "6": "ABC...", to keep the cache small and readable
const pack = (widths) => {
    const grouped = {};
    for (const [ch, w] of Object.entries(widths)) grouped[w] = (grouped[w] || '') + ch;
    return grouped;
};
const unpack = (grouped) => {
    const widths = {};
    for (const [w, chars] of Object.entries(grouped)) for (const ch of chars) widths[ch] = Number(w);
    return widths;
};

/** Measures every font in the client jar, includes too, and writes the cache. */
function buildCache(jarFile) {
    const zip = openZip(jarFile);
    const readFont = (id) => {
        const [ns, p] = id.split(':');
        const entry = zip[`assets/${ns}/font/${p}.json`];
        return entry ? JSON.parse(entry().toString('utf8')) : null;
    };
    const readTexture = (id) => {
        const [ns, p] = id.split(':');
        return zip[`assets/${ns}/textures/${p}`]();
    };
    const fonts = {};
    for (const name of Object.keys(zip).sort()) {
        const m = /^assets\/minecraft\/font\/(.+)\.json$/.exec(name);
        if (m) fonts['minecraft:' + m[1]] = pack(measureFont('minecraft:' + m[1], readFont, readTexture));
    }
    fs.writeFileSync(CACHE, JSON.stringify(fonts, null, 1) + '\n');
    return Object.keys(fonts);
}

/**
 * How far the glyphs of a font reach above the baseline, in game pixels: the largest ascent of its bitmap providers,
 * references followed. 0 for a font without one.
 */
function fontAscent(fontId, readFont, seen = new Set()) {
    if (seen.has(fontId)) return 0;
    seen.add(fontId);
    const font = readFont(fontId);
    let ascent = 0;
    for (const provider of (font && font.providers) || []) {
        if (provider.type === 'reference') ascent = Math.max(ascent, fontAscent(withNamespace(provider.id), readFont, seen));
        else if (provider.type === 'bitmap') ascent = Math.max(ascent, provider.ascent || 0);
    }
    return ascent;
}

// The fonts of the resource pack, { id: widths }. A reference to a vanilla font takes it from the cache.
function packFonts(cached, assetsDir, ascents = {}) {
    const found = {};
    if (!fs.existsSync(assetsDir)) return found;
    for (const ns of fs.readdirSync(assetsDir)) {
        const dir = path.join(assetsDir, ns, 'font');
        if (!fs.existsSync(dir)) continue;
        const walk = (d, prefix) => {
            for (const e of fs.readdirSync(d, { withFileTypes: true })) {
                if (e.isDirectory()) walk(path.join(d, e.name), prefix + e.name + '/');
                else if (e.name.endsWith('.json')) found[`${ns}:${prefix}${e.name.slice(0, -5)}`] = path.join(d, e.name);
            }
        };
        walk(dir, '');
    }
    const readFont = (id) => (found[id] ? JSON.parse(fs.readFileSync(found[id], 'utf8')) : cached[id] ? { providers: [{ type: 'space', advances: unpackedAsSpace(cached[id]) }] } : null);
    const readTexture = (id) => {
        const [ns, p] = id.split(':');
        return fs.readFileSync(path.join(assetsDir, ns, 'textures', p));
    };
    const out = {};
    for (const id of Object.keys(found)) {
        out[id] = measureFont(id, readFont, readTexture);
        ascents[id] = fontAscent(id, readFont);
    }
    return out;
}

// A cached vanilla font handed to measureFont as if it were a space provider
const unpackedAsSpace = (grouped) => unpack(grouped);

//endregion

/** Loads the vanilla cache and the pack's fonts. widthOf(font, char, bold) is the advance of one glyph in pixels, ascentOf(font) how far a font reaches above the baseline. */
function loadFonts(options = {}) {
    const cache = fs.existsSync(options.cache || CACHE) ? JSON.parse(fs.readFileSync(options.cache || CACHE, 'utf8')) : {};
    const fonts = {};
    for (const [id, grouped] of Object.entries(cache)) fonts[id] = unpack(grouped);
    const ascents = {};
    Object.assign(fonts, packFonts(cache, options.assets || PACK_ASSETS, ascents));
    const missing = new Set();
    const widthOf = (font, ch, bold) => {
        const id = withNamespace(font || DEFAULT_FONT);
        const table = fonts[id];
        if (!table) missing.add(id);
        const width = ch === ' ' ? (table || fonts[DEFAULT_FONT] || {})[' '] ?? DEFAULT_SPACE : (table || {})[ch] ?? UNKNOWN_WIDTH;
        return width + (bold && ch !== ' ' ? 1 : 0);
    };
    // The ascent of a font of the pack, 0 for the fonts of the game: they sit inside a line
    const ascentOf = (font) => ascents[withNamespace(font || DEFAULT_FONT)] || 0;
    return { widthOf, ascentOf, fonts, missing };
}

module.exports = { loadFonts, measureFont, buildCache, decodePng, withNamespace, DEFAULT_FONT };

if (require.main === module) {
    const jar = process.argv[2] || DEFAULT_JAR;
    if (!fs.existsSync(jar)) {
        console.error(`fonts: no client jar at ${jar}`);
        process.exit(1);
    }
    const ids = buildCache(jar);
    console.log(`wrote ${path.relative(ROOT, CACHE)}: ${ids.join(', ')}`);
}
