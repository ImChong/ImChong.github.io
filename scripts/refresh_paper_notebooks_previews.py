#!/usr/bin/env python3
"""Refresh just the EN/ZH Robot Learning Paper Notebooks project previews.

Temporary one-off wrapper around capture_project_previews.py.
"""
from io import BytesIO

from PIL import Image
from playwright.sync_api import sync_playwright

import capture_project_previews as previews


def main():
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        try:
            for lang in ("en", "zh"):
                context = browser.new_context(
                    viewport=previews.VIEWPORT, color_scheme="dark"
                )
                try:
                    context.add_init_script(
                        f"localStorage.setItem('cl-lang', {lang!r});"
                    )
                    page = context.new_page()
                    page.goto(
                        previews.BASE + "/Robot_Learning_Paper_Notebooks/",
                        wait_until="domcontentloaded",
                        timeout=60000,
                    )
                    page.locator(".index-header").wait_for(timeout=30000)
                    page.evaluate("document.fonts.ready")
                    page.wait_for_timeout(3500)
                    previews.save_webp(
                        Image.open(BytesIO(page.screenshot())),
                        f"robot-learning-paper-notebooks-{lang}",
                    )
                    print(f"Captured {lang}: {page.title()}")
                finally:
                    context.close()
        finally:
            browser.close()


if __name__ == "__main__":
    main()
