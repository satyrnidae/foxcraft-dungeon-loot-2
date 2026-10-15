// Loads and cross-references the pack's own files for the tests. Node built-ins only.
//
// Nothing here talks to the game. It reads the JSON under data/ and texturepack/, the mc-build sources under src/, and
// the generated functions when a build exists. The SNBT reader covers what the pack writes: compounds, lists, quoted
// and bare strings, and the numeric suffixes b, s, l, f and d.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const NS = 'foxcraft_dungeon_loot';
export const DATA = path.join(ROOT, 'data', NS);
export const MC_DATA = path.join(ROOT, 'data', 'minecraft');
export const SRC = path.join(ROOT, 'src');
export const SRC_NS = path.join(SRC, NS);
export const SRC_ITEMS = path.join(SRC_NS, 'item');
export const GEN_FUNCTIONS = path.join(DATA, 'function');
export const TP = path.join(ROOT, 'texturepack', 'assets', NS);
export const TP_MC = path.join(ROOT, 'texturepack', 'assets', 'minecraft');

// Audio that is gitignored and copied in by hand. A missing file here is a warning, not a failure.
export const GITIGNORED_AUDIO = ['records/wolfgun/', 'records/c418/'];

export const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'mythic'];

export const loadJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
export const readText = (file) => fs.readFileSync(file, 'utf8');
export const exists = (file) => fs.existsSync(file);
export const posix = (p) => p.split(path.sep).join('/');
export const rel = (file) => posix(path.relative(ROOT, file));

/** Every file under dir whose name ends with ext, as absolute paths in a stable order. */
export function walk(dir, ext) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (!ext || entry.name.endsWith(ext)) out.push(full);
    }
  };
  visit(dir);
  return out.sort((a, b) => (posix(a) < posix(b) ? -1 : posix(a) > posix(b) ? 1 : 0));
}

/** Direct children of dir with the extension, sorted. */
export function list(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile() && (!ext || e.name.endsWith(ext)))
    .map((e) => path.join(dir, e.name))
    .sort();
}

export const stem = (file) => path.basename(file, path.extname(file));

// region SNBT

export class SnbtError extends Error {}

/** A numeric SNBT value. type is byte, short, int, long, float or double. */
export class Num {
  constructor(type, value) {
    this.type = type;
    this.value = value;
  }
}

const BARE_END = ',}] \t\r\n';

class Snbt {
  constructor(text) {
    this.s = text;
    this.i = 0;
  }

  ws() {
    while (this.i < this.s.length && /\s/.test(this.s[this.i])) this.i += 1;
  }

  peek() {
    this.ws();
    if (this.i >= this.s.length) throw new SnbtError('unexpected end in ' + this.s);
    return this.s[this.i];
  }

  expect(ch) {
    if (this.peek() !== ch) throw new SnbtError(`expected '${ch}' at ${this.i} in ${this.s}`);
    this.i += 1;
  }

  parse() {
    const value = this.value();
    this.ws();
    if (this.i !== this.s.length) throw new SnbtError(`trailing text at ${this.i} in ${this.s}`);
    return value;
  }

  value() {
    const c = this.peek();
    if (c === '{') return this.compound();
    if (c === '[') return this.list();
    if (c === '"' || c === "'") return this.string();
    return this.scalar();
  }

  compound() {
    this.expect('{');
    const out = {};
    if (this.peek() === '}') {
      this.i += 1;
      return out;
    }
    for (;;) {
      const c0 = this.peek();
      const key = c0 === '"' || c0 === "'" ? this.string() : this.bare();
      this.expect(':');
      out[key] = this.value();
      const c = this.peek();
      this.i += 1;
      if (c === '}') return out;
      if (c !== ',') throw new SnbtError(`expected , or } at ${this.i} in ${this.s}`);
    }
  }

  list() {
    this.expect('[');
    const out = [];
    if (this.peek() === ']') {
      this.i += 1;
      return out;
    }
    for (;;) {
      out.push(this.value());
      const c = this.peek();
      this.i += 1;
      if (c === ']') return out;
      if (c !== ',') throw new SnbtError(`expected , or ] at ${this.i} in ${this.s}`);
    }
  }

