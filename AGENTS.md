# AGENTS.md

## Project Map
- `src/`: Chrome Extension source files for Manifest V3.
- `src/lib/turndown.js`: bundled third-party HTML-to-Markdown converter.
- `build.js`: packages `src/` into `dist/` and `releases/`.
- `assets/`: icon and Chrome Web Store listing assets.

## Commands
- Install: `npm install`
- Build/package: `npm run build`
- Release package: `npm run release`
- Version bump: `npm run version:patch`, `npm run version:minor`, or `npm run version:major`

## Working Rules
- `package.json` is the source of truth for the extension version; `npm run build` syncs it into `src/manifest.json`.
- Load `src/` unpacked for local development, or load `dist/` after running `npm run build`.
- Keep `src/lib/turndown.js` bundled locally so the extension does not depend on remote code.

## Do Not
- Do not edit generated `dist/` or `releases/` outputs directly.
- Do not commit local dependency folders, caches, logs, or packaged zip output.

## Done Means
- For ordinary code changes, run `npm run build`.
- For extension behavior changes, reload the unpacked extension in Chrome and test popup, highlight, click-to-copy, and auto-disable behavior.
