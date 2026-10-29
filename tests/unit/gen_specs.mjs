// Regenerate tests/unit/specs/items.json from the pack as it is now.
//
// The spec is a snapshot: one entry per item with the facts the tests pin down, such as its DungeonLootId, base items,
// item models and predicates. Run it after a deliberate change, then review the diff like any other code
// change. A diff you did not expect is a bug the tests just caught.
//
//     node tests/unit/gen_specs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isByte, sorted } from './checks.mjs';
import * as pk from './packdata.mjs';

const SPEC_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'specs', 'items.json');


function specFor(name, file) {
  const item = pk.buildItem(name, file);
  const predDir = pk.predicateDir(name);
  const rarity = item.customData.Rarity;
  return {
    loot_ids: [...item.lootIds].sort((a, b) => a - b),
    dungeon_item: Boolean(isByte(item.customData.DungeonItem, 1)),
    rarity: typeof rarity === 'string' ? rarity : null,
    base_items: sorted(item.baseItems),
    named: item.hasName,
    function_types: sorted(new Set(item.functionTypes)),
    item_models: sorted(item.itemModels),
    predicates: predDir ? pk.list(predDir, '.json').map(pk.stem).sort() : [],
  };
}

const sortKeys = (v) => {
  if (Array.isArray(v)) return v.map(sortKeys);
  if (v !== null && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]));
  return v;
};

const specs = {};
for (const [name, file] of pk.itemTables()) specs[name] = specFor(name, file);
fs.mkdirSync(path.dirname(SPEC_PATH), { recursive: true });
fs.writeFileSync(SPEC_PATH, JSON.stringify(sortKeys(specs), null, 2) + '\n');
console.log(`wrote ${Object.keys(specs).length} item specs to ${pk.rel(SPEC_PATH)}`);