  string() {
    const quote = this.s[this.i];
    this.i += 1;
    let out = '';
    for (;;) {
      if (this.i >= this.s.length) throw new SnbtError('unterminated string in ' + this.s);
      const c = this.s[this.i];
      this.i += 1;
      if (c === '\\') {
        out += this.s[this.i];
        this.i += 1;
      } else if (c === quote) {
        return out;
      } else {
        out += c;
      }
    }
  }

  bare() {
    this.ws();
    const start = this.i;
    while (this.i < this.s.length && !(BARE_END + ':').includes(this.s[this.i])) this.i += 1;
    if (start === this.i) throw new SnbtError(`empty key at ${this.i} in ${this.s}`);
    return this.s.slice(start, this.i);
  }

  scalar() {
    this.ws();
    const start = this.i;
    while (this.i < this.s.length && !BARE_END.includes(this.s[this.i])) this.i += 1;
    const token = this.s.slice(start, this.i);
    if (token === 'true' || token === 'false') return new Num('byte', token === 'true' ? 1 : 0);
    let m = /^([-+]?\d+)([bBsSlL]?)$/.exec(token);
    if (m) {
      const kind = { '': 'int', b: 'byte', s: 'short', l: 'long' }[m[2].toLowerCase()];
      return new Num(kind, parseInt(m[1], 10));
    }
    m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)([fFdD]?)$/.exec(token);
    if (m) return new Num(m[2].toLowerCase() === 'f' ? 'float' : 'double', parseFloat(m[1]));
    return token;
  }
}

export const parseSnbt = (text) => new Snbt(text).parse();

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Num);

/**
 * Partial match with vanilla's rules: compound keys must be present, list elements need any match, numbers must have
 * the same type, so a byte never matches an int.
 */
export function snbtMatches(pattern, actual) {
  if (isObject(pattern)) {
    return isObject(actual) && Object.entries(pattern).every(([k, v]) => k in actual && snbtMatches(v, actual[k]));
  }
  if (Array.isArray(pattern)) {
    return Array.isArray(actual) && pattern.every((p) => actual.some((a) => snbtMatches(p, a)));
  }
  if (pattern instanceof Num) return actual instanceof Num && pattern.type === actual.type && pattern.value === actual.value;
  return pattern === actual;
}

/** JSON-friendly form used to compare parses, numbers as [type, value]. */
export function snbtToPlain(v) {
  if (v instanceof Num) return [v.type, v.value];
  if (Array.isArray(v)) return v.map(snbtToPlain);
  if (isObject(v)) return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, snbtToPlain(x)]));
  return v;
}

// endregion

// region Modifiers and loot tables

const splitId = (id) => {
  const i = id.indexOf(':');
  return i < 0 ? ['', id] : [id.slice(0, i), id.slice(i + 1)];
};

export function modifierPath(modifierId) {
  const [ns, p] = splitId(modifierId);
  return ns === NS ? path.join(DATA, 'item_modifier', p + '.json') : null;
}

export function lootTablePath(tableId) {
  const [ns, p] = splitId(tableId);
  return ns === NS ? path.join(DATA, 'loot_table', p + '.json') : null;
}

export const asList = (value) => (value === undefined || value === null ? [] : Array.isArray(value) ? value : [value]);

/**
 * A modifier file is one function object, and the registry rejects a bare list. Several functions are wrapped in
 * minecraft:sequence. Inline modifiers in loot tables may still be lists. Sequences are flattened, so callers see
 * the functions in the order they run.
 */
export function functionList(modifierJson) {
  const out = [];
  for (const item of asList(modifierJson)) {
    if (Array.isArray(item)) out.push(...functionList(item));
    else if (item && bareType(item) === 'sequence') out.push(...functionList(item.functions));
    else out.push(item);
  }
  return out;
}

export const bareType = (fn) => (fn.type || '').replace('minecraft:', '');

/**
 * The facts a loot table and its modifiers declare about one item. Function conditions are ignored, so a variant item
 * shows the union of what its tiers set.
 */
