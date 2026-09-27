// Deploys the built site (dist/) to the server's public_html over SFTP.
// Run it from the repo root after a build:
//
//   node tools/deploy-at-server.mjs                 # default target below
//   node tools/deploy-at-server.mjs --dry-run       # print what would happen
//   node tools/deploy-at-server.mjs <target>        # or set DEPLOY_TARGET
//
// <target> is an sftp:// URL, user@host:/path, or a local folder (e.g. a
// network mount of public_html).
//
// Every deployed file is listed, as a relative path, in .deployed-files inside
// the target. Each deploy uploads the new build first, then removes only the
// files from the previous list that the new build no longer has, then rewrites
// the list. Nothing that isn't on the list is ever removed.
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdtempSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, normalize, posix, relative, sep } from 'node:path';

const DEFAULT_TARGET = 'sftp://sahilshahane@mars.cse.iitb.ac.in/users/pg25/sahilshahane/public_html';
const dist = 'dist';
const manifestName = '.deployed-files';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const target = parseTarget(args.find((a) => !a.startsWith('--')) ?? process.env.DEPLOY_TARGET ?? DEFAULT_TARGET);

if (!existsSync(join(dist, 'index.html'))) {
  console.error(`error: ${dist}/index.html not found — run this from the repo root after 'npm run build'`);
  process.exit(1);
}

// Files in the new build, as relative "/"-separated paths.
const files = readdirSync(dist, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => relative(dist, join(entry.parentPath, entry.name)).split(sep).join('/'))
  .sort();
const manifest = files.join('\n') + '\n';

if (target.host) deployRemote(target);
else deployLocal(target.dir);

// ---------------------------------------------------------------------------

function parseTarget(value) {
  if (value.startsWith('sftp://')) {
    const url = new URL(value);
    const user = url.username ? `${decodeURIComponent(url.username)}@` : '';
    return { host: user + url.hostname, port: url.port, dir: trimSlash(decodeURIComponent(url.pathname)) };
  }
  const scp = /^([^/:]+):(.*)$/.exec(value); // user@host:/path
  if (scp) return { host: scp[1], port: '', dir: trimSlash(scp[2]) || '.' };
  return { dir: value };
}

function trimSlash(path) {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** Previous-deploy entries that are safe to delete and absent from the new build. */
function staleFiles(previousManifest) {
  const current = new Set(files);
  return previousManifest
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((file) => {
      const path = posix.normalize(file);
      return !isAbsolute(path) && !path.startsWith('..') && !current.has(path);
    });
}

/** Parent folders of the given files, deepest first (candidates for removal once empty). */
function parentDirs(paths) {
  const dirs = new Set();
  for (const path of paths) {
    for (let dir = posix.dirname(path); dir !== '.'; dir = posix.dirname(dir)) dirs.add(dir);
  }
  return [...dirs].sort((a, b) => b.split('/').length - a.split('/').length);
}

function deployLocal(dir) {
  if (!existsSync(dir)) {
    console.error(`error: target folder ${dir} does not exist`);
    process.exit(1);
  }
  const manifestPath = join(dir, manifestName);
  const stale = staleFiles(existsSync(manifestPath) ? readFileSync(manifestPath, 'utf8') : '');

  if (dryRun) {
    console.log(`Would copy ${files.length} file(s) to ${dir} and remove ${stale.length}:`);
    for (const file of stale) console.log(`  - ${file}`);
    return;
  }

  cpSync(dist, dir, { recursive: true, force: true });
  for (const file of stale) rmSync(join(dir, normalize(file)), { force: true });
  for (const sub of parentDirs(stale)) {
    try {
      rmdirSync(join(dir, sub));
    } catch {
      // not empty or already gone — keep it
    }
  }
  writeFileSync(manifestPath, manifest);
  console.log(`Deployed ${files.length} file(s) to ${dir}, removed ${stale.length} stale file(s)`);
}

function deployRemote({ host, port, dir }) {
  const work = mkdtempSync(join(tmpdir(), 'deploy-'));
  // One shared SSH connection, so you authenticate once for all steps.
  const control = ['-o', 'ControlMaster=auto', '-o', `ControlPath=${join(work, 'ssh.sock')}`];
  const sshPort = port ? ['-p', port] : [];
  const sftpPort = port ? ['-P', port] : [];
  const q = (path) => `"${path.replace(/"/g, '\\"')}"`;
  const remote = (path) => (dir === '/' ? `/${path}` : `${dir}/${path}`);

  const sftp = (commands) => {
    const batch = join(work, 'batch');
    writeFileSync(batch, commands.join('\n') + '\n');
    return spawnSync('sftp', [...control, ...sftpPort, '-q', '-b', batch, host], { stdio: 'inherit' }).status;
  };

  try {
    if (dryRun) {
      console.log(`Would upload ${files.length} file(s) to ${host}:${dir}`);
      console.log('(stale files are worked out from the server\'s .deployed-files at deploy time)');
      return;
    }

    console.log(`Connecting to ${host}…`);
    const master = spawnSync('ssh', [...control, ...sshPort, '-o', 'ControlPersist=yes', '-fN', host], { stdio: 'inherit' });
    if (master.status !== 0) throw new Error(`could not connect to ${host}`);

    // 1. Fetch the previous list (it's fine if there isn't one yet).
    const previousPath = join(work, 'previous');
    sftp([`-get ${q(remote(manifestName))} ${q(previousPath)}`]);
    const stale = staleFiles(existsSync(previousPath) ? readFileSync(previousPath, 'utf8') : '');

    // 2. Upload the new build, then 3. remove stale files, then 4. write the new list.
    const newManifest = join(work, 'manifest');
    writeFileSync(newManifest, manifest);
    const dirs = [...new Set(files.flatMap((f) => parentDirs([f])))].sort(
      (a, b) => a.split('/').length - b.split('/').length,
    );
    const status = sftp([
      ...dirs.map((d) => `-mkdir ${q(remote(d))}`),
      ...files.map((f) => `put ${q(join(dist, f))} ${q(remote(f))}`),
      ...stale.map((f) => `-rm ${q(remote(f))}`),
      ...parentDirs(stale).map((d) => `-rmdir ${q(remote(d))}`),
      `put ${q(newManifest)} ${q(remote(manifestName))}`,
    ]);
    if (status !== 0) throw new Error('upload failed — see sftp output above');

    console.log(`Deployed ${files.length} file(s) to ${host}:${dir}, removed ${stale.length} stale file(s)`);
  } catch (error) {
    console.error(`error: ${error.message}`);
    process.exitCode = 1;
  } finally {
    spawnSync('ssh', [...control, '-O', 'exit', host], { stdio: 'ignore' });
    rmSync(work, { recursive: true, force: true });
  }
}
