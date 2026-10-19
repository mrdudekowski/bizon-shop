from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json

ROOT = Path("docs/superpowers/reports/mobile-350-2026-10-15")
MANIFEST = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
FONT = ImageFont.load_default()
TARGET_W = 210
LABEL_H = 25
COLS = 4
ROWS = 6
PER_SHEET = COLS * ROWS


def fit(image, width=TARGET_W, height=None):
    if height is None:
        height = round(image.height * width / image.width)
    return image.resize((width, height), Image.Resampling.LANCZOS)


def save_grid(items, path, tile_h, cols=COLS):
    rows = (len(items) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * TARGET_W, rows * (tile_h + LABEL_H)), "#d8dcdf")
    draw = ImageDraw.Draw(sheet)
    for index, (label, image) in enumerate(items):
        x = (index % cols) * TARGET_W
        y = (index // cols) * (tile_h + LABEL_H)
        draw.rectangle((x, y, x + TARGET_W - 1, y + LABEL_H - 1), fill="#17212b")
        draw.text((x + 5, y + 6), label[:34], font=FONT, fill="white")
        sheet.paste(image, (x, y + LABEL_H))
    sheet.save(path, optimize=True)


first_items = []
for result in MANIFEST["results"]:
    image = Image.open(ROOT / "first-screen" / f"{result['name']}.png").convert("RGB")
    first_items.append((result["path"], fit(image, height=492)))
save_grid(first_items, ROOT / "contact-first-screens.png", 492)

frames = []
frame_height = 1640
for result in MANIFEST["results"]:
    image = Image.open(ROOT / "full-page" / f"{result['name']}.png").convert("RGB")
    count = (image.height + frame_height - 1) // frame_height
    for index in range(count):
        frame = image.crop((0, index * frame_height, image.width, min(image.height, (index + 1) * frame_height)))
        tile = fit(frame, height=492)
        if tile.height < 492:
            padded = Image.new("RGB", (TARGET_W, 492), "#ffffff")
            padded.paste(tile, (0, 0))
            tile = padded
        frames.append((f"{result['path']} · экран {index + 1}/{count}", tile))

for start in range(0, len(frames), PER_SHEET):
    batch = frames[start:start + PER_SHEET]
    save_grid(batch, ROOT / f"contact-sections-{start // PER_SHEET + 1:02d}.png", 492)

print(f"First screens: {len(first_items)} routes; full page: {len(frames)} viewport slices; contact sheets written to {ROOT}")
