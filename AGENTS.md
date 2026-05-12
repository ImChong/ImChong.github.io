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

Reviewers should see **browser-rendered** screenshots (what users see), not raw asset files pulled from `src` alone.

1. From the repo root, serve the built site locally, for example:
   - `python3 -m http.server 8765 --bind 127.0.0.1`
2. Capture screenshots against that origin (Playwright is used in automation; install once with `pip install playwright` and `playwright install chromium`).
3. For the proportional control valve page, run:
   - `python3 scripts/capture_pcv_pr_screenshots.py`  
     (expects the server on port **8765**; writes under `docs/pr-screenshots/`.)
4. **Commit** the new or updated PNGs under `docs/pr-screenshots/` on the PR branch so they stay in git history.
5. In the PR description, embed those images with stable URLs, for example:
   - `https://raw.githubusercontent.com/ImChong/ImChong.github.io/<branch>/docs/pr-screenshots/<filename>.png`  
     Replace `<branch>` with your working branch name after `git push`.

Viewport captures (1280×900) show the fixed sections clearly; full-page captures document the whole article in each language.

### Notes

- **No build step** — there is no bundler or transpiler. HTML/CSS/JS files are served directly.
- **Dev server** — use `python3 -m http.server 8080` from the repo root. The project does not include a dev server dependency; `npx serve` requires interactive confirmation unless pre-installed.
- **Node version** — requires `>=20` (see `engines` in `package.json`).
- **CI parity** — the GitHub Actions workflow (`.github/workflows/lint.yml`) runs `npm ci` then `npm run format:check`, `npm run lint:js`, `npm run lint:css`, `npm run lint:html`, and `npm audit --audit-level=high`. Run `npm run check` locally to mirror CI (minus audit).
- **No environment variables or secrets** are needed.
