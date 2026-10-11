import { AuraBackground, ChromaWord, ChromeWord, EchoWord, HoloButton, LogoStrip, MetallicLogo, PrismCube, PrismWord, ChromeRipple, PrismMosaic, LightLines, SignalHoloCard, SpeedMarquee, Stat, Wordmark, wordmarkUrl, LogoMark, Lockup, markUrl } from '@/signal';
import { color } from '@/signal/tokens';
import { Entry, Group } from './Entry';
import './docs.css';

const nav: [group: string, items: [id: string, label: string][]][] = [
  ['Brand', [['wordmark', 'Wordmark'], ['logo-mark', 'Logo mark'], ['speed', 'Signal Speed'], ['chrome', 'Chrome'], ['prism', 'Prism'], ['sr-plate', 'SR plate'], ['prism-cube', 'PrismCube'], ['metallic-logo', 'MetallicLogo'], ['chrome-ripple', 'ChromeRipple'], ['prism-mosaic', 'PrismMosaic'], ['light-lines', 'LightLines'], ['chrome-word', 'ChromeWord / PrismWord']]],
  ['Foundations', [['color', 'Colour'], ['type', 'Type'], ['surfaces', 'Surfaces']]],
  ['CSS components', [['button', 'Button'], ['label', 'Label'], ['card', 'Card'], ['rule-list', 'Rule list']]],
  ['Supporting components', [
    ['chroma-word', 'ChromaWord'], ['echo-word', 'EchoWord'], ['aura', 'AuraBackground'], ['holo-button', 'HoloButton'],
    ['holo-card', 'SignalHoloCard'], ['stat', 'Stat'], ['speed-marquee', 'SpeedMarquee'], ['logo-strip', 'LogoStrip']
  ]]
];

const swatches: [name: string, token: string, hex: string][] = [
  ['Paper', '--paper', color.paper], ['Sand', '--sand', color.sand], ['White', '--white', color.white], ['Ink', '--ink', color.ink],
  ['Cyan', '--cyan', color.cyan], ['Azure', '--azure', color.azure], ['Blue', '--blue', color.blue], ['Indigo', '--indigo', color.indigo],
  ['Violet', '--violet', color.violet], ['Peach', '--peach', color.peach]
];

const scale: [cls: string, size: string, sample: string][] = [
  ['t-mega', '243 / 0.9 / −7.4%', 'Signal'],
  ['t-display', '72 / 1 / −5%', 'Display heading'],
  ['t-quote', '64 / 1 / −5%', 'Pull quote'],
  ['t-headline', '48 / 1 / −5%', 'Section heading'],
  ['t-title', '24 / 1.1 / −3%', 'Card title'],
  ['t-body', '18 / 1.35 / −1%', 'Body copy is weight 500 with near-neutral tracking, so long passages stay readable.'],
  ['t-small', '13 / 1.23 / −1%', 'Small print and card copy, weight 600.'],
  ['t-label', '16 / 1.25 / +4%', 'Condensed caps']
];

const sampleLogos = ['Logo one', 'Logo two', 'Logo three', 'Logo four', 'Logo five', 'Logo six'].map(name => ({
  node: <span className="t-title">{name}</span>,
  title: name
}));

