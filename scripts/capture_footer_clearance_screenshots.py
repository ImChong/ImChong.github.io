#!/usr/bin/env python3
"""
Capture screenshots showing the floating buttons parked above the footer.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
HOME = "http://127.0.0.1:8765/index.html"
SUBPAGE = "http://127.0.0.1:8765/experience/pcv/proportional-control-valve.html"

# name, url, viewport
SHOTS = (
    ("footer-clearance-home-mobile", HOME, {"width": 390, "height": 844}),
    ("footer-clearance-subpage-mobile", SUBPAGE, {"width": 390, "height": 844}),
    ("footer-clearance-subpage-desktop", SUBPAGE, {"width": 1280, "height": 900}),
)


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

        for name, url, viewport in SHOTS:
            page = browser.new_page(viewport=viewport)
            page.goto(url, wait_until="networkidle")
            # `content-visibility: auto` sections grow as they are scrolled
            # past, so the first jump lands short of the real page end.
            for _ in range(5):
                page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                page.wait_for_timeout(400)
            page.screenshot(path=str(OUT_DIR / f"{name}.png"))
            page.close()

        browser.close()

    for f in sorted(OUT_DIR.glob("footer-clearance-*.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
