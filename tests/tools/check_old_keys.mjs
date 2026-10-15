// Fail if loot tables, item modifiers, predicates or advancements still use pre-26.3 keys.
//
// 26.3 loads old keys without an error and silently drops them, so an unconverted file produces bare items with no names,
// components or conditions. This check needs no game jar. Run it from anywhere:
//
//     node tests/tools/check_old_keys.mjs [DATA_DIR]
//
// Exit status is 1 when anything is found. See tests/verifying-against-vanilla.md for the codec-based Scan tool, which is
// the stronger check but needs the client jar and Java 25.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Condition types that used to be written as "condition": "minecraft:<name>" and are now "type".
const OLD_CONDITION_NAMES = new Set([
  'alternative', 'reference', 'inverted', 'entity_properties', 'entity_scores', 'random_chance', 'weather_check',
  'killed_by_player', 'match_tool', 'block_state_property', 'survives_explosion', 'table_bonus', 'time_check',
  'value_check', 'location_check', 'damage_source_properties', 'random_chance_with_looting',
]);
// Type values that no longer exist.
const REMOVED_TYPES = new Set(['alternative', 'reference', 'looting_enchant', 'random_chance_with_looting', 'set_nbt']);
const LOOT_KINDS = new Set(['loot_table', 'item_modifier', 'predicate']);

const bare = (value) => value.split(':').pop();

/** True for "minecraft:name" or a bare "name", false for another namespace. */
const vanillaName = (value) => {
  const stripped = value.startsWith('minecraft:') ? value.slice('minecraft:'.length) : value;
  return !stripped.includes(':');
};

function walkNode(node, kind, here0, found) {
  if (Array.isArray(node)) {
    node.forEach((value, i) => walkNode(value, kind, `${here0}[${i}]`, found));
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      const here = `${here0}/${key}`;
      // minecraft:sequence still takes a functions list, it is the pool and entry key that was renamed
      const isSequence = key === 'functions' && bare(String(node.type ?? '')) === 'sequence';
      if (LOOT_KINDS.has(kind) && !isSequence && (key === 'functions' || key === 'conditions')) found.push(`${here}: old key '${key}'`);
      if (kind === 'advancement' && key === 'functions') found.push(`${here}: old key 'functions'`);
      if (LOOT_KINDS.has(kind) && key === 'function' && typeof value === 'string') found.push(`${here}: old key 'function' (now 'type')`);
      if (key === 'condition' && typeof value === 'string' && OLD_CONDITION_NAMES.has(bare(value)) && vanillaName(value)) {
        found.push(`${here}: old 'condition' type name '${value}' (now 'type')`);
      }
      if (key === 'type' && typeof value === 'string' && REMOVED_TYPES.has(bare(value)) && vanillaName(value)) {
        found.push(`${here}: removed type '${value}'`);
      }
      if (key === 'nbt' && typeof value === 'string') found.push(`${here}: item NBT string, use components or custom_data`);
      if (typeof value === 'string' && /tag\s*:\s*\{/.test(value)) found.push(`${here}: item 'tag' in SNBT '${value.slice(0, 40)}', use components`);
      if (typeof value === 'string' && (value.includes('CustomModelData') || value.includes('HideFlags'))) {
        found.push(`${here}: item NBT key in '${value.slice(0, 40)}'`);
      }
      walkNode(value, kind, here, found);
    }
  }
}

function jsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out.sort();
}

/** Scans a data/ folder. Returns { checked, problems } where problems are printable lines. */
export function scan(root) {
  const problems = [];
  let checked = 0;
  for (const file of jsonFiles(root)) {
    const parts = path.relative(root, file).split(path.sep);
    if (parts.length < 3 || !(LOOT_KINDS.has(parts[1]) || parts[1] === 'advancement')) continue;
    checked += 1;
    const found = [];
    walkNode(JSON.parse(fs.readFileSync(file, 'utf8')), parts[1], '', found);
    for (const line of found) problems.push(`${parts.join('/')} ${line}`);
  }
  return { checked, problems };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'data'));
  const { checked, problems } = scan(root);
  for (const line of problems) console.log(line);
  console.log(`checked ${checked} files, ${problems.length} old-key problems`);
  process.exit(problems.length ? 1 : 0);
}
