#!/usr/bin/env python3
"""
Capture the top of the homepage under prefers-reduced-motion: at rest (the skip
link should be hidden) and after one Tab (the skip link should show).

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
Set CHROMIUM_EXECUTABLE to use an already installed Chromium instead.

Usage: capture_skip_link_reduced_motion_screenshots.py [label] [port]
       label defaults to "after", port to 8765. Serve a checkout of the base
       branch on another port and pass "before" to capture the old behaviour.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
CLIP = {"x": 0, "y": 0, "width": 640, "height": 160}


def main() -> int:
    label = sys.argv[1] if len(sys.argv) > 1 else "after"
    port = sys.argv[2] if len(sys.argv) > 2 else "8765"
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
        browser = p.chromium.launch(
            headless=True, executable_path=os.environ.get("CHROMIUM_EXECUTABLE") or None
        )
        page = browser.new_page(
            viewport={"width": 1280, "height": 900},
            color_scheme="dark",
            reduced_motion="reduce",
            device_scale_factor=2,
        )
        page.goto(f"http://127.0.0.1:{port}/index.html", wait_until="networkidle")
        page.screenshot(path=str(OUT_DIR / f"skip-link-reduced-motion-rest-{label}.png"), clip=CLIP)
        page.keyboard.press("Tab")
        page.wait_for_timeout(100)
        page.screenshot(path=str(OUT_DIR / f"skip-link-reduced-motion-focus-{label}.png"), clip=CLIP)
        browser.close()

    for f in sorted(OUT_DIR.glob(f"skip-link-reduced-motion-*-{label}.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
