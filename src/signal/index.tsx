// Signal presets over React Bits components. Pages import from here, not from @/components directly,
// so colour, type and motion stay on-system.
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import GradientText from '@/components/GradientText';
import EchoText from '@/components/EchoText';
import Grainient from '@/components/Grainient';
import HoloCard from '@/components/HoloCard';
import GlareHover from '@/components/GlareHover';
import CountUp from '@/components/CountUp';
import LogoLoop from '@/components/LogoLoop';
import MetallicPaint from '@/components/MetallicPaint';
import RadialLiquid from '@/components/RadialLiquid';
import Mosaic from '@/components/Mosaic';
import LiquidLines from '@/components/LiquidLines';
import { ScrollVelocity } from '@/components/ScrollVelocity';
import { aurora, chroma, color, font } from './tokens';
import './signal.css';

export { PrismCube } from './PrismCube';

/**
 * A word cast in chrome, set in Signal Speed. `depth` extrudes it into 3D, as on the SR cube.
 * Size it with a type class or font-size on the parent.
 */
export function ChromeWord({ text, finish = 'silver', depth = false }: { text: string; finish?: 'silver' | 'dark'; depth?: boolean }) {
  const face = <span className={`t-speed chrome${finish === 'dark' ? ' chrome--dark' : ''}`}>{text}</span>;
  return depth ? <span className="chrome-3d t-speed" data-text={text}>{face}</span> : face;
}

/**
 * The signal wordmark, drawn from design-system/brand/signal-wordmark.svg. Height is 1em: size it with font-size.
 * `finish` fills it; `depth` extrudes it in 3D; `shimmer` sweeps light across it on hover and every 30s.
 */
const SHIMMER_EVERY_MS = 30_000;

export function Wordmark({
  finish = 'ink',
  depth = false,
  shimmer = false,
  size
}: { finish?: 'ink' | 'chrome' | 'chrome-dark' | 'prism' | 'vivid'; depth?: boolean; shimmer?: boolean; size?: string }) {
  const cls = ['wordmark', finish !== 'ink' && `wordmark--${finish}`, depth && 'wordmark--3d', shimmer && 'wordmark--shimmer'].filter(Boolean).join(' ');
  const ref = useRef<HTMLSpanElement>(null);

  // Passive sweep: once shortly after mount, then every 30s. Hover sweeps on demand via CSS.
  useEffect(() => {
    const el = ref.current;
    if (!shimmer || !el) return;
    const sweep = () => {
      el.classList.remove('is-sweeping');
      void el.offsetWidth; // restart the animation
      el.classList.add('is-sweeping');
    };
    const done = () => el.classList.remove('is-sweeping');
    el.addEventListener('animationend', done, true);
    const first = window.setTimeout(sweep, 1200);
    const every = window.setInterval(sweep, SHIMMER_EVERY_MS);
    return () => {
      clearTimeout(first);
      clearInterval(every);
      el.removeEventListener('animationend', done, true);
    };
  }, [shimmer]);

  return (
    <span ref={ref} className={cls} role="img" aria-label="signal" style={size ? { fontSize: size } : undefined}>
      <span className="wordmark__face" />
    </span>
  );
}

export { default as wordmarkUrl } from '../../design-system/brand/signal-wordmark.svg';
export { default as markUrl } from '../../design-system/brand/signal-mark.svg';

type Finish = 'ink' | 'chrome' | 'chrome-dark' | 'prism' | 'vivid';

/** The logo mark: a phone receiver in the wordmark's grammar. Height is 1em; size it with font-size. */
export function LogoMark({ finish = 'ink', depth = false, size }: { finish?: Finish; depth?: boolean; size?: string }) {
  const cls = ['mark', finish !== 'ink' && `wordmark--${finish}`, depth && 'wordmark--3d'].filter(Boolean).join(' ');
  return (
    <span className={cls} role="img" aria-label="signal" style={size ? { fontSize: size } : undefined}>
      <span className="wordmark__face" />
    </span>
  );
}

/** Mark and wordmark together, sharing one finish. Height follows font-size. */
export function Lockup({ finish = 'ink', depth = false, size }: { finish?: Finish; depth?: boolean; size?: string }) {
  return (
    <span className="lockup" role="img" aria-label="signal" style={size ? { fontSize: size } : undefined}>
      <LogoMark finish={finish} depth={depth} />
      <Wordmark finish={finish} depth={depth} />
    </span>
  );
}

