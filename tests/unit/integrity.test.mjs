// Whole-pack checks that no single item owns: identity, references, resources, scoreboards, versions, old keys.
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import { scan } from '../tools/check_old_keys.mjs';
import { dicts, sorted } from './checks.mjs';
import * as pk from './packdata.mjs';

const NS = pk.NS;
const ITEMS = pk.itemTables();
const SOUNDS = pk.readSounds();
const BUILD = pk.buildExists();
const dataFile = (...parts) => path.join(pk.DATA, ...parts);
const jsonIn = (dir) => pk.walk(dir, '.json');

describe('identity', () => {
  it('loot ids are unique across items', () => {
    const owners = {};
    for (const [name, file] of ITEMS) {
      for (const id of pk.buildItem(name, file).lootIds) (owners[id] ??= []).push(name);
    }
    const clashes = Object.fromEntries(Object.entries(owners).filter(([, names]) => names.length > 1));
    assert.deepEqual(clashes, {}, 'the same DungeonLootId on more than one item');
  });

  it('loot ids are positive and not retired', () => {
    const retired = new Set([23, 24, 25, 26, 27, 84]);
    const used = new Set();
    for (const [name, file] of ITEMS) for (const id of pk.buildItem(name, file).lootIds) used.add(id);
    assert.ok([...used].every((id) => id > 0));
    assert.deepEqual([...used].filter((id) => retired.has(id)), [], 'a retired DungeonLootId was reused');
  });
});

