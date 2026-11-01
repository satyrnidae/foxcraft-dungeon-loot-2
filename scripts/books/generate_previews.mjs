#!/usr/bin/env node
// Regenerate the book loot, run the book tests, then draw every book page to tests/.cache/books, without the rest of tests/run_all.mjs.
//
//     node scripts/books/generate_previews.mjs                 generate, test, render
//     node scripts/books/generate_previews.mjs --no-tests      skip tests/unit/books.test.mjs
//     node scripts/books/generate_previews.mjs --no-download   never fetch the client jar from Mojang
//     node scripts/books/generate_previews.mjs --scale 2       pixels per GUI pixel of the PNGs, 3 by default
//     node scripts/books/generate_previews.mjs --book brewing_potions
//                                                              rebuild and redraw only that book, <author>/<title> as the folders have it, as often as
//                                                              needed; the other books and their pages are left as they are
//
// The Java side is the same as in run_all.mjs: Java 25, the client jar and its libraries, found or downloaded the same way. Pages are
// written to tests/.cache/books/<locale>/[<group>/]<id>/page_NN.png. Exit status is 1 when a step fails, and a failing generator or
// test ends the run before the render.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareJava } from '../../tests/run_all.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const scaleAt = argv.indexOf('--scale');
const scale = scaleAt >= 0 ? argv[scaleAt + 1] : undefined;
if (scale !== undefined && !/^\d+$/.test(scale)) {
  console.error('--scale needs a whole number');
  process.exit(1);
}

// --book <name>, repeatable: the book sources it names, as src/books/<locale>/[<group>/]<id>.md, and their path without the extension
const names = argv.flatMap((a, i) => (a === '--book' ? [argv[i + 1]] : []));
if (argv.includes('--book') && names.some((n) => !n || n.startsWith('--'))) {
  console.error('--book needs a book id, as brewing_potions or chickenny/brewing_potions');
  process.exit(1);
}
const sources = [];
const books = new Set();
if (names.length) {
  const root = path.join(ROOT, 'src', 'books');
  const found = [];
  for (const entry of fs.readdirSync(root, { recursive: true })) {
    const rel = entry.split(path.sep).join('/');
    if (!rel.endsWith('.md') || !/^[a-z]{2,3}_[a-z]{2}\//i.test(rel)) continue;
    // Without the locale folder and the extension: <id> or <group>/<id>
    found.push({ file: path.join(root, entry), rel: rel.replace(/^[^/]+\//, '').replace(/\.md$/, '') });
  }
  for (const name of names) {
    const wanted = name.replace(/\.md$/, '').replaceAll('\\', '/');
    // The full <author>/<title> wins; a bare title is taken only when no other author has a book of that name
    let hits = found.filter((f) => f.rel === wanted);
    if (!hits.length) hits = found.filter((f) => f.rel.endsWith('/' + wanted));
    const rels = [...new Set(hits.map((f) => f.rel))];
    if (rels.length > 1) {
      console.error(`${name} is ambiguous, use ${rels.sort().join(' or ')}`);
      process.exit(1);
    }
    if (!hits.length) {
      console.error(`no book called ${name}; the books are ${[...new Set(found.map((f) => f.rel))].sort().join(', ')}`);
      process.exit(1);
    }
    hits.forEach((f) => { sources.push(f.file); books.add(f.rel); });
  }
}

const run = (cmd, args, options = {}) => spawnSync(cmd, args, { stdio: 'inherit', ...options }).status ?? 1;
const fail = (what) => {
  console.error(`\n${what} failed`);
  process.exit(1);
};

console.log('== book generator ==');
// With --book only those books' loot is rewritten, and no loot of the others is removed as left over
if (run(process.execPath, [path.join(ROOT, 'scripts', 'books', 'book_loot_gen.js'), ...sources], { cwd: ROOT }) !== 0) fail('the book generator');

if (flag('--no-tests')) {
  console.log('\n== book tests == skipped, --no-tests');
} else {
  console.log('\n== book tests ==');
  if (run(process.execPath, ['--test', path.join(ROOT, 'tests', 'unit', 'books.test.mjs')], { cwd: ROOT }) !== 0) fail('the book tests');
}

console.log('\n== book pages (BookRender) ==');
const prepared = await prepareJava(!flag('--no-download'), ['BookRender.java']);
if (prepared.skip) {
  console.error(`cannot render: ${prepared.skip}`);
  process.exit(1);
}
if (prepared.fail) fail(prepared.fail);
const out = path.join(prepared.cache, 'books');
// Run from the cache folder, the game writes a logs/ folder into the working directory
if (run(prepared.java, ['-cp', prepared.runcp, 'BookRender', ROOT, out, scale ?? '3', [...books].join(',')], { cwd: prepared.cache }) !== 0) fail('BookRender');
console.log(`\npages are in ${path.relative(ROOT, out)}`);
