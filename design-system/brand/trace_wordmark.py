"""
Trace signal-wordmark-source.png (light mark on dark) into signal-wordmark.svg.

    python -m venv .venv && .venv/bin/pip install pillow potracer
    .venv/bin/python trace_wordmark.py
"""
from pathlib import Path

import numpy as np
import potrace
from PIL import Image, ImageFilter

HERE = Path(__file__).parent
UPSCALE = 4  # trace at higher resolution for smoother curves

img = Image.open(HERE / "signal-wordmark-source.png").convert("L")
img = img.resize((img.width * UPSCALE, img.height * UPSCALE), Image.LANCZOS).filter(ImageFilter.GaussianBlur(UPSCALE * 0.6))
ink = np.array(img) > 128

ys, xs = np.nonzero(ink)
pad = 2 * UPSCALE
x0, y0 = xs.min() - pad, ys.min() - pad
ink = ink[y0 : ys.max() + pad, x0 : xs.max() + pad]

paths = potrace.Bitmap(~ink).trace(  # potracer treats False as ink
    turdsize=40 * UPSCALE, alphamax=1.0, opticurve=True, opttolerance=0.4)


def f(v):
    return f"{v / UPSCALE:.2f}".rstrip("0").rstrip(".")


d = []
for curve in paths:
    d.append(f"M{f(curve.start_point.x)} {f(curve.start_point.y)}")
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{f(seg.c.x)} {f(seg.c.y)}L{f(seg.end_point.x)} {f(seg.end_point.y)}")
        else:
            d.append(f"C{f(seg.c1.x)} {f(seg.c1.y)} {f(seg.c2.x)} {f(seg.c2.y)} {f(seg.end_point.x)} {f(seg.end_point.y)}")
    d.append("Z")

h, w = ink.shape
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {f(w)} {f(h)}" role="img" aria-label="signal">'
    f'<path fill="currentColor" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n'
)
(HERE / "signal-wordmark.svg").write_text(svg)
print("wrote signal-wordmark.svg", f(w), "x", f(h), len(paths), "contours")
