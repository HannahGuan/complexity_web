#!/usr/bin/env python3
"""Downscale and recompress vis_aids/originals/*.png into web-sized JPEGs.

The source illustrations are 1.4-2.4 MB PNGs, several times larger than the
sizes they are ever displayed at. Each participant loads three of them, so
shipping the originals meant ~6 MB of images per run. This writes display-sized
JPEGs next to them, which is what index.html actually references:

    python3 optimize_images.py

Originals stay untouched in vis_aids/originals/. Re-run after adding or
replacing one.
"""

import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "vis_aids", "originals")
OUT = os.path.join(HERE, "vis_aids")

QUALITY = 85

# Longest-edge cap per image role, at 2x the CSS size each is displayed at, so
# they stay sharp on retina displays:
#   mechanism diagram  up to 1080 CSS px wide (--read-width)  -> 2160
#   _0 / _1 decorative capped at 280 CSS px tall (.scene-aid) -> 560
MAX_EDGE_DIAGRAM = 2160
MAX_EDGE_DECORATIVE = 560


def max_edge(stem):
    return MAX_EDGE_DECORATIVE if stem.endswith(("_0", "_1")) else MAX_EDGE_DIAGRAM


def main():
    if not os.path.isdir(SRC):
        print("ERROR: %s does not exist" % SRC, file=sys.stderr)
        return 1

    names = sorted(n for n in os.listdir(SRC) if n.lower().endswith((".png", ".jpg", ".jpeg")))
    if not names:
        print("ERROR: no images in %s" % SRC, file=sys.stderr)
        return 1

    total_src = total_out = 0
    for name in names:
        stem = os.path.splitext(name)[0]
        src_path = os.path.join(SRC, name)
        out_path = os.path.join(OUT, stem + ".jpg")

        im = Image.open(src_path)
        # None of the sources use transparency, but flatten onto white anyway so
        # an RGBA source never turns into a black background in JPEG.
        if im.mode in ("RGBA", "LA", "P"):
            rgba = im.convert("RGBA")
            flat = Image.new("RGB", rgba.size, (255, 255, 255))
            flat.paste(rgba, mask=rgba.getchannel("A"))
            im = flat
        else:
            im = im.convert("RGB")

        cap = max_edge(stem)
        if max(im.size) > cap:
            scale = cap / float(max(im.size))
            im = im.resize((round(im.width * scale), round(im.height * scale)),
                           Image.LANCZOS)

        im.save(out_path, "JPEG", quality=QUALITY, optimize=True, progressive=True)

        src_kb = os.path.getsize(src_path) / 1024.0
        out_kb = os.path.getsize(out_path) / 1024.0
        total_src += src_kb
        total_out += out_kb
        print("  %-18s %5d KB -> %4d KB  (%dx%d)"
              % (stem, src_kb, out_kb, im.width, im.height))

    print("\n%d images: %.1f MB -> %.1f MB (%.0f%% smaller)"
          % (len(names), total_src / 1024, total_out / 1024,
             100 * (1 - total_out / total_src)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
