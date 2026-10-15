// Compare the mcfunction output of two mc-build runs, ignoring how each version splits blocks.
//
// mc-build 2.x and 4.x both turn `execute ... run { ... }` and if/else chains into generated helper functions, with
// different names, folder layouts and bookkeeping. To check that a source conversion kept behavior, this inlines every
// generated helper back into its caller, drops the internal if/else score updates, collapses one-line blocks and
// compares the resulting command lists per user-named function.
//
//     node tests/tools/compare_mcfunction.mjs OLD_BUILD_ROOT NEW_BUILD_ROOT [--namespace NAME] [--diffs diffs.json]
//
// Each root contains data/<namespace>/function(s)/. 2.x writes `functions`, 4.x writes `function`.
// Exit status is 1 if any user-named function differs after normalising.
import fs from 'node:fs';
import path from 'node:path';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function load(root, namespace) {
  const base = ['function', 'functions'].map((f) => path.join(root, 'data', namespace, f)).find((p) => fs.existsSync(p));
  if (!base) {
    console.error(`no function folder under ${root}/data/${namespace}`);
    process.exit(2);
  }
  const functions = {};
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.name.endsWith('.mcfunction')) {
        const key = path.relative(base, full).split(path.sep).join('/').slice(0, -'.mcfunction'.length);
        functions[key] = fs.readFileSync(full, 'utf8').split('\n').map((l) => l.trimEnd());
      }
    }
  };
  visit(base);
  return functions;
}

function normalise(functions, name, namespace) {
  const out = [];
  const call = new RegExp(`^(.*?)run function ${escapeRegex(namespace)}:(\\S*__generated__/\\S+)\\s*$`);
  const elseCheck = /if score #(execute|ifelse) \S+ matches 0 ?/g;
  for (const line of functions[name]) {
    let text = line.trim();
    if (!text || text.startsWith('#')) continue;
    if (/scoreboard players set #(execute|ifelse) /.test(text)) continue;
    text = text.replace(/(schedule function \S+ \S+) replace$/, '$1'); // 4.x appends 'replace'
    const match = call.exec(text);
    if (match && match[2] in functions) {
      out.push(match[1].replace(elseCheck, 'ELSE ') + 'run {');
      out.push(...normalise(functions, match[2], namespace).map((inner) => '  ' + inner));
      out.push('}');
    } else {
      out.push(text.replace(elseCheck, 'ELSE '));
    }
  }
  const collapsed = [];
  for (let i = 0; i < out.length;) {
    if (out[i].endsWith('run {') && i + 2 < out.length && out[i + 2] === '}' && !out[i + 1].trimStart().endsWith('{')) {
      collapsed.push(out[i].slice(0, -1) + out[i + 1].trim());
      i += 3;
    } else {
      collapsed.push(out[i]);
      i += 1;
    }
  }
  return collapsed;
}

/** Lines only in a (-) and only in b (+), in order. A plain set difference, enough to spot what changed. */
function diffLines(a, b) {
  const inB = new Set(b);
  const inA = new Set(a);
  return [...a.filter((l) => !inB.has(l)).map((l) => '- ' + l), ...b.filter((l) => !inA.has(l)).map((l) => '+ ' + l)];
}

const args = process.argv.slice(2);
const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
if (positional.length < 2) {
  console.error('usage: node compare_mcfunction.mjs OLD_BUILD_ROOT NEW_BUILD_ROOT [--namespace NAME] [--diffs FILE]');
  process.exit(2);
}
const namespace = option('--namespace', 'foxcraft_dungeon_loot');
const oldFns = load(positional[0], namespace);
const newFns = load(positional[1], namespace);
const userOld = new Set(Object.keys(oldFns).filter((k) => !k.includes('__generated__')));
const userNew = new Set(Object.keys(newFns).filter((k) => !k.includes('__generated__')));
const onlyOld = [...userOld].filter((k) => !userNew.has(k)).sort();
const onlyNew = [...userNew].filter((k) => !userOld.has(k)).sort();
console.log(`user functions: old ${userOld.size}, new ${userNew.size}; only old: ${JSON.stringify(onlyOld.slice(0, 5))}; only new: ${JSON.stringify(onlyNew.slice(0, 5))}`);

let same = 0;
const different = [];
for (const name of [...userOld].filter((k) => userNew.has(k)).sort()) {
  const a = normalise(oldFns, name, namespace);
  const b = normalise(newFns, name, namespace);
  if (JSON.stringify(a) === JSON.stringify(b)) same += 1;
  else different.push([name, a, b]);
}
console.log(`identical after normalising: ${same}, different: ${different.length}`);
for (const [name, a, b] of different.slice(0, 10)) {
  console.log('=====', name);
  console.log(diffLines(a, b).slice(0, 14).join('\n'));
}
const diffsFile = option('--diffs');
if (diffsFile) fs.writeFileSync(diffsFile, JSON.stringify(different.map(([n, a, b]) => [n, a.join('\n'), b.join('\n')])));
process.exit(different.length ? 1 : 0);