export default function Catalogue() {
  return (
    <div className="docs">
      <aside className="docs__nav">
        <a className="nav__brand" href="#top" aria-label="signal, back to top"><Wordmark size="1.5rem" /></a>
        <p className="t-small t-muted">Design system, after a16z speedrun</p>
        {nav.map(([group, items]) => (
          <nav key={group} aria-label={group}>
            <p className="t-label docs__nav-group">{group}</p>
            <ul>
              {items.map(([id, label]) => <li key={id}><a href={`#${id}`}>{label}</a></li>)}
            </ul>
          </nav>
        ))}
      </aside>

      <main className="docs__main" id="top">
        <header className="docs__intro">
          <div className="docs__hero">
            <h1 className="docs__wordmark"><Wordmark finish="chrome-dark" depth /></h1>
            <PrismCube size={220} mark={<ChromeWord text="sr" finish="dark" depth />} />
          </div>
          <p className="t-body">
            Three things lead: the Signal Speed racing face, chrome, and prismatic light. Everything else supports them.
            Import <code>design-system/signal.css</code> for tokens and CSS components, and <code>@/signal</code> for React components.
          </p>
        </header>

        <Group id="brand" title="Brand" intro="The primary layer. Use these first; reach for the supporting components only around them.">
          <Entry
            id="wordmark"
            name="Wordmark"
            summary="The signal wordmark is a drawn asset, traced from the master artwork into brand/signal-wordmark.svg. Never retype it in a font. Height is 1em, so size it with font-size."
            usage={'<Wordmark />\n<Wordmark finish="chrome" />\n<Wordmark finish="chrome-dark" depth shimmer />\n<Wordmark finish="vivid" size="4rem" />\n\n<!-- CSS only -->\n<span class="wordmark wordmark--chrome" role="img" aria-label="signal">\n  <span class="wordmark__face"></span>\n</span>'}
            props={[['finish', "'ink' | 'chrome' | 'chrome-dark' | 'prism' | 'vivid'", 'ink follows currentColor'], ['depth', 'boolean', 'extrude in 3D'], ['shimmer', 'boolean', 'light sweep on hover and every 30s; heroes only, off under reduced motion'], ['size', 'string', 'sets font-size; height is 1em']]}
            rules={['Clear space: at least the x-height on every side.', 'prism and vivid need a dark ground; chrome reads on SR and prismatic surfaces.', 'Retrace with brand/trace_wordmark.py if the master artwork changes.']}
            surface="flush"
          >
            <div className="wordmark-grid">
              <div className="surface-ink" style={{ color: color.white }}><Wordmark /></div>
              <div style={{ background: color.paper }}><Wordmark /></div>
              <div className="surface-sr"><Wordmark finish="chrome" /></div>
              <div className="surface-prismatic"><Wordmark finish="chrome-dark" depth shimmer /></div>
              <div className="surface-ink"><Wordmark finish="vivid" /></div>
              <div style={{ background: 'var(--chrome-ink)' }}><Wordmark finish="prism" /></div>
            </div>
          </Entry>

          <Entry
            id="logo-mark"
            name="Logo mark"
            summary="A phone receiver standing on end, drawn in the wordmark's grammar: the same lean as its l, the same soft corners, and grille slots cut as round-ended counters. Use it where the wordmark won't fit: app icon, favicon, avatar."
            usage={'<LogoMark finish="chrome-dark" depth size="4rem" />\n<Lockup finish="chrome-dark" depth size="3rem" />   // mark + wordmark\n<MetallicLogo src={markUrl} height={240} />        // liquid chrome\n\n<!-- CSS only -->\n<span class="mark wordmark--chrome" role="img" aria-label="signal">\n  <span class="wordmark__face"></span>\n</span>'}
            props={[['finish', "'ink' | 'chrome' | 'chrome-dark' | 'prism' | 'vivid'", 'same finishes as the wordmark'], ['depth', 'boolean', 'extrude in 3D'], ['size', 'string', 'sets font-size; height is 1em']]}
            rules={['Clear space: at least half the mark\'s width on every side.', 'Smallest size: 16px tall (favicon). Below 32px use ink, not chrome.', 'In the lockup the mark stands 1.45x the wordmark\'s height; never rearrange or restyle them separately.', 'Rebuild with brand/build_mark.py after editing its geometry.']}
            surface="flush"
          >
            <div className="wordmark-grid mark-grid">
              <div style={{ background: color.paper }}><LogoMark /></div>
              <div className="surface-ink" style={{ color: color.paper }}><LogoMark /></div>
              <div className="surface-prismatic"><LogoMark finish="chrome-dark" depth /></div>
              <div className="surface-ink"><LogoMark finish="chrome" depth /></div>
              <div style={{ background: '#000' }}><MetallicLogo src={markUrl} height="100%" /></div>
              <div style={{ background: color.paper }}><Lockup finish="chrome-dark" depth size="0.28em" /></div>
            </div>
          </Entry>

          <Entry
            id="speed"
            name="Signal Speed"
            summary="An original racing display face drawn after the speedrun lettering: wide slanted blocks, slot counters, and knife-point ascenders and descenders. Pair .t-speed with any size class."
            usage={'<h1 class="t-mega t-speed">signal</h1>\n<p class="t-headline t-speed">speedrun</p>'}
            rules={[
              'Lowercase only. Capitals map to the lowercase forms.',
              'Already slanted: never add italic, skew or tracking.',
              'Brand words and short display lines only. Hanken Grotesk carries everything else.',
              'The signal wordmark is drawn artwork, not this font: use <Wordmark>.',
              'Rebuild with design-system/fonts/build_signal_speed.py after editing glyphs.'
            ]}
            surface="ink"
          >
            <div className="speed-specimen">
              <p className="t-speed" style={{ fontSize: 'clamp(4rem, 10vw, 9.5rem)' }}>speedrun</p>
              <p className="t-headline t-speed">abcdefghijklm nopqrstuvwxyz</p>
              <p className="t-headline t-speed">0123456789 . , : - / ! +</p>
            </div>
          </Entry>

          <Entry
            id="chrome"
            name="Chrome"
            summary="Brand words are cast in metal. Silver is bevelled like the SR badge; dark chrome with depth is the extruded mark from the glass cube."
            usage={'<span class="t-speed chrome">signal</span>\n<span class="t-speed chrome chrome--dark">signal</span>\n<span class="chrome-3d t-speed" data-text="sr">\n  <span class="t-speed chrome chrome--dark">sr</span>\n</span>'}
            rules={['data-text on .chrome-3d must match the visible word.', 'Silver reads on SR and prismatic surfaces; dark chrome reads on light glass and paper.']}
            surface="flush"
          >
            <div className="chrome-row">
              <div className="surface-sr chrome-cell"><span className="t-display t-speed chrome">silver</span></div>
              <div className="surface-prismatic chrome-cell"><span className="t-display t-speed chrome chrome--dark">dark</span></div>
              <div className="chrome-cell" style={{ background: color.paper }}>
                <span className="t-display chrome-3d t-speed" data-text="depth"><span className="t-speed chrome chrome--dark">depth</span></span>
              </div>
            </div>
          </Entry>

          <Entry
            id="prism"
            name="Prism"
            summary="Light split through glass is the system's colour. Prismatic silver for surfaces, the pastel SR gradient with its halftone screen, and a spectral fill for type."
            usage={'<section class="surface-prismatic">…</section>\n<section class="surface-sr">…</section>\n<span class="t-speed prism-text">signal</span>\n<span class="t-speed prism-text--vivid">signal</span>  // on ink\n\n--grad-spectrum  --grad-foil  --grad-prismatic  --grad-sr  --halftone'}
            rules={['Spectrum is light, not paint: use it in thin bands and fills, never as flat blocks of one hue.', 'Prism text needs a dark ground: foil is the soft version, vivid the saturated one.', 'One prismatic or SR surface per view; let paper and ink frame it.']}
            surface="flush"
          >
            <div className="prism-grid">
              <div className="surface-prismatic"><code>.surface-prismatic</code></div>
              <div className="surface-sr"><code>.surface-sr</code></div>
              <div style={{ background: 'var(--grad-spectrum)' }}><code>--grad-spectrum</code></div>
              <div className="surface-ink prism-ink"><span className="t-display t-speed prism-text--vivid">prism</span></div>
              <div style={{ background: 'var(--chrome-ink)' }} className="prism-ink"><span className="t-display t-speed prism-text">foil</span></div>
            </div>
          </Entry>

          <Entry
            id="sr-plate"
            name="SR plate"
            summary="The badge: a silver chrome mark on the SR gradient, in a rounded plate. Use as an avatar, favicon art or sign-off."
            usage={'<div class="sr-plate surface-sr t-speed" style="font-size: 160px">\n  <span class="chrome">sr</span>\n</div>'}
          >
            <div className="sr-plate surface-sr t-speed" style={{ fontSize: 'clamp(96px, 14vw, 200px)' }}>
              <span className="chrome">sr</span>
            </div>
          </Entry>

          <Entry
            id="prism-cube"
            name="PrismCube"
            summary="A glass cube with prismatic faces and an extruded chrome mark, after the speedrun SR cube. Pure CSS 3D, drifts slowly."
            usage={'<PrismCube size={280} mark={<ChromeWord text="sr" finish="dark" depth />} />'}
            props={[['size', 'number', 'px, default 280'], ['mark', 'ReactNode', 'sits on the front face'], ['spin', 'boolean', 'default true; off under reduced motion']]}
            rules={['One per page, as a hero object.']}
          >
            <div className="cube-stage">
              <PrismCube size={260} mark={<ChromeWord text="sr" finish="dark" depth />} />
            </div>
          </Entry>

          <Entry
            id="metallic-logo"
            name="MetallicLogo"
            summary="Liquid chrome that flows over a logo or wordmark, with prismatic dispersion at the edges. Text is set in Signal Speed."
            source="MetallicPaint"
            usage={'import { MetallicLogo, wordmarkUrl } from "@/signal";\n\n<MetallicLogo src={wordmarkUrl} height={200} />\n<MetallicLogo text="speed" height={120} />'}
            props={[['text', 'string', 'set in Signal Speed'], ['src', 'string', 'SVG/PNG, dark shape on transparent'], ['height', 'number | string', 'default 120'], ['tone', "'ink' | 'paper'", 'background it sits on']]}
            rules={['Each instance is a WebGL canvas: a handful per page, never inside LogoStrip.', 'Reads best on ink.']}
            surface="ink"
          >
            <MetallicLogo src={wordmarkUrl} height="clamp(140px, 20vw, 260px)" />
          </Entry>

          <Entry
            id="chrome-ripple"
            name="ChromeRipple"
            summary="Liquid rings spreading from an edge, refracting at their rims. Chrome is molten silver on paper; prism splits the rings into the spectrum on ink. Follows the cursor."
            source="Pro: Radial Liquid"
            usage={'<section style={{ height: 480 }}>\n  <ChromeRipple position="bottom">\n    <h1 className="t-mega"><Wordmark finish="chrome-dark" depth /></h1>\n  </ChromeRipple>\n</section>\n\n<ChromeRipple tone="prism" position="center" />'}
            props={[['tone', "'chrome' | 'prism'", 'default chrome'], ['position', "'center' | 'top' | 'bottom' | 'left' | 'right'", 'where the rings spread from'], ['children', 'ReactNode', 'overlaid, pointer-events off']]}
            rules={['Hero backgrounds only, one per page. Give the parent a height.', 'Put the wordmark or a single Signal Speed line over it, nothing denser.']}
            surface="flush"
          >
            <div className="liquid-pair">
              <div><ChromeRipple position="bottom"><div className="liquid-overlay"><Wordmark finish="chrome-dark" depth size="clamp(2.5rem, 5vw, 4rem)" /></div></ChromeRipple></div>
              <div><ChromeRipple tone="prism" position="center" /></div>
            </div>
          </Entry>

          <Entry
            id="prism-mosaic"
            name="PrismMosaic"
            summary="Pixel tiles over waves of split light. The red, green and blue bands drift apart and back like light through a prism."
            source="Pro: Mosaic"
            usage={'<div style={{ height: 360 }}>\n  <PrismMosaic tile={12}>\n    <Wordmark finish="chrome" />\n  </PrismMosaic>\n</div>'}
            props={[['tile', 'number', 'tile size in px, default 12'], ['children', 'ReactNode', 'overlaid']]}
            rules={['On ink only: the waves are additive light.', 'Section breaks and footers; not behind body copy.']}
            surface="flush"
          >
            <div className="liquid-stage">
              <PrismMosaic tile={12}><div className="liquid-overlay"><Wordmark finish="chrome" size="clamp(2.5rem, 6vw, 5rem)" /></div></PrismMosaic>
            </div>
          </Entry>

          <Entry
            id="light-lines"
            name="LightLines"
            summary="Streaks of light flowing like liquid, with red, green and blue fringes where they cross. A calm ink backdrop for chrome type."
            source="Pro: Liquid Lines"
            usage={'<div style={{ position: "relative", height: 420 }}>\n  <LightLines />\n</div>'}
            props={[['intensity', 'number', 'brightness multiplier, default 1']]}
            rules={['On ink. Pair with silver chrome or prism type, never body copy.']}
            surface="flush"
          >
            <div className="liquid-stage">
              <LightLines />
            </div>
          </Entry>

          <Entry
            id="chrome-word"
            name="ChromeWord / PrismWord"
            summary="React shorthands for the chrome and prism classes, set in Signal Speed. Size them with a type class on the parent."
            usage={'<h1 className="t-mega"><ChromeWord text="speed" finish="dark" depth /></h1>\n<p className="t-display"><PrismWord text="speed" vivid /></p>'}
            props={[['text', 'string', 'required'], ['finish', "'silver' | 'dark'", 'ChromeWord'], ['depth', 'boolean', 'ChromeWord: extrude in 3D'], ['vivid', 'boolean', 'PrismWord: saturated spectrum; both need a dark ground']]}
          >
            <p className="t-mega"><ChromeWord text="speed" finish="dark" depth /></p>
          </Entry>
        </Group>

        <Group id="foundations" title="Foundations" intro="Defined in design-system/tokens.css and mirrored for JS in src/signal/tokens.ts.">
          <Entry
            id="color"
            name="Colour"
            summary="All type is pure black on paper. Colour comes from the chroma ramp, used in gradients rather than as flat accent text."
            rules={['Chroma on paper: use the azure → violet ramp (--grad-chroma).', 'Chroma on ink: use the aurora ramp. Cyan and peach wash out on paper.']}
            surface="white"
          >
            <div className="swatches">
              {swatches.map(([name, token, hex]) => (
                <div className="swatch" key={token}>
                  <div className="swatch__chip" style={{ background: `var(${token})` }} />
                  <p className="t-title">{name}</p>
                  <p className="t-small t-muted"><code>{token}</code> {hex.toUpperCase()}</p>
                </div>
              ))}
            </div>
          </Entry>

          <Entry
            id="type"
            name="Type"
            summary="One family. Display sizes are weight 900, line-height 1 and −5% tracking. Hanken Grotesk stands in for Messina Sans; swap --font-sans if you hold a licence."
          >
            <div className="scale">
              {scale.map(([cls, size, sample]) => (
                <div className="scale__row" key={cls}>
                  <p className="t-small t-muted"><code>.{cls}</code><br />{size}</p>
                  <p className={cls}>{sample}</p>
                </div>
              ))}
            </div>
          </Entry>

          <Entry
            id="surfaces"
            name="Surfaces"
            summary="Background classes. Aura is for heroes, band for one full-bleed moment per page, prism for card art, holo for primary buttons."
            usage={'<section class="surface-aura">…</section>\n<section class="surface-band">…</section>\n<div class="surface-prism">…</div>\n<section class="surface-ink">…</section>'}
            surface="white"
          >
            <div className="surfaces">
              <div className="surface-aura"><code>.surface-aura</code></div>
              <div className="surface-band" style={{ color: color.white }}><code>.surface-band</code></div>
              <div className="surface-prism"><code>.surface-prism</code></div>
              <div style={{ background: 'var(--grad-holo)' }}><code>--grad-holo</code></div>
              <div className="surface-ink"><code>.surface-ink</code></div>
            </div>
          </Entry>
        </Group>

        <Group id="css" title="CSS components" intro="Plain classes from design-system/signal.css. No JavaScript needed.">
          <Entry
            id="button"
            name="Button"
            summary="Condensed caps on a holographic fill. Ink for the one action that matters most on a section, line for secondary actions."
            usage={'<a class="btn">Apply</a>\n<a class="btn btn--ink">Register</a>\n<a class="btn btn--line">Read more</a>\n<a class="btn btn--sm">Small</a>'}
          >
            <div className="row">
              <a className="btn" href="#button">Holo</a>
              <a className="btn btn--ink" href="#button">Ink</a>
              <a className="btn btn--line" href="#button">Line</a>
              <a className="btn btn--sm" href="#button">Small</a>
            </div>
          </Entry>

          <Entry
            id="label"
            name="Label"
            summary="Condensed caps for nav, buttons and short context labels only. Never above every heading."
            usage={'<p class="t-label">Capital</p>'}
          >
            <p className="t-label">Context label</p>
          </Entry>

          <Entry
            id="card"
            name="Card"
            summary="White, 16px radius, no shadow. Put art on top with a surface class."
            usage={'<article class="card">\n  <div class="surface-prism">…</div>\n  <h3 class="t-title">Title</h3>\n  <p class="t-small">Copy</p>\n</article>'}
          >
            <div className="cards">
              <article className="card">
                <div className="card__art surface-prism" />
                <p className="t-label t-muted">Label</p>
                <h3 className="t-title">Card title</h3>
                <p className="t-small">Card copy at 13px, weight 600.</p>
              </article>
              <article className="card">
                <div className="card__art surface-aura" />
                <p className="t-label t-muted">Label</p>
                <h3 className="t-title">Card title</h3>
                <p className="t-small">Card copy at 13px, weight 600.</p>
              </article>
            </div>
          </Entry>

          <Entry
            id="rule-list"
            name="Rule list"
            summary="Headline-sized items separated by hairlines, for short lists of benefits or facts."
            usage={'<ul class="rule-list">\n  <li class="t-headline">Item</li>\n</ul>'}
          >
            <ul className="rule-list">
              <li className="t-headline">First item</li>
              <li className="t-headline">Second item</li>
              <li className="t-headline">Third item</li>
            </ul>
          </Entry>
        </Group>

        <Group id="react" title="Supporting components" intro="Presets in src/signal over React Bits components, with tokens baked in. Import from @/signal, never from @/components directly.">
          <Entry
            id="chroma-word"
            name="ChromaWord"
            summary="A display word filled with the chroma ramp, drifting slowly. The system's signature."
            source="GradientText"
            usage={'<ChromaWord>Signal</ChromaWord>\n<ChromaWord tone="aurora">Signal</ChromaWord>  // on ink'}
            props={[['tone', "'chroma' | 'aurora'", 'aurora is for ink backgrounds'], ['className', 'string', 'type class, default t-mega']]}
            rules={['One or two words. Never on body copy.', 'Do not place on the aura’s saturated edges.']}
          >
            <ChromaWord>Signal</ChromaWord>
          </Entry>

          <Entry id="chroma-word-ink" name="ChromaWord, aurora tone" summary="The same word on ink, using the aurora ramp." source="GradientText" surface="ink">
            <ChromaWord tone="aurora">Signal</ChromaWord>
          </Entry>

          <Entry
            id="echo-word"
            name="EchoWord"
            summary="Ink copies smear behind the word and settle on load, and again on hover. The speedrun motion trail."
            source="EchoText"
            usage={'<h1><EchoWord text="Signal" /></h1>'}
            props={[['text', 'string', 'required'], ['mode', "'entrance' | 'pointer' | 'both'", 'default both']]}
            rules={['Hero headline only, once per page.', 'Respects reduced motion: echoes are removed.']}
          >
            <EchoWord text="Signal" />
          </Entry>

          <Entry
            id="aura"
            name="AuraBackground"
            summary="An animated, grainy version of the aura surface. Fills its positioned parent."
            source="Grainient"
            usage={'<section style={{ position: "relative" }}>\n  <AuraBackground />\n  <div style={{ position: "relative" }}>…</div>\n</section>'}
            props={[['tone', "'light' | 'ink'", 'default light']]}
            rules={['One per page, behind the hero. Use .surface-aura for static versions.']}
            surface="flush"
          >
            <div className="aura-demo">
              <AuraBackground />
              <p className="t-display">Content sits above</p>
            </div>
          </Entry>

          <Entry
            id="holo-button"
            name="HoloButton"
            summary="The holo button with a light streak that follows the pointer. Hover to see it."
            source="GlareHover"
            usage={'<HoloButton href="/apply">Apply</HoloButton>'}
            props={[['href', 'string', 'link target']]}
            rules={['Use for the primary action only. Plain .btn everywhere else.']}
          >
            <HoloButton href="#holo-button">Hover me</HoloButton>
          </Entry>

          <Entry
            id="holo-card"
            name="SignalHoloCard"
            summary="A tilting trading card with holographic foil. The face is rendered in the system font over the chroma ramp."
            source="HoloCard"
            usage={'<SignalHoloCard label="Label" big="$1M" />'}
            props={[['label', 'string', 'condensed caps, top left'], ['big', 'string', '1–4 characters, bottom'], ['width', 'number', 'px, default 280']]}
            rules={['Decorative accent beside a headline, at most two per view.']}
          >
            <SignalHoloCard label="Label" big="Aa" width={240} />
          </Entry>

          <Entry
            id="stat"
            name="Stat"
            summary="A display-size number that counts up when scrolled into view."
            source="CountUp"
            usage={'<Stat prefix="$" to={10} suffix="M+" label="What the number means" />'}
            props={[['to', 'number', 'final value'], ['prefix / suffix', 'string', ''], ['label', 'string', 'small caption']]}
          >
            <div className="row row--stats">
              <Stat prefix="$" to={1} suffix="M" label="Prefix and suffix" />
              <Stat to={300} suffix="+" label="Suffix only" />
              <Stat to={12500} label="Thousands separator" />
            </div>
          </Entry>

          <Entry
            id="speed-marquee"
            name="SpeedMarquee"
            summary="Mega-size lines that drift sideways and speed up with scroll. Even lines are outlined."
            source="ScrollVelocity"
            usage={"<SpeedMarquee lines={['First line', 'Second line']} />"}
            props={[['lines', 'string[]', 'two works best']]}
            rules={['Full bleed, once per page.']}
            surface="flush"
          >
            <SpeedMarquee lines={['Signal', 'Signal']} />
          </Entry>

          <Entry
            id="logo-strip"
            name="LogoStrip"
            summary="A looping row of logos that pauses on hover and fades at the edges."
            source="LogoLoop"
            usage={"<LogoStrip logos={[{ src: '/a.svg', alt: 'A' }, { node: <span>B</span> }]} />"}
            props={[['logos', 'LogoItem[]', '{ src, alt } or { node }']]}
            surface="flush"
          >
            <LogoStrip logos={sampleLogos} />
          </Entry>
        </Group>
      </main>
    </div>
  );
}
