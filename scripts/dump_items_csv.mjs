// Dumps every item the loot tables define to a CSV: name, base item, client item (item_model), DungeonLootId and the rest
// of the custom data. One row per item entry of a loot table with its modifiers applied in the order the game runs them:
// the entry's, the pool's, then the table's. Rows are ordered by DungeonLootId, items without one come last by name, and an
// item with neither id, custom name nor client item is left out.
//
//     node scripts/dump_items_csv.mjs [output.csv]      default dungeon_loot_items.csv in the repo root
import fs from 'node:fs';
import path from 'node:path';

import * as pk from '../tests/unit/packdata.mjs';

const LOOT_TABLES = path.join(pk.DATA, 'loot_table', 'item');
const SUFFIX = { byte: 'b', short: 's', int: '', long: 'L', float: 'f', double: 'd' };

// SNBT of a parsed value, with the number types written back as suffixes
function snbt(value) {
  if (value instanceof pk.Num) return `${value.value}${SUFFIX[value.type] ?? ''}`;
  if (Array.isArray(value)) return `[${value.map(snbt).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([k, v]) => `${k}:${snbt(v)}`).join(',')}}`;
  if (typeof value === 'string') return JSON.stringify(value);
  return String(value);
}

// The text of a name component, whatever its styles
function plainText(c) {
  if (c === undefined || c === null) return '';
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map(plainText).join('');
  return (c.text ?? c.fallback ?? '') + plainText(c.extra);
}

function modifierFunctions(modifier) {
  if (typeof modifier !== 'string') return pk.functionList(modifier);
  const file = pk.modifierPath(modifier);
  return file && pk.exists(file) ? pk.functionList(pk.loadJson(file)) : [];
}

// Facts after the modifiers ran in order
function apply(base, modifiers) {
  const facts = { base, name: '', model: '', data: {} };
  for (const modifier of modifiers) {
    for (const fn of modifierFunctions(modifier)) {
      const kind = pk.bareType(fn);
      if (kind === 'set_name') facts.name = plainText(fn.name);
      else if (kind === 'set_custom_data' && typeof fn.tag === 'string') Object.assign(facts.data, pk.parseSnbt(fn.tag));
      else if (kind === 'set_components') {
        const components = fn.components ?? {};
        if (components['minecraft:item_model']) facts.model = components['minecraft:item_model'];
        // A book is named by its custom name, or by its title when it has none
        const title = components['minecraft:written_book_content']?.title;
        if (title) facts.name = facts.name || plainText(title.raw ?? title);
        if (components['minecraft:custom_name']) facts.name = plainText(components['minecraft:custom_name']);
      }
    }
  }
  return facts;
}

function* entries(node, pool, table) {
  for (const entry of pk.asList(node)) {
    if (entry.type?.replace('minecraft:', '') === 'item' && entry.name) yield apply(entry.name, [...pk.asList(entry.modifier), ...pool, ...table]);
    for (const key of ['children', 'entries']) if (entry[key]) yield* entries(entry[key], pool, table);
  }
}

const rows = new Map();
for (const file of pk.walk(LOOT_TABLES, '.json')) {
  const table = pk.loadJson(file);
  const root = pk.asList(table.modifier);
  for (const pool of table.pools ?? []) {
    for (const facts of entries(pool.entries, pk.asList(pool.modifier), root)) {
      const { DungeonLootId: id, ...rest } = facts.data;
      if (!id && !facts.name && !facts.model) continue;
      const row = [facts.name, facts.base, facts.model, id ? id.value : '', snbt(rest) === '{}' ? '' : snbt(rest)];
      rows.set(JSON.stringify(row), row);
    }
  }
}

const sorted = [...rows.values()].sort((a, b) => {
  if (a[3] !== '' && b[3] !== '') return a[3] - b[3] || a[0].localeCompare(b[0]);
  if (a[3] !== '' || b[3] !== '') return a[3] === '' ? 1 : -1;
  return a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]);
});

const cell = (v) => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
const out = [['Item name', 'Base item', 'Client item', 'DungeonLootId', 'Additional custom options'], ...sorted].map((r) => r.map(cell).join(',')).join('\n') + '\n';
const target = path.resolve(process.argv[2] ?? path.join(pk.ROOT, 'dungeon_loot_items.csv'));
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, out);
console.log(`wrote ${sorted.length} rows to ${pk.rel(target)}`);
