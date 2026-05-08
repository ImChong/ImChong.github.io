# AGENTS.md

## Cursor Cloud specific instructions

This is a **static website** (pure HTML, CSS, vanilla JS) with no build step, no backend, and no runtime dependencies. All npm packages are dev-only tooling for code quality.

### Quick reference

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Full quality check | `npm run check` |
| Format code | `npm run format` |
| Lint JS | `npm run lint:js` |
| Lint CSS | `npm run lint:css` |
| Lint HTML | `npm run lint:html` |
| Serve locally | `python3 -m http.server 8080` (from repo root) |

### Notes

- **No build step** — there is no bundler or transpiler. HTML/CSS/JS files are served directly.
- **Dev server** — use `python3 -m http.server 8080` from the repo root. The project does not include a dev server dependency; `npx serve` requires interactive confirmation unless pre-installed.
- **Node version** — requires `>=20` (see `engines` in `package.json`).
- **CI parity** — the GitHub Actions workflow (`.github/workflows/lint.yml`) runs `npm ci` then `npm run format:check`, `npm run lint:js`, `npm run lint:css`, `npm run lint:html`, and `npm audit --audit-level=high`. Run `npm run check` locally to mirror CI (minus audit).
- **No environment variables or secrets** are needed.
