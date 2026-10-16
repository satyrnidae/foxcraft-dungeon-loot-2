#!/usr/bin/env node
'use strict';
/**
 * Renders a pixel TrueType font to a Minecraft bitmap font: a glyph sheet PNG plus the font/ JSON that points at it.
 *
 *   node scripts/font_to_bitmap.js "Pixelated Elegance.ttf" pixellated_elegance --size 9
 *
 * Writes texturepack/assets/<namespace>/textures/font/<name>.png and texturepack/assets/<namespace>/font/<name>.json.
 * Needs opentype.js, a dev dependency. Glyphs are filled without anti-aliasing and without hinting, so the size should be
 * a whole multiple of the pixel grid of the font: --preview shows the sheet as text.
 * Glyph widths are the ink of each glyph plus one pixel, as vanilla does it, so scripts/fonts.js measures it the same way.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const opentype = require('opentype.js');

const ROOT = path.resolve(__dirname, '..');
const COLUMNS = 16;
const HELP = `usage: node scripts/font_to_bitmap.js <font.ttf> <name> [options]
  --size N        pixel size of the font em, default the pixel grid of the font, found from the width of a period
  --grid N        font pixels across the em, when the width of a period does not show it; 8 for a font drawn on 4 units of 32
  --namespace S   default foxcraft_dungeon_loot
  --chars LIST    code points, ranges separated by commas, default 32-126,160-255,0x2018-0x201d,0x2026
  --height N      cell height in pixels, default ascent plus descent of the font
  --ascent N      pixels above the baseline, default from the font
  --scale F       size of a glyph in game relative to the sheet, the game scales the sheet when it draws: 2 shows a size 9
                  sheet at twice the size, 0.5 shows a size 18 sheet at half size; the game takes whole pixels, so one of
                  the cell height and the shown height has to be a whole multiple of the other
  --pad N         blank columns left of every glyph, default only what a glyph that starts left of its origin needs
  --bearing MODE  trim: move every glyph to the left edge of its cell, keep: leave the left side bearing of the font as is;
                  default trim for a monospaced font, whose bearings only center glyphs in a fixed cell, keep otherwise
  --space N       advance of a space, default from the font, or the glyph advance with --monospace
  --monospace     every glyph, the space included, advances the same: a glyph that ends short of the cell gets an invisible
                  pixel in its last column, alpha 1, which the game counts for the width and the text shader discards
  --out DIR       assets folder
  --preview       write nothing, print the sheet as text to check the size`;

function parseArgs(argv) {
    const args = { size: undefined, namespace: 'foxcraft_dungeon_loot', chars: '32-126,160-255,0x2018-0x201d,0x2026', scale: 1, out: path.join(ROOT, 'texturepack', 'assets'), positional: [] };
    const numeric = { grid: 'int', size: 'int', height: 'int', ascent: 'int', pad: 'int', space: 'int', scale: 'float' };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '-h' || a === '--help') {
            console.log(HELP);
            process.exit(0);
        } else if (a === '--preview') {
            args.preview = true;
        } else if (a === '--monospace') {
            args.monospace = true;
        } else if (a.startsWith('--')) {
            const key = a.slice(2);
            if (!['size', 'grid', 'namespace', 'chars', 'height', 'ascent', 'scale', 'pad', 'bearing', 'space', 'out'].includes(key)) throw new Error(`unknown option ${a}\n${HELP}`);
            const value = argv[++i];
            if (value === undefined) throw new Error(`${a} needs a value`);
            args[key] = numeric[key] ? Number(value) : value;
            if (numeric[key] && !Number.isFinite(args[key])) throw new Error(`${a} is not a number: ${value}`);
        } else {
            args.positional.push(a);
        }
    }
    if (args.positional.length !== 2) throw new Error(HELP);
    return args;
}

// "32-126,160-255,0x2018" -> sorted code points
function parseRanges(spec) {
    const points = new Set();
    for (const part of spec.split(',')) {
        if (!part.trim()) continue;
        const [lo, hi] = part.split('-').map((v) => Number(v.trim()));
        for (let cp = lo; cp <= (hi === undefined ? lo : hi); cp++) points.add(cp);
    }
    return [...points].sort((a, b) => a - b);
}

/**
 * Fills a glyph at the given size, origin on the baseline, no anti-aliasing: a pixel is on when its center is inside the
 * outline by the nonzero rule. Returns { x0, y0, x1, y1, rows } with the box relative to the origin, y down, or null when
 * nothing is inked. rows are strings of 0 and 1.
 */
