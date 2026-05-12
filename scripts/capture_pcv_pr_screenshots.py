#!/usr/bin/env python3
"""
Capture browser-rendered screenshots of the PCV project page for PR verification.

Requires: pip install playwright && playwright install chromium
Serve the site first: python3 -m http.server 8765 --bind 127.0.0.1 (repo root)
"""
from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "docs" / "pr-screenshots"
BASE = "http://127.0.0.1:8765/experience/pcv/proportional-control-valve.html"


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
        page = browser.new_page(viewport={"width": 1280, "height": 900})

        def set_lang(code: str) -> None:
            page.goto(BASE, wait_until="networkidle")
            page.evaluate(f"() => localStorage.setItem('cl-lang', {code!r})")
            page.reload(wait_until="networkidle")

        # Chinese — viewport screenshots (what a user sees in the window)
        set_lang("zh")
        for name, heading in (
            ("pcv-zh-detailed-cad-viewport", "详细 CAD 模型"),
            ("pcv-zh-production-viewport", "生产要求"),
        ):
            page.get_by_role("heading", name=heading).scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT_DIR / f"{name}.png"))

        page.screenshot(path=str(OUT_DIR / "pcv-zh-fullpage.png"), full_page=True)

        # English — parity
        set_lang("en")
        for name, heading in (
            ("pcv-en-detailed-cad-viewport", "Detailed CAD"),
            ("pcv-en-production-viewport", "Production Requirements"),
        ):
            page.get_by_role("heading", name=heading).scroll_into_view_if_needed()
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT_DIR / f"{name}.png"))

        page.screenshot(path=str(OUT_DIR / "pcv-en-fullpage.png"), full_page=True)

        browser.close()

    for f in sorted(OUT_DIR.glob("pcv-*.png")):
        print(f"Wrote {f.relative_to(REPO_ROOT)} ({f.stat().st_size // 1024} KiB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
