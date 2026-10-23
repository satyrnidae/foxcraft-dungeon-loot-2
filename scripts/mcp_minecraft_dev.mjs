// Starts the minecraft-dev MCP server listed in .mcp.json. JAVA_HOME differs per machine, so it is read from the gitignored
// .env in the repo root, the same file tests/run_all.mjs reads, instead of a path in .mcp.json. A variable already set in
// the environment wins, and without either the server uses java from PATH.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    if (line.trimStart().startsWith('#')) continue;
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[1] === 'JAVA_HOME' && process.env.JAVA_HOME === undefined) process.env.JAVA_HOME = m[2].replace(/^(["'])(.*)\1$/, '$2');
  }
}

await import(pathToFileURL(path.join(ROOT, 'node_modules', '@mcdxai', 'minecraft-dev-mcp', 'dist', 'index.js')).href);
