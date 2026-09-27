// Rewrites root-relative URLs in the built HTML ("/_astro/x.css", "/blog/",
// "url(/assets/…)") into document-relative ones ("./_astro/x.css", "../blog/"),
// so the output works wherever it is served from, with no base path baked in.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

export default function relativeLinks() {
  return {
    name: 'relative-links',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = htmlFiles(outDir);
        for (const file of files) {
          const depth = relative(outDir, file).split(sep).length - 1;
          const prefix = depth === 0 ? './' : '../'.repeat(depth);
          const html = readFileSync(file, 'utf8')
            // href="/…", src="/…" — but not protocol-relative "//host"
            .replace(/\b(href|src|srcset|action|poster)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
            // CSS url(/…) in inline styles and <style> blocks
            .replace(/url\((["']?)\/(?!\/)/g, `url($1${prefix}`);
          writeFileSync(file, html);
        }
        logger.info(`Made links relative in ${files.length} HTML file(s)`);
      },
    },
  };
}
