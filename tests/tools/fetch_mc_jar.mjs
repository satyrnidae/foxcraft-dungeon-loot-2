// Download a Minecraft client jar and its version JSON from Mojang, and verify the jar's sha1.
//
//     node tests/tools/fetch_mc_jar.mjs [--version <mc_version from config.json>] [--out DIR]
//
// Writes DIR/<version>/<version>.jar and DIR/<version>/<version>.json, the layout of a launcher install, and prints the
// jar path. Files that are already there with the right sha1 are not downloaded again. The default DIR is tests/.cache/mc.
// The jar is Mojang's. It is fetched for local checks only, never commit it or publish it as a build artifact.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MANIFEST = 'https://piston-meta.mojang.com/mc/game/version_manifest_v2.json';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const configVersion = () => JSON.parse(fs.readFileSync(path.join(HERE, '..', '..', 'config.json'), 'utf8')).mc.mc_version;
export const DEFAULT_OUT = path.join(HERE, '..', '.cache', 'mc');

const sha1 = (file) => crypto.createHash('sha1').update(fs.readFileSync(file)).digest('hex');

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} -> HTTP ${response.status}`);
  return response.json();
}

/** Returns { jar, json } paths for the version, downloading what is missing or fails its sha1. */
export async function fetchClientJar(version, outDir = DEFAULT_OUT) {
  const dir = path.join(outDir, version);
  const jar = path.join(dir, `${version}.jar`);
  const json = path.join(dir, `${version}.json`);
  fs.mkdirSync(dir, { recursive: true });

  const manifest = await getJson(MANIFEST);
  const entry = manifest.versions.find((v) => v.id === version);
  if (!entry) throw new Error(`version ${version} is not in Mojang's manifest`);
  const meta = await getJson(entry.url);
  const client = meta.downloads?.client;
  if (!client) throw new Error(`version ${version} has no client download`);

  fs.writeFileSync(json, JSON.stringify(meta));
  if (!fs.existsSync(jar) || sha1(jar) !== client.sha1) {
    console.error(`downloading ${version}.jar (${(client.size / 1048576).toFixed(1)} MB)`);
    const response = await fetch(client.url);
    if (!response.ok) throw new Error(`${client.url} -> HTTP ${response.status}`);
    fs.writeFileSync(jar, Buffer.from(await response.arrayBuffer()));
    if (sha1(jar) !== client.sha1) {
      fs.rmSync(jar, { force: true });
      throw new Error(`${version}.jar failed its sha1 check`);
    }
  }
  return { jar, json };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const option = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
  try {
    const { jar } = await fetchClientJar(option('--version', configVersion()), path.resolve(option('--out', DEFAULT_OUT)));
    console.log(jar);
  } catch (exc) {
    console.error(exc.message);
    process.exit(1);
  }
}
