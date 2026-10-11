// React Bits Pro: Liquid Lines (liquid-lines). Licensed via the project's React Bits Pro key.
// Adapted for Signal: ported from @react-three/fiber to plain three.js, and next-themes replaced with an explicit
// `backgroundColor` prop, to avoid two dependencies. Shader unchanged.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export interface LiquidLinesProps {
  /** Width of the component */
  width?: string | number;
  /** Height of the component */
  height?: string | number;
  /** Additional CSS classes */
  className?: string;
  /** Animation speed multiplier */
  speed?: number;
  /** Number of iterations for detail (higher = more detailed but slower) */
  iterations?: number;
  /** Wave frequency - controls how many waves appear */
  waveFrequency?: number;
  /** Depth progression - how much depth changes per iteration */
  depthStep?: number;
  /** Line thickness - controls the thickness of the lines */
  lineThickness?: number;
  /** Wave amplitude - how much the waves displace */
  waveAmplitude?: number;
  /** Primary line color */
  lineColor?: string;
  /** Background color (replaces the original light/dark theme pair) */
  backgroundColor?: string;
  /** Brightness multiplier */
  brightness?: number;
  /** Contrast adjustment */
  contrast?: number;
  /** Horizontal offset */
  offsetX?: number;
  /** Vertical offset */
  offsetY?: number;
  /** Pattern scale */
  scale?: number;
  /** Alpha/opacity of the effect */
  opacity?: number;
}

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
uniform float u_speed;
uniform int u_iterations;
uniform float u_waveFrequency;
uniform float u_depthStep;
uniform float u_lineThickness;
uniform float u_waveAmplitude;
uniform vec3 u_lineColor;
uniform vec3 u_backgroundColor;
uniform float u_brightness;
uniform float u_contrast;
uniform float u_offsetX;
uniform float u_offsetY;
uniform float u_scale;
uniform float u_opacity;

varying vec2 vUv;

void main() {
  float time = u_time * u_speed;
  vec2 resolution = u_resolution;

  vec3 accumulator = vec3(0.0);
  float depth = time;
  float magnitude = 0.0;

  vec2 baseCoord = (vUv - 0.5) * 2.0;
  baseCoord.x *= resolution.x / resolution.y;
  baseCoord *= u_scale;
  baseCoord += vec2(u_offsetX, u_offsetY);

  for (int i = 0; i < 100; i++) {
    if (i >= u_iterations) break;

    vec2 coord = baseCoord;
    vec2 waveCoord = coord;

    coord -= waveCoord.x + 0.1;
    coord.x *= resolution.x / resolution.y;

    depth += u_depthStep;
    magnitude = length(coord);

    float phase1 = depth * 0.7;
    float phase2 = depth * 1.3;
    float wave1 = sin(phase1) * 0.5 + cos(phase2) * 0.5 + 1.5;
    float wave2 = sin(magnitude * u_waveFrequency - depth) * 0.7 + cos(magnitude * u_waveFrequency * 0.5 + depth * 0.3) * 0.3;
    waveCoord += coord / max(magnitude, 0.01) * wave1 * wave2 * u_waveAmplitude;

    vec2 gridPos = mod(waveCoord, 1.0) - 0.5;
    float lineIntensity = u_lineThickness / length(gridPos);

    if (i == 0) accumulator.r = lineIntensity;
    else if (i == 1) accumulator.g = lineIntensity;
    else if (i == 2) accumulator.b = lineIntensity;
    else {
      accumulator += vec3(lineIntensity) * 0.01;
    }
  }

  accumulator = accumulator / max(magnitude, 0.001);

  accumulator = (accumulator - 0.5) * u_contrast + 0.5;
  accumulator *= u_brightness;

  vec3 finalColor = accumulator * u_lineColor;

  float alpha = clamp(length(accumulator) * u_opacity, 0.0, 1.0);
  finalColor = mix(u_backgroundColor, finalColor, alpha);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const LiquidLines: React.FC<LiquidLinesProps> = ({
  width = '100%',
  height = '100%',
  className = '',
  speed = 0.4,
  iterations = 3,
  waveFrequency = 49,
  depthStep = 0.05,
  lineThickness = 0.009,
  waveAmplitude = 0.6,
  lineColor = '#ffffff',
  backgroundColor = '#000000',
  brightness = 2.5,
  contrast = 1.1,
  offsetX = 0,
  offsetY = 0,
  scale = 0.3,
  opacity = 1
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const props = { speed, iterations, waveFrequency, depthStep, lineThickness, waveAmplitude, lineColor, backgroundColor, brightness, contrast, offsetX, offsetY, scale, opacity };
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    // Full-screen quad in clip space: the original drew a viewport-sized plane through a perspective camera
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
    const p = propsRef.current;

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(1, 1) },
      u_speed: { value: p.speed },
      u_iterations: { value: p.iterations },
      u_waveFrequency: { value: p.waveFrequency },
      u_depthStep: { value: p.depthStep },
      u_lineThickness: { value: p.lineThickness },
      u_waveAmplitude: { value: p.waveAmplitude },
      u_lineColor: { value: new THREE.Color(p.lineColor) },
      u_backgroundColor: { value: new THREE.Color(p.backgroundColor) },
      u_brightness: { value: p.brightness },
      u_contrast: { value: p.contrast },
      u_offsetX: { value: p.offsetX },
      u_offsetY: { value: p.offsetY },
      u_scale: { value: p.scale },
      u_opacity: { value: p.opacity }
    };

    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms });
    const geometry = new THREE.PlaneGeometry(1, 1);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      uniforms.u_resolution.value.set(width, height);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    const start = performance.now();
    let raf = 0;
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const c = propsRef.current;
      uniforms.u_time.value = (performance.now() - start) / 1000;
      uniforms.u_speed.value = c.speed;
      uniforms.u_iterations.value = c.iterations;
      uniforms.u_waveFrequency.value = c.waveFrequency;
      uniforms.u_depthStep.value = c.depthStep;
      uniforms.u_lineThickness.value = c.lineThickness;
      uniforms.u_waveAmplitude.value = c.waveAmplitude;
      uniforms.u_lineColor.value.set(c.lineColor);
      uniforms.u_backgroundColor.value.set(c.backgroundColor);
      uniforms.u_brightness.value = c.brightness;
      uniforms.u_contrast.value = c.contrast;
      uniforms.u_offsetX.value = c.offsetX;
      uniforms.u_offsetY.value = c.offsetY;
      uniforms.u_scale.value = c.scale;
      uniforms.u_opacity.value = c.opacity;
      renderer.render(scene, camera);
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    />
  );
};

LiquidLines.displayName = 'LiquidLines';

export default LiquidLines;
