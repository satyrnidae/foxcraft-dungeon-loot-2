#!/usr/bin/env node
// Run every check in tests/ and print a summary.
//
//     node tests/run_all.mjs                run the build, the unit tests and, when a client jar is found, the Java checks
//     node tests/run_all.mjs --no-build     skip npx mcb build and reuse the current data/.../function output
//     node tests/run_all.mjs --no-java      skip the checks that need the client jar and Java 25
//     node tests/run_all.mjs --no-download  never fetch the client jar from Mojang
//     node tests/run_all.mjs --release      also run the release checks, such as mc.dev being false
//     node tests/run_all.mjs -k chainsaw    only unit tests whose name matches, repeatable
//
// Exit status is 1 when any step fails. A failing build or unit test step ends the run, the Java checks are not started. A step that cannot run, such as the Java checks without a jar, is reported as
// SKIPPED and does not fail the run.
//
// Java checks need the client jar. They use MC_JAR if set, else the launcher copy at %APPDATA%/.minecraft/versions/<mc_version>/<mc_version>.jar,
// else a copy downloaded from Mojang into tests/.cache/mc, which is what happens on CI.
// Java is JAVA25, a Java 25 executable or JDK folder, else JDK_HOME or else JAVA_HOME when it is a Java 25, else the newest
// JDK under ~/.jdks, else java on PATH. These and MC_JAR can also go in a .env file in the repo root, one KEY=value a
// line; the environment wins over it.
// Library jars are downloaded once into tests/.cache, which is gitignored.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchClientJar, fetchUnifont } from './tools/fetch_mc_jar.mjs';
import { fetchLibs } from './tools/fetch_mc_libs.mjs';

const TESTS = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(TESTS);
const CACHE = path.join(TESTS, '.cache');
// The Minecraft version under test comes from config.json, the same file src/config.js exposes to the sources.
const MC_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'config.json'), 'utf8')).mc.mc_version;
const IS_WINDOWS = process.platform === 'win32';

