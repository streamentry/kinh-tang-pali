import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://streamentry.github.io',
  base: '/kinh-tang-pali',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
