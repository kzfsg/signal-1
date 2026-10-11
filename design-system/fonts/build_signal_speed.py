"""
Build "Signal Speed": an original racing display face drawn after the a16z speedrun lettering.

Every glyph is constructed from the same grammar the speedrun wordmark uses:
  - letters are wide slanted blocks, mostly ink
  - counters are narrow round-ended slots (vertical) or notches (horizontal)
  - ascenders and descenders end in knife points: one edge runs straight, the other is cut
Glyphs are drawn upright with polygon booleans, then sheared to the slant and compiled.

    python -m venv .venv && .venv/bin/pip install fonttools brotli shapely
    .venv/bin/python build_signal_speed.py
"""
from pathlib import Path

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely import affinity
from shapely.geometry import LineString, MultiPolygon, Polygon, box
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

# ---------------------------------------------------------------- metrics
UPM = 1000
X = 500          # x-height (letters live here; caps map to lowercase)
ASC = 790        # ascender tip
DSC = -270       # descender tip
T = 100          # horizontal bar thickness
S = 66           # slot / notch width
W = 720          # standard letter width
R = 34           # outer corner radius
SB = 34          # side bearing
SHEAR = 0.42     # ~23 degrees
FAMILY = "Signal Speed"
PS_NAME = "SignalSpeed-Black"
E = 400          # overshoot used to open slots past an edge


def rbox(x0, y0, x1, y1, r=R):
    """Rounded rectangle."""
    return box(x0 + r, y0 + r, x1 - r, y1 - r).buffer(r, quad_segs=6)


def vslot(cx, y0, y1, w=S):
    """Vertical round-ended slot. Extend y0/y1 past the block to open it."""
    return LineString([(cx, y0), (cx, y1)]).buffer(w / 2, quad_segs=8)


def hslot(x0, x1, cy, h=S):
    """Horizontal round-ended notch. Extend x0/x1 past the block to open it."""
    return LineString([(x0, cy), (x1, cy)]).buffer(h / 2, quad_segs=8)


def asc_spike(x0, x1, base=X - 20):
    """Ascender: left edge runs straight up to the point, right edge is cut back to the x-height."""
    return Polygon([(x0, base), (x1, base), (x1, X + 30), (x0, ASC)])


def dsc_spike(x0, x1, base=20):
    """Descender: right edge runs straight down to the point, left edge is cut back to the baseline."""
    return Polygon([(x0, base), (x1, base), (x1, DSC), (x0, -30)])


def soften(shape, r=10):
    """Round the hard corners left where slots open through an edge."""
    return shape.buffer(-r, quad_segs=4).buffer(r, quad_segs=4)


def block(w=W, y0=0, y1=X):
    return rbox(0, y0, w, y1)


L = (W - S) / 2          # stem width either side of a centred slot
MID = W / 2
UPPER = X - T - S / 2    # centre line of an upper notch
LOWER = T + S / 2        # centre line of a lower notch


def o_body(w=W):
    return block(w) - vslot(w / 2, T + S / 2, X - T - S / 2)


G = {}

