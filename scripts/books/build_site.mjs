#!/usr/bin/env node
// Writes the book viewer as a static site, for GitHub Pages or any file host.
//
//     node scripts/books/build_site.mjs                 into .build/site
//     node scripts/books/build_site.mjs --out some/dir  somewhere else
//
// Same layout the local server serves: the files of viewer/, icon.png, books.json and the rendered files/<locale>/... from
// tests/.cache/books, with only relative URLs so a repo sub-path works. Run `npm run previews` first.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOKS, FONT, ICON, ICONS, index, prepareFont, prepareIcon } from './viewer_lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'viewer');
const argv = process.argv.slice(2);
const outAt = argv.indexOf('--out');
const out = path.resolve(ROOT, outAt >= 0 ? argv[outAt + 1] : path.join('.build', 'site'));

if (!fs.existsSync(BOOKS) || !fs.readdirSync(BOOKS).length) {
  console.error(`No rendered books in ${BOOKS}, run npm run previews first`);
  process.exit(1);
}
if (!prepareIcon()) {
  console.error('No client jar in tests/.cache/mc to take the book icon from');
  process.exit(1);
}

if (!await prepareFont()) {
  console.error('Could not download the Minecraft font from classic.minecraft.net');
  process.exit(1);
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
fs.cpSync(SITE, out, { recursive: true });
fs.copyFileSync(ICON, path.join(out, 'icon.png'));
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });
fs.copyFileSync(FONT, path.join(out, 'fonts', 'minecraftfont.woff'));
fs.cpSync(BOOKS, path.join(out, 'files'), { recursive: true });
// index() resolves the icons, so it runs before they are copied, over a clean folder so no old icon is shipped
fs.rmSync(ICONS, { recursive: true, force: true });
const data = index();
fs.cpSync(ICONS, path.join(out, 'icons'), { recursive: true });
fs.writeFileSync(path.join(out, 'books.json'), JSON.stringify(data));
// Pages would run Jekyll over the files otherwise
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`${data.books.length} book entries in ${data.locales.length} locales written to ${out}`);
