// Copies the built site from dist/ into the current directory, which nginx serves.
// Run it from the repo root:  node tools/deploy-at-server.mjs
//
// Every file copied is listed in .deployed-files. On the next deploy, exactly
// those files are removed first (so stale builds don't pile up), then the new
// build is copied and the list is rewritten. Nothing outside the list is ever
// removed.
//
// All paths are relative to the current directory — both here and in
// .deployed-files — so it works the same on the server or over a network mount.
import { cpSync, existsSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, isAbsolute, join, normalize, relative, sep } from 'node:path';

const dist = 'dist';
const manifest = '.deployed-files';

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`error: ${dist}/index.html not found — run this from the repo root after 'npm run build'`);
  process.exit(1);
}

// 1. Remove the files listed by the previous deploy.
if (existsSync(manifest)) {
  const previous = readFileSync(manifest, 'utf8').split('\n').filter(Boolean);
  const dirs = new Set();
  let removed = 0;
  for (const file of previous) {
    const path = normalize(file);
    // Only ever delete inside the current directory, never inside dist/.
    if (isAbsolute(path) || path.startsWith('..') || path === dist || path.startsWith(dist + sep)) continue;
    rmSync(path, { force: true });
    removed++;
    for (let dir = dirname(path); dir !== '.'; dir = dirname(dir)) dirs.add(dir);
  }
  // Remove folders left empty by that, deepest first.
  for (const dir of [...dirs].sort((a, b) => b.length - a.length)) {
    try {
      rmdirSync(dir);
    } catch {
      // not empty (holds files that weren't deployed) or already gone — keep it
    }
  }
  console.log(`Removed ${removed} file(s) from the previous deploy`);
}

// 2. Copy the new build.
cpSync(dist, '.', { recursive: true, force: true });

// 3. Save the list of files just deployed, as relative paths with "/" separators.
const files = readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => relative(dist, join(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort();
writeFileSync(manifest, files.join('\n') + '\n');
console.log(`Deployed ${files.length} file(s) (list saved in ${manifest})`);
