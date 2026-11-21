// Runs the book generator on every build, so the written book modifiers always match src/books.
const { generate } = require('../../scripts/books/book_loot_gen.js');

const { changed, warnings } = generate();
for (const w of warnings) console.warn('book_loot_gen: ' + w);
for (const f of changed) console.log('book_loot_gen: wrote ' + f);

module.exports = {};
