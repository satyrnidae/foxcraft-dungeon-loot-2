// The book generator in scripts/book_loot_gen.js: markdown to translatable text components, frontmatter, and the committed output.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import * as pk from './packdata.mjs';

const require = createRequire(import.meta.url);
const gen = require('../../scripts/book_loot_gen.js');
const fontsApi = require('../../scripts/fonts.js');
const lore = require('../../scripts/lore.js');
const zlib = require('node:zlib');

// An RGBA PNG of the pixels, for fonts built on the fly
const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const encodePng = (width, height, rgba) => {
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, 'latin1');
    const tail = Buffer.alloc(4);
    tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, tail]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const rows = [];
  for (let y = 0; y < height; y++) rows.push(Buffer.from([0]), rgba.subarray(y * width * 4, (y + 1) * width * 4));
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(Buffer.concat(rows))), chunk('IEND', Buffer.alloc(0))]);
};

// One page of markdown to its component and lang entries
const page = (md) => {
  const lang = {};
  const component = gen.toComponent(gen.parseInline(md, 0, null).content, 'k', lang);
  return { component, lang };
};

describe('book generator markdown', () => {
  it('plain text is one translate component with a fallback', () => {
    assert.deepEqual(page('Hello there').component, { translate: 'k', fallback: 'Hello there' });
  });

  it('formats map to component styles', () => {
    const cases = { '**x**': 'bold', '*x*': 'italic', '_x_': 'italic', '__x__': 'underlined', '~~x~~': 'strikethrough', '||x||': 'obfuscated' };
    for (const [md, style] of Object.entries(cases)) assert.equal(page(md).component[style], true, md);
  });

  it('stacked formatting is one component', () => {
    const { component } = page('***both***');
    assert.deepEqual(component, { translate: 'k', fallback: 'both', bold: true, italic: true });
  });

  it('spans inside text become with arguments, each translatable', () => {
    const { component, lang } = page('a **b** c');
    assert.equal(component.fallback, 'a %1$s c');
    assert.deepEqual(component.with, [{ translate: 'k.1', fallback: 'b', bold: true }]);
    assert.deepEqual(lang, { k: 'a %1$s c', 'k.1': 'b' });
  });

  it('nests spans', () => {
    const { component } = page('**a *b* c**');
    assert.equal(component.bold, true);
    assert.equal(component.fallback, 'a %1$s c');
    assert.equal(component.with[0].italic, true);
  });

  it('a newline stays a line break and percent signs are escaped', () => {
    assert.equal(page('one\ntwo 50%').component.fallback, 'one\ntwo 50%%');
  });

  it('a doubled marker inside a single one opens its own span', () => {
    const { component } = page('*a **b** c*');
    assert.equal(component.italic, true);
    assert.equal(component.fallback, 'a %1$s c');
    assert.equal(component.with[0].bold, true);
    assert.equal(page('**a *b***').component.with[0].italic, true);
  });

  it('underscores inside a word stay, an unclosed opener is literal', () => {
    assert.equal(page('snake_case_name and **open').component.fallback, 'snake_case_name and **open');
  });

  it('font maps color, face and shadow', () => {
    const { component } = page('<font color="gray" face="minecraft:illageralt" shadow="#80ff0000">hi</font>');
    assert.equal(component.color, 'gray');
    assert.equal(component.font, 'minecraft:illageralt');
    assert.equal(component.shadow_color, 0x80ff0000 | 0);
    assert.throws(() => page('<font color="plaid">x</font>'));
  });

  it('attribute values read the five entities', () => {
    const { component } = page('<a on_hover="{action:show_text,value:&quot;tip &amp; &lt;more&gt;&quot;}">x</a>');
    assert.deepEqual(component.hover_event, { action: 'show_text', value: 'tip & <more>' });
  });

  it('styles of the frontmatter are named classes for <style class>', () => {
    const front = '---\ntitle: T\nstyles: {\n  .url: {\n    color: "blue",\n    bold: false,\n    underline: true,\n    shadow_color: 12345678\n  },\n  .warn: { color: "#ff8800", italic: true }\n}\nrarity: epic\n---\n';
    const { meta } = gen.parseFrontmatter(front + 'body');
    assert.deepEqual(meta.styles, { '.url': { color: 'blue', bold: false, underlined: true, shadow_color: 12345678 }, '.warn': { color: '#ff8800', italic: true } });
    assert.equal(meta.rarity, 'epic');
    const component = (md) => {
      const [tree] = gen.pagesOf(md, null, null, meta.styles);
      return gen.toComponent(tree, 'k', {});
    };
    // The class styles go on the span, several names apply in order
    const link = component('a <style class="url">link</style>');
    assert.deepEqual(link.with[0], { translate: 'k.1', fallback: 'link', color: 'blue', bold: false, underlined: true, shadow_color: 12345678 });
    assert.deepEqual(component('<style class="url warn">x</style>'), { translate: 'k', fallback: 'x', color: '#ff8800', bold: false, underlined: true, shadow_color: 12345678, italic: true });
    // The class works on font, a and span too, and the attributes of the tag win over it
    const withFont = component('<font class="url" color="red" face="minecraft:alt">x</font>');
    assert.equal(withFont.color, 'red');
    assert.equal(withFont.font, 'minecraft:alt');
    assert.equal(withFont.underlined, true);
    const anchor = component('<a class="url" href="https://example.com">x</a>');
    assert.deepEqual([anchor.color, anchor.click_event.url], ['blue', 'https://example.com']);
    assert.equal(component('<span class="url">x</span>').color, 'blue');
    // A false turns off what the text around it has, and the width follows
    const inBold = gen.pagesOf('**a <style class="url">b</style>**', null, null, meta.styles)[0];
    const { chars } = gen.layout(inBold);
    assert.equal(chars.find((c) => c.ch === 'a').bold, true);
    assert.equal(chars.find((c) => c.ch === 'b').bold, false);
    // Unknown classes and keys stop the build
    assert.throws(() => component('<style class="nope">x</style>'), /unknown class "nope"/);
    assert.throws(() => component('<style>x</style>'), /needs a class/);
    assert.throws(() => gen.parseClasses({ a: { colour: 'red' } }), /unknown colour/);
    assert.throws(() => gen.parseClasses({ a: { bold: 'yes' } }), /true or false/);
    assert.throws(() => gen.parseFrontmatter('---\nstyles: {\n  a: {}\n---\n'), /not closed/);
  });

  it('a style name may start with a dot, quoted or not, and a value may be an unquoted id or color', () => {
    const sheet = gen.parseSnbt('{ .front: { font: foxcraft_dungeon_loot:hexenaat, color: #ff8800 }, ".q": { bold: true } }');
    assert.deepEqual(sheet, { '.front': { font: 'foxcraft_dungeon_loot:hexenaat', color: '#ff8800' }, '.q': { bold: true } });
    assert.deepEqual(gen.parseClasses(sheet), { '.front': { font: 'foxcraft_dungeon_loot:hexenaat', color: '#ff8800' }, '.q': { bold: true } });
    assert.deepEqual(gen.parseSnbt('{action:open_url,url:https://example.com/a}'), { action: 'open_url', url: 'https://example.com/a' });
  });

  it('the format types of the stylesheet override how they look by default', () => {
    const sheet = gen.parseClasses({
      bold: { color: 'gold' },
      italic: { italic: false, color: 'aqua' },
      underline: { color: 'red' },
      header: { color: 'dark_red' },
      h2: { underline: false },
      code: { color: 'gray' },
      a: { color: 'dark_blue' },
      font: { italic: true },
      span: { obfuscated: true },
      body: { color: 'dark_gray' },
    });
    const component = (md) => gen.toComponent(gen.pagesOf(md, null, null, sheet)[0], 'k', {});
    // Text around it keeps the span from merging into the page
    const first = (md) => component('a\n' + md + '\nb').with[0];
    // Markdown formats keep their format and take what the sheet adds
    assert.deepEqual(first('**x**'), { translate: 'k.1', fallback: 'x', bold: true, color: 'gold' });
    assert.deepEqual(first('*x*'), { translate: 'k.1', fallback: 'x', italic: false, color: 'aqua' });
    assert.deepEqual(first('__x__'), { translate: 'k.1', fallback: 'x', underlined: true, color: 'red' });
    // Headers are bold and underlined, header changes all of them and h2 only the second level
    assert.deepEqual(first('# x\ny'), { translate: 'k.1', fallback: 'x', bold: true, underlined: true, color: 'dark_red' });
    assert.deepEqual(first('## x\ny'), { translate: 'k.1', fallback: 'x', bold: true, underlined: false, color: 'dark_red' });
    // Code, and the tags
    assert.equal(first('`x`').color, 'gray');
    assert.equal(first('<a href="https://example.com">x</a>').color, 'dark_blue');
    assert.equal(first('<font color="red">x</font>').italic, true);
    assert.equal(first('<span>x</span>').obfuscated, true);
    // The body styles the whole text
    assert.equal(component('plain').color, 'dark_gray');
    // A name that is not a class and not a format type stops the build
    assert.throws(() => gen.parseClasses({ url: {} }), /is not a class/);
    assert.throws(() => gen.parseClasses({ '.bad name': {} }), /is not a class/);
  });

  it('a font id that is not a resource location stops the build', () => {
    assert.throws(() => gen.parseInline('<font face="foxcraft_dungeon_loot:pixellated_elegance,">x</font>', 0, null), /not a resource location/);
    assert.throws(() => gen.parseClasses({ a: { font: 'Bad Font' } }), /not a resource location/);
    assert.doesNotThrow(() => gen.parseInline('<font face="minecraft:alt">x</font>', 0, null));
  });

  it('open_url takes only http and https links', () => {
    assert.throws(() => gen.parseInline('<a href="mailto:a@b.c">x</a>', 0, null), /http or https/);
    assert.throws(() => gen.parseInline(`<a on_click="{action:'open_url',url:'ftp://x.y'}">x</a>`, 0, null), /http or https/);
    assert.doesNotThrow(() => gen.parseInline('<a href="https://example.com">x</a>', 0, null));
  });

  it('anchors map on_click and on_hover from SNBT', () => {
    const { component } = page(`<a on_click='{action:copy_to_clipboard,value:"text"}' on_hover='{action:show_text,value:"tip"}'>go</a>`);
    assert.deepEqual(component.click_event, { action: 'copy_to_clipboard', value: 'text' });
    assert.deepEqual(component.hover_event, { action: 'show_text', value: 'tip' });
    assert.deepEqual(page('<a href="https://example.com">x</a>').component.click_event, { action: 'open_url', url: 'https://example.com' });
  });

  it('a line of --- is a page break, a newline a line break and a header is bold and underlined', () => {
    assert.deepEqual(gen.splitSections('one  \ntwo\n\n---\nthree\n  ---  \n# Head'), ['one\ntwo', 'three', '<h1>Head</h1>']);
    // A heading gets one empty line under it, and not a second when there is one already
    assert.deepEqual(gen.splitSections('# Head\ntext'), ['<h1>Head</h1>\n\ntext']);
    assert.deepEqual(gen.splitSections('# Head\n\ntext'), ['<h1>Head</h1>\n\ntext']);
    assert.equal(gen.pagesOf('one\n---\ntwo').length, 2);
    // A --- in code or after other text is not a break
    assert.equal(gen.splitSections('a ---\n`---`\nb\n---\nc').length, 2);
    assert.equal(gen.splitSections('a\n```\n---\n```\nb\n---\nc').length, 2);
  });
});

