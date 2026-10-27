#!/usr/bin/env node
// Glyph advance widths per font, for laying out book pages.
//
// Vanilla fonts are read from the client jar once and cached in scripts/fonts/font_widths.json, so builds need no jar:
//   node scripts/fonts/fonts.js [path/to/client.jar]
// The jar is the one npm run data downloads to tests/.cache/mc, else the launcher's. The same run caches the pixel width of
// every glyph of the vanilla font images in scripts/fonts/font_textures.json, so a pack font can use those images at its own size.
// Fonts of the resource pack, texturepack/assets/<namespace>/font/<name>.json, are read on every run from their own
// bitmap and space providers. TrueType and unihex providers cannot be measured here, their glyphs get a guessed width.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..', '..');
const CACHE = path.join(__dirname, 'font_widths.json');
const TEXTURE_CACHE = path.join(__dirname, 'font_textures.json');
const PACK_ASSETS = path.join(ROOT, 'texturepack', 'assets');
const DEFAULT_FONT = 'minecraft:default';
const DEFAULT_SPACE = 4;
const UNKNOWN_WIDTH = 9;
const MC_VERSION = (() => {
    try {
        return JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).mc.mc_version;
    } catch (e) {
        return '26.3';
    }
})();
const CACHED_JAR = path.join(ROOT, 'tests', '.cache', 'mc', MC_VERSION, `${MC_VERSION}.jar`);
const LAUNCHER_JAR = path.join(process.env.APPDATA || '', '.minecraft', 'versions', MC_VERSION, `${MC_VERSION}.jar`);
const DEFAULT_JAR = fs.existsSync(CACHED_JAR) || !fs.existsSync(LAUNCHER_JAR) ? CACHED_JAR : LAUNCHER_JAR;

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
 * How many pixels of its cell each glyph of a bitmap provider takes, up to its rightmost inked column, as
 * { cellH, pixels: { char: px } }. The texture is a PNG buffer, or such a result already, from the cache of the vanilla images.
 */
function glyphPixels(provider, texture) {
    if (!Buffer.isBuffer(texture)) return texture;
    const png = decodePng(texture);
    const rows = provider.chars.map((r) => [...r]);
    const cols = Math.max(...rows.map((r) => r.length));
    const cellW = png.width / cols;
    const cellH = png.height / rows.length;
    const pixels = {};
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
            if (right >= 0) pixels[ch] ??= right + 1;
        });
    });
    return { cellH, pixels };
}

/**
 * The advance widths of one font as { char: width }, the first provider that has a glyph wins. readFont gives the JSON of a
 * font id, readTexture the PNG buffer of a texture id such as minecraft:font/ascii.png.
 */
function measureFont(fontId, readFont, readTexture, seen = new Set(), readHex = null) {
    const widths = {};
    if (seen.has(fontId)) return widths;
    seen.add(fontId);
    const font = readFont(fontId);
    if (!font) throw new Error(`font ${fontId} not found`);
    for (const provider of font.providers || []) {
        // A provider with a filter option on is for a setting that is off by default
        if (Object.values(provider.filter || {}).some(Boolean)) continue;
        if (provider.type === 'reference') {
            const inner = measureFont(withNamespace(provider.id), readFont, readTexture, seen, readHex);
            for (const [ch, w] of Object.entries(inner)) widths[ch] ??= w;
        } else if (provider.type === 'space') {
            for (const [ch, w] of Object.entries(provider.advances || {})) widths[ch] ??= w;
        } else if (provider.type === 'bitmap') {
            const { cellH, pixels } = glyphPixels(provider, readTexture(withNamespace(provider.file)));
            const scale = (provider.height ?? 8) / cellH;
            for (const [ch, px] of Object.entries(pixels)) widths[ch] ??= Math.trunc(0.5 + px * scale) + 1;
        } else if (provider.type === 'unihex' && readHex) {
            for (const [ch, w] of Object.entries(unihexWidths(provider, readHex))) widths[ch] ??= w;
        }
    }
    return widths;
}

/**
 * The advances of a unihex provider, { char: width }. readHex gives the text of the hex file of an id. A glyph is as wide as its
 * inked columns, or the left and right of the size override of its range, and advances half of that plus one, as
 * UnihexProvider.Glyph does. A glyph with no ink is the whole width of its line.
 */
