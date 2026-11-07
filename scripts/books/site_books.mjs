#!/usr/bin/env node
// Writes the books only the viewer site has, as book sources under src/books/en_us/site, gitignored: THIRD_PARTY.md as Third Party
// Notices and README.md as About. Links stay markdown links, which the generator makes click events, and BookRender writes where
// they are so the viewer can link them. pages.yml runs it before the book generator, so these are only on the site, never in a
// local or release build. The viewer opens them from buttons in its header, not from the grid.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'src', 'books', 'en_us', 'site');

const BOOKS = [
  { source: 'THIRD_PARTY.md', id: 'third_party_notices', title: 'Third Party Notices' },
  { source: 'README.md', id: 'about', title: 'About' },
];

fs.mkdirSync(OUT, { recursive: true });
for (const { source, id, title } of BOOKS) {
  const text = fs.readFileSync(path.join(ROOT, source), 'utf8').replace(/\r\n/g, '\n');
  const file = path.join(OUT, `${id}.md`);
  fs.writeFileSync(file, `---\ntitle: ${title}\nauthor: Foxcraft\n---\n\n${text}`);
  console.log(`wrote ${path.relative(ROOT, file)}`);
}
