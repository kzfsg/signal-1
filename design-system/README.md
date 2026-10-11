# Signal design system

After a16z speedrun. Three things lead, everything else supports them:

1. **Signal Speed** — the racing display face (`.t-speed`, `--font-speed`).
2. **Chrome** — brand words cast in metal (`.chrome`, `.chrome--dark`, `.chrome-3d`).
3. **Prism** — light split through glass (`.surface-prismatic`, `.surface-sr`, `.prism-text`, `--grad-spectrum`).

```bash
npm install
npm run dev   # catalogue at http://localhost:5173
```

- CSS layer: `design-system/signal.css` (tokens in `tokens.css`). No build step needed.
- React layer: import from `@/signal` (`ChromeWord`, `PrismWord`, `PrismCube`, `MetallicLogo`, …). Never import `@/components` directly; those are raw React Bits sources.

## Logo mark

A phone receiver standing on end, drawn in the wordmark's grammar: the same lean as its `l`, soft corners, grille slots cut as round-ended counters. Geometry lives in `brand/build_mark.py` (outputs `brand/signal-mark.svg`); it is also the favicon.

```tsx
<LogoMark finish="chrome-dark" depth size="4rem" />
<Lockup finish="chrome-dark" depth size="3rem" />   // mark + wordmark
<MetallicLogo src={markUrl} height={240} />        // liquid chrome
```

## Signal Speed

An original face drawn after the speedrun lettering, not a copy of a16z's files: wide slanted blocks, round-ended slot counters, and knife-point ascenders and descenders.

- Lowercase only (capitals map to lowercase), figures and basic punctuation.
- Already slanted. Never add italic, skew or tracking.
- Brand words and short display lines only. Hanken Grotesk sets everything else.
- Glyphs are defined in `fonts/build_signal_speed.py`. Edit there and rebuild:

```bash
python3 -m venv .venv && .venv/bin/pip install fonttools brotli shapely
.venv/bin/python design-system/fonts/build_signal_speed.py
```

## Chrome

```html
<span class="t-speed chrome">signal</span>                  <!-- silver, bevelled -->
<span class="chrome-3d t-speed" data-text="sr">              <!-- extruded -->
  <span class="t-speed chrome chrome--dark">sr</span>
</span>
```

`data-text` must match the visible word. For liquid chrome on a logo file, use `<MetallicLogo src="…" />` (WebGL; a few per page at most).

## Prism

- `.surface-prismatic`: silver glass with caustic rainbow bands.
- `.surface-sr`: the SR badge gradient with a halftone screen.
- `.prism-text` / `.prism-text--vivid`: spectral fill for type, on a dark ground.
- Spectrum is light, not paint: thin bands and fills, never flat blocks of one hue. One prismatic surface per view.

## Liquid surfaces (React Bits Pro)

- `ChromeRipple`: liquid rings from an edge. `tone="chrome"` on paper, `tone="prism"` on ink. Hero backgrounds.
- `PrismMosaic`: pixel tiles over split-light waves, on ink.
- `LightLines`: diagonal streaks of light with RGB fringes, on ink.

Sources live in `src/components/` (RadialLiquid, Mosaic, LiquidLines), adapted from the `-tw` variants: Tailwind classes swapped for inline styles, and Liquid Lines ported off `@react-three/fiber` and `next-themes`. Add more from the Starter registry with:

```bash
set -a; . ./.env.local; set +a
npx shadcn@latest add @reactbits-starter/<name>-css   # -css: this project has no Tailwind
```

## Glass nav

`.nav.nav--glass` is a fixed, fully transparent header: no fill, no colour. Add `.is-scrolled` once the page moves (past 8px) and a colourless 10px backdrop blur fades in, masked so it dissolves toward the bottom. Text is ink by default; add `.is-dark` while a dark section is under the nav (the landing marks those sections with `data-nav="dark"`). Add `.is-hidden` to slide it away when idle (the landing hides it after 7s without scrolling; scrolling, pointing at the top edge, or keyboard focus brings it back). Use `.btn--white` for its CTA: it reads on the dark hero, and its hairline keeps it visible over light sections.

## Supporting layer

Hanken Grotesk display type at −5% tracking, paper `#EBE9E5` and ink `#000`, the chroma ramp, holo buttons, cards, echo trail, aura. The catalogue documents each with usage and props.

## Font licensing

speedrun's text face is Messina Sans (Luzi Type, licensed). Hanken Grotesk stands in; put "Messina Sans" first in `--font-sans` if you hold a licence.
