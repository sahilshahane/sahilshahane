import { execSync } from 'node:child_process';

// Stamped into the title block and status bar at build time, like a
// drawing's revision. Falls back quietly where git isn't available.
function git(cmd: string, fallback: string): string {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() || fallback;
  } catch {
    return fallback;
  }
}

export const REV = git('git rev-parse --short HEAD', 'dev');
export const BUILT = new Date().toISOString().slice(0, 10);
