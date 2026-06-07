#!/usr/bin/env python3
"""
Capture mobile TOC drawer screenshots for PR verification.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
BASE = "http://127.0.0.1:8765/experience/pcv/proportional-control-valve.html"
MOBILE_VIEWPORT = {"width": 390, "height": 844}


def main() -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "Install Playwright: pip install playwright && playwright install chromium",
            file=sys.stderr,
        )
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=MOBILE_VIEWPORT)

        def set_lang(code: str) -> None:
            page.goto(BASE, wait_until="networkidle")
            page.evaluate(f"() => localStorage.setItem('cl-lang', {code!r})")
            page.reload(wait_until="networkidle")

        for lang, suffix in (("en", "en"), ("zh", "zh")):
            set_lang(lang)
            toggle = page.locator(".subpage-toc-toggle")
            toggle.wait_for(state="visible")

            page.screenshot(path=str(OUT_DIR / f"mobile-toc-{suffix}-closed.png"))

            toggle.click()
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUT_DIR / f"mobile-toc-{suffix}-open.png"))

            # Tap the dimmed area to the right of the drawer (drawer is ~280px wide).
            page.mouse.click(340, 420)
            page.wait_for_timeout(300)

        browser.close()

    for f in sorted(OUT_DIR.glob("mobile-toc-*.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
