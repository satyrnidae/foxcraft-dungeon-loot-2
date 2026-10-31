// Shared by viewer.mjs and build_site.mjs: the book index of tests/.cache/books, with each book's icon resolved from its item model, and
// the glint texture, from the pack and the client jar.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

import { decodePng, encodeApng, glintFrames } from './apng.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CACHE = path.join(ROOT, 'tests', '.cache');
export const BOOKS = path.join(CACHE, 'books');
const MC = path.join(CACHE, 'mc');
export const VIEWER = path.join(CACHE, 'viewer');
export const ICON = path.join(VIEWER, 'written_book.png');
export const GLINT = path.join(VIEWER, 'glint.png');
export const ICONS = path.join(VIEWER, 'icons');
const ICON_ENTRY = 'assets/minecraft/textures/item/written_book.png';
const GLINT_ENTRY = 'assets/minecraft/textures/misc/enchanted_glint_item.png';

//region Client jar

/** One entry of a zip, read through its central directory, null when it is not there. */
function readZipEntry(file, entry) {
  const buf = fs.readFileSync(file);
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error(`${file} is not a zip`);
  let count = buf.readUInt16LE(eocd + 10);
  let at = buf.readUInt32LE(eocd + 16);
  for (; count > 0; count--) {
    const method = buf.readUInt16LE(at + 10);
    const size = buf.readUInt32LE(at + 20);
    const nameLength = buf.readUInt16LE(at + 28);
    const extraLength = buf.readUInt16LE(at + 30);
    const commentLength = buf.readUInt16LE(at + 32);
    const local = buf.readUInt32LE(at + 42);
    const name = buf.toString('utf8', at + 46, at + 46 + nameLength);
    if (name === entry) {
      const dataAt = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
      const raw = buf.subarray(dataAt, dataAt + size);
      return method === 0 ? raw : zlib.inflateRawSync(raw);
    }
    at += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

let jarBuffer;
let jarFound;

/** The client jar in tests/.cache/mc, the newest version, null when there is none. */
function jar() {
  if (jarFound === undefined) {
    const versions = fs.existsSync(MC) ? fs.readdirSync(MC).filter((v) => fs.existsSync(path.join(MC, v, `${v}.jar`))).sort() : [];
    jarFound = versions.length ? path.join(MC, versions[versions.length - 1], `${versions[versions.length - 1]}.jar`) : null;
  }
  return jarFound;
}

const jarEntry = (entry) => (jar() ? readZipEntry(jar(), entry) : null);

/** Puts the default written book icon and the glint texture in the cache, false when there is no client jar to take them from. */
export function prepareIcon() {
  if (fs.existsSync(ICON) && fs.existsSync(GLINT)) return true;
  if (!jar()) return false;
  const icon = jarEntry(ICON_ENTRY), glint = jarEntry(GLINT_ENTRY);
  if (!icon || !glint) return false;
  fs.mkdirSync(VIEWER, { recursive: true });
  fs.writeFileSync(ICON, icon);
  fs.writeFileSync(GLINT, glint);
  return true;
}

//endregion
//region Icons

const splitId = (id) => (id.includes(':') ? id.split(':') : ['minecraft', id]);

/** A file of an asset folder, the resource pack's own first and the client jar's under it, as in game. */
function asset(id, folder, ext) {
  const [ns, rel] = splitId(id);
  const own = path.join(ROOT, 'texturepack', 'assets', ns, folder, `${rel}.${ext}`);
  if (fs.existsSync(own)) return fs.readFileSync(own);
  return jarEntry(`assets/${ns}/${folder}/${rel}.${ext}`);
}

/** The first model id in an item definition, whatever switch or condition it sits under. */
function firstModel(node) {
  if (!node || typeof node !== 'object') return null;
  if (typeof node.model === 'string') return node.model;
  for (const v of Object.values(node)) {
    const found = firstModel(v);
    if (found) return found;
  }
  return null;
}

const GLINT_FRAMES = 60, GLINT_FPS = 15;
const icons = new Map();

/** The icon file, under icons/, of an item model id such as foxcraft_dungeon_loot:random_loot/written_letter, null when it has none. */
function iconOf(itemModel, glint) {
  const key = `${itemModel}${glint ? '#glint' : ''}`;
  if (icons.has(key)) return icons.get(key);
  let result = null;
  try {
    const def = asset(itemModel, 'items', 'json');
    let model = def && firstModel(JSON.parse(def.toString('utf8')));
    // layer0 of the model, or of its parent when it has none of its own
    let texture = null;
    for (let depth = 0; model && !texture && depth < 4; depth++) {
      const json = asset(model, 'models', 'json');
      if (!json) break;
      const parsed = JSON.parse(json.toString('utf8'));
      texture = parsed.textures?.layer0 ?? null;
      model = parsed.parent ?? null;
    }
    const png = texture && asset(texture, 'textures', 'png');
    if (png) {
      const name = `${splitId(itemModel).join('__').replace(/\//g, '_')}${glint ? '.glint' : ''}.png`;
      fs.mkdirSync(ICONS, { recursive: true });
      // A glinting item is one loop of the glint as an animated PNG, 60 frames at 15 a second, 4 seconds
      const glintTexture = glint && fs.existsSync(GLINT) ? decodePng(fs.readFileSync(GLINT)) : null;
      if (glintTexture) {
        const icon = decodePng(png);
        fs.writeFileSync(path.join(ICONS, name), encodeApng(glintFrames(icon, glintTexture, GLINT_FRAMES), icon.width, icon.height, GLINT_FPS));
      } else {
        fs.writeFileSync(path.join(ICONS, name), png);
      }
      result = `icons/${name}`;
    }
  } catch {
    result = null;
  }
  icons.set(key, result);
  return result;
}

const generatedDir = () => /"generatedDirectory"\s*:\s*"([^"]+)"/.exec(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8'))?.[1] ?? '__generated__';