describe('book generator page layout', () => {
  const lines = (md) => gen.layout(gen.parseInline(md, 0, null).content).lines.length;
  const rows = (ch, n) => lines(ch.repeat(n));

  it('a line holds 19 W, 28 I, 38 l or 57 i and a page 14 lines', () => {
    for (const [ch, fit] of [['W', 19], ['I', 28], ['l', 38], ['i', 57]]) {
      assert.equal(rows(ch, fit), 1, ch + ' x' + fit);
      assert.equal(rows(ch, fit + 1), 2, ch + ' x' + (fit + 1));
      assert.equal(rows(ch, fit * 14), 14, ch + ' x' + fit * 14);
      assert.equal(rows(ch, fit * 14 + 1), 15, ch + ' x' + (fit * 14 + 1));
    }
  });

  it('wraps at spaces, honors newlines and counts bold a pixel wider', () => {
    assert.equal(lines('WWWWWWWWWW WWWWWWWWW'), 2);
    assert.equal(lines('a\nb\n\nc'), 4);
    assert.equal(lines('**' + 'W'.repeat(17) + '**'), 2);
  });

  it('measures each font on its own', () => {
    // Plain illageralt letters are 6 wide too, a font that does not exist falls back to 9
    assert.equal(lines('<font face="minecraft:illageralt">' + 'a'.repeat(19) + '</font>'), 1);
    assert.equal(lines('<font face="test:nothing">' + 'a'.repeat(13) + '</font>'), 2);
  });

  it('reads the fonts of a resource pack', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fonts-'));
    try {
      // 2 glyphs of 8x8: "a" fills 3 columns, "b" 7
      const png = path.join(dir, 'test', 'textures', 'font');
      fs.mkdirSync(png, { recursive: true });
      fs.mkdirSync(path.join(dir, 'test', 'font'), { recursive: true });
      const pixels = Buffer.alloc(16 * 8 * 4);
      const ink = (x, y) => pixels.fill(255, (y * 16 + x) * 4, (y * 16 + x) * 4 + 4);
      for (let x = 0; x < 3; x++) ink(x, 2);
      for (let x = 8; x < 15; x++) ink(x, 2);
      fs.writeFileSync(path.join(png, 'tiny.png'), encodePng(16, 8, pixels));
      fs.writeFileSync(path.join(dir, 'test', 'font', 'tiny.json'), JSON.stringify({ providers: [{ type: 'bitmap', file: 'test:font/tiny.png', ascent: 7, chars: ['ab'] }, { type: 'space', advances: { ' ': 5 } }] }));
      const fonts = fontsApi.loadFonts({ assets: dir });
      assert.equal(fonts.widthOf('test:tiny', 'a', false), 4);
      assert.equal(fonts.widthOf('test:tiny', 'b', false), 8);
      assert.equal(fonts.widthOf('test:tiny', 'b', true), 9);
      assert.equal(fonts.widthOf('test:tiny', ' ', false), 5);
      assert.equal(fonts.widthOf('minecraft:default', 'W', false), 6);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('book generator pagination', () => {
  const text = (tree) => tree.map((p) => (typeof p === 'string' ? p : text(p.content))).join('');

  it('fills a page with 14 lines and starts the next one', () => {
    assert.equal(gen.pagesOf('i'.repeat(57 * 14)).length, 1);
    assert.equal(gen.pagesOf('i'.repeat(57 * 14 + 1)).length, 2);
    assert.equal(gen.pagesOf(Array(14).fill('line').join('\n')).length, 1);
    assert.equal(gen.pagesOf(Array(15).fill('line').join('\n')).length, 2);
  });

  it('splits between words and keeps all the text', () => {
    const words = Array.from({ length: 200 }, (_, n) => 'word' + n);
    const result = gen.pagesOf(words.join(' '));
    assert.ok(result.length > 1);
    assert.equal(result.map(text).join(' '), words.join(' '));
  });

  it('a page does not start with an empty line', () => {
    const result = gen.pagesOf(Array(14).fill('x').join('\n') + '\n\nnext');
    assert.equal(result.length, 2);
    assert.equal(text(result[1]), 'next');
  });

  it('keeps formatting on both sides of a split', () => {
    const result = gen.pagesOf('**' + 'ii '.repeat(300) + '**');
    assert.ok(result.length > 1);
    assert.ok(result.every((tree) => tree.length === 1 && tree[0].styles.bold === true));
  });

  it('lines after a newline keep their indentation and lose trailing spaces', () => {
    assert.deepEqual(gen.pagesOf('    first\n    second  \n\n  third\n   fourth').map(text), ['    first\n    second\n\n  third\n   fourth']);
  });

  it('wrapped lines lose the spaces at their ends and keep one to break on', () => {
    assert.deepEqual(gen.pagesOf('WWWWWWWWWW      WWWWWWWWW').map(text), ['WWWWWWWWWW WWWWWWWWW']);
    assert.deepEqual(gen.pagesOf('  WWWWWWWWWW      WWWWWWWWW').map(text), ['  WWWWWWWWWW WWWWWWWWW']);
  });

  it('lays out again after a trim, so a line the cut spaces made room on does not wrap', () => {
    // 48 + 4 spaces of 16 + 54 is 118, over the 114, but with one space it is 106
    const body = 'WWWWWWWW    WWWWWWWWW';
    assert.equal(gen.layout(gen.parseInline(body, 0, null).content).lines.length, 1);
    assert.deepEqual(gen.pagesOf(body).map(text), ['WWWWWWWW WWWWWWWWW']);
  });

  it('--- starts a page even when the last one has room', () => {
    assert.deepEqual(gen.pagesOf('one\n---\ntwo').map(text), ['one', 'two']);
  });
});

describe('book generator files', () => {
  const write = (dir, rel, text) => {
    const file = path.join(dir, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  };
  const sandbox = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'books-'));
    return { dir, opts: { bookDir: path.join(dir, 'books'), modifierDir: path.join(dir, 'mod'), tableDir: path.join(dir, 'table'), langDir: path.join(dir, 'lang') } };
  };
  const SOURCE = '---\ntitle: Test Book\nauthor: Me\nrarity: epic\nlore:\n  first line\n    second line\n---\n\nPage **one**\n---\nPage two';

  it('frontmatter gives title, author, rarity and trimmed lore', () => {
    const { meta, body } = gen.parseFrontmatter(SOURCE);
    assert.deepEqual(meta, { lore: ['first line', 'second line'], title: 'Test Book', author: 'Me', rarity: 'epic' });
    assert.ok(body.includes('Page two'));
  });

  it('colors the item name by rarity, and an SNBT title keeps its own styles over it', () => {
    const file = path.join(os.tmpdir(), 'name_test.md');
    const name = (source) => {
      fs.writeFileSync(file, source);
      return gen.buildBook('t', file).modifier.functions[0].components['minecraft:custom_name'];
    };
    const book = (title, rarity) => `---\ntitle: ${title}\n${rarity ? `rarity: ${rarity}\n` : ''}---\n\nx`;
    // A plain name is a lang key, a translation gives it its own words
    assert.deepEqual(name(book('Plain', 'epic')), { translate: 'book.foxcraft_dungeon_loot.t.title', fallback: 'Plain', color: 'light_purple', italic: false });
    fs.writeFileSync(file, book('Plain', 'epic'));
    assert.equal(gen.buildBook('t', file).lang['book.foxcraft_dungeon_loot.t.title'], 'Plain');
    assert.equal(name(book('Plain')), undefined);
    // The item name has no filtered side, so it takes the filtered title
    assert.equal(name(book('<filter as="Darn">Damn</filter>', 'rare')).fallback, 'Darn');
    const rich = name(book('{text: "Fancy", color: red}', 'rare'));
    assert.deepEqual(rich, { text: '', color: 'aqua', italic: false, extra: [{ text: 'Fancy', color: 'red' }] });
  });

  it('requires a title and an author, and warns about an unsupported key', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/ok.md', SOURCE.replace('rarity: epic', 'rarty: epic'));
      const warnings = [];
      gen.findSources(opts.bookDir, warnings, false);
      assert.ok(warnings.some((w) => w.includes('unsupported frontmatter key "rarty"')));
      write(dir, 'books/en_us/ok.md', SOURCE.replace('author: Me\n', ''));
      assert.throws(() => gen.findSources(opts.bookDir, [], false), /author is required/);
      write(dir, 'books/en_us/ok.md', SOURCE.replace('title: Test Book\n', ''));
      assert.throws(() => gen.findSources(opts.bookDir, [], false), /title is required/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('leaves out a debug book unless dev is set', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/shown.md', SOURCE);
      write(dir, 'books/en_us/hidden.md', SOURCE.replace('rarity: epic', 'debug: true'));
      assert.deepEqual(Object.keys(gen.findSources(opts.bookDir, [], false).en_us), ['shown']);
      assert.deepEqual(Object.keys(gen.findSources(opts.bookDir, [], true).en_us), ['hidden', 'shown']);
      const entries = () => JSON.parse(fs.readFileSync(path.join(opts.tableDir, 'random_book.json'), 'utf8')).pools[0].entries.map((e) => e.value);
      gen.generate({ ...opts, dev: false });
      assert.ok(!fs.existsSync(path.join(opts.tableDir, 'hidden.json')));
      assert.deepEqual(entries(), ['foxcraft_dungeon_loot:item/random_loot/book/generated/shown']);
      gen.generate({ ...opts, dev: true });
      assert.ok(fs.existsSync(path.join(opts.tableDir, 'hidden.json')));
      assert.deepEqual(entries(), ['foxcraft_dungeon_loot:item/random_loot/book/generated/shown'], 'a debug book is not in the random table');
      gen.generate({ ...opts, dev: false });
      assert.ok(!fs.existsSync(path.join(opts.tableDir, 'hidden.json')), 'the table of a book that went debug is removed');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes a table per rarity, empty when no book has it', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE);
      gen.generate(opts);
      const read = (name) => JSON.parse(fs.readFileSync(path.join(opts.tableDir, name + '.json'), 'utf8'));
      assert.deepEqual(read('random_epic_book').pools[0].entries.map((e) => e.value), ['foxcraft_dungeon_loot:item/random_loot/book/generated/test']);
      assert.deepEqual(read('random_rare_book'), { pools: [] });
      write(dir, 'books/en_us/random_rare_book.md', SOURCE);
      assert.throws(() => gen.generate(opts), /random_rare_book is the loot table/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('removes the modifier and table of a book that has no source any more', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE);
      write(dir, 'mod/gone.json', '{}');
      write(dir, 'table/gone.json', '{}');
      write(dir, 'table/README.txt', 'kept');
      assert.ok(gen.generate({ ...opts, check: true }).changed.some((f) => f.endsWith('gone.json')));
      assert.ok(fs.existsSync(path.join(opts.tableDir, 'gone.json')));
      gen.generate(opts);
      assert.ok(!fs.existsSync(path.join(opts.modifierDir, 'gone.json')));
      assert.ok(!fs.existsSync(path.join(opts.tableDir, 'gone.json')));
      assert.ok(fs.existsSync(path.join(opts.tableDir, 'test.json')));
      assert.ok(fs.existsSync(path.join(opts.tableDir, 'README.txt')));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes the modifier, table, lang file and the rarity lore line, and then is current', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE);
      const first = gen.generate(opts);
      assert.equal(first.changed.length, 10);
      const mod = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8'));
      const content = mod.functions[0].components['minecraft:written_book_content'];
      assert.equal(content.pages.length, 2);
      assert.equal(content.title.raw, 'Test Book');
      // The Rarity line takes its words from the hand-written lang of the namespace
      assert.deepEqual(mod.functions[1].lore.at(-1), { translate: 'lore.foxcraft_dungeon_loot.rarity', fallback: 'Rarity: %s', with: [{ translate: 'rarity.foxcraft_dungeon_loot.epic', fallback: 'Epic', color: 'light_purple', italic: true }] });
      assert.equal(lore.componentText(mod.functions[1].lore.at(-1)), 'Rarity: Epic');
      assert.equal(lore.componentText(mod.functions[1].lore.at(-1), 'fr_ca'), 'Rareté : Épique');
      assert.equal(JSON.parse(fs.readFileSync(path.join(opts.langDir, 'en_us.json'), 'utf8'))['book.foxcraft_dungeon_loot.test.page.1'], 'Page %1$s');
      assert.deepEqual(gen.generate({ ...opts, check: true }).changed, []);
      fs.writeFileSync(path.join(opts.modifierDir, 'test.json'), '{}');
      assert.equal(gen.generate({ ...opts, check: true }).changed.length, 1);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('filter spans give the filtered side of a page, other locales only write lang', () => {
    const { dir, opts } = sandbox();
    try {
      const source = '---\ntitle: Test Book\nauthor: Me\n---\n\nSay <filter as="||heck||">hell</filter> now\n---\nPage two';
      write(dir, 'books/en_us/test.md', source);
      write(dir, 'books/es_es/test.md', source.replace('Say', 'Di'));
      gen.generate(opts);
      const pages = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components['minecraft:written_book_content'].pages;
      // Raw reads as written, the span melts into the text; page two has no filter so it stays a plain component
      assert.equal(pages[0].raw.fallback, 'Say hell now');
      assert.equal(pages[0].filtered.fallback, 'Say %1$s now');
      assert.deepEqual(pages[0].filtered.with, [{ translate: 'book.foxcraft_dungeon_loot.test.filtered.1.1', fallback: 'heck', obfuscated: true }]);
      assert.ok(pages[1].translate && !pages[1].raw && !pages[1].filtered);
      const lang = JSON.parse(fs.readFileSync(path.join(opts.langDir, 'en_us.json'), 'utf8'));
      assert.ok(Object.keys(lang).some((k) => k.endsWith('.filtered.1')));
      assert.ok(!Object.keys(lang).some((k) => k.endsWith('.filtered.2')));
      assert.ok(fs.existsSync(path.join(opts.langDir, 'es_es.json')));
      assert.deepEqual(fs.readdirSync(opts.modifierDir), ['test.json']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a longer translation has its pages cut with the reference, the keys and %n$s line up', () => {
    const { dir, opts } = sandbox();
    try {
      const head = '---\ntitle: Test Book\nauthor: Me\n---\n\n';
      const en = 'word '.repeat(150) + 'a **bold** b ' + 'word '.repeat(150) + 'c *it* d ' + 'word '.repeat(100);
      // About twice as long, so it alone would need more pages
      const fr = 'mot mot '.repeat(150) + 'a **gras** b ' + 'mot mot '.repeat(150) + 'c *it* d ' + 'mot mot '.repeat(100);
      write(dir, 'books/en_us/test.md', head + en);
      write(dir, 'books/fr_ca/test.md', head + fr);
      assert.ok(gen.pagesOf(fr).length > gen.pagesOf(en).length);
      const { warnings } = gen.generate(opts);
      assert.deepEqual(warnings.filter((w) => w.includes('test.md')), []);
      const lang = (locale) => JSON.parse(fs.readFileSync(path.join(opts.langDir, locale + '.json'), 'utf8'));
      const [enLang, frLang] = [lang('en_us'), lang('fr_ca')];
      assert.deepEqual(Object.keys(frLang), Object.keys(enLang));
      const args = (s) => (s.match(/%\d+\$s/g) || []).join();
      for (const key of Object.keys(enLang)) assert.equal(args(frLang[key]), args(enLang[key]), key);
      const pages = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components['minecraft:written_book_content'].pages;
      assert.equal(pages.length, gen.pagesOf(fr).length);
      // Spans that do not line up keep the pages of each locale, with a warning
      write(dir, 'books/fr_ca/test.md', head + fr.replace('*it*', 'it'));
      assert.ok(gen.generate(opts).warnings.some((w) => /spans of section 1 are not the ones/.test(w)));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a title takes a filter for its filtered side', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE.replace('title: Test Book', 'title: <filter as="Darn Book">Damn Book</filter>'));
      gen.generate(opts);
      const content = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components['minecraft:written_book_content'];
      assert.deepEqual(content.title, { raw: 'Damn Book', filtered: 'Darn Book' });
      write(dir, 'books/en_us/test.md', SOURCE.replace('title: Test Book', 'title: <filter as="' + 'x'.repeat(33) + '">Book</filter>'));
      assert.ok(gen.generate(opts).warnings.some((w) => /filtered title is 33 characters/.test(w)));
      write(dir, 'books/en_us/test.md', SOURCE.replace('title: Test Book', 'title: {text:"<filter>b"}'));
      assert.throws(() => gen.generate(opts), /SNBT title/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('code is literal text in the pixel_mono font, inline and in fenced blocks', () => {
    const tick = String.fromCharCode(96);
    const fence = tick.repeat(3);
    const font = 'foxcraft_dungeon_loot:pixel_mono';
    const [inline] = gen.parseInline(`a ${tick}x*y_z${tick} b`, 0, null).content.filter((p) => typeof p !== 'string');
    assert.deepEqual(inline, { styles: { font }, content: ['x*y_z'] });
    // An opener with no closer is a plain backtick
    assert.deepEqual(gen.parseInline(`a ${tick} b`, 0, null).content, [`a ${tick} b`]);
    const [section] = gen.splitSections(`text\n${fence}\n# no heading *x*\n  kept\n${fence}\nafter`);
    assert.deepEqual(section.split('\n'), ['text', `<font face="${font}" literal="1"># no heading \\*x\\*</font>`, `<font face="${font}" literal="1">  kept</font>`, 'after']);
    const page = gen.pagesOf(`a ${tick}b${tick} c`)[0];
    assert.equal(page[1].styles.font, font);
  });

  it('a code block is colored by its language and written as literal text components', () => {
    const { highlight } = require('../../scripts/highlight.js');
    const colors = (code, language) => Object.fromEntries(highlight(code, language).flat().filter((p) => p.color).map((p) => [p.text, p.color]));
    assert.deepEqual(colors('{"a": [1, true]}', 'json'), { '"a"': 'dark_aqua', 1: 'dark_red', true: 'dark_red' });
    assert.equal(colors('x = 1 # c', 'py')['# c'], 'dark_gray');
    assert.equal(colors('say hi', 'mcfunction').say, 'dark_blue');
    assert.equal(colors('tp @s ~ ~1 ~', 'mcfunction')['@s'], 'dark_red');
    assert.equal(colors('summon minecraft:cow', 'mcfunction')['minecraft:cow'], 'dark_blue');
    assert.equal(highlight('x', 'brainfuck'), null);
    assert.deepEqual(highlight('a\n\nb', 'json'), [[{ text: 'a', color: undefined }], [], [{ text: 'b', color: undefined }]]);

    const fence = String.fromCharCode(96).repeat(3);
    const lang = {};
    const [page] = gen.pagesOf(`${fence}json\n{"a": 1}\n${fence}\nafter`);
    const component = gen.toComponent(page, 'k', lang);
    const font = 'foxcraft_dungeon_loot:pixel_mono';
    // The block has a key for its template, the code in its entries is not translated
    assert.deepEqual(Object.keys(lang), ['k', 'k.1']);
    assert.equal(lang['k.1'], '%1$s%2$s%3$s%4$s%5$s');
    // The whole block is one substitution of the page, with a component of its own for the pieces
    assert.equal(component.fallback, '%1$s\nafter');
    assert.equal(component.with.length, 1);
    assert.equal(component.with[0].translate, 'k.1');
    assert.equal(component.with[0].fallback, '%1$s%2$s%3$s%4$s%5$s');
    assert.deepEqual(component.with[0].with[1], { text: '"a"', color: 'dark_aqua', font });
    // No language, or one the highlighter does not know, is plain code
    for (const info of ['', 'rust']) {
      const [plain] = gen.pagesOf(`${fence}${info}\nlet x = *1;\n${fence}`);
      assert.deepEqual(gen.toComponent(plain, 'k', {}), { text: 'let x = *1;', font });
    }
  });

  it('a font that reaches higher than a line takes empty lines above its line', () => {
    const tall = { styles: { font: 'foxcraft_dungeon_loot:tall' }, content: ['I'] };
    const ascentOf = (font) => (font.endsWith(':tall') ? 18 : 7);
    const text = (tree) => JSON.stringify(gen.reserveTall(tree, ascentOf));
    // 18 pixels over a 7 pixel baseline is two lines
    assert.equal(text(['first\nsecond ', tall, 'n']), JSON.stringify(['first\n\n\nsecond ', tall, 'n']));
    // Empty lines that are there count, and a glyph at the very start is pushed down too
    assert.equal(text(['a\n\n', tall, 'n']), JSON.stringify(['a\n\n', '\n', tall, 'n']));
    assert.equal(text(['a\n\n\n', tall, 'n']), JSON.stringify(['a\n\n\n', tall, 'n']));
    assert.equal(text([tall, 'n at the start']), JSON.stringify(['\n\n', tall, 'n at the start']));
    // No more than a page can hold above a line, the rest leaks over the top
    assert.equal(gen.layout(gen.reserveTall([tall, 'n'], () => 500)).lines.length, 14);
    // A font that stays inside a line, as the default and the code font do, adds nothing
    assert.equal(JSON.stringify(gen.reserveTall(['a\nb'], () => 9)), JSON.stringify(['a\nb']));
    // At a wrap the new line break is the empty line too
    const wrapped = gen.reserveTall(['a '.repeat(30), tall, 'n'], ascentOf);
    const lines = gen.layout(wrapped).lines;
    assert.equal(lines.filter((l) => l.start === l.end).length, 2);
  });

  it('a tall glyph at the top of a page is pushed down by empty lines so the illustration sits in place', () => {
    const md = 'text\n---\n' + '\n'.repeat(13) + '<font face="foxcraft_dungeon_loot:illustrations">0</font>';
    const pages = gen.pagesOf(md);
    assert.equal(pages.length, 2);
    const { lines } = gen.layout(pages[1]);
    assert.equal(lines.length, 14);
    assert.equal(lines.filter((l) => l.start === l.end).length, 13);
  });

  it('a word wider than a line breaks at a syllable with a hyphen, only when it is wider than a line', () => {
    const Hypher = require('hypher');
    const hyphenator = new Hypher(require('hyphenation.en-us'));
    const rows = (tree) => {
      const { lines, chars } = gen.layout(tree);
      return lines.map((l) => chars.slice(l.tstart, l.tend).map((c) => c.ch).join(''));
    };
    // A word that fits a line of its own wraps at the space as before, nothing is hyphenated
    const fits = ['a longer start extraordinarily'];
    assert.equal(JSON.stringify(gen.hyphenate(fits, hyphenator)), JSON.stringify(fits));
    // A word wider than a line breaks in what is left of the line before it, at the last syllable that fits with its hyphen
    const before = rows(gen.hyphenate(['By antidisestablishmentarianism'], hyphenator));
    assert.deepEqual(before, ['By antidisestablish-', 'mentarianism']);
    for (const row of before) assert.equal(gen.layout([row]).lines.length, 1, row);
    // A break that does not fit there is one that fits a line of its own, the word moves down
    const moved = rows(gen.hyphenate(['one two three four five six seven eight nine ten supercalifragilisticexpialidocious'], hyphenator));
    assert.ok(moved.every((row) => gen.layout([row]).lines.length === 1), moved.join('|'));
    assert.ok(moved.some((row) => row.endsWith('-')), moved.join('|'));
    // No syllable break, no hyphen, the word breaks between letters as before
    assert.equal(JSON.stringify(gen.hyphenate(['x'.repeat(30)], hyphenator)), JSON.stringify(['x'.repeat(30)]))
    // A span is never broken at a syllable and is gone from the pages
    const [kept] = gen.pagesOf('By <span>antidisestablishmentarianism</span>', null, hyphenator);
    assert.ok(kept.every((part) => typeof part === 'string'));
    assert.deepEqual(rows(kept), ['By', 'antidisestablishmentari', 'anism']);
    const [plain] = gen.pagesOf('By antidisestablishmentarianism', null, hyphenator);
    assert.deepEqual(rows(plain), ['By antidisestablish-', 'mentarianism']);
    // No patterns for the locale, or code, are left alone
    assert.equal(JSON.stringify(gen.hyphenate(['supercalifragilisticexpialidocious'], null)), JSON.stringify(['supercalifragilisticexpialidocious']));
    const code = [{ styles: {}, literal: true, content: ['supercalifragilisticexpialidocious'] }];
    assert.equal(JSON.stringify(gen.hyphenate(code, hyphenator)), JSON.stringify(code));
  });

  it('the height of a glyph is the one of the provider that draws it, so a font mixes tall glyphs and short ones', () => {
    const fonts = fontsApi.loadFonts();
    const staff = 'foxcraft_dungeon_loot:staff_notation';
    assert.equal(fonts.ascentOf(staff, String.fromCodePoint(0xe000)), 17);
    // minecraft:default at 3/4 and the padding, in the same font
    assert.equal(fonts.ascentOf(staff, 'a'), 5);
    assert.equal(fonts.ascentOf(staff, String.fromCodePoint(0xf808)), 0);
    assert.equal(fonts.ascentOf(staff), 17);
    // A line of words in the staff font sits in its line, a line of staff takes the lines above it
    const classes = { '.staff': { font: staff } };
    const [words] = gen.pagesOf('<style class="staff">just words</style>', null, null, classes);
    assert.equal(gen.layout(words).lines.length, 1);
    const [music] = gen.pagesOf('<style class="staff">\\ue000</style>', null, null, classes);
    assert.equal(gen.layout(music).lines.length, 3);
  });

  it('a page break never leaves the empty lines of a tall line behind on the page before it', () => {
    // Twelve lines, then the two empty lines a 25px tall glyph needs, which would end the page at 14
    const content = ['a\n'.repeat(11) + 'a\n\n\n', { styles: { font: 'x:tall' }, content: ['T'] }];
    const rows = (tree) => {
      const { lines, chars } = gen.layout(tree);
      return lines.map((l) => chars.slice(l.tstart, l.tend).map((c) => c.ch).join(''));
    };
    const pages = gen.paginate(content, (font) => (font === 'x:tall' ? 25 : 0));
    assert.equal(pages.length, 2);
    assert.deepEqual(rows(pages[1]), ['', '', 'T']);
  });

  it('<center> pads every line it is on to the middle, the overflow of a wrap too', () => {
    // [padding, text] widths of each line
    const rows = (tree) => {
      const { lines, chars } = gen.layout(tree);
      const width = (list) => list.reduce((sum, g) => sum + lore.FONTS.widthOf(g.font, g.ch, g.bold), 0);
      return lines.map((l) => {
        const line = chars.slice(l.tstart, l.tend);
        return [width(line.filter((g) => g.font === 'foxcraft_dungeon_loot:padding')), width(line.filter((g) => g.font !== 'foxcraft_dungeon_loot:padding'))];
      });
    };
    const [page] = gen.pagesOf('left\n<center>\nThe quick brown fox jumps over the lazy dog and runs\n</center>\nleft');
    const lines = rows(page);
    assert.equal(lines.length, 5);
    assert.deepEqual(lines[0], [0, lines[0][1]]);
    assert.deepEqual(lines[4], [0, lines[4][1]]);
    for (const [pad, text] of lines.slice(1, 4)) assert.equal(pad, Math.floor((114 - text) / 2));
    // The padding is its own span, an underline of a header class does not reach over it
    const [header] = gen.pagesOf('<center class="h1">Title</center>');
    assert.equal(header[0].styles.underlined, false);
    assert.equal(header[1].styles.underlined, true);
    // A book and quill keeps the text where it is
    const [plain] = gen.pagesOf('<center>Title</center>', null, null, {}, false);
    assert.deepEqual(plain, ['Title']);
    assert.throws(() => gen.pagesOf('<center class="nope">x</center>'), /unknown class/);
  });

  it('a filter span needs as, an old _filtered file is ignored with a warning', () => {
    assert.throws(() => gen.parseInline('a <filter>b</filter>', 0, null), /as=/);
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE);
      write(dir, 'books/en_us/test_filtered.md', SOURCE);
      const { warnings } = gen.generate(opts);
      assert.ok(warnings.some((w) => /test_filtered\.md: ignored/.test(w)));
      assert.deepEqual(fs.readdirSync(opts.modifierDir), ['test.json']);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a filter span cut by a page break stays raw and warns', () => {
    const { dir, opts } = sandbox();
    try {
      const filler = Array.from({ length: 13 }, () => 'x').join('\n');
      write(dir, 'books/en_us/test.md', `---\ntitle: Test Book\nauthor: Me\n---\n\n${filler}\n<filter as="a b">one\ntwo</filter>`);
      const { warnings } = gen.generate(opts);
      assert.ok(warnings.some((w) => /cut by the page break/.test(w)), warnings.join('\n'));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a body font in the styles sets the font of every page, a span inside keeps its own', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nstyles: { body: { font: foxcraft_dungeon_loot:pixellated_elegance } }\n---\n\nPlain <font face="minecraft:illageralt">odd</font> end');
      gen.generate(opts);
      const [page] = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components['minecraft:written_book_content'].pages;
      assert.equal(page.font, 'foxcraft_dungeon_loot:pixellated_elegance');
      assert.equal(page.with[0].font, 'minecraft:illageralt');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('the old frontmatter font key still works and warns that it is deprecated', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nfont: foxcraft_dungeon_loot:pixellated_elegance\n---\n\nText');
      const { warnings } = gen.generate(opts);
      assert.ok(warnings.some((w) => /test\.md: the frontmatter font is deprecated, use styles: \{ body: \{ font: foxcraft_dungeon_loot:pixellated_elegance \} \}/.test(w)));
      const [page] = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components['minecraft:written_book_content'].pages;
      assert.equal(page.font, 'foxcraft_dungeon_loot:pixellated_elegance');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a frontmatter font that is not a resource location stops the build', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nfont: foxcraft_dungeon_loot:pixellated_elegance,\n---\n\nText');
      assert.throws(() => gen.generate(opts), /test\.md: frontmatter font/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('data in the frontmatter is set as custom data in the SNBT string form, on written and writable books', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\ndata: {\n  DungeonLootId: 87,\n  DungeonItem: 1b\n}\n---\n\nText');
      write(dir, 'books/en_us/note.md', '---\ntitle: Note\nwritable: true\ndata: {DungeonLootId:88}\n---\n\nText');
      gen.generate(opts);
      const read = (id) => JSON.parse(fs.readFileSync(path.join(opts.modifierDir, id + '.json'), 'utf8')).functions;
      assert.deepEqual(read('test')[1], { type: 'minecraft:set_custom_data', tag: '{ DungeonLootId: 87, DungeonItem: 1b }' });
      assert.deepEqual(read('note')[1], { type: 'minecraft:set_custom_data', tag: '{DungeonLootId:88}' });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('data that is not an SNBT compound stops the build', () => {
    for (const data of ['{DungeonLootId:}', '[1,2]', 'nope']) {
      const { dir, opts } = sandbox();
      try {
        write(dir, 'books/en_us/test.md', `---\ntitle: Test Book\nauthor: Me\ndata: ${data}\n---\n\nText`);
        assert.throws(() => gen.generate(opts), /test\.md: frontmatter data/);
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    }
  });

  it('a model in the frontmatter is saved as the item_model component', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nmodel: foxcraft_dungeon_loot:random_loot/written_letter.json\n---\n\nText');
      gen.generate(opts);
      const set = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[0].components;
      assert.equal(set['minecraft:item_model'], 'foxcraft_dungeon_loot:random_loot/written_letter');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a frontmatter model that is not a resource location stops the build', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nmodel: Foo Bar\n---\n\nText');
      assert.throws(() => gen.generate(opts), /test\.md: frontmatter model/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writable: true makes a book and quill with plain pages and no author needed', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Letter\nwritable: true\n---\n\nSome **bold** text');
      gen.generate(opts);
      const modifier = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8'));
      const components = modifier.functions[0].components;
      assert.deepEqual(components['minecraft:writable_book_content'].pages, ['Some bold text']);
      assert.equal(components['minecraft:written_book_content'], undefined);
      const table = JSON.parse(fs.readFileSync(path.join(opts.tableDir, 'test.json'), 'utf8'));
      assert.equal(table.pools[0].entries[0].name, 'minecraft:writable_book');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects a rarity that does not exist', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE.replace('epic', 'legendary'));
      assert.throws(() => gen.generate(opts), /rarity/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reflowLore joins lines without ending punctuation, keeps sentence ends and wraps to the width', () => {
    const lore = require('../../scripts/lore.js');
    const out = lore.reflowLore(['Hastily scrawled sheet music with', 'accompanying lyrics.', 'Second paragraph that is long enough to need a wrap somewhere here.']);
    assert.equal(out[0], 'Hastily scrawled sheet music with');
    assert.equal(out[1], 'accompanying lyrics.');
    assert.ok(out.length > 3);
    for (const line of out) assert.ok(lore.loreWidth(line) <= lore.LORE_PIXELS, line);
    assert.deepEqual(lore.reflowLore(['short.', '', 'also short.']), ['short.', '', 'also short.']);
  });

  it('a lore line starting with { or [ is a JSON text component, anything else is plain text', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nlore:\n  Plain line.\n  {"text":"Blue","color":"blue","italic":true}\n  ["A ",{"text":"list","bold":true}]\n---\n\nText');
      const { warnings } = gen.generate(opts);
      assert.deepEqual(warnings.filter((w) => w.includes('lore')), []);
      const { lore } = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[1];
      // A plain line is a lang key so a translation can word it, a component stays as written
      assert.deepEqual(lore, [{ translate: 'book.foxcraft_dungeon_loot.test.lore.1', fallback: 'Plain line.' }, { text: 'Blue', color: 'blue', italic: true }, ['A ', { text: 'list', bold: true }]]);
      assert.equal(JSON.parse(fs.readFileSync(path.join(opts.langDir, 'en_us.json'), 'utf8'))['book.foxcraft_dungeon_loot.test.lore.1'], 'Plain line.');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('every rarity has its words in each hand-written lang of the namespace', () => {
    const dir = path.join(pk.ROOT, 'texturepack', 'assets', 'foxcraft_dungeon_loot', 'lang');
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.json'))) {
      const lang = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      const missing = ['lore.foxcraft_dungeon_loot.rarity', ...Object.keys(gen.RARITY_COLORS).map((r) => `rarity.foxcraft_dungeon_loot.${r}`)].filter((k) => !(k in lang));
      assert.deepEqual(missing, [], name);
      assert.match(lang['lore.foxcraft_dungeon_loot.rarity'], /%(1\$)?s/, name);
    }
  });

  it('a translate lore line is measured and read through the lang files, its fallback when the key is missing', () => {
    const line = { translate: 'book.foxcraft_dungeon_loot.no_such_book.lore.1', fallback: '100%% of %s', with: [{ text: 'it', bold: true }] };
    assert.equal(lore.componentText(line), '100% of it');
    assert.equal(lore.componentWidth(line), lore.loreWidth('100% of ') + lore.loreWidth('it', true));
  });

  it('lore can be one JSON list over several lines', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nlore: [\n  "[Not a component]",\n  {"text": "Blue", "color": "blue"}\n]\n---\n\nText');
      const { warnings } = gen.generate(opts);
      assert.deepEqual(warnings.filter((w) => w.includes('lore')), []);
      const { lore } = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions[1];
      assert.deepEqual(lore, [{ translate: 'book.foxcraft_dungeon_loot.test.lore.1', fallback: '[Not a component]' }, { text: 'Blue', color: 'blue' }]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a lore line of broken JSON stops the build', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nlore:\n  {"text":\n---\n\nText');
      assert.throws(() => gen.generate(opts), /lore line/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('plain lore is wrapped to the width by the generator, keeping the breaks after sentence ends', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', '---\ntitle: Test Book\nauthor: Me\nlore:\n  Hastily scrawled sheet music with accompanying lyrics. The sheet\n  bears no author.\n---\n\nText');
      const { warnings } = gen.generate(opts);
      assert.deepEqual(warnings.filter((w) => w.includes('lore')), []);
      const lang = JSON.parse(fs.readFileSync(path.join(opts.langDir, 'en_us.json'), 'utf8'));
      const lines = Object.keys(lang).filter((k) => k.includes('.lore.')).map((k) => lang[k]);
      // A sentence end inside a frontmatter line flows on, one at the end of a line keeps its break
      assert.deepEqual(lines, ['Hastily scrawled sheet music with', 'accompanying lyrics. The sheet bears no', 'author.']);
      for (const line of lines) assert.ok(lore.loreWidth(line) <= lore.LORE_PIXELS, line);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('only a lore word or a component line too wide for a line is warned about', () => {
    const { dir, opts } = sandbox();
    try {
      write(dir, 'books/en_us/test.md', SOURCE.replace('lore:', 'lore:\n  ' + 'x'.repeat(lore.LORE_WIDTH)));
      assert.ok(gen.generate(opts).warnings.some((w) => /lore word "x+" is \d+ pixels/.test(w)));
      // Narrow letters get more characters in the same width, and a long line of words just wraps
      write(dir, 'books/en_us/test.md', SOURCE.replace('lore:', 'lore:\n  ' + 'i'.repeat(lore.LORE_WIDTH + 20) + '\n  ' + 'word '.repeat(40)));
      assert.ok(!gen.generate(opts).warnings.some((w) => /lore/.test(w)));
      write(dir, 'books/en_us/test.md', SOURCE.replace('lore:', 'lore:\n  {"text":"' + 'x'.repeat(lore.LORE_WIDTH) + '"}'));
      assert.ok(gen.generate(opts).warnings.some((w) => /lore line is \d+ pixels/.test(w)));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('a translation whose lore wraps into fewer lines is wrapped narrower to fill as many', () => {
    const { dir, opts } = sandbox();
    try {
      const book = (lore) => `---\ntitle: Test Book\nauthor: Me\nlore:\n  ${lore}\n---\n\nText`;
      write(dir, 'books/en_us/test.md', book('A short note about the war.'));
      write(dir, 'books/fr_ca/test.md', book('Une note pas si courte que ça sur la guerre et sur ceux qui la font.'));
      gen.generate(opts);
      const lang = (locale) => JSON.parse(fs.readFileSync(path.join(opts.langDir, locale + '.json'), 'utf8'));
      const lines = (l) => Object.keys(l).filter((k) => k.includes('.lore.')).map((k) => l[k]);
      const [en, fr] = [lines(lang('en_us')), lines(lang('fr_ca'))];
      assert.equal(fr.length, 2);
      assert.equal(en.length, 2);
      assert.ok(en.every(Boolean), 'no empty line: ' + en.join('|'));
      assert.equal(en.join(' '), 'A short note about the war.');
      const lore0 = JSON.parse(fs.readFileSync(path.join(opts.modifierDir, 'test.json'), 'utf8')).functions.find((f) => f.type === 'minecraft:set_lore').lore;
      assert.equal(lore0.length, 2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('every lore line of the book sources wraps to the average width of 44 characters', () => {
    const root = path.join(pk.ROOT, 'src', 'books');
    const over = [];
    for (const locale of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory())) {
      for (const name of fs.readdirSync(path.join(root, locale.name)).filter((f) => f.endsWith('.md'))) {
        const text = fs.readFileSync(path.join(root, locale.name, name), 'utf8');
        if (!text.trimStart().startsWith('---')) continue;
        const { meta } = gen.parseFrontmatter(text);
        for (const line of gen.wrappedLore(meta)) {
          const width = line.component !== undefined ? lore.componentWidth(line.component) : lore.loreWidth(line.text);
          if (width > lore.LORE_PIXELS) over.push(`${locale.name}/${name}: ${width} pixels, ${lore.LORE_PIXELS} fit: ${JSON.stringify(line)}`);
        }
      }
    }
    assert.deepEqual(over, []);
  });

  it('the generated books match their sources', () => {
    const result = gen.generate({ check: true });
    assert.deepEqual(result.changed, [], 'run node scripts/book_loot_gen.js, or mcb build, to regenerate');
  });
});

describe('book give triggers', () => {
  it('every en_us book has a give function and a trigger', () => {
    const dir = path.join(pk.ROOT, 'src', 'books', 'en_us');
    const ids = fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.endsWith('_filtered.md') && fs.readFileSync(path.join(dir, f), 'utf8').trimStart().startsWith('---')).map((f) => f.slice(0, -3));
    assert.ok(ids.length > 0);
    for (const id of ids) {
      const fn = pk.readText(pk.generatedFunction('give/give_' + id));
      assert.ok(fn.includes(`loot give @s loot ${pk.NS}:item/random_loot/book/generated/${id}`), id);
      assert.ok(pk.readText(pk.generatedFunction('give/on_load')).includes(`scoreboard objectives add give_${id} trigger`), id);
    }
  });
});