/** Spectral fill for a Signal Speed word, on a dark ground. `vivid` is the saturated version. */
export function PrismWord({ text, vivid = false }: { text: string; vivid?: boolean }) {
  return <span className={`t-speed ${vivid ? 'prism-text--vivid' : 'prism-text'}`}>{text}</span>;
}

/** Gradient-filled display word. `tone="aurora"` is for ink backgrounds. */
export function ChromaWord({
  children,
  tone = 'chroma',
  className = 't-mega',
  ...rest
}: { children: ReactNode; tone?: 'chroma' | 'aurora' } & Omit<ComponentProps<typeof GradientText>, 'children' | 'colors'>) {
  return (
    <GradientText
      colors={tone === 'aurora' ? aurora : chroma}
      variant="linear"
      angle={100}
      animationSpeed={9}
      scale={1.2}
      yoyo
      className={className}
      {...rest}
    >
      {children}
    </GradientText>
  );
}

/** The speedrun motion smear: ink copies trail the word and settle on load. */
export function EchoWord({ text, ...rest }: { text: string } & Omit<ComponentProps<typeof EchoText>, 'text'>) {
  return (
    <EchoText
      text={text}
      echoes={6}
      offset={28}
      direction="left"
      fade={0.6}
      blur={0}
      tint={false}
      mode="both"
      duration={1100}
      ease="snappy"
      fontSize="var(--fs-mega)"
      fontWeight={900}
      color={color.ink}
      className="signal-echo"
      {...rest}
    />
  );
}

/** Animated, grainy version of --grad-aura. Absolutely fills its positioned parent. */
export function AuraBackground({ tone = 'light' }: { tone?: 'light' | 'ink' }) {
  return (
    <div className="signal-fill" aria-hidden="true">
      <Grainient
        color1={color.cyan}
        color2={tone === 'ink' ? color.violet : color.peach}
        color3={tone === 'ink' ? color.azure : color.violet}
        lightMode={tone === 'light'}
        timeSpeed={0.12}
        warpStrength={0.8}
        contrast={1.1}
        saturation={1.05}
        grainAmount={0.06}
        zoom={0.8}
      />
    </div>
  );
}

/** Renders a speedrun-style card face in the system font, for HoloCard art. */
// The foil only shimmers over mid-tones, so the face is painted with the chroma ramp, not white or ink.
function useCardFace(label: string, big: string) {
  const [src, setSrc] = useState<string>();
  useEffect(() => {
    let alive = true;
    document.fonts.load(`900 200px ${font.sans}`).then(() => {
      if (!alive) return;
      const c = document.createElement('canvas');
      c.width = 640;
      c.height = 896;
      const g = c.getContext('2d')!;
      const ramp = g.createLinearGradient(0, 0, c.width, c.height);
      [color.cyan, color.azure, color.violet, color.peach].forEach((stop, i, all) => ramp.addColorStop(i / (all.length - 1), stop));
      g.fillStyle = ramp;
      g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = color.ink;
      g.font = `600 34px ${font.condensed}`;
      g.fillText(label.toUpperCase(), 48, 80);
      g.font = `900 ${big.length > 3 ? 190 : 260}px ${font.sans}`;
      g.letterSpacing = '-12px';
      g.fillText(big, 36, 840);
      setSrc(c.toDataURL('image/png'));
    });
    return () => {
      alive = false;
    };
  }, [label, big]);
  return src;
}

export function SignalHoloCard({ label, big, width = 280 }: { label: string; big: string; width?: number }) {
  const image = useCardFace(label, big);
  if (!image) return <div style={{ width, aspectRatio: '5 / 7' }} />;
  return <HoloCard image={image} alt={`${label}: ${big}`} preset="shards" foilColor={color.cyan} width={width} radius={16} intensity={0.7} />;
}

/** Holographic primary button with a light streak that follows the pointer. */
export function HoloButton({ children, href = '#' }: { children: ReactNode; href?: string }) {
  return (
    <GlareHover
      width="auto"
      height="auto"
      background="transparent"
      borderRadius="8px"
      borderColor="transparent"
      glareColor="#ffffff"
      glareOpacity={0.6}
      variant="streak"
      mode="hover"
      className="signal-glare"
    >
      <a className="btn" href={href}>
        {children}
      </a>
    </GlareHover>
  );
}

