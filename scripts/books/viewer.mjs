#!/usr/bin/env node
// Local browser for the book pages BookRender draws to tests/.cache/books.
//
//     node scripts/books/viewer.mjs               serve on http://127.0.0.1:4173 and open it
//     node scripts/books/viewer.mjs --port 8080   another port
//     node scripts/books/viewer.mjs --no-open     do not open the browser
//
// No dependencies. Run `npm run previews` first, it draws the pages and the tooltip.png beside them. The written book icon is taken
// from the client jar in tests/.cache/mc/<version> the first time and kept in tests/.cache/viewer.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { BOOKS, FONT, ICON, ICONS, index, prepareIcon, SOUNDS } from './viewer_lib.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'viewer');

const argv = process.argv.slice(2);
const portAt = argv.indexOf('--port');
const port = portAt >= 0 ? Number(argv[portAt + 1]) : 4173;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('--port needs a port number');
  process.exit(1);
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.woff': 'font/woff', '.ogg': 'audio/ogg', '.json': 'application/json' };

//region Server

/** A file under base for a URL path, null when the path leaves base or is not a file. */
function resolveIn(base, urlPath) {
  let rel;
  try { rel = decodeURIComponent(urlPath); } catch { return null; }
  const file = path.resolve(base, '.' + path.posix.normalize('/' + rel));
  if (file !== base && !file.startsWith(base + path.sep)) return null;
  return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
}

function send(res, status, body, type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  res.end(body);
}

function sendFile(res, file) {
  send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] ?? 'application/octet-stream');
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/books.json') return send(res, 200, JSON.stringify(index()), TYPES['.json']);
  if (url.pathname.startsWith('/icons/')) {
    const icon = resolveIn(ICONS, url.pathname.slice('/icons/'.length));
    return icon ? sendFile(res, icon) : send(res, 404, 'not found');
  }
  if (url.pathname === '/fonts/minecraftfont.woff') return fs.existsSync(FONT) ? sendFile(res, FONT) : send(res, 404, 'no font');
  if (url.pathname.startsWith('/sounds/')) {
    const sound = resolveIn(SOUNDS, url.pathname.slice('/sounds/'.length));
    return sound ? sendFile(res, sound) : send(res, 404, 'not found');
  }
  if (url.pathname === '/icon.png') return fs.existsSync(ICON) ? sendFile(res, ICON) : send(res, 404, 'no icon');
  const fromCache = url.pathname.startsWith('/files/');
  const file = fromCache ? resolveIn(BOOKS, url.pathname.slice('/files/'.length)) : resolveIn(SITE, url.pathname === '/' ? '/index.html' : url.pathname);
  if (!file) return send(res, 404, 'not found');
  sendFile(res, file);
});

//endregion

if (!fs.existsSync(BOOKS) || !fs.readdirSync(BOOKS).length) {
  console.error(`No rendered books in ${BOOKS}, run npm run previews first`);
  process.exit(1);
}
if (!prepareIcon()) console.warn('No client jar in tests/.cache/mc, the books show without their icon. npm run data fetches it.');

server.on('error', (e) => {
  console.error(e.code === 'EADDRINUSE' ? `Port ${port} is in use, try --port` : e.message);
  process.exit(1);
});
server.listen(port, '127.0.0.1', () => {
  const address = `http://127.0.0.1:${port}/`;
  console.log(`Book viewer on ${address}`);
  if (!argv.includes('--no-open')) {
    const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', address]] : process.platform === 'darwin' ? ['open', [address]] : ['xdg-open', [address]];
    spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
  }
});
