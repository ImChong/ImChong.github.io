#!/usr/bin/env python3
"""
Capture the homepage project-card previews into img/projects/*.webp.

Each online project is opened at 1440x900 in its default (dark) look, nudged
into a representative state where it would otherwise show a loader or an empty
canvas, and saved as a 960x600 WebP. The Proportional Control Valve card has no
website, so its preview is cropped from the product photo on its project page.

The site's CSP only allows same-origin images, so previews must be committed
rather than hot-linked. Re-run after a project's homepage changes noticeably.

Requires: pip install playwright pillow && playwright install chromium
Set CHROMIUM_PATH to use a Chromium that Playwright did not install itself.
HTTPS_PROXY, when set, is passed to the browser.
"""
from __future__ import annotations

import os
import re
import sys
import time
from io import BytesIO
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = REPO_ROOT / "img" / "projects"
VIEWPORT = {"width": 1440, "height": 900}
OUTPUT_SIZE = (960, 600)
WEBP_QUALITY = 80
BASE = "https://imchong.github.io"


def load_sample_motion(page) -> None:
    """Robot Retarget: open the sample menu and load the LAFAN1 walk clip."""
    page.get_by_text(re.compile(r"加载示例动作|sample", re.I)).first.click()
    page.wait_for_timeout(800)
    page.get_by_text(re.compile(r"Walk")).first.click()
    page.wait_for_timeout(4000)


def load_sample_robot(page) -> None:
    """Joint Order Check: load the Unitree G1 example so the table is filled."""
    page.get_by_text("Unitree G1 29DOF").first.click()
    page.wait_for_timeout(6000)


def wait_for_simulation(page) -> None:
    """Sim2Sim: wait for the MuJoCo/ONNX loading overlay to go away."""
    deadline = time.time() + 60
    while time.time() < deadline:
        loading = page.evaluate(
            """() => [...document.querySelectorAll('*')].some((el) =>
                el.children.length < 3 &&
                /Loading Simulation Environment/.test(el.textContent || '') &&
                el.getBoundingClientRect().width > 0 &&
                getComputedStyle(el).visibility !== 'hidden')"""
        )
        if not loading:
            break
        page.wait_for_timeout(1000)
    page.wait_for_timeout(6000)


# (output name, path under BASE, optional action before the screenshot)
PROJECTS = [
    ("robotics-notebooks", "/Robotics_Notebooks/", None),
    ("robot-learning-paper-notebooks", "/Robot_Learning_Paper_Notebooks/", None),
    ("robot-description-gallery", "/Robot_Description_Gallery_Online/", None),
    ("robot-joint-order-check", "/Robot_Joint_Order_Check_Tool_Online/", load_sample_robot),
    ("robot-retarget", "/Robot_Retarget_Online/", load_sample_motion),
    ("robot-learning-io-board", "/Robot_Learning_IO_Board_Online/", None),
    ("robot-learning-sim2sim", "/Robot_Learning_Sim2Sim_Online/", wait_for_simulation),
]


def save_webp(image, name: str) -> None:
    from PIL import ImageOps

    fitted = ImageOps.fit(image.convert("RGB"), OUTPUT_SIZE, centering=(0.5, 0.5))
    path = OUT_DIR / f"{name}.webp"
    fitted.save(path, "WEBP", quality=WEBP_QUALITY, method=6)
    print(f"wrote {path.relative_to(REPO_ROOT)} ({path.stat().st_size // 1024} KB)")


def main() -> int:
    try:
        from PIL import Image
        from playwright.sync_api import sync_playwright
    except ImportError:
        print(
            "Install dependencies: pip install playwright pillow && playwright install chromium",
            file=sys.stderr,
        )
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    launch_kwargs = {"headless": True}
    chromium_path = os.environ.get("CHROMIUM_PATH")
    if chromium_path:
        launch_kwargs["executable_path"] = chromium_path
    proxy = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy:
        launch_kwargs["proxy"] = {"server": proxy}

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        for name, path, action in PROJECTS:
            context = browser.new_context(viewport=VIEWPORT, color_scheme="dark")
            page = context.new_page()
            page.goto(BASE + path, wait_until="networkidle", timeout=60000)
            page.wait_for_timeout(2500)
            if action:
                try:
                    action(page)
                except Exception as exc:  # keep going: a stale selector still yields a preview
                    print(f"warning: {name}: {exc}", file=sys.stderr)
            save_webp(Image.open(BytesIO(page.screenshot())), name)
            context.close()
        browser.close()

    # Proportional Control Valve: the product photo, cropped to the card ratio.
    photo = Image.open(REPO_ROOT / "experience" / "pcv" / "hero.png")
    if photo.mode == "RGBA":
        backdrop = Image.new("RGB", photo.size, (255, 255, 255))
        backdrop.paste(photo, mask=photo.split()[3])
        photo = backdrop
    save_webp(photo, "proportional-control-valve")
    return 0


if __name__ == "__main__":
    sys.exit(main())
