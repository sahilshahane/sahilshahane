import type { APIRoute } from 'astro';

// Emits /tech-icons.css: one `.i-<name>` class per SVG in src/assets/icons/tech,
// each setting --i (the .ico mask in main.css) to that icon as a data URI.
// One small stylesheet instead of ~35 icon requests; drop an SVG in the folder
// and use `<i class="ico i-<name>">`.
const icons = import.meta.glob<string>('../assets/icons/tech/*.svg', { query: '?raw', import: 'default', eager: true });

// URL-encode only what a data URI needs; stays smaller and gzips better than base64.
const dataUri = (svg: string) =>
  'data:image/svg+xml,' +
  svg
    .trim()
    .replace(/"/g, "'")
    .replace(/[\r\n%#<>{}]/g, encodeURIComponent);

export const GET: APIRoute = () => {
  const css = Object.entries(icons)
    .map(([file, svg]) => `.i-${file.match(/([\w-]+)\.svg$/)![1]}{--i:url("${dataUri(svg)}")}`)
    .sort()
    .join('\n');
  return new Response(css + '\n', { headers: { 'Content-Type': 'text/css' } });
};
