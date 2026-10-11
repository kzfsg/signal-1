"""
Build the signal logo mark: a metallic phone receiver drawn in the wordmark's grammar.

  - same shear as the wordmark (its stems lean ~0.65, about 33 degrees)
  - heavy rounded blocks, soft outer corners, filleted inner corners
  - round-ended slot cutouts, like the wordmark's counters

Writes signal-mark.svg: a phone receiver standing on end.

    python -m venv .venv && .venv/bin/pip install shapely
    .venv/bin/python build_mark.py
"""
from pathlib import Path

from shapely import affinity
from shapely.geometry import LineString, MultiPolygon, box
from shapely.ops import unary_union

HERE = Path(__file__).parent
SHEAR = 0.65  # matches the wordmark's slant
H = 120       # cap unit: the wordmark's letter height


def rbox(x0, y0, x1, y1, r):
    return box(x0 + r, y0 + r, x1 - r, y1 - r).buffer(r, quad_segs=12)


def slot(x0, x1, y, w):
    """Horizontal round-ended slot."""
    return LineString([(x0, y), (x1, y)]).buffer(w / 2, quad_segs=12)


def handset():
    """
    Receiver standing on end (the phone glyph people recognise), so its long axis takes the wordmark's
    slant: handle on the left, earpiece and mouthpiece jutting right, an arch between them, grille slots
    as round-ended counters. After the shear it leans exactly like the wordmark's l.
    """
    from shapely.geometry import Polygon
    handle = rbox(0, 20, 40, 200, 14)
    ear = Polygon([(0, 150), (112, 164), (104, 220), (0, 220)])     # earpiece, its face tilted out
    mouth = Polygon([(0, 0), (104, 0), (112, 56), (0, 70)])         # mouthpiece, mirrored
    body = unary_union([handle, ear, mouth])
    body = body.buffer(30, quad_segs=16).buffer(-30, quad_segs=16)  # arch the opening between the cups
    body = body.buffer(-13, quad_segs=12).buffer(13, quad_segs=12)  # soft outer corners, as on the wordmark
    grille = unary_union([slot(34, 74, 191, 18), slot(34, 74, 29, 18)])
    return body - grille


def to_svg(shape, name):
    shape = affinity.affine_transform(shape, [1, SHEAR, 0, 1, 0, 0])  # lean like the wordmark
    minx, miny, maxx, maxy = shape.bounds
    pad = 4
    w, h = maxx - minx + 2 * pad, maxy - miny + 2 * pad

    def pt(x, y):
        return f"{x - minx + pad:.1f} {maxy - y + pad:.1f}"  # flip y for SVG

    polys = shape.geoms if isinstance(shape, MultiPolygon) else [shape]
    d = []
    for poly in polys:
        for ring in [poly.exterior, *poly.interiors]:
            coords = list(ring.coords)[:-1]
            d.append("M" + "L".join(pt(x, y) for x, y in coords) + "Z")
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.1f} {h:.1f}" role="img" aria-label="signal">'
        f'<path fill="currentColor" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n'
    )
    (HERE / name).write_text(svg)
    print("wrote", name, f"{w:.0f}x{h:.0f}")


if __name__ == "__main__":
    to_svg(handset(), "signal-mark.svg")
