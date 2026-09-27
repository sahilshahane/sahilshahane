// @ts-check
import { defineConfig } from 'astro/config';
import relativeLinks from './src/integrations/relative-links.mjs';

// Built HTML uses relative links (see relative-links.mjs). `site` is only used
// where a full URL is required: canonical, Open Graph, JSON-LD and sitemap.xml.
export default defineConfig({
  site: 'https://www.cse.iitb.ac.in/~sahilshahane/',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Lets <Image format="webp"> rasterize our own SVGs (the IITB seal is a 55 KB
  // SVG shown at 36px). Only local, trusted SVGs go through this.
  image: { dangerouslyProcessSVG: true },
  integrations: [relativeLinks()],
});
