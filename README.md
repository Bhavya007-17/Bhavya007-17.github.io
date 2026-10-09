# Bhavya Dosi — portfolio

Personal robotics portfolio: a warm dark React site with an animated arm introduction, a project gallery with schematic covers, project pages, and a frame-material trade study. Built with Vite for GitHub Pages; no backend or API keys.

## Run locally

Use Node.js 24 (as in the deployment workflow):

```bash
npm ci
npm run dev
```

`npm run build` writes `dist/`, `npm run verify` checks the content and the built bundle, and `npm run preview` serves the production build. The site must be served over HTTP.

## Publish on GitHub Pages

1. Create the repository `Bhavya007-17.github.io`.
2. Add this folder at the repository root, including `.github/workflows/deploy.yml` and `package-lock.json`. Do not commit `node_modules/` or `dist/`.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. Push to `main`. The workflow builds, verifies, and deploys to `https://bhavya007-17.github.io/`.

Relative asset paths and hash routes work on both user and project Pages sites without rewrite rules.

## Edit the content

- `src/data/projects.json` — biography, experience, skills, and the seven projects (status, summary, description, key facts, highlights, media, documents, related links).
- `src/data/schematics.json` — system diagram nodes and connections for each project. Keep node counts consistent with the positions in `Schematic.jsx`.
- `src/data/tradeStudies.json` — trade-study data; totals are computed on the page from scores × weights.
- `src/components/SchematicCover.jsx` — gallery cover drawings.
- `public/media/` — screenshots, CAD renders, FEA plots, videos, and captions.
- `public/og.png` — 1200×630 link preview; its absolute URL and the canonical address are set in `index.html`.

Project IDs appear in links such as `#/project/hive`; keep them stable. `#/project/p1` still resolves to `act-training`. Trade studies live at `#/study/<id>`.

## Design and behavior

Warm charcoal surfaces, cream text, copper links, and red reserved for status and one highlighted path per diagram. The hero arm is a decorative procedural model that picks and places a cube in a loop; it can be paused, respects reduced motion, stops offscreen, and falls back to a vector drawing without WebGL. Images and diagrams open in keyboard-accessible dialogs, phones get a readable parts list under each diagram, and the HIVE film loads only when played.
