#!/usr/bin/env node
// Zip the resource pack in texturepack/ into .build/<baseArchiveName>-<version>.zip with a .sha1 beside it, as npm run assets.
// The name and version are the meta of texturepack/pack.mcmeta, the files left out are named by scripts/build/assets.exclude.txt.
// Needs 7-Zip as 7z, 7zz or 7za.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ROOT, readJson, zipPack } from './common.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const pack = path.join(ROOT, 'texturepack');
const { baseArchiveName, version } = readJson(path.join(pack, 'pack.mcmeta')).meta;

if (baseArchiveName && version) zipPack(pack, `${baseArchiveName}-${version}`, path.join(HERE, 'assets.exclude.txt'));
else console.warn('texturepack/pack.mcmeta meta has no baseArchiveName and version, nothing zipped');
