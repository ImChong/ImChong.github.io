#!/usr/bin/env python3
"""
Capture homepage mobile jump-menu (FAB) screenshots for PR verification.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
Set CHROMIUM_PATH to use a Chromium that Playwright did not install itself.
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
BASE = "http://127.0.0.1:8765/index.html"
MOBILE_VIEWPORT = {"width": 390, "height": 844}
DESKTOP_VIEWPORT = {"width": 1280, "height": 900}


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

    launch_kwargs = {"headless": True}
    chromium_path = os.environ.get("CHROMIUM_PATH")
    if chromium_path:
        launch_kwargs["executable_path"] = chromium_path

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        page = browser.new_page(viewport=MOBILE_VIEWPORT)

        def load(lang: str, theme: str = "dark") -> None:
            page.goto(BASE, wait_until="networkidle")
            page.evaluate(
                "([lang, theme]) => { localStorage.setItem('cl-lang', lang);"
                " localStorage.setItem('cl-theme', theme); }",
                [lang, theme],
            )
            page.reload(wait_until="networkidle")

        for lang in ("en", "zh"):
            load(lang)
            toggle = page.locator(".home-nav-fab__toggle")
            toggle.wait_for(state="visible")

            page.screenshot(path=str(OUT_DIR / f"home-nav-fab-{lang}-closed.png"))

            toggle.click()
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUT_DIR / f"home-nav-fab-{lang}-open.png"))

            # Jump to a section, then reopen to show the active-section highlight.
            page.locator('.home-nav-menu a[href="#research"]').click()
            page.wait_for_timeout(2600)
            toggle.click()
            page.wait_for_timeout(400)
            page.screenshot(path=str(OUT_DIR / f"home-nav-fab-{lang}-active.png"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)

        # Light theme, to confirm the menu picks up the theme tokens.
        load("en", theme="light")
        light_toggle = page.locator(".home-nav-fab__toggle")
        light_toggle.wait_for(state="visible")
        light_toggle.click()
        page.wait_for_timeout(400)
        page.screenshot(path=str(OUT_DIR / "home-nav-fab-en-open-light.png"))

        # Desktop keeps the header nav and hides the FAB entirely.
        page.set_viewport_size(DESKTOP_VIEWPORT)
        load("en")
        page.wait_for_timeout(300)
        page.screenshot(path=str(OUT_DIR / "home-nav-fab-desktop-hidden.png"))

        browser.close()

    for f in sorted(OUT_DIR.glob("home-nav-fab-*.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
