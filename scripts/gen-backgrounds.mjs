/**
 * Generates Kredal's painterly background art (see design.md § Background art).
 *
 * Each wash is composed as an SVG — layered radial colour fields, organic
 * displacement from feTurbulence, a soft blur, and a fine grain layer — then
 * rasterised to WebP so the browser never pays the filter cost.
 *
 * Run (no app dependency needed):
 *   cd kredal-app && npx --yes sharp-cli@5 --version >/dev/null   # ensures sharp is fetchable
 *   node scripts/gen-backgrounds.mjs
 *
 * If `sharp` is not resolvable, install it once in a scratch dir and run with
 * NODE_PATH pointing at it:
 *   NODE_PATH=/tmp/gfx/node_modules node scripts/gen-backgrounds.mjs
 *
 * Output: public/backgrounds/*.webp  (committed; regenerate only when the
 * palette in design.md changes).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../public/backgrounds");

const W = 1700;
const H = 760;

/** Brand palette — keep in sync with design.md. */
const C = {
  cream: "#f7f7f4",
  ink: "#26251e",
  dark: "#14120b",
  sand: "#dfa88f",
  sage: "#9fc9a2",
  orange: "#f54e00",
  warmCard: "#f3ede6",
  cardDark: "#1b1913",
};

/**
 * One painterly wash: a base fill plus soft colour fields, distorted by
 * turbulence for painted edges, finished with a grain overlay.
 */
