# Bhavya Dosi — portfolio

Personal robotics portfolio: a warm dark React site that leads with real project footage. The home page has a muted showreel and seven project cards; each project opens as a case study (problem, how it works, design decisions, sourced results, what didn't work, what's next, gallery). One project also links to a frame-material trade study. Built with Vite for GitHub Pages; no backend or API keys.

## Run locally

Use Node.js 24 (as in the deployment workflow):

```bash
npm ci
npm run dev
```

`npm run build` writes `dist/`, `npm run verify` checks the content, the media and the built bundle, and `npm run preview` serves the production build. The site must be served over HTTP.

## Publish on GitHub Pages

1. Create the repository `Bhavya007-17.github.io`.
2. Add this folder at the repository root, including `.github/workflows/deploy.yml` and `package-lock.json`. Do not commit `node_modules/` or `dist/`.
3. In **Settings → Pages → Build and deployment**, choose **GitHub Actions**.
4. Push to `main`. The workflow builds, verifies, and deploys to `https://bhavya007-17.github.io/`.

Relative asset paths and hash routes work on both user and project Pages sites without rewrite rules.

## Edit the content

All text lives in data files; the components only render it.

- `src/data/projects.json` has two parts.
  - `profile`: name, headline, tagline, availability, summary, links, education, experience, `skills` (groups of `{name, projects: [project ids]}`; each skill links to the first project listed) and `reel` (exactly 5 clips `{project, src, poster, caption}` for the home showreel).
  - `projects`: seven case studies, in this order: `hive`, `robotic-arm`, `amphibious-robot`, `ros2-micromouse-sync`, `act-training`, `autonomous-drone`, `jarvis-agentic-orchestrator`. Each has `id, name, status, role, team, timeline, domains[], summary, chips[]` (2–3 result chips for the card), `card` and `hero` media, `facts[]` (key numbers), `tldr[3]` (What / How / Result), `problem`, `steps[]` (title, text, optional media), `decisions[]`, `results[]` (`value, label, source`: every number names its source), `failures[]` (title, text, optional media), `next[]`, `gallery[]`, `links[]` (`label, url, kind`) and optional `documents[]` (`label`, `href` such as `#/study/amphibious-frame`). `failures`, `gallery` and `links` may be empty; a project needs at least one link or document.
  - A media object is `{type: "video" | "image", src, poster?, alt, caption?}`. Videos need a `poster`; every media object needs `alt` text. Paths look like `./media/<project-id>/<file>`.
- `src/data/tradeStudies.json`: trade-study data; totals are computed on the page from scores × weights.
- `public/media/<project-id>/`: one folder per project holding its footage and stills. Every `.mp4` has a same-name `.jpg` poster. Budgets: loop clips (`loop*.mp4`, 960×540, a few seconds, no audio, H.264 with `+faststart`) ≤ 1.5 MB; other videos ≤ 12 MB; JPG/WebP ≤ 400 KB; PNG ≤ 600 KB (screenshots with fine text only); all of `public/media` ≤ 90 MB.
- `public/og.png`: 1200×630 link preview. Its absolute URL and the canonical address are set in `index.html`.

Project IDs appear in links such as `#/project/hive`; keep them stable. `#/project/p1` still resolves to `act-training`. Trade studies live at `#/study/<id>`.

Captions and labels must say what the footage is: simulation is called simulation, CAD is called design, the amphibious clip is a tilt-ring prototype test, and ACT dataset clips are scripted-expert demonstrations, not a trained policy.

## Components

- `App.jsx`: hash routing (with scroll restoration for Back), header, hero, home sections.
- `Showreel.jsx`: plays the five `profile.reel` clips one at a time, muted. Only the current clip is loaded. It advances when a clip ends, has a caption chip and dot buttons, links to the project, and pauses when scrolled out of view. When the system asks for reduced motion it is a grid of posters instead.
- `ProjectCard.jsx`: one card per project (HIVE spans two columns on wide screens).
- `MediaThumb.jsx`: renders a media object. Videos use `preload="none"` and a poster; looping card/step videos are muted and play only while at least half visible. A missing file falls back to its poster, then to the alt text.
- `CaseStudy.jsx`: the case-study page template.
- `Gallery.jsx`: gallery grid plus a keyboard-accessible native `<dialog>` lightbox (Enter opens, Escape or a click outside closes, focus returns to the thumbnail). Step and hero images open in it too.
- `Skills.jsx`: the skill pills; hovering or focusing one lists the projects that show it.
- `MotionToggle.jsx` and `useInView.js`: the site-wide motion control and the in-view and motion hooks (see below).
- `TradeStudy.jsx`: the trade-study page.

## Design and behavior

Warm charcoal surfaces, cream text, copper links, and red reserved for status and one highlighted chip per card. Fonts are DM Sans and Instrument Serif. Text is at least 12 px and nothing overflows horizontally at 390, 768 or 1440 px.

Motion: nothing autoplays with sound, and nothing loads video it does not need. Hero videos on case studies show a poster with controls and never autoplay. The header has one **Pause motion / Play motion** toggle that stops the showreel and every card and step loop and keeps new ones from starting; the choice is remembered in `localStorage` (the site still works if storage is unavailable). With no saved choice, motion is paused when the system asks for reduced motion.

## `npm run verify`

Run after `npm run build` (set `VERIFY_DIST=<dir>` for another build folder, `VERIFY_SKIP_DIST=1` to skip only the bundle checks). It fails on:

- project order or missing/empty required fields, wrong counts (chips 2–3, TL;DR 3, at least 3 steps, 2 decisions, 2 results), results without a `source`, missing card/hero, no link or document;
- a reel that is not exactly 5 clips, or reel/skill entries pointing at unknown projects;
- forbidden keys (`source`, `sources`, `notes`, `kind`, `featured` outside the places that use them) and placeholder text (TODO, TBD, lorem, FIXME);
- any `./media/...` path that does not exist, any file in `public/media` that nothing references, any video without a `.jpg` poster, and any file over its size budget;
- the built JavaScript containing a WebGL renderer or phrases that must not ship.