export class Item {
  constructor(name) {
    this.name = name;
    this.errors = [];
    this.tableIds = [];
    this.modifierIds = [];
    this.baseItems = new Set();
    this.customData = {};
    this.customDataAll = [];
    this.itemModels = new Set();
    this.components = {};
    this.hasName = false;
    this.hasLore = false;
    this.functionTypes = [];
  }

  get lootIds() {
    const ids = new Set();
    for (const tag of this.customDataAll) {
      const value = tag.DungeonLootId;
      if (value instanceof Num) ids.add(value.value);
    }
    return ids;
  }
}

function walkEntries(node, item, seen) {
  if (Array.isArray(node)) {
    for (const child of node) walkEntries(child, item, seen);
    return;
  }
  if (!isObject(node)) return;
  for (const mid of asList(node.modifier)) {
    if (typeof mid === 'string') {
      item.modifierIds.push(mid);
    } else {
      // Inline modifier on a pool or entry, used by the variant items to set a per-tier item_model.
      for (const fn of functionList(mid)) applyFunction(item, fn, 'inline modifier in ' + item.name);
    }
  }
  const kind = (node.type || '').replace('minecraft:', '');
  if (kind === 'item' && 'name' in node) item.baseItems.add(node.name);
  if (kind === 'loot_table' && typeof node.value === 'string') {
    const tableId = node.value;
    const file = lootTablePath(tableId);
    if (file !== null && !seen.has(tableId)) {
      seen.add(tableId);
      item.tableIds.push(tableId);
      if (exists(file)) walkEntries(loadJson(file), item, seen);
      else item.errors.push('missing loot table ' + tableId);
    }
  }
  for (const key of ['pools', 'entries', 'children']) {
    if (key in node) walkEntries(node[key], item, seen);
  }
}

function applyFunction(item, fn, origin) {
  const kind = bareType(fn);
  item.functionTypes.push(kind);
  if (kind === 'set_name') {
    item.hasName = true;
  } else if (kind === 'set_lore') {
    item.hasLore = true;
  } else if (kind === 'set_custom_data') {
    const tag = fn.tag;
    if (typeof tag !== 'string') {
      item.errors.push(`set_custom_data tag in ${origin} is not an SNBT string`);
      return;
    }
    let parsed;
    try {
      parsed = parseSnbt(tag);
    } catch (exc) {
      if (!(exc instanceof SnbtError)) throw exc;
      item.errors.push(`bad SNBT in ${origin}: ${exc.message}`);
      return;
    }
    Object.assign(item.customData, parsed);
    item.customDataAll.push(parsed);
  } else if (kind === 'set_components') {
    for (const [key, value] of Object.entries(fn.components || {})) {
      item.components[key] = value;
      if (key === 'minecraft:item_model') item.itemModels.add(value);
    }
  }
}

function applyModifier(item, modifierId) {
  const file = modifierPath(modifierId);
  if (file === null) return;
  if (!exists(file)) {
    item.errors.push('missing item modifier ' + modifierId);
    return;
  }
  for (const fn of functionList(loadJson(file))) applyFunction(item, fn, modifierId);
}

/** name is the path under loot_table/, such as item/mythic/chainsaw. */
export function buildItem(name, tablePath) {
  const item = new Item(name);
  const table = loadJson(tablePath);
  item.tableIds.push(`${NS}:${name}`);
  walkEntries(table, item, new Set([`${NS}:${name}`]));
  for (const mid of new Set(item.modifierIds)) applyModifier(item, mid);
  return item;
}

/** predicate/item/<rarity>/<item>/ for an item named item/<rarity>/<item>, or null for discs and horns. */
export function predicateDir(itemName) {
  const parts = itemName.split('/');
  if (parts.length === 3 && RARITIES.includes(parts[1])) return path.join(DATA, 'predicate', 'item', parts[1], parts[2]);
  return null;
}

/**
 * Every item the pack hands out as a unit: loot_table/item/** except random_loot, which holds pickers and pools.
 * Discs and copper horn variants are under item/special/. Returns a Map of name -> file.
 */
export function itemTables() {
  const out = new Map();
  const base = path.join(DATA, 'loot_table', 'item');
  for (const file of walk(base, '.json')) {
    const relPath = posix(path.relative(base, file)).slice(0, -'.json'.length);
    if (!relPath.startsWith('random_loot/')) out.set('item/' + relPath, file);
  }
  return out;
}