function washSVG({ base, fields, seed = 3 }, w = W, h = H) {
  const blobs = fields
    .map(
      ({ color, opacity }, i) => `
      <radialGradient id="g${i}" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="${opacity}"/>
        <stop offset="55%" stop-color="${color}" stop-opacity="${opacity * 0.5}"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </radialGradient>`
    )
    .join("");

  const circles = fields
    .map(
      ({ cx, cy, r }, i) =>
        `<ellipse cx="${cx * w}" cy="${cy * h}" rx="${r * w}" ry="${r * h * 1.2}" fill="url(#g${i})"/>`
    )
    .join("");

  // Gentle displacement then a heavy blur: enough to break the perfect ellipse
  // edges into painted shapes, without the hard ring artefacts a large scale
  // produces where fields overlap.
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    ${blobs}
    <filter id="paint" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.0022 0.0035" numOctaves="3" seed="${seed}" result="warp"/>
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="55" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="60"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="${base}"/>
  <g filter="url(#paint)">${circles}</g>
</svg>`;
}

/** Panel washes — each index shares a hue family across light and dark.
 *
 * Fields are large and overlapping so paint reaches every edge of the stage; a
 * wash whose fields fade back to bare cream reads as an unpainted box, not as
 * art. Copy never sits on these, so they run at full strength.
 */
const PANELS = [
  {
    name: "panel-1", // sand
    light: { base: C.warmCard, seed: 5, fields: [
      { cx: 0.18, cy: 0.3, r: 0.62, color: C.sand, opacity: 1 },
      { cx: 0.78, cy: 0.72, r: 0.55, color: C.sand, opacity: 0.7 },
      { cx: 0.6, cy: 0.08, r: 0.44, color: C.sage, opacity: 0.6 },
    ] },
    dark: { base: C.dark, seed: 5, fields: [
      { cx: 0.18, cy: 0.3, r: 0.62, color: C.sand, opacity: 0.73 },
      { cx: 0.78, cy: 0.72, r: 0.55, color: C.sand, opacity: 0.36 },
      { cx: 0.6, cy: 0.08, r: 0.44, color: C.orange, opacity: 0.32 },
    ] },
  },
  {
    name: "panel-2", // sage
    light: { base: C.warmCard, seed: 17, fields: [
      { cx: 0.76, cy: 0.34, r: 0.62, color: C.sage, opacity: 1 },
      { cx: 0.22, cy: 0.7, r: 0.55, color: C.sage, opacity: 0.66 },
      { cx: 0.4, cy: 0.12, r: 0.44, color: C.sand, opacity: 0.72 },
    ] },
    dark: { base: C.dark, seed: 17, fields: [
      { cx: 0.76, cy: 0.34, r: 0.62, color: C.sage, opacity: 0.6 },
      { cx: 0.22, cy: 0.7, r: 0.55, color: C.sage, opacity: 0.3 },
      { cx: 0.4, cy: 0.12, r: 0.44, color: C.sand, opacity: 0.34 },
    ] },
  },
  {
    name: "panel-3", // neutral warm
    light: { base: C.warmCard, seed: 29, fields: [
      { cx: 0.3, cy: 0.62, r: 0.64, color: C.sand, opacity: 0.9 },
      { cx: 0.8, cy: 0.22, r: 0.55, color: C.sage, opacity: 0.8 },
      { cx: 0.52, cy: 0.95, r: 0.44, color: C.sand, opacity: 0.6 },
    ] },
    dark: { base: C.dark, seed: 29, fields: [
      { cx: 0.3, cy: 0.62, r: 0.64, color: C.sand, opacity: 0.5 },
      { cx: 0.8, cy: 0.22, r: 0.55, color: C.sage, opacity: 0.38 },
      { cx: 0.52, cy: 0.95, r: 0.44, color: C.sand, opacity: 0.3 },
    ] },
  },
  {
    name: "panel-4", // sand + orange
    light: { base: C.warmCard, seed: 41, fields: [
      { cx: 0.72, cy: 0.64, r: 0.62, color: C.sand, opacity: 0.95 },
      { cx: 0.2, cy: 0.26, r: 0.55, color: C.sage, opacity: 0.62 },
      { cx: 0.9, cy: 0.1, r: 0.36, color: C.orange, opacity: 0.4 },
    ] },
    dark: { base: C.dark, seed: 41, fields: [
      { cx: 0.72, cy: 0.64, r: 0.62, color: C.sand, opacity: 0.66 },
      { cx: 0.2, cy: 0.26, r: 0.55, color: C.sage, opacity: 0.3 },
      { cx: 0.9, cy: 0.1, r: 0.36, color: C.orange, opacity: 0.46 },
    ] },
  },
];

/**
 * Hero stage: frames the headline product visual. Rendered at the wide, short
 * aspect the stage actually occupies (2000×820) — a taller canvas would put the
 * colour fields outside the `bg-cover` crop and the margin would read as flat.
 * Fields are spread across the full frame so every visible edge is painted.
 */
const HERO = {
  dark: {
    base: C.dark,
    seed: 63,
    grain: 0.4,
    fields: [
      { cx: 0.18, cy: 0.3, r: 0.46, color: C.sand, opacity: 0.98 },
      { cx: 0.82, cy: 0.68, r: 0.44, color: C.orange, opacity: 0.72 },
      { cx: 0.52, cy: 0.92, r: 0.4, color: C.sage, opacity: 0.6 },
      { cx: 0.93, cy: 0.12, r: 0.3, color: C.sage, opacity: 0.5 },
    ],
  },
  light: {
    base: C.cream,
    seed: 63,
    grain: 0.4,
    fields: [
      { cx: 0.18, cy: 0.3, r: 0.46, color: C.sand, opacity: 0.95 },
      { cx: 0.82, cy: 0.68, r: 0.44, color: C.orange, opacity: 0.4 },
      { cx: 0.52, cy: 0.9, r: 0.4, color: C.sage, opacity: 0.7 },
      { cx: 0.92, cy: 0.14, r: 0.3, color: C.sage, opacity: 0.55 },
    ],
  },
};

/**
 * Fine film grain. librsvg ignores `mix-blend-mode`, so the grain is composited
 * here with sharp instead of inside the SVG.
 */
async function grainLayer(width, height, sigma) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      noise: { type: "gaussian", mean: 128, sigma },
    },
  })
    .png()
    .toBuffer();
}

async function render(name, spec, width = W, height = H) {
  const svg = washSVG(spec, width, height);
  const out = resolve(OUT_DIR, `${name}.webp`);
  const grain = await grainLayer(width, height, spec.grainSigma ?? 9);

  await sharp(Buffer.from(svg), { density: 96 })
    .resize(width, height)
    .composite([{ input: grain, blend: "overlay", opacity: spec.grain ?? 0.5 }])
    .webp({ quality: 80, effort: 6 })
    .toFile(out);
  return out;
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const written = [];
  for (const p of PANELS) {
    written.push(await render(`${p.name}-light`, p.light));
    written.push(await render(`${p.name}-dark`, p.dark));
  }
  written.push(await render("hero-dark", HERO.dark, 2000, 820));
  written.push(await render("hero-light", HERO.light, 2000, 820));
  console.log(`wrote ${written.length} background(s) to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
