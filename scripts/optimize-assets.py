#!/usr/bin/env python3
"""Resize and compress design3d PNG assets for mini program package limit."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "miniprogram" / "assets" / "design3d"

# max dimension (px) per file — tuned to on-screen rpx sizes at ~2x
TARGETS = {
    "schedule-plan-duck.png": 200,
    "timeline-duck-right.png": 360,
    "profile-duck-camera-full.png": 520,
    "profile-invite-scene-crop.png": 400,
    "expense-duck-coin-full.png": 400,
    "memo-duck-pencil-transparent.png": 420,
    "memo-wordmark-transparent.png": 440,
    "app-avatar-duck-transparent-300.png": 300,
}


def fit_max(img: Image.Image, max_dim: int) -> Image.Image:
    w, h = img.size
    scale = min(max_dim / w, max_dim / h, 1.0)
    if scale >= 1.0:
        return img
    return img.resize((int(w * scale), int(h * scale)), Image.LANCZOS)


def save_png(path: Path, img: Image.Image) -> None:
    img = img.convert("RGBA")
    img.save(path, format="PNG", optimize=True, compress_level=9)


def main() -> None:
    for name, max_dim in TARGETS.items():
        path = ROOT / name
        if not path.exists():
            print(f"skip missing: {name}")
            continue
        before = path.stat().st_size
        img = Image.open(path)
        img = fit_max(img, max_dim)
        save_png(path, img)
        after = path.stat().st_size
        print(f"{name}: {before // 1024}KB -> {after // 1024}KB ({img.size[0]}x{img.size[1]})")


if __name__ == "__main__":
    main()