describe('references', () => {
  it('every loot table reference resolves', () => {
    const missing = [];
    for (const file of jsonIn(dataFile('loot_table'))) {
      for (const node of dicts(pk.loadJson(file))) {
        if ((node.type || '').replace('minecraft:', '') === 'loot_table' && typeof node.value === 'string') {
          const target = pk.lootTablePath(node.value);
          if (target !== null && !pk.exists(target)) missing.push(`${pk.rel(file)} -> ${node.value}`);
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  it('every modifier reference resolves', () => {
    const missing = [];
    for (const file of jsonIn(dataFile('loot_table'))) {
      for (const node of dicts(pk.loadJson(file))) {
        for (const mid of pk.asList(node.modifier)) {
          if (typeof mid === 'string') {
            const target = pk.modifierPath(mid);
            if (target !== null && !pk.exists(target)) missing.push(`${pk.rel(file)} -> ${mid}`);
          }
        }
      }
    }
    assert.deepEqual(missing, []);
  });

  it('every set_custom_data tag is valid SNBT', () => {
    const bad = [];
    for (const file of jsonIn(dataFile('item_modifier'))) {
      for (const fn of pk.functionList(pk.loadJson(file))) {
        if (pk.bareType(fn) !== 'set_custom_data') continue;
        try {
          if (typeof fn.tag !== 'string') throw new pk.SnbtError('not an SNBT string');
          pk.parseSnbt(fn.tag);
        } catch (exc) {
          if (!(exc instanceof pk.SnbtError)) throw exc;
          bad.push(`${pk.rel(file)}: ${exc.message}`);
        }
      }
    }
    assert.deepEqual(bad, []);
  });

  it('every pack item model has a definition', () => {
    const problems = new Set();
    const pattern = new RegExp(`^${NS}:[a-z0-9_/]+$`);
    for (const file of jsonIn(pk.DATA)) {
      for (const node of dicts(pk.loadJson(file))) {
        const model = node['minecraft:item_model'];
        if (typeof model === 'string' && pattern.test(model)) {
          for (const issue of pk.resourceProblems(model)) problems.add(`${pk.rel(file)}: ${issue}`);
        }
      }
    }
    assert.deepEqual(sorted(problems), []);
  });

  it('every advancement parent exists', () => {
    const missing = [];
    for (const file of jsonIn(dataFile('advancement'))) {
      const parent = pk.loadJson(file).parent;
      if (parent && parent.startsWith(NS + ':') && !pk.exists(dataFile('advancement', parent.split(':')[1] + '.json'))) {
        missing.push(`${pk.rel(file)} -> ${parent}`);
      }
    }
    assert.deepEqual(missing, []);
  });

  it('every advancement function exists', (t) => {
    if (!BUILD) return t.skip('no build output, run npx mcb build for this check');
    const missing = [];
    for (const file of jsonIn(dataFile('advancement'))) {
      const reward = (pk.loadJson(file).rewards || {}).function;
      if (reward && !pk.exists(pk.generatedFunction(reward.split(':')[1]))) missing.push(`${pk.rel(file)} -> ${reward}`);
    }
    assert.deepEqual(missing, []);
  });
});

describe('resource pack', () => {
  it('every item definition resolves', () => {
    const problems = [];
    const itemsDir = path.join(pk.TP, 'items');
    for (const file of jsonIn(itemsDir)) {
      const model = `${NS}:${pk.posix(path.relative(itemsDir, file)).slice(0, -'.json'.length)}`;
      problems.push(...pk.resourceProblems(model));
    }
    assert.deepEqual(problems, []);
  });

  it('every sound event has its audio', (t) => {
    const missing = [];
    let ignored = 0;
    for (const [event, sound] of pk.soundFiles(SOUNDS)) {
      if (pk.exists(path.join(pk.TP, 'sounds', sound + '.ogg'))) continue;
      if (pk.GITIGNORED_AUDIO.some((p) => sound.startsWith(p))) ignored += 1;
      else missing.push(`${event} -> ${sound}`);
    }
    assert.deepEqual(missing, []);
    if (ignored) t.diagnostic(`${ignored} sound entries point at gitignored audio that is not in this checkout`);
  });

  it('every jukebox song has an item', () => {
    const songs = pk.list(dataFile('jukebox_song'), '.json').map(pk.stem);
    const discs = [];
    for (const [name, file] of ITEMS) {
      if (name.startsWith('item/special/music_disc/')) discs.push(pk.buildItem(name, file).components['minecraft:jukebox_playable'].split(':')[1]);
    }
    const a = new Set(songs);
    const b = new Set(discs);
    assert.deepEqual(sorted([...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)))), []);
  });

  it('every instrument has a swap modifier', () => {
    const key = (file) => `${path.basename(path.dirname(file))}_${pk.stem(file)}`;
    const instruments = pk.walk(dataFile('instrument', 'copper_horn'), '.json').map(key);
    const swaps = pk.walk(dataFile('item_modifier', 'special', 'copper_horn'), '.json')
      .filter((f) => ['bass', 'harmony', 'melody'].includes(pk.stem(f)) && path.dirname(path.dirname(f)).endsWith('copper_horn'))
      .map(key);
    const a = new Set(instruments);
    const b = new Set(swaps);
    assert.deepEqual(sorted([...a].filter((x) => !b.has(x)).concat([...b].filter((x) => !a.has(x)))), []);
  });

  it('every subtitle a sound event names is in lang, and every lang subtitle is used', () => {
    const lang = pk.loadJson(path.join(pk.TP_MC, 'lang', 'en_us.json'));
    const used = new Set(Object.values(SOUNDS).map((e) => e.subtitle).filter(Boolean));
    const missing = [...used].filter((k) => !(k in lang));
    const unused = Object.keys(lang).filter((k) => k.startsWith('subtitles.') && !used.has(k));
    assert.deepEqual({ missing, unused }, { missing: [], unused: [] });
  });

  it('every instrument description has a lang entry', () => {
    const lang = pk.loadJson(path.join(pk.TP_MC, 'lang', 'en_us.json'));
    const missing = pk.walk(dataFile('instrument'), '.json').map((f) => pk.loadJson(f).description.translate).filter((k) => !(k in lang));
    assert.deepEqual([...new Set(missing)], []);
  });

  it('lang has every song title', () => {
    const lang = pk.loadJson(path.join(pk.TP_MC, 'lang', 'en_us.json'));
    const missing = [];
    for (const file of pk.list(dataFile('jukebox_song'), '.json')) {
      const key = pk.loadJson(file).description.translate;
      if (!(key in lang)) missing.push(key);
    }
    assert.deepEqual(missing, []);
  });
});

describe('scoreboards', () => {
  const SRC = pk.walk(pk.SRC).filter((f) => path.extname(f).startsWith('.mcb')).map((f) => pk.stripComments(pk.readText(f))).join('\n');
  const names = (re, text) => new Set([...text.matchAll(re)].map((m) => m[1]));

  it('every objective added is removed', () => {
    const added = names(/scoreboard objectives add ([\w.]+)/g, SRC);
    const removed = names(/scoreboard objectives remove ([\w.]+)/g, SRC);
    assert.deepEqual(sorted([...added].filter((n) => !removed.has(n))), []);
  });

  it('objectives removed only in update are not added again', () => {
    const update = pk.readText(path.join(pk.SRC, 'foxcraft_dungeon_loot.mcb'));
    const block = update.slice(update.indexOf('function update_scoreboards'));
    const legacy = names(/scoreboard objectives remove ([\w.]+)/g, block);
    const added = names(/scoreboard objectives add ([\w.]+)/g, SRC);
    // The loot variant trigger is removed and re-added on purpose when versions change.
    assert.deepEqual(sorted([...legacy].filter((n) => added.has(n) && n !== 'satyrn.fdl.loot.variant')), []);
  });
});

describe('give functions', () => {
  // Every item has a give_<item> function in its source file, and every give function has a trigger.
  const GIVES = {};
  for (const file of pk.srcItemFiles()) {
    for (const m of pk.readText(file).matchAll(/^function (give_\w+)/gm)) (GIVES[m[1]] ??= []).push(pk.srcFunctionPrefix(file));
  }
  const TIERS = new Set(['leather', 'chainmail', 'iron', 'diamond', 'netherite']);

  it('names are unique', () => {
    assert.deepEqual(Object.fromEntries(Object.entries(GIVES).filter(([, owners]) => owners.length > 1)), {});
  });

  it('every item has one in its own source file', () => {
    const problems = [];
    for (const name of ITEMS.keys()) {
      const base = name.split('/').pop();
      let owner = name;
      if (name.startsWith('item/special/music_disc/')) owner = 'item/special/music_disc/main';
      else if (name.startsWith('item/special/copper_horn/')) owner = 'item/special/copper_horn/main';
      if (!(GIVES['give_' + base] || []).includes(owner)) problems.push(`${name} has no give_${base} in ${owner}.mcb`);
    }
    assert.deepEqual(problems, []);
  });

  it('every loot variant has one', () => {
    const problems = [];
    for (const [name, file] of ITEMS) {
      const scores = new Set();
      for (const node of dicts(pk.loadJson(file))) {
        const value = (node.scores || {})['satyrn.fdl.loot.variant'];
        if (Number.isInteger(value)) scores.add(value);
      }
      const prefix = `give_${name.split('/').pop()}_`;
      const found = Object.keys(GIVES).filter((n) => n.startsWith(prefix) && TIERS.has(n.slice(prefix.length))).length;
      if (found !== scores.size) problems.push(`${name} has ${scores.size} variant scores and ${found} variant give functions`);
    }
    assert.deepEqual(problems, []);
  });

  it('every give function has a trigger', (t) => {
    if (!BUILD) return t.skip('no build output, run npx mcb build for this check');
    const load = pk.readText(pk.generatedFunction('give/on_load'));
    const process = pk.readText(pk.generatedFunction('give/process'));
    const missing = Object.keys(GIVES).filter((n) => !load.includes(`scoreboard objectives add ${n} trigger`) || !process.includes(`scores={${n}=1..}`));
    assert.deepEqual(missing, []);
  });
});

describe('versions', () => {
  const config = () => pk.loadJson(path.join(pk.ROOT, 'config.json')).mc;
  const meta = (rel) => pk.loadJson(path.join(pk.ROOT, rel));

  it('versions agree', () => {
    assert.equal(config().version, meta('pack.mcmeta').meta.version);
    assert.equal(config().version, meta('texturepack/pack.mcmeta').meta.version);
  });

  it('changelog has the current version', () => {
    const { version } = config();
    for (const rel of ['pack.mcmeta', 'texturepack/pack.mcmeta']) {
      const log = meta(rel).meta.changelog;
      assert.ok(version in log, `${rel} has no changelog for ${version}`);
      assert.ok(log[version].length > 0, `${rel} changelog entry is empty`);
    }
  });

  it('pack formats', () => {
    const data = meta('pack.mcmeta').pack;
    const resource = meta('texturepack/pack.mcmeta').pack;
    assert.deepEqual([data.min_format, data.max_format], [121, 121]);
    assert.deepEqual([resource.min_format, resource.max_format], [[97, 1], [97, 1]]);
  });

  it('scoreboardsVersion is an int', () => {
    assert.ok(Number.isInteger(config().scoreboardsVersion));
  });
});

describe('old keys', () => {
  it('no pre-26.3 keys', () => {
    const { problems } = scan(path.join(pk.ROOT, 'data'));
    assert.deepEqual(problems, []);
  });
});

// Only runs with FDL_RELEASE=1. These are fine in development and wrong in a release.
describe('release readiness', { skip: process.env.FDL_RELEASE !== '1' && 'set FDL_RELEASE=1 to run release checks' }, () => {
  it('dev flag is off', () => {
    assert.equal(pk.loadJson(path.join(pk.ROOT, 'config.json')).mc.dev, false, 'mc.dev is true, a release would be a dev build');
  });

  it('version has no dev suffix', () => {
    assert.ok(!pk.loadJson(path.join(pk.ROOT, 'config.json')).mc.version.includes('+dev'));
  });
});