# lowercase --------------------------------------------------------------
G["a"] = (W, soften(block() - hslot(-E, W - L + S / 2, UPPER + 12) - vslot(MID - 40, LOWER - 10, UPPER - S - 40)))
G["b"] = (W, soften(o_body()) | asc_spike(0, L))
G["c"] = (W, soften(block() - hslot(W * 0.36, W + E, X / 2, X - 2 * T)))
G["d"] = (W, soften(o_body()) | asc_spike(W - L, W))
G["e"] = (W, soften(block() - vslot(MID, UPPER - 40, X - T - S / 2 + 10) - hslot(W * 0.42, W + E, LOWER + 6)))
G["f"] = (520, soften(rbox(0, 0, 270, ASC - 40) | rbox(0, ASC - 40 - T, 520, ASC - 40) | rbox(0, X - T, 470, X)))
G["g"] = (W, soften(block(W, DSC + 40, X) - vslot(MID, T + S / 2, X - T - S / 2) - hslot(-E, W - L + S / 2, -60)))
G["h"] = (W, soften(block() - vslot(MID, -E, X - T - S / 2)) | asc_spike(0, L))
G["i"] = (270, rbox(0, 0, 270, X) | rbox(0, X + 70, 270, X + 70 + 150))
G["j"] = (300, soften(rbox(30, 0, 300, X)) | dsc_spike(30, 300) | rbox(30, X + 70, 300, X + 70 + 150))
G["k"] = (W, soften(unary_union([
    rbox(0, 0, L, X),
    Polygon([(L - 40, X * 0.36), (L + 230, X * 0.36), (W, X), (W - 270, X)]),   # arm, up and out
    Polygon([(L - 40, X * 0.64), (L + 230, X * 0.64), (W, 0), (W - 270, 0)]),   # leg, down and out
]) & box(0, 0, W, X)) | asc_spike(0, L))
G["l"] = (270, rbox(0, 0, 270, ASC - 40))
G["m"] = (1080, soften(block(1080) - vslot(1080 / 3 + 6, -E, X - T - S / 2) - vslot(1080 * 2 / 3 - 6, -E, X - T - S / 2)))
G["n"] = (W, soften(block() - vslot(MID, -E, X - T - S / 2)))
G["o"] = (W, soften(o_body()))
G["p"] = (W, soften(o_body()) | dsc_spike(0, L))
G["q"] = (W, soften(o_body()) | dsc_spike(W - L, W))
G["r"] = (560, soften(rbox(0, 0, 560, X) - rbox(L + S - 20, -E, 560 + E, X - T, S / 2)))
G["s"] = (W, soften(block() - hslot(W * 0.3, W + E, UPPER + 6) - hslot(-E, W * 0.7, LOWER - 6)))
G["t"] = (500, soften(rbox(0, 0, 270, X + 150) | rbox(0, X - T, 500, X)))
G["u"] = (W, soften(block() - vslot(MID, T + S / 2, X + E)))
G["v"] = (W, soften(block() - vslot(MID, T + S / 2 + 20, X + E) - Polygon([(W - 160, -1), (W + 1, -1), (W + 1, 200)])))
G["w"] = (1080, soften(block(1080) - vslot(1080 / 3 + 6, T + S / 2, X + E) - vslot(1080 * 2 / 3 - 6, T + S / 2, X + E)))
G["x"] = (W, soften(block() - vslot(MID, -E, LOWER + 20) - vslot(MID, UPPER - 20, X + E) - hslot(-E, MID - 80, X / 2) - hslot(MID + 80, W + E, X / 2)))
G["y"] = (W, soften(block() - vslot(MID, T + S / 2, X + E)) | dsc_spike(W - L, W))
G["z"] = (W, soften(block() - hslot(-E, W * 0.66, UPPER + 6) - hslot(W * 0.34, W + E, LOWER - 6)))

# figures (x-height, to sit with the lowercase) --------------------------
G["zero"] = (W, soften(block() - vslot(MID, T + S / 2, X - T - S / 2)))
G["one"] = (380, soften(rbox(110, 0, 380, X) | rbox(0, X - T, 380, X)))
G["two"] = (W, G["z"][1])
G["three"] = (W, soften(block() - hslot(-E, W * 0.66, UPPER + 6) - hslot(-E, W * 0.66, LOWER - 6)))
G["four"] = (W, soften(block() - vslot(W * 0.4, T + S / 2 + 60, X + E) - hslot(-E, W * 0.62, T / 2 - 10, T - 20)))
G["five"] = (W, G["s"][1])
G["six"] = (W, soften(block() - hslot(W * 0.34, W + E, UPPER + 6) - hslot(W * 0.3, W * 0.7, LOWER - 6)))
G["seven"] = (W, soften(block() - rbox(-E, -E, W - L + 20, X - T, S / 2)))
G["eight"] = (W, soften(block() - hslot(W * 0.3, W * 0.7, UPPER + 6) - hslot(W * 0.3, W * 0.7, LOWER - 6)))
G["nine"] = (W, soften(block() - hslot(W * 0.3, W * 0.7, UPPER + 6) - hslot(-E, W * 0.66, LOWER - 6)))

