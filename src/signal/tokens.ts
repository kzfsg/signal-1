// JS mirror of design-system/tokens.css for components that need literal colours (WebGL, canvas).
// Keep in sync with tokens.css.
export const color = {
  paper: '#ebe9e5',
  sand: '#e2dfd8',
  white: '#ffffff',
  ink: '#000000',
  cyan: '#56faf7',
  azure: '#00a1ff',
  blue: '#398cff',
  indigo: '#757aff',
  violet: '#a162ff',
  peach: '#f8dcbb'
} as const;

export const chroma = [color.azure, color.blue, color.indigo, color.violet];
export const aurora = [color.cyan, color.azure, color.violet, color.peach];

export const font = {
  speed: '"Signal Speed", "Hanken Grotesk", sans-serif',
  sans: '"Hanken Grotesk", "Messina Sans", system-ui, sans-serif',
  condensed: '"Barlow Condensed", "Messina Sans Condensed", "Arial Narrow", sans-serif'
};
