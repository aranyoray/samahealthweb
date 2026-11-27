"""Cut tighter versions of the camp photos whose subject sits in one part of the frame.

The collage (app/components/CampGallery.tsx) shows these crops in its pieces; the
full-size view still opens the original. Each entry is the part to keep, as
fractions of the photo: (left, top, right, bottom). Run after changing the table:

    python3 scripts/camp_photo_crops.py

Needs Pillow. Writes public/events/crops/ and app/camp-crops.json.
"""
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
EVENTS = ROOT / "public" / "events"
OUT = EVENTS / "crops"

# photo number: (left, top, right, bottom)
CROPS = {
    34: (0.16, 0.30, 1.00, 1.00),   # the desk, without the empty wall
    72: (0.00, 0.37, 1.00, 1.00),   # the registration table, without the ceiling
    99: (0.00, 0.30, 1.00, 1.00),   # the people under the awning
    117: (0.00, 0.32, 1.00, 1.00),  # the team in the van, without the roof
}

OUT.mkdir(exist_ok=True)
sizes = {}
for number, (left, top, right, bottom) in sorted(CROPS.items()):
    source = next(EVENTS.glob(f"anubhav-cmc-{number:03d}.*"))
    with Image.open(source) as opened:
        picture = ImageOps.exif_transpose(opened).convert("RGB")
    width, height = picture.size
    cut = picture.crop((round(left * width), round(top * height), round(right * width), round(bottom * height)))
    name = f"anubhav-cmc-{number:03d}.jpg"
    cut.save(OUT / name, quality=90, optimize=True)
    sizes[source.name] = {"file": f"crops/{name}", "w": cut.width, "h": cut.height}

(ROOT / "app" / "camp-crops.json").write_text(json.dumps(sizes, indent=1) + "\n", encoding="utf-8")
print(f"cut {len(sizes)} crops")