# punctuation -------------------------------------------------------------
G["period"] = (240, rbox(0, 0, 240, 150))
G["comma"] = (240, rbox(0, 0, 240, 150) | Polygon([(0, 20), (240, 20), (240, -170), (0, -20)]))
G["colon"] = (240, rbox(0, 0, 240, 150) | rbox(0, X - 150, 240, X))
G["hyphen"] = (420, rbox(0, X / 2 - 70, 420, X / 2 + 70))
G["slash"] = (440, Polygon([(0, DSC + 60), (130, DSC + 60), (440, ASC - 40), (310, ASC - 40)]))
G["exclam"] = (270, rbox(0, 220, 270, ASC - 40) | rbox(0, 0, 270, 150))
G["quotesingle"] = (240, rbox(0, ASC - 300, 240, ASC - 40))
G["plus"] = (520, rbox(0, X / 2 - 70, 520, X / 2 + 70) | rbox(190, 40, 330, X - 40))
G["space"] = (300, None)

CHARS = {
    **{c: c for c in "abcdefghijklmnopqrstuvwxyz"},
    **{c.upper(): c for c in "abcdefghijklmnopqrstuvwxyz"},
    "0": "zero", "1": "one", "2": "two", "3": "three", "4": "four", "5": "five",
    "6": "six", "7": "seven", "8": "eight", "9": "nine",
    ".": "period", ",": "comma", ":": "colon", "-": "hyphen", "/": "slash", "!": "exclam",
    "'": "quotesingle", "+": "plus", " ": "space",
}


def draw(shape):
    pen = TTGlyphPen(None)
    if shape is None or shape.is_empty:
        return pen.glyph()
    shape = affinity.affine_transform(shape, [1, SHEAR, 0, 1, SB, 0])
    polys = shape.geoms if isinstance(shape, MultiPolygon) else [shape]
    for poly in polys:
        poly = orient(poly.simplify(0.6), sign=-1.0)  # TrueType: outer clockwise, holes counter-clockwise
        for ring in [poly.exterior, *poly.interiors]:
            pts = [(round(x), round(y)) for x, y in ring.coords[:-1]]
            pen.moveTo(pts[0])
            for p in pts[1:]:
                pen.lineTo(p)
            pen.closePath()
    return pen.glyph()


def main():
    order = [".notdef", *G.keys()]
    glyphs = {".notdef": draw(rbox(0, 0, 500, X))}
    metrics = {".notdef": (500 + 2 * SB, SB)}
    for name, (adv, shape) in G.items():
        if shape is not None:
            shape = unary_union(shape)
        g = draw(shape)
        glyphs[name] = g
        metrics[name] = (round(adv + 2 * SB), SB)

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({ord(c): g for c, g in CHARS.items()})
    fb.setupGlyf(glyphs)
    for name in order:
        glyphs[name].recalcBounds(fb.font["glyf"])
    fb.setupHorizontalMetrics({n: (adv, glyphs[n].xMin if hasattr(glyphs[n], "xMin") else 0) for n, (adv, _) in metrics.items()})
    fb.setupHorizontalHeader(ascent=ASC + 60, descent=DSC - 60)
    fb.setupNameTable({
        "familyName": FAMILY,
        "styleName": "Black",
        "uniqueFontIdentifier": f"{PS_NAME};signal",
        "fullName": f"{FAMILY} Black",
        "psName": PS_NAME,
        "version": "Version 1.000",
    })
    fb.setupOS2(
        sTypoAscender=ASC + 60, sTypoDescender=DSC - 60, sTypoLineGap=0,
        usWinAscent=ASC + 120, usWinDescent=-(DSC - 120), sxHeight=X, sCapHeight=X,
        usWeightClass=900, fsSelection=0b1000000,
    )
    fb.setupPost(italicAngle=-23)
    fb.font["hhea"].caretSlopeRise = 1000
    fb.font["hhea"].caretSlopeRun = round(1000 * SHEAR)

    out = Path(__file__).parent / "SignalSpeed.woff2"
    fb.font.flavor = "woff2"
    fb.save(out)
    print("wrote", out, len(order), "glyphs")


if __name__ == "__main__":
    main()
