/**
 * Generates Kredal's background art (see design.md § 3.7).
 *
 * The art is sourced, not generated: four supplied landscape paintings are
 * cropped to the wide band each stage actually shows, pushed toward the brand
 * palette, and emitted as a light/dark pair per stage.
 *
 * Two things this script exists to guarantee:
 *
 *  1. **The signature never ships.** Every source painting carries an
 *     illegible generated signature along its bottom edge. `BAND_MAX_BOTTOM`
 *     is the hard ceiling on how far down a crop may reach, and `assertCrop`
 *     fails the build rather than letting one slip through.
 *  2. **Payload stays sane.** `ArtStage` renders the light and dark layer
 *     simultaneously (`dark:hidden` / `hidden dark:block`), so every byte here
 *     is downloaded twice. Budget is 500 KB for all ten files; the script
 *     prints the total and complains if it is exceeded.
 *
 * Run (sharp resolves transitively via next; no project dependency needed):
 *   cd kredal-app && node scripts/gen-backgrounds.mjs
 *
 * If `sharp` is not resolvable, install it once in a scratch dir:
 *   NODE_PATH=/tmp/gfx/node_modules node scripts/gen-backgrounds.mjs
 *
 * Output: public/backgrounds/{hero,panel-1..4}-{light,dark}.webp (committed;
 * regenerate only when the sources or the palette change).
 */
import { mkdirSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../public/backgrounds");

const SRC_DIR =
  "/Users/apple/Library/CloudStorage/GoogleDrive-you@example.com/My Drive/Ai Projects/AbuDhabi/Images Data ";

/** Every source is 2400×1792. */
const SRC_W = 2400;
const SRC_H = 1792;

/**
 * No crop may extend below this line. The generated signature sits in the
 * bottom-left of each painting, around y≈1700; this leaves ~150px of margin.
 */
const BAND_MAX_BOTTOM = 1550;

/** Brand palette — keep in sync with design.md. */
const C = {
  cream: { r: 247, g: 247, b: 244 },
  dark: { r: 20, g: 18, b: 11 },
  sand: { r: 223, g: 168, b: 143 },
};

const SOURCES = {
  lochSunset: "Generate_similar_image_different_2K_202607291407.jpg",
  valleyRoad: "Generate_similar_image_landscape_2K_202607291413.jpg",
  coralRiver: "Generate_similar_image_different_2K_202607291413.jpg",
  wideRiver: "Generate_similar_image_different_2K_202607291414.jpg",
};

/**
 * One stage. `top` picks which horizontal band of the painting is used — vary
 * it across stages so the set doesn't read as five crops of the same sky.
 */
const STAGES = [
  // The widest, calmest composition carries the headline product shot.
  { name: "hero", src: SOURCES.valleyRoad, top: 250, w: 2000, h: 820 },
  { name: "panel-1", src: SOURCES.lochSunset, top: 330, w: 1700, h: 760 },
  { name: "panel-2", src: SOURCES.coralRiver, top: 180, w: 1700, h: 760 },
  { name: "panel-3", src: SOURCES.wideRiver, top: 430, w: 1700, h: 760 },
  // Reuses the hero painting, but from a lower, greener band — and it sits four
  // panels away from the hero, so the repeat doesn't register.
  { name: "panel-4", src: SOURCES.valleyRoad, top: 470, w: 1700, h: 760 },
];

/**
 * Fails loudly rather than shipping a signature. Called for every crop.
 */
function assertCrop({ name, top, height }) {
  const bottom = top + height;
  if (bottom > BAND_MAX_BOTTOM) {
    throw new Error(
      `${name}: crop reaches y=${bottom}, past the ${BAND_MAX_BOTTOM}px ` +
        `signature guard. Raise \`top\` or shorten the band.`
    );
  }
  if (top < 0 || top + height > SRC_H) {
    throw new Error(`${name}: crop falls outside the ${SRC_W}×${SRC_H} source.`);
  }
}

/** A translucent flat colour, for tinting via composite. */
async function wash({ r, g, b }, alpha, width, height) {
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r, g, b, alpha },
    },
  })
    .png()
    .toBuffer();
}

/** Fine film grain, so the art keeps the texture the washes had. */
async function grain(width, height, sigma = 7) {
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

/**
 * The band, at the stage's aspect. The crop is as wide as the source and as
 * tall as that aspect allows, so we keep the full sweep of the composition.
 */
function bandFor({ w, h, top }) {
  const height = Math.round((SRC_W * h) / w);
  return { left: 0, top, width: SRC_W, height };
}

async function render(stage, theme) {
  const band = bandFor(stage);
  assertCrop({ name: `${stage.name}-${theme}`, top: band.top, height: band.height });

  const base = sharp(resolve(SRC_DIR, stage.src))
    .extract(band)
    .resize(stage.w, stage.h);

  // Both themes keep the painting essentially intact — the overlay is a hint of
  // brand colour, not a veil. The dark variant is only slightly cooled and
  // dimmed; crushing it toward ink both hid the art and, counter-intuitively,
  // *reduced* separation from the dark product card, which is nearly black.
  const tuned =
    theme === "light"
      ? base.modulate({ brightness: 1.03, saturation: 0.95 })
      : base.modulate({ brightness: 0.94, saturation: 0.92 });

  const layers =
    theme === "light"
      ? [
          { input: await wash(C.cream, 0.12, stage.w, stage.h), blend: "over" },
          { input: await wash(C.sand, 0.05, stage.w, stage.h), blend: "over" },
        ]
      : [
          { input: await wash(C.dark, 0.1, stage.w, stage.h), blend: "over" },
          { input: await wash(C.sand, 0.04, stage.w, stage.h), blend: "overlay" },
        ];

  layers.push({
    input: await grain(stage.w, stage.h),
    blend: "overlay",
    opacity: 0.22,
  });

  const out = resolve(OUT_DIR, `${stage.name}-${theme}.webp`);
  await tuned
    .composite(layers)
    .webp({ quality: 48, effort: 6 })
    .toFile(out);
  return out;
}

const BUDGET_BYTES = 500 * 1024;

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;
  for (const stage of STAGES) {
    for (const theme of ["light", "dark"]) {
      const file = await render(stage, theme);
      const bytes = statSync(file).size;
      total += bytes;
      console.log(
        `${stage.name}-${theme}`.padEnd(16),
        `${stage.w}×${stage.h}`.padEnd(10),
        `${(bytes / 1024).toFixed(1)} KB`
      );
    }
  }

  console.log(`\ntotal ${(total / 1024).toFixed(1)} KB across ${STAGES.length * 2} files`);
  if (total > BUDGET_BYTES) {
    console.error(
      `OVER BUDGET by ${((total - BUDGET_BYTES) / 1024).toFixed(1)} KB — ` +
        `lower webp quality before lowering dimensions.`
    );
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
