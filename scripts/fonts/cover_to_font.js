#!/usr/bin/env node
// Cuts texturepack/assets/foxcraft_dungeon_loot/textures/gui/cover.png into the rows of the foxcraft_dungeon_loot:cover font, which
// draws it over the book screen one line at a time, so the title and the author can be written on the cover:
//
//     node scripts/fonts/cover_to_font.js
//
// See the Cover section of scripts/fonts/README.md for how the pieces fit. The geometry below is that of the book screen and of
// book.png, which tests/java/BookRender.java has too.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const { decodePng } = require('./fonts.js');

const ASSETS = path.join(__dirname, '..', '..', 'texturepack', 'assets', 'foxcraft_dungeon_loot');
const COVER = path.join(ASSETS, 'textures', 'gui', 'cover.png');
const OUT_DIR = path.join(ASSETS, 'textures', 'font', 'cover');
const FONT = path.join(ASSETS, 'font', 'cover.json');

// Where the art of book.png starts on the 192 by 192 picture of the screen, and where the text of a page starts on it
const ART_X = 20;
const ART_Y = 1;
const TEXT_X = 36;
const TEXT_Y = 30;
const LINE_HEIGHT = 9;
const LINES = 14;
// The default font draws its baseline 7 pixels under the top of a line
const BASELINE = 7;

// The art left of the text, which the left strip of each line draws, 16 pixels wide, at negative places of the line
const LEFT = TEXT_X - ART_X;

// A line n of the page is cut from the rows of the cover from the top of the art or the top of the line, down to the bottom of the
// line, or to the bottom of the art for the first and last: the first reaches up over the margin, so it has a large height and an
// ascent that lifts it there; the last reaches down over it, a large height and the ascent of a line
const rowsOf = (n) => {
    const top = n === 0 ? ART_Y : TEXT_Y + n * LINE_HEIGHT;
    const bottom = n === LINES - 1 ? ART_Y + 180 : TEXT_Y + (n + 1) * LINE_HEIGHT;
    return { top: top - ART_Y, height: bottom - top, ascent: TEXT_Y + n * LINE_HEIGHT + BASELINE - top };
};

// The group of lines that share a sheet: the first, the middle ones, the last. first is the code point of the glyph of the first line
const GROUPS = [
    { name: 'top', lines: [0] },
    { name: 'mid', lines: Array.from({ length: LINES - 2 }, (_, i) => i + 1) },
    { name: 'bottom', lines: [LINES - 1] },
];
// The glyph of the right body of line n, and of the left strip: 0xe000 + n and 0xe010 + n
const RIGHT = (n) => String.fromCharCode(0xe000 + n);
const LEFT_GLYPH = (n) => String.fromCharCode(0xe010 + n);

function crc32(buf) {
    return zlib.crc32(buf);
}

// An 8 bit RGBA PNG
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
    for (let y = 0; y < height; y++) pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
    return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const u16 = (s) => [...s].map((c) => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0')).join('');

function build() {
    const cover = decodePng(fs.readFileSync(COVER));
    if (cover.width < 146 || cover.height < 180) throw new Error(`cover.png is ${cover.width} by ${cover.height}, it has to be 146 by 180, the art of the book screen`);
    const widths = { right: cover.width - LEFT, left: LEFT };
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const providers = [];
    for (const side of ['right', 'left']) {
        for (const group of GROUPS) {
            const first = rowsOf(group.lines[0]);
            const rows = group.lines.map(rowsOf);
            // Every row of a sheet is as tall as its first, the middle lines are all of one height
            const cellH = first.height;
            if (rows.some((r) => r.height !== cellH || r.ascent !== first.ascent)) throw new Error(`the lines of ${group.name} differ in height`);
            const width = widths[side];
            const pixels = Buffer.alloc(width * cellH * rows.length * 4);
            const from = side === 'right' ? LEFT : 0;
            rows.forEach((row, k) => {
                for (let y = 0; y < cellH; y++) {
                    for (let x = 0; x < width; x++) {
                        const px = cover.pixel(from + x, row.top + y);
                        Buffer.from(px).copy(pixels, ((k * cellH + y) * width + x) * 4);
                    }
                }
            });
            const file = `${side}_${group.name}.png`;
            fs.writeFileSync(path.join(OUT_DIR, file), png(width, cellH * rows.length, pixels));
            providers.push({
                type: 'bitmap',
                file: `foxcraft_dungeon_loot:font/cover/${file}`,
                ascent: first.ascent,
                height: cellH,
                chars: group.lines.map((n) => (side === 'right' ? RIGHT(n) : LEFT_GLYPH(n))),
            });
        }
    }
    const lines = ['{', '  "providers": ['];
    providers.forEach((p) => {
        lines.push('    {', `      "type": "bitmap",`, `      "file": "${p.file}",`, `      "ascent": ${p.ascent},`, `      "height": ${p.height},`, '      "chars": [');
        lines.push(p.chars.map((c) => `        "${u16(c)}"`).join(',\n'), '      ]', '    },');
    });
    lines.push('    {', '      "type": "reference",', '      "id": "minecraft:include/space"', '    }', '  ]', '}', '');
    fs.writeFileSync(FONT, lines.join('\n'));
    return providers.map((p) => p.file);
}

module.exports = { ART_X, ART_Y, TEXT_X, TEXT_Y, LINE_HEIGHT, LINES, LEFT, RIGHT, LEFT_GLYPH, rowsOf };

if (require.main === module) {
    for (const file of build()) console.log(`wrote ${file}`);
    console.log(`wrote ${path.relative(path.join(__dirname, '..', '..'), FONT)}`);
}
