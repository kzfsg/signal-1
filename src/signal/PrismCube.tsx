import type { CSSProperties, ReactNode } from 'react';
import './PrismCube.css';

const FACES = ['front', 'back', 'right', 'left', 'top', 'bottom'] as const;

/**
 * A glass cube with prismatic faces, after the speedrun SR cube. Pure CSS 3D.
 * `mark` sits on the front face; use <ChromeWord> for the cube look.
 */
export function PrismCube({ size = 280, mark, spin = true }: { size?: number; mark?: ReactNode; spin?: boolean }) {
  return (
    <div className="prism-cube" style={{ '--cube': `${size}px` } as CSSProperties}>
      <div className={`prism-cube__body${spin ? ' prism-cube__body--spin' : ''}`}>
        {FACES.map(face => (
          <div key={face} className={`prism-cube__face prism-cube__face--${face}`}>
            {face === 'front' && mark && <div className="prism-cube__mark">{mark}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
