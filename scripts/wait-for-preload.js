#!/usr/bin/env node
// scripts/wait-for-preload.js
// Attend qu'un des chemins candidats du preload existe avant de rendre la main.

const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(process.cwd(), '.vite', 'preload', 'index.js'),
  path.join(process.cwd(), '.vite', 'preload', 'index.mjs'),
  path.join(__dirname, '..', 'src', 'preload', 'index.js'),
  path.join(__dirname, '..', 'src', 'preload', 'index.ts'),
  path.join(__dirname, '..', 'src', 'preload', 'preload.ts'),
  path.join(__dirname, '..', '.vite', 'preload', 'index.js'),
  path.join(__dirname, '..', 'dist', 'preload', 'index.js'),
  path.join(__dirname, '..', '.vite', 'preload', 'preload.js'),
];

function findPreloadInVite() {
  const viteRoot = path.join(process.cwd(), '.vite');
  try {
    if (!fs.existsSync(viteRoot)) return null;
    const stack = [viteRoot];
    while (stack.length) {
      const dir = stack.pop();
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile()) {
          const lname = full.toLowerCase();
          if ((lname.endsWith('.js') || lname.endsWith('.mjs')) && lname.includes('preload')) {
            return full;
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }
  return null;
}

const timeoutMs = parseInt(process.env.WAIT_PRELOAD_TIMEOUT || '30000', 10);
const pollInterval = 200;

function existsAny() {
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {
      // ignore
    }
  }
  // fallback: search recursively inside .vite for any file with 'preload' in its name/path
  const found = findPreloadInVite();
  if (found) return found;
  return null;
}

const start = Date.now();
(function poll() {
  const found = existsAny();
  if (found) {
    console.log('[wait-for-preload] found preload at', found);
    process.exit(0);
  }
  if (Date.now() - start > timeoutMs) {
    console.error('[wait-for-preload] timeout waiting for preload. Tried candidates:\n', candidates.join('\n'));
    process.exit(2);
  }
  setTimeout(poll, pollInterval);
})();