function unihexWidths(provider, readHex) {
    const overrides = (provider.size_overrides || []).map((o) => ({ from: o.from.codePointAt(0), to: o.to.codePointAt(0), left: o.left, right: o.right }));
    const widths = {};
    for (const line of readHex(withNamespace(provider.hex_file)).split(/\r?\n/)) {
        const colon = line.indexOf(':');
        if (colon < 1) continue;
        const cp = parseInt(line.slice(0, colon), 16);
        const data = line.slice(colon + 1).trim();
        const digits = data.length / 16; // hex digits in each of the 16 rows
        const bits = digits * 4;
        let mask = 0n;
        for (let y = 0; y < 16; y++) mask |= BigInt('0x' + data.slice(y * digits, (y + 1) * digits));
        let left = bits;
        let right = -1;
        for (let x = 0; x < bits; x++) {
            if ((mask >> BigInt(bits - 1 - x)) & 1n) {
                left = Math.min(left, x);
                right = x;
            }
        }
        if (right < 0) [left, right] = [0, bits];
        const override = overrides.find((o) => cp >= o.from && cp <= o.to);
        if (override) [left, right] = [override.left, override.right];
        widths[String.fromCodePoint(cp)] ??= Math.floor((right - left + 1) / 2) + 1;
    }
    return widths;
}

// The glyphs of Unifont are written as ranges, "4e00-9fff,a000", under their width: the file would be huge with every character
const UNIFONT = 'minecraft:include/unifont';
const packRanges = (widths) => {
    const grouped = {};
    for (const [ch, w] of Object.entries(widths)) (grouped[w] ??= []).push(ch.codePointAt(0));
    const out = {};
    for (const [w, cps] of Object.entries(grouped)) {
        cps.sort((a, b) => a - b);
        const ranges = [];
        for (let i = 0; i < cps.length; ) {
            let j = i;
            while (j + 1 < cps.length && cps[j + 1] === cps[j] + 1) j++;
            ranges.push(i === j ? cps[i].toString(16) : `${cps[i].toString(16)}-${cps[j].toString(16)}`);
            i = j + 1;
        }
        out[w] = ranges.join(',');
    }
    return out;
};
const unpackRanges = (grouped) => {
    const widths = {};
    for (const [w, text] of Object.entries(grouped)) {
        for (const range of text.split(',')) {
            const [from, to = from] = range.split('-').map((h) => parseInt(h, 16));
            for (let cp = from; cp <= to; cp++) widths[String.fromCodePoint(cp)] = Number(w);
        }
    }
    return widths;
};

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
function buildCache(jarFile, unifontDir = path.join(path.dirname(jarFile), 'unifont')) {
    const zip = openZip(jarFile);
    // The jar's own include/unifont.json is empty, the game takes Unifont from its asset index, see tests/tools/fetch_mc_jar.mjs
    const unifontFile = (id) => path.join(unifontDir, id.split('/').pop());
    const readHex = (id) => {
        const inner = openZip(unifontFile(id));
        return Object.keys(inner).filter((n) => n.endsWith('.hex')).map((n) => inner[n]().toString('utf8')).join('\n');
    };
    const readFont = (id) => {
        const [ns, p] = id.split(':');
        if (ns === 'minecraft' && /^include\/unifont/.test(p) && fs.existsSync(unifontFile(p + '.json'))) return JSON.parse(fs.readFileSync(unifontFile(p + '.json'), 'utf8'));
        const entry = zip[`assets/${ns}/font/${p}.json`];
        return entry ? JSON.parse(entry().toString('utf8')) : null;
    };
    const readTexture = (id) => {
        const [ns, p] = id.split(':');
        return zip[`assets/${ns}/textures/${p}`]();
    };
    const fonts = {};
    const textures = {};
    const withUnifont = [];
    const hasUnifont = fs.existsSync(unifontFile('unifont.json'));
    if (hasUnifont) fonts[UNIFONT] = packRanges(measureFont(UNIFONT, readFont, readTexture, new Set(), readHex));
    const reaches = (id, visited = new Set()) => !visited.has(id) && (visited.add(id), id === UNIFONT || (readFont(id)?.providers || []).some((p) => p.type === 'reference' && reaches(withNamespace(p.id), visited)));
    for (const name of Object.keys(zip).sort()) {
        const m = /^assets\/minecraft\/font\/(.+)\.json$/.exec(name);
        if (!m || m[1] === 'include/unifont') continue;
        // The widths of Unifont are kept once, a font that reaches it by a reference only lists its id
        fonts['minecraft:' + m[1]] = pack(measureFont('minecraft:' + m[1], readFont, readTexture, new Set([UNIFONT]), readHex));
        if (hasUnifont && reaches('minecraft:' + m[1])) withUnifont.push('minecraft:' + m[1]);
        for (const provider of readFont('minecraft:' + m[1]).providers || []) {
            if (provider.type !== 'bitmap') continue;
            const id = withNamespace(provider.file);
            const { cellH, pixels } = glyphPixels(provider, readTexture(id));
            textures[id] ??= { cellH, pixels: pack(pixels) };
        }
    }
    if (withUnifont.length) fonts.__with_unifont = withUnifont;
    fs.writeFileSync(CACHE, JSON.stringify(fonts, null, 1) + '\n');
    fs.writeFileSync(TEXTURE_CACHE, JSON.stringify(textures, null, 1) + '\n');
    return Object.keys(fonts);
}

