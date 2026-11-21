#!/usr/bin/env node
// Build the datapack and the resource pack, as npm run build. Args go to data.mjs, so
// npm run build -- --no-tests skips the tests.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { run } from './common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

for (const [script, args] of [['data.mjs', process.argv.slice(2)], ['assets.mjs', []]]) {
  const status = run(process.execPath, [path.join(HERE, script), ...args]);
  if (status !== 0) process.exit(status);
}
