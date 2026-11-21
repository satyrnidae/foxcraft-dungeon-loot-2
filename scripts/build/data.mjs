#!/usr/bin/env node
// Build the datapack: compile src/ with mc-build, run the tests on the output and zip it into
// .build/<baseArchiveName>-<version>[+dev].zip with a .sha1 beside it, as npm run data.
//
//     npm run data                 build, test, zip
//     npm run data -- --no-tests   skip the tests, as does SKIP_TESTS=1 in the environment, for when they already ran
//
// A non-dev build also runs the release checks. The client jar is fetched to tests/.cache/mc when it is missing, for the Java
// checks and for measuring the vanilla fonts; tests/ is never zipped. A failing build or test step stops before the zip.
// Needs 7-Zip as 7z, 7zz or 7za.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fetchClientJar, DEFAULT_OUT } from '../../tests/tools/fetch_mc_jar.mjs';
import { ROOT, buildFunctions, readJson, run, zipPack } from './common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const config = readJson(path.join(ROOT, 'config.json')).mc;

try {
  await fetchClientJar(config.mc_version, DEFAULT_OUT);
} catch (exc) {
  console.error(`Could not download the client jar to tests/.cache/mc: ${exc.message}`);
  process.exit(1);
}

if (buildFunctions() !== 0) {
  console.error('mc-build failed');
  process.exit(1);
}

if (!process.env.SKIP_TESTS && !process.argv.includes('--no-tests')) {
  const args = [path.join(ROOT, 'tests', 'run_all.mjs'), '--no-build', ...(config.dev ? [] : ['--release'])];
  if (run(process.execPath, args, { cwd: ROOT }) !== 0) {
    console.error('Tests failed, cowardly refusing to build the .zip file.');
    process.exit(1);
  }
}

if (config.baseArchiveName && config.version) zipPack(ROOT, `${config.baseArchiveName}-${config.version}${config.dev ? '+dev' : ''}`, path.join(HERE, 'data.exclude.txt'));
else console.warn('config.json mc has no baseArchiveName and version, nothing zipped');
