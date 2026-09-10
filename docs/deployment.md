# Deployment

Target: **Cloudflare Pages**, static Astro output.

Build settings:

- Node: `22.20.0` (or a supported newer even Node 22 release)
- Install: `npm install --no-audit --no-fund`
- Build: `npm run build`
- Output directory: `dist`

GitHub CI validates every PR. Cloudflare credentials/project binding are intentionally not committed to the repository.