function fill(font, ch, size) {
    const glyph = font.charToGlyph(ch);
    const commands = glyph.getPath(0, 0, size).commands;
    const edges = [];
    let cx = 0;
    let cy = 0;
    let sx = 0;
    let sy = 0;
    const line = (x, y) => {
        if (y !== cy) edges.push([cx, cy, x, y]);
        cx = x;
        cy = y;
    };
    for (const c of commands) {
        if (c.type === 'M') {
            // Contours are closed implicitly by the fill
            if (cx !== sx || cy !== sy) line(sx, sy);
            cx = sx = c.x;
            cy = sy = c.y;
        } else if (c.type === 'L') {
            line(c.x, c.y);
        } else if (c.type === 'Q') {
            const [x0, y0] = [cx, cy];
            for (let t = 1; t <= 8; t++) {
                const u = t / 8;
                line((1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * c.x1 + u * u * c.x, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * c.y1 + u * u * c.y);
            }
        } else if (c.type === 'C') {
            const [x0, y0] = [cx, cy];
            for (let t = 1; t <= 8; t++) {
                const u = t / 8;
                const a = (1 - u) ** 3;
                const b = 3 * (1 - u) ** 2 * u;
                const d = 3 * (1 - u) * u * u;
                line(a * x0 + b * c.x1 + d * c.x2 + u ** 3 * c.x, a * y0 + b * c.y1 + d * c.y2 + u ** 3 * c.y);
            }
        } else if (c.type === 'Z') {
            line(sx, sy);
        }
    }
    if (cx !== sx || cy !== sy) line(sx, sy);
    if (!edges.length) return null;

    const minX = Math.floor(Math.min(...edges.flatMap((e) => [e[0], e[2]])));
    const maxX = Math.ceil(Math.max(...edges.flatMap((e) => [e[0], e[2]])));
    const minY = Math.floor(Math.min(...edges.flatMap((e) => [e[1], e[3]])));
    const maxY = Math.ceil(Math.max(...edges.flatMap((e) => [e[1], e[3]])));
    const grid = [];
    for (let y = minY; y < maxY; y++) {
        const yc = y + 0.5;
        const hits = [];
        for (const [xa, ya, xb, yb] of edges) {
            if ((ya <= yc && yb > yc) || (yb <= yc && ya > yc)) hits.push([xa + ((yc - ya) / (yb - ya)) * (xb - xa), yb > ya ? 1 : -1]);
        }
        hits.sort((a, b) => a[0] - b[0]);
        const row = new Array(maxX - minX).fill(0);
        let wind = 0;
        for (let n = 0; n < hits.length - 1; n++) {
            wind += hits[n][1];
            if (wind === 0) continue;
            for (let x = Math.ceil(hits[n][0] - 0.5); x < hits[n + 1][0] - 0.5; x++) if (x >= minX && x < maxX) row[x - minX] = 1;
        }
        grid.push(row);
    }
    // Shrink to the ink
    const inkRows = grid.map((r, n) => (r.includes(1) ? n : -1)).filter((n) => n >= 0);
    if (!inkRows.length) return null;
    const inkCols = [...Array(maxX - minX).keys()].filter((x) => grid.some((r) => r[x]));
    const [r0, r1, c0, c1] = [inkRows[0], inkRows[inkRows.length - 1] + 1, inkCols[0], inkCols[inkCols.length - 1] + 1];
    return { x0: minX + c0, y0: minY + r0, x1: minX + c1, y1: minY + r1, rows: grid.slice(r0, r1).map((r) => r.slice(c0, c1).join('')) };
}

// FreeType rounds the scaled metrics to 26.6 and then up to whole pixels
const ceilMetric = (units, size, upm) => Math.ceil(Math.round(((units * size) / upm) * 64) / 64);

function crc32(buf) {
    return zlib.crc32(buf);
}

// An 8 bit RGBA PNG from rows of [r, g, b, a]
function png(width, height, pixels) {
    const chunk = (type, data) => {
        const head = Buffer.alloc(8);
        head.writeUInt32BE(data.length, 0);
        head.write(type, 4, 'ascii');
        const crc = Buffer.alloc(4);
        crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])) >>> 0, 0);
        return Buffer.concat([head, data, crc]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8;
    ihdr[9] = 6;
    const raw = Buffer.alloc((width * 4 + 1) * height);
    for (let y = 0; y < height; y++) {
        raw[y * (width * 4 + 1)] = 0;
        pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    }
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const u16 = (s) => [...s].map((c) => (c.codePointAt(0) > 126 || c.codePointAt(0) < 32 ? '\\u' + c.codePointAt(0).toString(16).padStart(4, '0') : c)).join('');

function main() {
    const args = parseArgs(process.argv.slice(2));
    const [ttf, name] = args.positional;
    const font = opentype.loadSync(ttf);
    const upm = font.unitsPerEm;
    // A pixel font is drawn on a grid, and the period is one pixel of it. A size that is a whole multiple of the grid
    // keeps every pixel the same size, anything else makes some strokes one pixel wider than others.
    const dot = font.charToGlyph('.').getBoundingBox();
    const grid = dot.x2 > dot.x1 ? upm / (dot.x2 - dot.x1) : null;
    const native = args.grid !== undefined ? args.grid : grid && Math.abs(grid - Math.round(grid)) < 0.05 ? Math.round(grid) : null;
    const size = args.size !== undefined ? args.size : native || 8;
    if (native && size % native) console.log(`note: the font is drawn on a ${native} pixel grid, size ${size} is not a multiple of it so strokes come out uneven; try ${native * Math.max(1, Math.round(size / native))}`);
    const ascent = args.ascent !== undefined ? args.ascent : ceilMetric(font.ascender, size, upm);
    const height = args.height !== undefined ? args.height : ascent + ceilMetric(-font.descender, size, upm);

    const points = [];
    const absent = [];
    const inks = new Map();
    for (const cp of parseRanges(args.chars)) {
        const ch = String.fromCodePoint(cp);
        if (ch === ' ') continue;
        if (font.charToGlyph(ch).index === 0) {
            absent.push(cp);
            continue;
        }
        const ink = fill(font, ch, size);
        if (!ink) continue;
        inks.set(cp, ink);
        points.push(cp);
    }
    if (!points.length) throw new Error('no glyphs rendered');

    // One cell size for the whole sheet: widest ink and the full height. The game only trims the right side of a glyph,
    // so a blank column on the left is spacing; none unless the font draws left of the origin
    if (args.bearing !== undefined && !['trim', 'keep'].includes(args.bearing)) throw new Error('--bearing is trim or keep');
    const advances = new Set(points.map((cp) => font.charToGlyph(String.fromCodePoint(cp)).advanceWidth));
    const trim = args.bearing !== undefined ? args.bearing === 'trim' : advances.size === 1;
    // Ink columns moved off the left edge of a glyph: its bearing when trimming
    const shift = (cp) => (trim ? inks.get(cp).x0 : 0);
    const pad = args.pad !== undefined ? args.pad : trim ? 0 : Math.max(0, -Math.min(...points.map((cp) => inks.get(cp).x0)));
    const cellW = Math.max(1, Math.max(...points.map((cp) => inks.get(cp).x1 - shift(cp))) + pad);
    const rowCount = Math.ceil(points.length / COLUMNS);
    const sheetW = cellW * COLUMNS;
    const sheetH = height * rowCount;
    const pixels = Buffer.alloc(sheetW * sheetH * 4);
    const clipped = [];
    const lines = [];
    points.forEach((cp, n) => {
        const ink = inks.get(cp);
        const [col, row] = [n % COLUMNS, Math.floor(n / COLUMNS)];
        if (-ascent > ink.y0 || ink.y1 > height - ascent) clipped.push(cp);
        ink.rows.forEach((bits, ry) => {
            for (let rx = 0; rx < bits.length; rx++) {
                if (bits[rx] !== '1') continue;
                const x = col * cellW + pad + ink.x0 - shift(cp) + rx;
                const y = row * height + ascent + ink.y0 + ry;
                if (x < col * cellW || x >= (col + 1) * cellW || y < row * height || y >= (row + 1) * height) continue;
                pixels.fill(255, (y * sheetW + x) * 4, (y * sheetW + x) * 4 + 4);
            }
        });
        // The game takes the advance from the rightmost column with any alpha, so one nearly clear pixel holds the width
        if (args.monospace) {
            const x = (col + 1) * cellW - 1;
            const y = row * height;
            if (![...Array(height).keys()].some((dy) => pixels[((y + dy) * sheetW + x) * 4 + 3])) {
                pixels.fill(255, (y * sheetW + x) * 4, (y * sheetW + x) * 4 + 3);
                pixels[(y * sheetW + x) * 4 + 3] = 1;
            }
        }
        lines[row] = (lines[row] || '') + String.fromCodePoint(cp);
    });
    const chars = lines.map((l) => [...l].join('').concat('\u0000'.repeat(COLUMNS - [...l].length)));

    // The provider scales glyphs by height over cell height; ascent and the space advance are game pixels
    const shownHeight = Math.max(1, Math.floor(height * args.scale + 0.5));
    const shownAscent = Math.floor(ascent * args.scale + 0.5);
    const spaceGlyph = font.charToGlyph(' ');
    const space = args.space !== undefined ? args.space : args.monospace ? Math.trunc(0.5 + cellW * args.scale) + 1 : Math.floor(((spaceGlyph.advanceWidth * size) / upm) * args.scale + 0.5);

    if (args.preview) {
        for (let r = 0; r < rowCount; r++) {
            for (let y = 0; y < height; y++) {
                let out = '';
                for (let x = 0; x < sheetW; x++) {
                    const alpha = pixels[((r * height + y) * sheetW + x) * 4 + 3];
                    out += alpha === 255 ? '#' : alpha ? ':' : '.';
                }
                console.log(out);
            }
            console.log();
        }
        console.log(`cell ${cellW}x${height}, ascent ${ascent}, ${points.length} glyphs, space ${space}`);
        return;
    }

    const providers = [
        { type: 'space', advances: { ' ': space, ' ': space } },
        { type: 'bitmap', file: `${args.namespace}:font/${name}.png`, ascent: shownAscent, height: shownHeight, chars },
    ];
    const pngFile = path.join(args.out, args.namespace, 'textures', 'font', name + '.png');
    const metaFile = path.join(args.out, args.namespace, 'font', name + '.json');
    for (const f of [pngFile, metaFile]) fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(pngFile, png(sheetW, sheetH, pixels));
    // JSON.stringify leaves non-ASCII as is, the files stay ASCII with \u escapes like vanilla's
    fs.writeFileSync(metaFile, JSON.stringify({ providers }, null, 2).replace(/[^\x20-\x7e\n]/g, (c) => u16(c)) + '\n');
    console.log(`${pngFile}\n${metaFile}\n${points.length} glyphs, cell ${cellW}x${height}, ascent ${shownAscent}, height ${shownHeight}, space ${space}`);
    // Scaling is clean when a pixel of the font covers whole pixels in game: one height is a whole multiple of the other, or
    // the sheet pixels per font pixel times the scale is a whole number, 4 x 0.75 = 3
    const fontPixel = (native ? size / native : 1) * (shownHeight / height);
    if (shownHeight !== height && height % shownHeight && shownHeight % height && Math.abs(fontPixel - Math.round(fontPixel)) > 0.01) {
        console.log(`note: the game scales glyphs by ${shownHeight}/${height} = ${(shownHeight / height).toFixed(3)}, not a whole fraction, so pixels come out uneven`);
    }
    if (absent.length) console.log(`font lacks ${absent.length} of the requested code points: ${absent.map((cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')).join(' ')}`);
    if (clipped.length) console.log(`warning: glyphs reach outside the cell, raise --height or --ascent: ${clipped.map((cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0')).join(' ')}`);
}

try {
    main();
} catch (e) {
    console.error(`font_to_bitmap: ${e.message}`);
    process.exit(1);
}