// KEY=value lines of the gitignored .env in the repo root, for paths that differ per machine such as JAVA25. A # starts a
// comment line, quotes around a value are dropped, and a variable already set in the environment is kept.
function loadDotEnv(file = path.join(ROOT, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    const value = m[2].replace(/^(["'])(.*)\1$/, '$2');
    if (process.env[m[1]] === undefined) process.env[m[1]] = value;
  }
}
loadDotEnv();

const say = (text = '') => console.log(text);
const run = (cmd, args, options = {}) => spawnSync(cmd, args, { stdio: 'inherit', ...options }).status ?? 1;

/** Absolute path of an executable on PATH, or null. */
function which(name) {
  const exts = IS_WINDOWS ? ['.exe', '.cmd', '.bat', ''] : [''];
  for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
    for (const ext of exts) {
      const candidate = path.join(dir, name + ext);
      if (dir && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

/** Clean the generated functions, then compile src/ with mc-build. Returns [status, why]. */
function build() {
  fs.rmSync(path.join(ROOT, 'data', 'foxcraft_dungeon_loot', 'function'), { recursive: true, force: true });
  for (const name of ['load.json', 'tick.json']) {
    fs.rmSync(path.join(ROOT, 'data', 'minecraft', 'tags', 'function', name), { force: true });
  }
  const npx = which('npx');
  if (!npx) return [null, 'npx not found'];
  return [run(npx, ['mcb', 'build'], { cwd: ROOT, shell: IS_WINDOWS }), ''];
}

function unitTests(patterns) {
  const files = fs.readdirSync(path.join(TESTS, 'unit')).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => path.join(TESTS, 'unit', f));
  const args = ['--test', ...patterns.flatMap((p) => ['--test-name-pattern', p]), ...files];
  return run(process.execPath, args, { cwd: ROOT });
}

function javaMajor(java) {
  const out = spawnSync(java, ['-version'], { encoding: 'utf8' }).stderr ?? '';
  const m = /version "(\d+)/.exec(out);
  return m ? Number(m[1]) : 0;
}

function findJava() {
  const exe = IS_WINDOWS ? 'java.exe' : 'java';
  // JAVA25 is the java executable, or the JDK folder that has it in bin
  const env = process.env.JAVA25;
  if (env && fs.existsSync(env)) return fs.statSync(env).isDirectory() ? path.join(env, 'bin', exe) : env;
  // Then the JDK of JDK_HOME, else of JAVA_HOME, when it is a Java 25
  for (const name of ['JDK_HOME', 'JAVA_HOME']) {
    const home = process.env[name] && path.join(process.env[name], 'bin', exe);
    if (home && fs.existsSync(home) && javaMajor(home) === 25) return home;
  }
  const jdks = path.join(os.homedir(), '.jdks');
  if (fs.existsSync(jdks)) {
    const candidates = fs.readdirSync(jdks).filter((d) => d.includes('25')).sort().reverse();
    for (const d of candidates) {
      const candidate = path.join(jdks, d, 'bin', exe);
      if (fs.existsSync(candidate)) return candidate;
    }
  }
  const onPath = which('java');
  return onPath && javaMajor(onPath) === 25 ? onPath : null;
}

function findJar() {
  if (process.env.MC_JAR) return process.env.MC_JAR;
  const base = process.env.APPDATA ? path.join(process.env.APPDATA, '.minecraft') : path.join(os.homedir(), '.minecraft');
  return path.join(base, 'versions', MC_VERSION, `${MC_VERSION}.jar`);
}

/** The client jar to test against: MC_JAR, the launcher's copy, or a download. Returns { jar } or { skip }. */
async function resolveJar(allowDownload) {
  const jar = findJar();
  const hasJson = (j) => fs.existsSync(j.replace(/\.jar$/, '.json'));
  if (fs.existsSync(jar) && hasJson(jar)) {
    // The launcher's jar is no help with Unifont, which the game takes from its asset index: BookRender and the font widths need it
    try {
      await fetchUnifont(JSON.parse(fs.readFileSync(jar.replace(/\.jar$/, '.json'), 'utf8')), path.join(CACHE, 'mc', MC_VERSION));
    } catch (exc) {
      console.error(`could not fetch Unifont, CJK and Arabic draw as missing glyphs: ${exc.message}`);
    }
    return { jar };
  }
  if (process.env.MC_JAR) return { skip: `no client jar at ${jar}, check MC_JAR` };
  if (!allowDownload) return { skip: `no client jar at ${jar}, drop --no-download or set MC_JAR` };
  try {
    return { jar: (await fetchClientJar(MC_VERSION, path.join(CACHE, 'mc'))).jar };
  } catch (exc) {
    return { skip: `could not download the client jar: ${exc.message}` };
  }
}

/** Returns [name, status] pairs where status is PASS, FAIL or SKIPPED. */
async function javaChecks(allowDownload) {
  const java = findJava();
  if (!java) return [['java checks', 'SKIPPED no Java 25 found, set JAVA25']];
  const found = await resolveJar(allowDownload);
  if (found.skip) return [['java checks', `SKIPPED ${found.skip}`]];
  const jar = found.jar;
  const versionJson = jar.replace(/\.jar$/, '.json');
  if (!fs.existsSync(versionJson)) return [['java checks', 'SKIPPED no version json next to the jar']];
  const javac = path.join(path.dirname(java), IS_WINDOWS ? 'javac.exe' : 'javac');
  const classes = path.join(CACHE, 'classes');
  fs.mkdirSync(classes, { recursive: true });
  let libs;
  try {
    libs = await fetchLibs(versionJson, path.join(CACHE, 'libs'));
  } catch (exc) {
    return [['java checks', `SKIPPED could not fetch libraries: ${exc.message}`]];
  }
  const classpath = [jar, ...libs].join(path.delimiter);
  const sources = ['Harness.java', 'Scan.java', 'CmdCheck.java', 'PackLoad.java', 'BookRender.java', 'ArabicShapingTable.java'].map((n) => path.join(TESTS, 'java', n));
  if (run(javac, ['-cp', classpath, '-d', classes, ...sources], { cwd: CACHE }) !== 0) return [['java compile', 'FAIL']];
  const runcp = [classes, classpath].join(path.delimiter);
  const functions = path.join(ROOT, 'data', 'foxcraft_dungeon_loot', 'function');
  const results = [];
  // Run from the cache folder, the game writes a logs/ folder into the working directory.
  for (const [label, main, ...args] of [
    // The table the book generator measures Arabic with, written again, and a failure, when the game's shaper gives another
    ['arabic shaping table (ArabicShapingTable)', 'ArabicShapingTable', path.join(ROOT, 'scripts', 'books', 'arabic_shaping.json')],
    ['vanilla behavior (Harness)', 'Harness'],
    ['data codecs (Scan)', 'Scan', path.join(ROOT, 'data')],
    ['generated commands (CmdCheck)', 'CmdCheck', functions],
    ['pack registry load (PackLoad)', 'PackLoad', ROOT],
    // Every generated book page as a PNG in tests/.cache/books, wrapped by the game's own line splitter
    ['book pages (BookRender)', 'BookRender', ROOT, path.join(CACHE, 'books')],
  ]) {
    if (main === 'CmdCheck' && !fs.existsSync(functions)) {
      results.push([label, 'SKIPPED no build output']);
      continue;
    }
    results.push([label, run(java, ['-cp', runcp, main, ...args], { cwd: CACHE }) === 0 ? 'PASS' : 'FAIL']);
  }
  return results;
}

async function main() {
  const argv = process.argv.slice(2);
  const patterns = [];
  for (let i = 0; i < argv.length; i += 1) if (argv[i] === '-k') patterns.push(argv[(i += 1)]);
  const flag = (name) => argv.includes(name);
  if (flag('--help') || flag('-h')) {
    say(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 14).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return 0;
  }
  if (flag('--release')) process.env.FDL_RELEASE = '1';
  const summary = [];

  if (flag('--no-build')) {
    summary.push(['build (npx mcb build)', 'SKIPPED --no-build']);
  } else {
    say('== build ==');
    const [code, why] = build();
    summary.push(['build (npx mcb build)', code === null ? `SKIPPED ${why}` : code === 0 ? 'PASS' : 'FAIL']);
  }

  say('\n== unit tests ==');
  summary.push(['unit tests (tests/unit)', unitTests(patterns) === 0 ? 'PASS' : 'FAIL']);

  // Fail fast: a unit test failure ends the run here, the slower Java checks would only bury its output
  if (summary.some(([, status]) => status === 'FAIL')) {
    summary.push(['java checks', 'SKIPPED not run after a failure']);
  } else if (flag('--no-java')) {
    summary.push(['java checks', 'SKIPPED --no-java']);
  } else {
    say('\n== java checks ==');
    summary.push(...(await javaChecks(!flag('--no-download'))));
  }

  say('\n== summary ==');
  const width = Math.max(...summary.map(([name]) => name.length));
  for (const [name, status] of summary) say(`${name.padEnd(width)}  ${status}`);
  // On CI a step that could not run, such as the Java checks without a jar, is a failure unless a flag skipped it.
  const ci = Boolean(process.env.CI);
  const failed = summary.filter(([, status]) => status === 'FAIL' || (ci && status.startsWith('SKIPPED') && !status.startsWith('SKIPPED --'))).map(([name]) => name);
  say(`\n${failed.length ? 'FAILED: ' + failed.join(', ') : 'all runnable checks passed'}`);
  return failed.length ? 1 : 0;
}

process.exit(await main());
