# AGENTS.md

## Cursor Cloud specific instructions

This is a **static website** (pure HTML, CSS, vanilla JS) with no build step, no backend, and no runtime dependencies. All npm packages are dev-only tooling for code quality.

### Quick reference

| Task               | Command                                        |
| ------------------ | ---------------------------------------------- |
| Install deps       | `npm ci`                                       |
| Full quality check | `npm run check`                                |
| Format code        | `npm run format`                               |
| Lint JS            | `npm run lint:js`                              |
| Lint CSS           | `npm run lint:css`                             |
| Lint HTML          | `npm run lint:html`                            |
| Serve locally      | `python3 -m http.server 8080` (from repo root) |

### Pull requests that change layout or visuals

Check visual changes in a real browser (what users see), not by reading asset files from `src` alone.

1. From the repo root, serve the built site locally, for example:
   - `python3 -m http.server 8765 --bind 127.0.0.1`
2. Capture screenshots against that origin (Playwright is used in automation; install once with `pip install playwright` and `playwright install chromium`). The `scripts/capture_*.py` helpers expect the server on port **8765**, for example:
   - `python3 scripts/capture_pcv_pr_screenshots.py`
3. **Do not commit screenshots or videos.** The helpers write to `docs/pr-screenshots/` (videos go in `docs/pr-videos/`); both are git-ignored scratch output. Share captures with the requester directly instead of putting them in the repo or linking them from the PR description, and describe the visual change in the PR text.

Viewport captures (1280×900) show the fixed sections clearly; full-page captures document the whole article in each language.

### Notes

- **No build step** — there is no bundler or transpiler. HTML/CSS/JS files are served directly.
- **Dev server** — use `python3 -m http.server 8080` from the repo root. The project does not include a dev server dependency; `npx serve` requires interactive confirmation unless pre-installed.
- **Node version** — requires `>=20` (see `engines` in `package.json`).
- **CI parity** — the GitHub Actions workflow (`.github/workflows/lint.yml`) runs `npm ci` then `npm run format:check`, `npm run lint:js`, `npm run lint:css`, `npm run lint:html`, and `npm audit --audit-level=high`. Run `npm run check` locally to mirror CI (minus audit).
- **No environment variables or secrets** are needed.