// endregion

// region Resource pack

export function readSounds() {
  const file = path.join(TP, 'sounds.json');
  return exists(file) ? loadJson(file) : {};
}

/** Every [event, sound name] for entries that point into this pack's namespace. */
export function soundFiles(sounds) {
  const out = [];
  for (const [event, body] of Object.entries(sounds)) {
    for (const entry of body.sounds || []) {
      const name = typeof entry === 'string' ? entry : entry.name || '';
      if (name.startsWith(NS + ':')) out.push([event, name.slice(NS.length + 1)]);
    }
  }
  return out;
}

export function itemDefinitionPath(itemModel) {
  const [ns, p] = splitId(itemModel);
  return ns === NS ? path.join(TP, 'items', p + '.json') : null;
}

export const modelTextureIds = (modelJson) =>
  Object.values(modelJson.textures || {}).filter((v) => typeof v === 'string' && !v.startsWith('#'));

/** Collect every model id named inside an item definition tree. */
export function definitionModels(node) {
  const out = [];
  if (isObject(node)) {
    if ((node.type || '').replace('minecraft:', '') === 'model' && 'model' in node) out.push(node.model);
    for (const value of Object.values(node)) out.push(...definitionModels(value));
  } else if (Array.isArray(node)) {
    for (const value of node) out.push(...definitionModels(value));
  }
  return out;
}

/** Strings describing what is missing between an item_model id and its texture. */
export function resourceProblems(itemModel) {
  const problems = [];
  const file = itemDefinitionPath(itemModel);
  if (file === null) return problems; // vanilla model
  if (!exists(file)) return ['no item definition ' + rel(file)];
  let definition;
  try {
    definition = loadJson(file);
  } catch (exc) {
    return [`item definition ${rel(file)} is not valid JSON: ${exc.message}`];
  }
  const models = definitionModels(definition);
  if (models.length === 0) problems.push(`item definition ${rel(file)} names no model`);
  for (const modelId of models) {
    const [ns, mpath] = splitId(modelId);
    if (ns !== NS) continue;
    const modelFile = path.join(TP, 'models', mpath + '.json');
    if (!exists(modelFile)) {
      problems.push('missing model ' + rel(modelFile));
      continue;
    }
    for (const tex of modelTextureIds(loadJson(modelFile))) {
      const [tns, tpath] = splitId(tex);
      if (tns !== NS) continue;
      const texFile = path.join(TP, 'textures', tpath + '.png');
      if (!exists(texFile)) problems.push('missing texture ' + rel(texFile));
    }
  }
  return problems;
}

// endregion

// region Source

/** Names declared as `function name` at column 0, which are the hooks other files can call. */
export const topLevelFunctions = (text) => [...text.matchAll(/^function ([a-z0-9_]+)/gm)].map((m) => m[1]);

export const allFunctionNames = (text) => [...text.matchAll(/^\s*function ([a-z0-9_]+)/gm)].map((m) => m[1]);

export function functionTags() {
  const out = {};
  for (const file of list(path.join(DATA, 'tags', 'function'), '.json')) {
    const values = loadJson(file).values || [];
    out[stem(file)] = values.map((v) => (typeof v === 'string' ? v : v.id || ''));
  }
  return out;
}

export const srcItemFiles = () => walk(SRC_ITEMS, '.mcb');

/** Source file for an item loot table name like item/mythic/chainsaw. The src tree mirrors loot_table/item. */
export const srcItemFor = (name) => path.join(SRC_NS, name + '.mcb');

/** Function id path of a source file, like item/mythic/chainsaw. */
export const srcFunctionPrefix = (file) => posix(path.relative(SRC_NS, file)).replace(/\.[^./]+$/, '');

export const stripComments = (text) =>
  text.split(/\r?\n/).filter((line) => !line.trimStart().startsWith('#')).join('\n');

export const generatedFunction = (pathInNs) => path.join(GEN_FUNCTIONS, pathInNs + '.mcfunction');

export const buildExists = () => walk(GEN_FUNCTIONS, '.mcfunction').length > 0;

// endregion