/** The item model a generated book sets, else its item's own, and whether the item is a written book, which glints. */
function itemOf(name) {
  const dir = generatedDir();
  const readJson = (file) => (fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null);
  const find = (node, key) => {
    if (!node || typeof node !== 'object') return null;
    if (typeof node[key] === 'string') return node[key];
    for (const v of Object.values(node)) {
      const found = find(v, key);
      if (found) return found;
    }
    return null;
  };
  const modifier = readJson(path.join(ROOT, 'data', 'foxcraft_dungeon_loot', 'item_modifier', 'random_loot', 'book', dir, `${name}.json`));
  const table = readJson(path.join(ROOT, 'data', 'foxcraft_dungeon_loot', 'loot_table', 'item', 'random_loot', 'book', dir, `${name}.json`));
  const item = find(table, 'name') ?? 'minecraft:written_book';
  const model = find(modifier, 'minecraft:item_model') ?? item;
  const glint = item === 'minecraft:written_book';
  return { icon: iconOf(model, glint), glint };
}

const itemCache = new Map();
const bookItem = (name) => {
  if (!itemCache.has(name)) itemCache.set(name, itemOf(name));
  return itemCache.get(name);
};

//endregion
//region Book index

const isPage = (f) => /^page_\d+\.png$/.test(f);
/** The numbers of the pages in a folder that have link areas, from their page_NN.links.json. */
const linkPages = (dir) => fs.readdirSync(dir).map((f) => /^page_(\d+)\.links\.json$/.exec(f)).filter(Boolean).map((m) => Number(m[1]));
/** The numbers of the pages in a folder that have a heading, from their page_NN.heading marker files. */
const headingPages = (dir) => fs.readdirSync(dir).map((f) => /^page_(\d+)\.heading$/.exec(f)).filter(Boolean).map((m) => Number(m[1]));
const pagesIn = (dir) => fs.readdirSync(dir).filter(isPage).sort();

/** Every book under a locale folder: a folder with page_NN.png files is one, the folders above it are its group. */
function scan(localeDir, locale, rel = []) {
  const dir = path.join(localeDir, ...rel);
  const pages = pagesIn(dir);
  const found = [];
  if (pages.length) {
    const filtered = fs.existsSync(path.join(dir, 'filtered')) ? pagesIn(path.join(dir, 'filtered')).length : 0;
    found.push({
      locale,
      group: rel.length > 1 ? rel.slice(0, -1).join('/') : '',
      id: rel[rel.length - 1],
      name: rel.join('/'),
      ...bookItem(rel.join('/')),
      pages: pages.length,
      filteredPages: filtered,
      links: linkPages(dir),
      filteredLinks: fs.existsSync(path.join(dir, 'filtered')) ? linkPages(path.join(dir, 'filtered')) : [],
      headings: headingPages(dir),
      filteredHeadings: fs.existsSync(path.join(dir, 'filtered')) ? headingPages(path.join(dir, 'filtered')) : [],
      hasTooltip: fs.existsSync(path.join(dir, 'tooltip.png')),
    });
  }
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory() && e.name !== 'filtered') found.push(...scan(localeDir, locale, [...rel, e.name]));
  }
  return found;
}

export function index() {
  const locales = fs.readdirSync(BOOKS, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name)
    .sort((a, b) => (a === 'en_us' ? -1 : b === 'en_us' ? 1 : a.localeCompare(b)));
  const books = locales.flatMap((l) => scan(path.join(BOOKS, l), l));
  return { locales, books };
}

//endregion
