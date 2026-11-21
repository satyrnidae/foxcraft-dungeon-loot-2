// Shared by data.mjs, assets.mjs and tests/run_all.mjs: paths, running a command, compiling src/ with mc-build and zipping a pack.
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const BUILD_DIR = path.join(ROOT, '.build');
const IS_WINDOWS = process.platform === 'win32';

export const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Runs a command with its output shown and returns the exit status, 1 when it could not start. */
export const run = (cmd, args, options = {}) => spawnSync(cmd, args, { stdio: 'inherit', ...options }).status ?? 1;

/** Runs the mc-build of node_modules, `mcb <args>`, from the repo root. */
export const mcb = (...args) => run(path.join(ROOT, 'node_modules', '.bin', IS_WINDOWS ? 'mcb.cmd' : 'mcb'), args, { cwd: ROOT, shell: IS_WINDOWS });

/** Deletes the generated functions and function tags, mc-build 4.x does not clean stale output, then compiles src/ into data/. */
export function buildFunctions() {
  fs.rmSync(path.join(ROOT, 'data', 'foxcraft_dungeon_loot', 'function'), { recursive: true, force: true });
  for (const name of ['load.json', 'tick.json']) fs.rmSync(path.join(ROOT, 'data', 'minecraft', 'tags', 'function', name), { force: true });
  return mcb('build');
}

/** The 7-Zip executable on PATH as 7z, 7zz or 7za, or null. */
function find7z() {
  const exts = IS_WINDOWS ? ['.exe', ''] : [''];
  for (const name of ['7z', '7zz', '7za']) {
    for (const dir of (process.env.PATH ?? '').split(path.delimiter)) {
      for (const ext of exts) {
        const candidate = path.join(dir, name + ext);
        if (dir && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
      }
    }
  }
  return null;
}

/**
 * Zips a pack folder into .build/<stem>.zip with the sha1 in uppercase hex in <stem>.zip.sha1 beside it, leaving out what the
 * excludeFile names, relative to the folder, and its src/. An earlier build of the same stem, and its ` (n)` copies from the old scripts, are replaced.
 * Returns the zip's path, and exits with status 1 when 7-Zip is missing or fails.
 */
export function zipPack(dir, stem, excludeFile) {
  const sevenZ = find7z();
  if (!sevenZ) {
    console.error('7-Zip not found, install it as 7z, 7zz or 7za');
    process.exit(1);
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  const old = new RegExp(`^${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( \\(\\d+\\))?\\.zip(\\.sha1)?$`);
  for (const name of fs.readdirSync(BUILD_DIR)) if (old.test(name)) fs.rmSync(path.join(BUILD_DIR, name));
  const out = path.join(BUILD_DIR, `${stem}.zip`);
  if (run(sevenZ, ['a', '-tzip', out, '-i!*', `-xr@${excludeFile}`, '-x!src/*'], { cwd: dir }) !== 0) {
    console.error(`7-Zip failed on ${path.relative(ROOT, dir) || '.'}`);
    process.exit(1);
  }
  fs.writeFileSync(`${out}.sha1`, crypto.createHash('sha1').update(fs.readFileSync(out)).digest('hex').toUpperCase() + '\n');
  console.log(`wrote ${path.relative(ROOT, out)}`);
  return out;
}
