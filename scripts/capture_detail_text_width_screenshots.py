#!/usr/bin/env python3
"""
Capture a full work-experience detail page (EN and ZH) to show its card text
running the full card width.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
Set CHROMIUM_EXECUTABLE to use an already installed Chromium instead.

Usage: capture_detail_text_width_screenshots.py [label] [port]
       label defaults to "after", port to 8765. Serve a checkout of the base
       branch on another port and pass "before" to capture the old layout.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
PAGE = "experience/bridgedp.html"
VIEWPORT = {"width": 1280, "height": 900}


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

        for lang in ("en", "zh"):
            page = browser.new_page(viewport=VIEWPORT, color_scheme="dark")
            # theme-init.js reads the language before first paint.
            page.add_init_script(f"localStorage.setItem('cl-lang', '{lang}')")
            page.goto(f"http://127.0.0.1:{port}/{PAGE}", wait_until="networkidle")
            # Scroll through once so scroll-reveal fades every block in.
            page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            page.wait_for_timeout(1200)
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(600)
            out = OUT_DIR / f"detail-text-width-{lang}-{label}.png"
            page.screenshot(path=str(out), full_page=True)
            page.close()

        browser.close()

    for f in sorted(OUT_DIR.glob(f"detail-text-width-*-{label}.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
