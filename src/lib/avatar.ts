/** Deterministic premium avatar as data-URI SVG — always loads offline. */

const PALETTES = [
  ["#86efac", "#14532d"],
  ["#67e8f9", "#164e63"],
  ["#c4b5fd", "#4c1d95"],
  ["#fbbf24", "#78350f"],
  ["#fb7185", "#881337"],
  ["#a3e635", "#365314"],
  ["#38bdf8", "#0c4a6e"],
  ["#f472b6", "#831843"],
  ["#facc15", "#713f12"],
  ["#2dd4bf", "#134e4a"],
  ["#e879f9", "#701a75"],
  ["#fdba74", "#7c2d12"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function coinAvatarUrl(seed: string, symbol: string): string {
  const h = hash(seed + symbol);
  const [fg, bg] = PALETTES[h % PALETTES.length];
  const initials = (symbol || "??").slice(0, 3).toUpperCase();
  const rot = h % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg}"/>
      <stop offset="100%" stop-color="${fg}"/>
    </linearGradient>
    <radialGradient id="r" cx="30%" cy="25%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="256" height="256" rx="48" fill="url(#g)"/>
  <rect width="256" height="256" rx="48" fill="url(#r)"/>
  <circle cx="200" cy="56" r="40" fill="${fg}" opacity="0.25" transform="rotate(${rot} 128 128)"/>
  <circle cx="48" cy="200" r="56" fill="${bg}" opacity="0.45"/>
  <text x="128" y="142" text-anchor="middle" font-family="ui-sans-serif,system-ui,sans-serif" font-size="72" font-weight="800" fill="#0a0a0a" opacity="0.9">${initials}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
