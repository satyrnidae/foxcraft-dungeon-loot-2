// Download the library jars a Minecraft version needs and print a Java classpath.
//
// The launcher's libraries folder is not always readable, and a scripted check should not depend on a launcher install,
// so this fetches the same files from Mojang's library URLs listed in the version JSON.
//
//     node tests/tools/fetch_mc_libs.mjs --version-json PATH/TO/26.3.json --out DIR
//
// Prints the downloaded jars joined with the platform's path separator.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Version JSON library rules: no rules means always; otherwise allow or disallow by os name. Only linux-neutral jars matter here. */
function appliesToThisOs(rules) {
  if (!rules || rules.length === 0) return true;
  let ok = false;
  for (const rule of rules) {
    const osName = rule.os?.name;
    if (osName !== undefined && osName !== 'linux') continue;
    ok = rule.action === 'allow';
  }
  return ok;
}

/** Downloads missing jars into outDir and returns their paths. */
export async function fetchLibs(versionJson, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const version = JSON.parse(fs.readFileSync(versionJson, 'utf8'));
  const classpath = [];
  for (const library of version.libraries) {
    if (!appliesToThisOs(library.rules)) continue;
    const artifact = library.downloads?.artifact;
    if (!artifact) continue;
    const target = path.join(outDir, path.basename(artifact.path));
    if (!fs.existsSync(target)) {
      console.error('downloading', artifact.path);
      const response = await fetch(artifact.url);
      if (!response.ok) throw new Error(`${artifact.url} -> HTTP ${response.status}`);
      fs.writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    }
    classpath.push(target);
  }
  return classpath;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const arg = (name) => args[args.indexOf(name) + 1];
  if (!args.includes('--version-json') || !args.includes('--out')) {
    console.error('usage: node fetch_mc_libs.mjs --version-json FILE --out DIR');
    process.exit(2);
  }
  console.log((await fetchLibs(arg('--version-json'), arg('--out'))).join(path.delimiter));
}
