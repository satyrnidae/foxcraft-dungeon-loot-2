// Whole-pack checks that no single item owns: identity, references, resources, scoreboards, versions, old keys.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it } from 'node:test';

import { scan } from '../tools/check_old_keys.mjs';
import { dicts, sorted } from './checks.mjs';
import * as pk from './packdata.mjs';

const loreLib = createRequire(import.meta.url)('../../scripts/lore/lore.js');

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

describe('villager trades', () => {
  // A villager trade is loaded without the item modifier registry, so it holds its functions inline. They must stay the ones
  // the loot table gives: the tier file of the book, then the shared define
  const NS = 'foxcraft_dungeon_loot:';
  const expand = (f) => {
    if (typeof f === 'string') return expand(pk.loadJson(dataFile('item_modifier', f.slice(NS.length) + '.json')));
    return f.type === 'minecraft:sequence' ? f.functions.flatMap(expand) : [f];
  };

  it('the mystery book trade has the functions of the common book', () => {
    const trade = pk.loadJson(dataFile('villager_trade', 'librarian', '5', 'common_mystery_book.json'));
    assert.deepEqual(trade.given_item_modifier, [`${NS}special/mystery_book/common`, `${NS}special/mystery_book/define`].flatMap(expand));
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

  it('every item modifier file is one function object', () => {
    // The registry codec rejects a bare list, only inline modifiers in a loot table may be one. Wrap in minecraft:sequence.
    const lists = jsonIn(dataFile('item_modifier')).filter((file) => Array.isArray(pk.loadJson(file))).map(pk.rel);
    assert.deepEqual(lists, []);
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

describe('enchantments', () => {
  it('pack enchantments are in no enchantment tag, so they never roll in a table, loot or trade', () => {
    const own = jsonIn(dataFile('enchantment')).map((f) => NS + ':' + pk.posix(path.relative(dataFile('enchantment'), f)).slice(0, -'.json'.length));
    const tagged = [];
    for (const ns of [NS, 'minecraft']) {
      const dir = path.join(pk.DATA, '..', ns, 'tags', 'enchantment');
      if (!pk.exists(dir)) continue;
      for (const file of pk.walk(dir, '.json')) {
        const values = JSON.stringify(pk.loadJson(file).values ?? []);
        for (const id of own) if (values.includes(id)) tagged.push(id + ' in ' + pk.rel(file));
      }
    }
    assert.deepEqual(tagged, []);
  });
});

describe('lore', () => {
  // Pixels, not characters: 44 characters of average English text in the default font, see scripts/lore/lore.js
  const MAX_LORE_WIDTH = loreLib.LORE_PIXELS;

  /**
   * The text a lore entry renders as one line: a string, a component, or a list of them joined on one line. A translate
   * component reads as its en_us lang entry.
   */
  const lineText = (entry) => loreLib.componentText(entry);

  /** The first piece of text of an entry, to find its line in the file. A translate component is found by its fallback. */
  const firstText = (entry) => {
    if (typeof entry === 'string') return entry;
    if (Array.isArray(entry)) return entry.map(firstText).find(Boolean) ?? '';
    return entry?.text ?? entry?.fallback ?? '';
  };

  /** The last piece of text of an entry. */
  const lastText = (entry) => {
    if (typeof entry === 'string') return entry;
    if (Array.isArray(entry)) return [...entry].reverse().map(lastText).find(Boolean) ?? '';
    return entry?.text ?? entry?.fallback ?? '';
  };

  /**
   * Every lore line that wraps wrong, as { file, line, endLine, kind, note, text }, the lines being where the entry sits in the file.
   * A wide line is over the limit, a short one stops early: no ending punctuation and the next word still fits.
   */
  const longLoreLines = () => {
    const long = [];
    for (const root of ['item_modifier', 'loot_table']) {
      for (const file of jsonIn(dataFile(root))) {
        const lines = pk.readText(file).split(/\r?\n/);
        let cursor = 0;
        for (const node of dicts(pk.loadJson(file))) {
          if (pk.bareType(node) !== 'set_lore' || !Array.isArray(node.lore)) continue;
          const entries = [];
          for (const entry of node.lore) {
            const text = lineText(entry);
            // Lore entries come in file order, so search on from the last one found
            const needle = JSON.stringify(firstText(entry)).slice(1, -1);
            let at = needle ? lines.findIndex((l, i) => i >= cursor && l.includes(needle)) : -1;
            if (at < 0 && needle) at = lines.findIndex((l) => l.includes(needle));
            const lastNeedle = JSON.stringify(lastText(entry)).slice(1, -1);
            let end = at >= 0 && lastNeedle ? lines.findIndex((l, i) => i >= at && l.includes(lastNeedle)) : at;
            if (end < at) end = at;
            if (at >= 0) cursor = end + 1;
            const width = loreLib.componentWidth(entry);
            const where = { file: pk.rel(file), line: at >= 0 ? at + 1 : 1, endLine: end >= 0 ? end + 1 : 1, text };
            entries.push({ ...where, width });
            if (width > MAX_LORE_WIDTH) long.push({ ...where, kind: 'wide', note: `${width} pixels, ${MAX_LORE_WIDTH} fit, ${loreLib.wrapAdvice(text)}` });
          }
          for (const { index, word } of loreLib.shortLines(entries)) {
            const { width, ...where } = entries[index];
            long.push({ ...where, kind: 'short', note: `no ending punctuation, "${word}" from the next line fits, ${width + loreLib.loreWidth(' ' + word)} of ${MAX_LORE_WIDTH} pixels` });
          }
        }
      }
    }
    return long;
  };
  const describeLine = (l) => `${l.file}:${l.line}: ${l.note}: "${l.text}"`;

  /**
   * The lines changed against HEAD, staged or not, as a Map from file to [start, end] ranges of the new text. A file git does not
   * track yet maps to null, all of it is new. Null when git cannot tell.
   */
  const changedLines = () => {
    try {
      const git = (args) => execFileSync('git', args, { cwd: pk.ROOT, encoding: 'utf8', maxBuffer: 1 << 26 });
      const changed = new Map();
      let file = null;
      for (const line of git(['diff', '-U0', 'HEAD']).split(/\r?\n/)) {
        if (line.startsWith('+++ ')) {
          file = line.startsWith('+++ b/') ? line.slice(6) : null;
          if (file && !changed.has(file)) changed.set(file, []);
        } else if (file && line.startsWith('@@')) {
          const m = /\+(\d+)(?:,(\d+))?/.exec(line);
          const count = m[2] === undefined ? 1 : Number(m[2]);
          if (count > 0) changed.get(file).push([Number(m[1]), Number(m[1]) + count - 1]);
        }
      }
      for (const name of git(['ls-files', '--others', '--exclude-standard']).split(/\r?\n/).filter(Boolean)) changed.set(name, null);
      return changed;
    } catch {
      return null;
    }
  };
  const inEdit = (changed, l) => {
    if (!changed.has(l.file)) return false;
    const ranges = changed.get(l.file);
    return ranges === null || ranges.some(([s, e]) => l.line <= e && l.endLine >= s);
  };

  // Lore on a line that is part of an edit, staged or not, must already fit. The test fails right after listing the lines.
  // Over-width lines the edit did not touch are only warnings, so old lore never blocks a build and never shows as a failure.
  it('lore lines in the edit fit the average width of 44 characters and do not stop early', async (t) => {
    const changed = changedLines();
    if (changed === null) return t.skip('git cannot list the changed lines');
    const long = longLoreLines();
    const mine = long.filter((l) => inEdit(changed, l));
    // Old over-width lines are todos, one per line named path:line so the terminal can link to it. The subtests pass, a failing todo is
    // drawn as a failure and fills the end of the report with red.
    for (const l of long.filter((l) => !inEdit(changed, l))) {
      await t.test(describeLine(l), { todo: l.kind === 'wide' ? 'lore line over ' + MAX_LORE_WIDTH + ' pixels' : 'lore line wrapped early' }, () => {});
    }
    if (mine.length) assert.fail(`${mine.length} lore lines are wrapped wrong in the edit, over ${MAX_LORE_WIDTH} pixels or stopping early:\n${mine.map(describeLine).join('\n')}`);
  });
  /** Modifier ids, inline functions and lists of them, as the flat list of functions they run. */
  const resolveModifier = (m) => {
    if (m === undefined || m === null) return [];
    if (Array.isArray(m)) return m.flatMap(resolveModifier);
    if (typeof m === 'string') {
      const file = pk.modifierPath(m);
      return file && pk.exists(file) ? pk.functionList(pk.loadJson(file)) : [];
    }
    return pk.functionList(m);
  };

  /** What set_lore does to the lines already on the item, by its mode. */
  const applyLore = (lore, fn) => {
    const added = (fn.lore ?? []).map(lineText);
    const mode = (typeof fn.mode === 'string' ? fn.mode : fn.mode?.type ?? 'replace_all').replace('minecraft:', '');
    const offset = Math.min(fn.offset ?? 0, lore.length);
    if (mode === 'append') return [...lore, ...added];
    if (mode === 'insert') return [...lore.slice(0, offset), ...added, ...lore.slice(offset)];
    if (mode === 'replace_section') return [...lore.slice(0, offset), ...added, ...lore.slice(offset + (fn.size ?? added.length))];
    return added;
  };

  it('no lore line is repeated once the modifiers have run in order', () => {
    // A pool entry's own modifiers run first, then the pool's, then the loot table's root modifier, so a base define that inserts
    // or appends lines on top of a tier file that already wrote them repeats those lines.
    const repeats = [];
    for (const file of jsonIn(dataFile('loot_table', 'item'))) {
      const table = pk.loadJson(file);
      (table.pools ?? []).forEach((pool, poolIndex) => {
        for (const entry of pool.entries ?? []) {
          let lore = [];
          let any = false;
          for (const fn of [...resolveModifier(entry.modifier), ...resolveModifier(pool.modifier), ...resolveModifier(table.modifier)]) {
            if (pk.bareType(fn) !== 'set_lore') continue;
            any = true;
            lore = applyLore(lore, fn);
          }
          if (!any) continue;
          const seen = new Set();
          for (const line of lore) {
            // Short lines repeat on purpose, such as two paragraphs that both end 'in your off-hand.'. A pasted blurb has long lines.
            if (line.trim().length < 25) continue;
            if (seen.has(line)) repeats.push(`${pk.rel(file)}: pool ${poolIndex} (${entry.name ?? entry.type}) repeats "${line}"`);
            seen.add(line);
          }
        }
      });
    }
    assert.deepEqual(repeats, [], `${repeats.length} repeated lore lines`);
  });
});

describe('enchantment functions', () => {
  it('every function in src/enchantment is used, and every enchantment has a source file', () => {
    const srcDir = path.join(pk.SRC, 'foxcraft_dungeon_loot', 'enchantment');
    const files = pk.walk(srcDir, '.mcb');
    assert.ok(files.length > 0, 'no enchantment sources found');
    const everything = [...pk.walk(pk.DATA, '.json'), ...files].map((f) => pk.readText(f)).join('\n');
    const unused = [];
    for (const file of files) {
      const name = path.basename(file, '.mcb');
      for (const m of pk.readText(file).matchAll(/^function (\w+)/gm)) {
        const id = NS + ':enchantment/' + name + '/' + m[1];
        if (!everything.includes(id)) unused.push(id);
      }
    }
    assert.deepEqual(unused, []);
    const missing = jsonIn(dataFile('enchantment')).map((f) => path.basename(f, '.json')).filter((n) => !pk.exists(path.join(srcDir, n + '.mcb')));
    assert.deepEqual(missing, [], 'an enchantment has no source file');
  });
});

describe('enchantment books', () => {
  it('every pack enchantment has a give_<name>_book trigger that gives its book', (t) => {
    if (!BUILD) return t.skip('no build output, run npx mcb build for this check');
    const dev = pk.loadJson(path.join(pk.ROOT, 'config.json')).mc.dev;
    if (!dev) return;
    const load = pk.readText(pk.generatedFunction('give/on_load'));
    const process = pk.readText(pk.generatedFunction('give/process'));
    const missing = [];
    for (const file of jsonIn(dataFile('enchantment'))) {
      const rel = pk.posix(path.relative(dataFile('enchantment'), file)).slice(0, -'.json'.length);
      const name = 'give_' + rel.split('/').pop() + '_book';
      if (!load.includes('scoreboard objectives add ' + name + ' trigger') || !process.includes('give/book_' + name)) missing.push(name);
      const max = pk.loadJson(file).max_level || 1;
      if (!process.includes('give_' + rel.split('/').pop() + '_book=' + (max + 1) + '..}] ' + name + ' ' + max)) missing.push(name + ' is not limited to level ' + max);
      const book = pk.readText(pk.generatedFunction('give/book_' + name));
      if (!book.includes(NS + ':' + rel)) missing.push(name + ' names the wrong enchantment');
    }
    assert.deepEqual(missing, []);
  });
});

describe('give functions', () => {
  // Every item has a give_<item> function in its source file, and every give function has a trigger.
  const GIVES = {};
  for (const file of pk.srcItemFiles()) {
    for (const m of pk.readText(file).matchAll(/^function (give_\w+)/gm)) (GIVES[m[1]] ??= []).push(pk.srcFunctionPrefix(file));
  }
  const TIERS = new Set(['leather', 'chainmail', 'copper', 'iron', 'diamond', 'netherite', 'uncommon', 'rare', 'epic', 'mythic']);

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

  // A tier variant such as give_longsword_diamond has no trigger of its own, its base function takes the tier as the value
  const isVariant = (name) => [...TIERS].some((tier) => name.endsWith('_' + tier) && GIVES[name.slice(0, -(tier.length + 1))]);

  it('every give function has a trigger', (t) => {
    if (!BUILD) return t.skip('no build output, run npx mcb build for this check');
    const load = pk.readText(pk.generatedFunction('give/on_load'));
    const process = pk.readText(pk.generatedFunction('give/process'));
    const dev = pk.loadJson(path.join(pk.ROOT, 'config.json')).mc.dev;
    if (!dev) {
      // A release build has no triggers and no clock
      assert.ok(!load.includes('trigger') && !process.includes('scores='));
      return;
    }
    const plain = Object.keys(GIVES).filter((n) => !isVariant(n));
    const missing = plain.filter((n) => !load.includes(`scoreboard objectives add ${n} trigger`) || !process.includes(`scores={${n}=`));
    assert.deepEqual(missing, []);
    const extra = Object.keys(GIVES).filter((n) => isVariant(n) && load.includes(`objectives add ${n} trigger`));
    assert.deepEqual(extra, [], 'a tier variant has its own trigger');
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

  // The game ignores an unknown summon key without an error, so an old one only shows as a wrong look or behavior in game.
  // Todo subtests, one per hit as path:line, so they are counted without failing the run.
  it('summons use no ignored pre-26.3 keys', async (t) => {
    // Area effect cloud: the colour is potion_contents.custom_color, effects are potion_contents.custom_effects and the particle is custom_particle
    const IGNORED = [
      { entity: 'area_effect_cloud', key: 'Color', use: 'potion_contents:{custom_color:...}' },
      { entity: 'area_effect_cloud', key: 'Effects', use: 'potion_contents:{custom_effects:[...]}' },
      { entity: 'area_effect_cloud', key: 'Potion', use: 'potion_contents:{potion:...}' },
      { entity: 'area_effect_cloud', key: 'Particle', use: 'custom_particle' },
      { entity: 'area_effect_cloud', key: 'PotionColor', use: 'potion_contents:{custom_color:...}' },
    ];
    const hits = [];
    for (const file of [...pk.walk(pk.SRC, '.mcb'), ...pk.walk(pk.SRC, '.mcbt')]) {
      pk.readText(file).split(/\r?\n/).forEach((line, i) => {
        for (const { entity, key, use } of IGNORED) {
          if (line.includes('summon minecraft:' + entity) && new RegExp('[{,]' + key + ':').test(line)) {
            hits.push(`${pk.rel(file)}:${i + 1}: ${entity} ${key} is ignored, use ${use}`);
          }
        }
      });
    }
    for (const hit of hits) {
      await t.test(hit, { todo: 'ignored summon key' }, () => {});
    }
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
