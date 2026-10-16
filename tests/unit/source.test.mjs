// One generated test per item source file in src/foxcraft_dungeon_loot/item/.
//
// Checks what the compiler and the game would only reveal at runtime: a hook that is not listed in its function tag never
// runs, a clock that nothing schedules never ticks, and a predicate, modifier, loot table, advancement, tag or sound named
// in a command that does not exist fails silently or logs an error in game.
import assert from 'node:assert/strict';
import path from 'node:path';
import { describe, it } from 'node:test';

import { Checks, escapeRegex } from './checks.mjs';
import * as pk from './packdata.mjs';

const NS = pk.NS;
const SOUNDS = pk.readSounds();
const TAGS = pk.functionTags();
const ALL_SRC = pk.walk(pk.SRC).filter((f) => path.extname(f).startsWith('.mcb')).map((f) => pk.stripComments(pk.readText(f))).join('\n');
const BUILD = pk.buildExists();

/** Captures of pattern, skipping ones followed by a template expression, which are not final ids. */
function refs(code, pattern) {
  const out = [];
  for (const m of code.matchAll(new RegExp(pattern, 'g'))) {
    const end = m.index + m[0].length;
    if (end < code.length && '<%'.includes(code[end])) continue;
    out.push(m[1]);
  }
  return out;
}

/** code with the body of `function fn { ... }` cut out, so a clock that reschedules itself does not count as started. */
function withoutFunction(code, fn) {
  const m = new RegExp(`^[ \\t]*function ${escapeRegex(fn)}\\b[^{]*\\{`, 'm').exec(code);
  if (!m) return code;
  let depth = 1;
  let i = m.index + m[0].length;
  while (i < code.length && depth) {
    if (code[i] === '{') depth += 1;
    else if (code[i] === '}') depth -= 1;
    i += 1;
  }
  return code.slice(0, m.index) + code.slice(i);
}

function checkHooks(c, name, text, code) {
  const top = pk.topLevelFunctions(text);
  c.sub('event hooks are listed in their function tag', () => {
    for (const fn of top) {
      if (fn in TAGS) assert.ok(TAGS[fn].includes(`${NS}:${name}/${fn}`), `${fn} defined but not in tags/function/${fn}.json`);
    }
  });
  c.sub('function tag entries for this item are defined', () => {
    const prefix = `${NS}:${name}/`;
    for (const [tag, values] of Object.entries(TAGS)) {
      for (const value of values) {
        if (value.startsWith(prefix) && value.split('/').length === prefix.split('/').length) {
          assert.ok(top.includes(value.slice(prefix.length)), `tags/function/${tag}.json lists ${value}, which has no function`);
        }
      }
    }
  });
  c.sub('clock functions are scheduled', () => {
    for (const fn of top) {
      if (fn.startsWith('clock_')) {
        const scheduled = new RegExp(`schedule function ${NS}:${escapeRegex(name)}/${escapeRegex(fn)}\\b`).test(withoutFunction(code, fn));
        assert.ok(scheduled, `${fn} is never started outside itself, so it never runs`);
      }
    }
  });
  c.sub('scoreboard objectives added here are removed', () => {
    for (const m of code.matchAll(/scoreboard objectives add ([\w.]+)/g)) {
      assert.match(ALL_SRC, new RegExp(`scoreboard objectives remove ${escapeRegex(m[1])}\\b`), `${m[1]} is never removed`);
    }
  });
}

const dataFile = (...parts) => path.join(pk.DATA, ...parts);

function checkReferences(c, code) {
  c.sub('predicates exist', () => {
    for (const pattern of [`predicate=!?${NS}:([\\w/]+)`, `(?:if|unless) predicate ${NS}:([\\w/]+)`]) {
      for (const pid of refs(code, pattern)) assert.ok(pk.exists(dataFile('predicate', pid + '.json')), 'missing predicate ' + pid);
    }
  });
  c.sub('item modifiers exist', () => {
    for (const pid of refs(code, `item modify \\w+ \\S+(?: \\S+)? ${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('item_modifier', pid + '.json')), 'missing item modifier ' + pid);
    }
  });
  c.sub('loot tables exist', () => {
    for (const pid of refs(code, `\\bloot (?:give|spawn|insert|replace)\\b.*?\\bloot ${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('loot_table', pid + '.json')), 'missing loot table ' + pid);
    }
  });
  c.sub('advancements exist', () => {
    for (const pid of refs(code, `advancements=\\{${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('advancement', pid + '.json')), 'missing advancement ' + pid);
    }
    for (const pid of refs(code, `advancement (?:grant|revoke) \\S+ (?:only|from|through|until) ${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('advancement', pid + '.json')) || pk.exists(dataFile('advancement', pid)), 'missing advancement ' + pid);
    }
  });
  c.sub('tags exist', () => {
    for (const pid of refs(code, `type=!?#${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('tags', 'entity_type', pid + '.json')), 'missing entity type tag ' + pid);
    }
    for (const pid of refs(code, `\\bblock [~\\d. ^-]+ #${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('tags', 'block', pid + '.json')), 'missing block tag ' + pid);
    }
    for (const pid of refs(code, `\\bfunction #${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(dataFile('tags', 'function', pid + '.json')), 'missing function tag ' + pid);
    }
  });
  c.sub('sound events exist', () => {
    for (const sid of refs(code, `(?:playsound|stopsound @\\w+ \\w+) ${NS}:([\\w.]+)`)) {
      assert.ok(sid in SOUNDS, `sound event ${sid} is not in sounds.json`);
    }
  });
  c.sub('called functions exist', () => {
    if (!BUILD) return;
    for (const pid of refs(code, `\\bfunction ${NS}:([\\w/]+)`)) {
      assert.ok(pk.exists(pk.generatedFunction(pid)), 'no generated function ' + pid);
    }
  });
}

describe('item sources', () => {
  for (const file of pk.srcItemFiles()) {
    const name = pk.srcFunctionPrefix(file);
    it(name.slice('item/'.length).replaceAll('/', '__'), (t) => {
      if (!BUILD) t.diagnostic('no build output, "called functions exist" was skipped');
      const text = pk.readText(file);
      const code = pk.stripComments(text);
      const c = new Checks();
      checkHooks(c, name, text, code);
      checkReferences(c, code);
      c.done();
    });
  }
});

describe('source coverage', () => {
  it('every function tag entry resolves', (t) => {
    if (!BUILD) return t.skip('no build output, run npx mcb build for this check');
    const missing = [];
    for (const [tag, values] of Object.entries(TAGS)) {
      for (const value of values) {
        if (!pk.exists(pk.generatedFunction(value.split(':')[1]))) missing.push(`${tag} -> ${value}`);
      }
    }
    assert.deepEqual(missing, []);
  });
});
