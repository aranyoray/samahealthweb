"""Write each camp photo's pixel size into app/events-data.json.

The camp collage (app/components/CampGallery.tsx) shapes a tile from the photo's
proportions, so every image needs its width and height. Run after adding photos
to public/events:

    python3 scripts/camp_photo_sizes.py

Needs Pillow. Sizes are taken after the camera's rotation flag is applied.
"""
import json
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "events-data.json"

data = json.loads(DATA.read_text(encoding="utf-8"))
for image in data["images"]:
    with Image.open(ROOT / "public" / "events" / image["file"]) as picture:
        image["w"], image["h"] = ImageOps.exif_transpose(picture).size
DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"sized {len(data['images'])} photos")
