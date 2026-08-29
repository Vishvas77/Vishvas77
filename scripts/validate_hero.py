#!/usr/bin/env python3
import sys, os, json, re
from PIL import Image

def validate():
    print("=== RUNNING VISHVAS77 HERO & REPO CONTRACT VALIDATION ===")
    errors = []

    # 1. Validate primary animated hero
    hero_path = "assets/hero.webp"
    if not os.path.exists(hero_path):
        errors.append(f"Missing primary hero asset: {hero_path}")
    else:
        sz = os.path.getsize(hero_path) / 1024
        im = Image.open(hero_path)
        w, h = im.size
        ratio = w / h
        is_anim = getattr(im, "is_animated", False)
        n_frames = getattr(im, "n_frames", 1)
        print(f"Hero Asset: {hero_path} ({w}x{h}, {sz:.1f} KB, Ratio: {ratio:.4f}, Animated: {is_anim}, Frames: {n_frames})")
        
        if not is_anim or n_frames <= 1:
            errors.append(f"{hero_path} is not animated (frames: {n_frames})")
        if abs(ratio - (16/9)) > 0.05:
            errors.append(f"{hero_path} aspect ratio {ratio:.4f} is not 16:9")
        if sz > 1500:
            errors.append(f"{hero_path} size {sz:.1f} KB exceeds 1.5 MB limit")

    # 2. Validate static fallback poster
    poster_path = "assets/poster.png"
    if not os.path.exists(poster_path):
        errors.append(f"Missing fallback poster asset: {poster_path}")
    else:
        sz = os.path.getsize(poster_path) / 1024
        im = Image.open(poster_path)
        w, h = im.size
        ratio = w / h
        print(f"Poster Asset: {poster_path} ({w}x{h}, {sz:.1f} KB, Ratio: {ratio:.4f})")
        if abs(ratio - (16/9)) > 0.05:
            errors.append(f"{poster_path} aspect ratio {ratio:.4f} is not 16:9")
        if sz > 1500:
            errors.append(f"{poster_path} size {sz:.1f} KB exceeds 1.5 MB limit")

    # 3. Validate README markup
    readme_path = "README.md"
    if not os.path.exists(readme_path):
        errors.append(f"Missing {readme_path}")
    else:
        with open(readme_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Check hero markup contains direct <img> tag for hero.webp
        if 'src="./assets/hero.webp"' not in content:
            errors.append("README.md does not reference ./assets/hero.webp in src attribute")
        if "<picture>" in content:
            errors.append("README.md should not use <picture> tag for hero animation to avoid GitHub Catalyst hijacking")
            
        # Check headings
        for h in ["## DOMAINS", "## PROJECTS", "### 🔺 ResearchCompass-AI", "### 🔺 Memory Allocator Simulator", "## PROGRESSION", "## STACK"]:
            if h not in content:
                errors.append(f"README.md is missing expected heading: {h}")

    # 4. Validate profile.json
    json_path = "data/profile.json"
    if not os.path.exists(json_path):
        errors.append(f"Missing {json_path}")
    else:
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            print("profile.json is valid JSON.")
        except Exception as e:
            errors.append(f"Invalid profile.json: {e}")

    if errors:
        print("\n[!] VALIDATION FAILED:")
        for err in errors:
            print(f"  - {err}")
        sys.exit(1)
    else:
        print("\n[OK] ALL HERO & REPO VALIDATION CHECKS PASSED.")
        sys.exit(0)

if __name__ == "__main__":
    validate()
