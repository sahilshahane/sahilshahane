import type { APIRoute } from 'astro';

// Emits /sitemap.xml at the site root (same URL as the old hand-written one).
// Every static page under src/pages is listed; dynamic routes like [slug] are skipped.
const pages = Object.keys(import.meta.glob('./**/*.{astro,md,mdx}'))
  .filter((file) => !file.includes('['))
  .map((file) => file.replace(/^\.\//, '').replace(/(^|\/)index\.\w+$/, '$1').replace(/\.\w+$/, '/'));

export const GET: APIRoute = ({ site }) => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const urls = pages
    .sort()
    .map((path) => `  <url>\n    <loc>${new URL(path, site).href}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml' } },
  );
};
