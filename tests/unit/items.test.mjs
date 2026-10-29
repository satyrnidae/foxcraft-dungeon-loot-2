// One generated test per item.
//
// Items are discovered from loot_table/item/**, except item/random_loot. Discs and copper horns are under
// item/special/music_disc/ and item/special/copper_horn/, named like their modifier folders. Each test builds the item
// from its loot table and modifiers, then checks it against rules every item must follow.
//
// Test names read item__<folder>__<rarity or group>__<item>, so `node tests/run_all.mjs -k chainsaw` runs one item.
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import { Checks, isByte, sorted } from './checks.mjs';
import * as pk from './packdata.mjs';

const ITEMS = pk.itemTables();
const SOUNDS = pk.readSounds();
const LANG_PATH = path.join(pk.TP_MC, 'lang', 'en_us.json');
const LANG = pk.exists(LANG_PATH) ? pk.loadJson(LANG_PATH) : {};

const basename = (name) => name.split('/').pop();
const isIgnoredAudio = (p) => pk.GITIGNORED_AUDIO.some((prefix) => p.startsWith(prefix));

/** Problems with a sound event id from this namespace, such as one missing from sounds.json or its audio file. */
function soundProblems(event) {
  const body = SOUNDS[event];
  if (body === undefined) return [`sound event ${event} is not in sounds.json`];
  const problems = [];
  for (const [, soundPath] of pk.soundFiles({ [event]: body })) {
    if (isIgnoredAudio(soundPath)) continue;
    const file = path.join(pk.TP, 'sounds', soundPath + '.ogg');
    if (!pk.exists(file)) problems.push('missing audio ' + pk.rel(file));
  }
  return problems;
}

/** Every custom_data SNBT string a predicate asks for. */
function predicatePatterns(node) {
  const out = [];
  if (Array.isArray(node)) {
    for (const value of node) out.push(...predicatePatterns(value));
  } else if (node !== null && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      if (key === 'minecraft:custom_data' && typeof value === 'string') out.push(value);
      else out.push(...predicatePatterns(value));
    }
  }
  return out;
}

function checkIdentity(c, item) {
  c.sub('loot table and modifiers resolve', () => assert.deepEqual(item.errors, []));
  c.sub('DungeonLootId is an int', () => {
    for (const tag of item.customDataAll) {
      if ('DungeonLootId' in tag) assert.equal(tag.DungeonLootId.type, 'int', 'a byte or other type never matches the predicates');
    }
  });
  c.sub('rarity matches the folder', () => {
    const folder = item.name.startsWith('item/') ? item.name.split('/')[1] : null;
    const rarity = item.customData.Rarity;
    if (typeof rarity === 'string' && pk.RARITIES.includes(folder)) assert.equal(rarity.toLowerCase(), folder);
  });
}

/** Where an item's define.json lives: <rarity>/<item>, special/<item> for discs and horns. */
function expectedDefineId(name) {
  const parts = name.split('/');
  if (parts.length === 4 && parts[1] === 'special') return `${pk.NS}:special/${parts[2]}/${parts[3]}/define`;
  if (parts.length === 3) return `${pk.NS}:${parts[1]}/${parts[2]}/define`;
  return null;
}

function checkLayout(c, item) {
  c.sub('define.json is where the layout says', () => {
    const expected = expectedDefineId(item.name);
    if (expected === null || item.modifierIds.length === 0) return;
    assert.ok(item.modifierIds.includes(expected), `${expected} is not among ${item.modifierIds}`);
    const file = pk.modifierPath(expected);
    assert.ok(pk.exists(file), 'missing ' + pk.rel(file));
  });
}

function checkContent(c, item) {
  c.sub('loot table produces an item', () => assert.ok(item.baseItems.size > 0, 'loot table produces no item'));
  c.sub('modifier is not silently empty', () => {
    assert.ok(item.functionTypes.length > 0, 'no item functions were found');
  });
  c.sub('item models have a definition, model and texture', () => {
    for (const model of sorted(item.itemModels)) assert.deepEqual(pk.resourceProblems(model), [], model);
  });
}

function checkSource(c, item) {
  c.sub("predicates ask for this item's custom_data", () => {
    const src = pk.srcItemFor(item.name);
    if (!pk.exists(src)) return;
    const predDir = pk.predicateDir(item.name);
    const predFiles = predDir ? pk.list(predDir, '.json') : [];
    for (const file of predFiles) {
      for (const text of predicatePatterns(pk.loadJson(file))) {
        const pattern = pk.parseSnbt(text);
        const ok = item.customDataAll.some((tag) => pk.snbtMatches(pattern, tag));
        assert.ok(ok, `${pk.rel(file)} wants ${text}, which no tier of ${item.name} sets`);
      }
    }
  });
}

function checkDisc(c, item) {
  if (!item.name.startsWith('item/special/music_disc/')) return;
  c.sub('disc has a jukebox_playable that resolves', () => {
    const songId = item.components['minecraft:jukebox_playable'];
    assert.equal(typeof songId, 'string', 'no jukebox_playable component');
    const [ns, p] = songId.split(':');
    assert.equal(ns, pk.NS);
    const songFile = path.join(pk.DATA, 'jukebox_song', p + '.json');
    assert.ok(pk.exists(songFile), 'missing ' + pk.rel(songFile));
    const song = pk.loadJson(songFile);
    c.sub('song fields', () => {
      assert.ok(song.length_in_seconds > 0);
      assert.ok(song.comparator_output >= 0 && song.comparator_output <= 15);
      assert.ok(song.description.translate in LANG, 'no lang entry for ' + song.description.translate);
    });
    c.sub('song sound resolves', () => {
      const soundId = song.sound_event.sound_id;
      assert.ok(soundId.startsWith(pk.NS + ':'));
      assert.deepEqual(soundProblems(soundId.split(':')[1]), []);
    });
  });
}

function checkHorn(c, item) {
  if (!item.name.startsWith('item/special/copper_horn/')) return;
  const song = item.customData.CustomInstrument;
  if (song === undefined) return; // the random horn picks one of the others
  c.sub('CustomInstrument is the file name', () => assert.equal(song, basename(item.name)));
  c.sub('copper horn flag is a byte', () => assert.ok(isByte(item.customData.CopperGoatHorn, 1)));
  for (const part of ['bass', 'harmony', 'melody']) {
    c.sub(`${part} part`, () => {
      const inst = path.join(pk.DATA, 'instrument', 'copper_horn', song, part + '.json');
      assert.ok(pk.exists(inst), 'missing ' + pk.rel(inst));
      assert.ok(pk.exists(path.join(pk.DATA, 'item_modifier', 'special', 'copper_horn', song, part + '.json')), 'missing swap modifier');
      const body = pk.loadJson(inst);
      assert.equal(body.use_duration, 4.0);
      assert.equal(body.range, 256.0);
      assert.deepEqual(soundProblems(body.sound_event.sound_id.split(':')[1]), []);
    });
  }
  c.sub('default instrument resolves', () => {
    const def = item.components['minecraft:instrument'];
    assert.equal(typeof def, 'string');
    assert.ok(pk.exists(path.join(pk.DATA, 'instrument', def.split(':')[1] + '.json')));
  });
}

describe('items', () => {
  for (const [name, file] of ITEMS) {
    it(name.replaceAll('/', '__'), () => {
      const item = pk.buildItem(name, file);
      const c = new Checks();
      checkIdentity(c, item);
      checkLayout(c, item);
      checkContent(c, item);
      checkSource(c, item);
      checkDisc(c, item);
      checkHorn(c, item);
      c.done();
    });
  }
});
