// Rewrites root-relative URLs in the built HTML ("/_astro/x.css", "/blog/",
// "url(/assets/…)") and CSS ("url(/_astro/font.woff2)") into document-relative
// ones ("./_astro/x.css", "../blog/", "url(../_astro/font.woff2)"), so the
// output works wherever it is served from, with no base path baked in.
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function filesWithExt(dir, ext) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return filesWithExt(path, ext);
    return name.endsWith(ext) ? [path] : [];
  });
}

// "./" for files at the root of the output, "../" per directory level below it.
const prefixFor = (outDir, file) => {
  const depth = relative(outDir, file).split(sep).length - 1;
  return depth === 0 ? './' : '../'.repeat(depth);
};

// CSS url(/…) — but not protocol-relative "//host"
const cssUrls = (text, prefix) => text.replace(/url\((["']?)\/(?!\/)/g, `url($1${prefix}`);

export default function relativeLinks() {
  return {
    name: 'relative-links',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const outDir = fileURLToPath(dir);
        const files = filesWithExt(outDir, '.html');
        for (const file of files) {
          const prefix = prefixFor(outDir, file);
          const html = readFileSync(file, 'utf8')
            // href="/…", src="/…" — but not protocol-relative "//host"
            .replace(/\b(href|src|srcset|action|poster)=(["'])\/(?!\/)/g, `$1=$2${prefix}`);
          // CSS url(/…) in inline styles and <style> blocks
          writeFileSync(file, cssUrls(html, prefix));
        }
        const sheets = filesWithExt(outDir, '.css');
        for (const file of sheets) {
          writeFileSync(file, cssUrls(readFileSync(file, 'utf8'), prefixFor(outDir, file)));
        }
        logger.info(`Made links relative in ${files.length} HTML and ${sheets.length} CSS file(s)`);
      },
    },
  };
}
