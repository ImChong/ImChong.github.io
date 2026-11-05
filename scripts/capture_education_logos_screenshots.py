#!/usr/bin/env python3
"""
Capture the homepage Education section with the institution logos.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
Set CHROMIUM_EXECUTABLE to use an already installed Chromium instead.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
HOME = "http://127.0.0.1:8765/index.html"

# name, language, colour scheme, viewport
SHOTS = (
    ("education-logos-en-dark", "en", "dark", {"width": 1280, "height": 900}),
    ("education-logos-en-light", "en", "light", {"width": 1280, "height": 900}),
    ("education-logos-zh-dark", "zh", "dark", {"width": 1280, "height": 900}),
    ("education-logos-en-mobile-390", "en", "dark", {"width": 390, "height": 844}),
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
        browser = p.chromium.launch(
            headless=True, executable_path=os.environ.get("CHROMIUM_EXECUTABLE") or None
        )

        for name, lang, scheme, viewport in SHOTS:
            page = browser.new_page(
                viewport=viewport,
                color_scheme=scheme,
                device_scale_factor=2,
                reduced_motion="reduce",
            )
            # theme-init.js reads the language before first paint.
            page.add_init_script(f"localStorage.setItem('cl-lang', '{lang}')")
            page.goto(HOME, wait_until="networkidle")
            section = page.locator(f"#lang-{lang} #education")
            section.scroll_into_view_if_needed()
            page.wait_for_timeout(600)
            section.screenshot(path=str(OUT_DIR / f"{name}.png"))
            page.close()

        browser.close()

    for f in sorted(OUT_DIR.glob("education-logos-*.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