/** Animated stat: "$1M", "300+". */
export function Stat({ to, prefix = '', suffix = '', label }: { to: number; prefix?: string; suffix?: string; label: string }) {
  return (
    <div className="signal-stat">
      <p className="t-display">
        {prefix}
        <CountUp to={to} duration={1.6} separator="," />
        {suffix}
      </p>
      <p className="t-small t-muted">{label}</p>
    </div>
  );
}

/** Giant words that drift sideways and speed up with scroll. */
export function SpeedMarquee({ lines }: { lines: string[] }) {
  return (
    <div className="signal-marquee">
      <ScrollVelocity texts={lines} velocity={40} numCopies={6} />
    </div>
  );
}

/**
 * Liquid chrome with prismatic edge dispersion. Pass `src` (SVG/PNG, dark shape on transparent) or `text`,
 * which is set in Signal Speed.
 * Each instance is a WebGL canvas: keep it to a handful per page and out of looping marquees.
 */
export function MetallicLogo({
  text,
  src,
  height = 120,
  tone = 'ink'
}: { text?: string; src?: string; height?: number | string; tone?: 'ink' | 'paper' }) {
  return (
    <div className="signal-metal" style={{ height }} role="img" aria-label={text ?? 'Logo'}>
      <MetallicPaint
        text={text}
        imageSrc={src}
        fontFamily={font.speed}
        fontWeight={900}
        color={color.white}
        lightMode={tone === 'paper'}
        scale={0.9}
        speed={0.6}
        dispersion={0.6}
        mouseTilt={0.4}
      />
    </div>
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return reduced;
}

/**
 * Liquid rings spreading from an edge. `chrome` is molten silver on paper; `prism` splits the rings into the
 * spectrum on ink. Children sit on top. Fills its parent; give the parent a height.
 */
export function ChromeRipple({
  tone = 'chrome',
  position = 'bottom',
  children
}: { tone?: 'chrome' | 'prism'; position?: 'center' | 'top' | 'bottom' | 'left' | 'right'; children?: ReactNode }) {
  const reduced = useReducedMotion();
  const prism = tone === 'prism';
  return (
    <RadialLiquid
      speed={reduced ? 0 : 0.6}
      color1={prism ? color.cyan : color.white}
      color2={prism ? color.violet : '#8e979f'}
      color3={prism ? color.peach : '#0b0d10'}
      backgroundColor={prism ? '#0b0d10' : color.paper}
      position={position}
      chromaShift={prism ? 0.7 : 0}
      edgeHighlight={prism ? 0.35 : 0.5}
      enableCursorInteraction={!reduced}
    >
      {children}
    </RadialLiquid>
  );
}

/** Pixel tiles over waves of split light in cyan, violet and peach; overlaps resolve to the SR pastels. Sits on ink. */
export function PrismMosaic({ tile = 12, children }: { tile?: number; children?: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <div className="signal-fill-ink">
      <Mosaic speed={reduced ? 0 : 0.8} color1={color.cyan} color2={color.violet} color3={color.peach} pixelSize={tile} borderIntensity={0.6} waveIntensity={1.7} waveWidth={1.6} quality="medium">
        {children}
      </Mosaic>
    </div>
  );
}

/** Streaks of light flowing like liquid, with red, green and blue fringes. On ink. Fills its parent. */
export function LightLines({ intensity = 1 }: { intensity?: number }) {
  const reduced = useReducedMotion();
  return <LiquidLines speed={reduced ? 0 : 0.35} lineColor={color.white} backgroundColor="#0b0d10" brightness={2.5 * intensity} />;
}

/** Portfolio logo strip. Pass text wordmarks or images. */
export function LogoStrip({ logos }: { logos: ComponentProps<typeof LogoLoop>['logos'] }) {
  return (
    <div className="signal-logos">
      <LogoLoop logos={logos} speed={60} gap={64} logoHeight={32} fadeOut fadeOutColor={color.paper} pauseOnHover ariaLabel="Portfolio companies" />
    </div>
  );
}
