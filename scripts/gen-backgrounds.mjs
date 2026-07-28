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

const W = 1600;
const H = 1000;

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

/** Panel washes — each index shares a hue family across light and dark. */
const PANELS = [
  {
    name: "panel-1", // sand
    light: {
      base: C.cream,
      seed: 5,
      fields: [
        { cx: 0.2, cy: 0.28, r: 0.5, color: C.sand, opacity: 0.72 },
        { cx: 0.72, cy: 0.72, r: 0.42, color: C.sand, opacity: 0.4 },
        { cx: 0.6, cy: 0.1, r: 0.3, color: C.sage, opacity: 0.3 },
      ],
    },
    dark: {
      base: C.dark,
      seed: 5,
      fields: [
        { cx: 0.2, cy: 0.28, r: 0.5, color: C.sand, opacity: 0.42 },
        { cx: 0.74, cy: 0.74, r: 0.4, color: C.sand, opacity: 0.16 },
        { cx: 0.62, cy: 0.1, r: 0.28, color: C.orange, opacity: 0.16 },
      ],
    },
  },
  {
    name: "panel-2", // sage
    light: {
      base: C.cream,
      seed: 17,
      fields: [
        { cx: 0.74, cy: 0.32, r: 0.5, color: C.sage, opacity: 0.85 },
        { cx: 0.26, cy: 0.74, r: 0.4, color: C.sage, opacity: 0.42 },
        { cx: 0.42, cy: 0.16, r: 0.28, color: C.sand, opacity: 0.42 },
      ],
    },
    dark: {
      base: C.dark,
      seed: 17,
      fields: [
        { cx: 0.74, cy: 0.32, r: 0.5, color: C.sage, opacity: 0.36 },
        { cx: 0.24, cy: 0.74, r: 0.4, color: C.sage, opacity: 0.14 },
        { cx: 0.44, cy: 0.14, r: 0.26, color: C.sand, opacity: 0.16 },
      ],
    },
  },
  {
    name: "panel-3", // neutral warm
    light: {
      base: C.cream,
      seed: 29,
      fields: [
        { cx: 0.32, cy: 0.6, r: 0.52, color: C.sand, opacity: 0.6 },
        { cx: 0.78, cy: 0.24, r: 0.4, color: C.sage, opacity: 0.45 },
        { cx: 0.5, cy: 0.9, r: 0.3, color: C.sand, opacity: 0.35 },
      ],
    },
    dark: {
      base: C.dark,
      seed: 29,
      fields: [
        { cx: 0.32, cy: 0.6, r: 0.5, color: C.sand, opacity: 0.26 },
        { cx: 0.78, cy: 0.24, r: 0.38, color: C.sage, opacity: 0.2 },
        { cx: 0.5, cy: 0.9, r: 0.28, color: C.sand, opacity: 0.14 },
      ],
    },
  },
  {
    name: "panel-4", // sand + orange
    light: {
      base: C.cream,
      seed: 41,
      fields: [
        { cx: 0.7, cy: 0.62, r: 0.5, color: C.sand, opacity: 0.68 },
        { cx: 0.24, cy: 0.28, r: 0.4, color: C.sage, opacity: 0.34 },
        { cx: 0.86, cy: 0.12, r: 0.24, color: C.orange, opacity: 0.22 },
      ],
    },
    dark: {
      base: C.dark,
      seed: 41,
      fields: [
        { cx: 0.7, cy: 0.62, r: 0.48, color: C.sand, opacity: 0.36 },
        { cx: 0.24, cy: 0.28, r: 0.38, color: C.sage, opacity: 0.16 },
        { cx: 0.86, cy: 0.12, r: 0.22, color: C.orange, opacity: 0.24 },
      ],
    },
  },
];

/** Hero: wide, dark, atmospheric — sits behind the headline and product frame. */
const HERO = {
  base: C.dark,
  seed: 63,
  grain: 0.4,
  fields: [
    { cx: 0.5, cy: 0.06, r: 0.6, color: C.sand, opacity: 0.3 },
    { cx: 0.14, cy: 0.4, r: 0.42, color: C.sage, opacity: 0.18 },
    { cx: 0.86, cy: 0.34, r: 0.4, color: C.orange, opacity: 0.16 },
  ],
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
  written.push(await render("hero-dark", HERO, 1920, 1100));
  console.log(`wrote ${written.length} background(s) to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
