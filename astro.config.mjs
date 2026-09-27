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
  integrations: [relativeLinks()],
});