/**
 * How far each glyph of a font reaches above the baseline, in game pixels, as { char: ascent }: the ascent of the
 * bitmap provider that draws it, references followed, and the first provider that has a glyph wins as in the game. A
 * glyph of a space provider reaches nowhere. A font can so mix tall glyphs with ones that sit inside a line.
 */
function glyphAscents(fontId, readFont, seen = new Set()) {
    const ascents = {};
    if (seen.has(fontId)) return ascents;
    seen.add(fontId);
    const font = readFont(fontId);
    for (const provider of (font && font.providers) || []) {
        if (provider.type === 'reference') {
            for (const [ch, a] of Object.entries(glyphAscents(withNamespace(provider.id), readFont, seen))) ascents[ch] ??= a;
        } else if (provider.type === 'space') {
            for (const ch of Object.keys(provider.advances || {})) ascents[ch] ??= 0;
        } else if (provider.type === 'bitmap') {
            for (const row of provider.chars || []) for (const ch of row) if (ch !== '\u0000') ascents[ch] ??= provider.ascent || 0;
        }
    }
    return ascents;
}

// The fonts of the resource pack, { id: widths }. A reference to a vanilla font takes it from the cache.
function packFonts(cached, assetsDir, ascents = {}) {
    // cached is { id: { char: width } }
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
    const readFont = (id) => (found[id] ? JSON.parse(fs.readFileSync(found[id], 'utf8')) : cached[id] ? { providers: [{ type: 'space', advances: cached[id] }] } : null);
    // A texture of the pack, else a vanilla font image from its cache, as minecraft:font/ascii.png at another height
    const textures = fs.existsSync(TEXTURE_CACHE) ? JSON.parse(fs.readFileSync(TEXTURE_CACHE, 'utf8')) : {};
    const readTexture = (id) => {
        const [ns, p] = id.split(':');
        const file = path.join(assetsDir, ns, 'textures', p);
        if (fs.existsSync(file)) return fs.readFileSync(file);
        if (textures[id]) return { cellH: textures[id].cellH, pixels: unpack(textures[id].pixels) };
        throw new Error(`texture ${id} is not in texturepack/assets or the cache of the vanilla font images, run node scripts/fonts/fonts.js`);
    };
    const out = {};
    for (const id of Object.keys(found)) {
        out[id] = measureFont(id, readFont, readTexture);
        ascents[id] = glyphAscents(id, readFont);
    }
    return out;
}

//endregion

/** Loads the vanilla cache and the pack's fonts. widthOf(font, char, bold) is the advance of one glyph in pixels, ascentOf(font, char) how far a glyph reaches above the baseline, or the tallest glyph of the font without a char. */
function loadFonts(options = {}) {
    const cache = fs.existsSync(options.cache || CACHE) ? JSON.parse(fs.readFileSync(options.cache || CACHE, 'utf8')) : {};
    const fonts = {};
    for (const [id, grouped] of Object.entries(cache)) if (!id.startsWith('__') && id !== UNIFONT) fonts[id] = unpack(grouped);
    // The fonts that reach Unifont have its widths under their own, which win
    if (cache[UNIFONT]) {
        const unifont = unpackRanges(cache[UNIFONT]);
        for (const id of cache.__with_unifont || []) fonts[id] = { ...unifont, ...fonts[id] };
    }
    const ascents = {};
    Object.assign(fonts, packFonts({ ...fonts }, options.assets || PACK_ASSETS, ascents));
    const missing = new Set();
    const widthOf = (font, ch, bold) => {
        const id = withNamespace(font || DEFAULT_FONT);
        const table = fonts[id];
        if (!table) missing.add(id);
        const width = ch === ' ' ? (table || fonts[DEFAULT_FONT] || {})[' '] ?? DEFAULT_SPACE : (table || {})[ch] ?? UNKNOWN_WIDTH;
        // Bold adds a pixel to every glyph, a space too: in 26.3 GlyphInfo.getAdvance(bold) adds getBoldOffset() and the space provider keeps it
        return width + (bold ? 1 : 0);
    };
    // The ascent of a glyph of a font of the pack, 0 for the fonts of the game: they sit inside a line
    const ascentOf = (font, ch) => {
        const table = ascents[withNamespace(font || DEFAULT_FONT)];
        if (!table) return 0;
        return ch === undefined ? Math.max(0, ...Object.values(table)) : table[ch] ?? 0;
    };
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
