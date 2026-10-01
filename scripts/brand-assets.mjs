/**
 * Builds every brand asset from the master logos in design/brand:
 *   design/brand/slumberlush-logo.png        (navy, transparent)
 *   design/brand/slumberlush-logo-white.png  (white, transparent)
 *   design/brand/favicon-logo.png            (white cloud mark, transparent)
 *   design/brand/og-meta.png                 (social share image, 16:9)
 *
 *   node scripts/brand-assets.mjs
 *
 * Writes trimmed + optimised logos and the cloud-and-star mark to
 * public/brand, the favicon (.ico / .svg / .png) and app icons (from
 * favicon-logo.png), and the Open Graph / Twitter image (from og-meta.png).
 */
import fs from "node:fs";
import sharp from "sharp";

const OUT = "public/brand";
fs.mkdirSync(OUT, { recursive: true });

const NAVY_BG = "#171b2a";
const MILK = "#fbf8f3";

const trimmed = async (file) =>
  sharp(file).trim({ threshold: 8 }).toBuffer({ resolveWithObject: true });

const dark = await trimmed("design/brand/slumberlush-logo.png");
const light = await trimmed("design/brand/slumberlush-logo-white.png");
console.log("logo (trimmed)", dark.info.width, "x", dark.info.height, "|", light.info.width, "x", light.info.height);

const save = (buf, name, width) =>
  sharp(buf).resize({ width }).png({ compressionLevel: 9, palette: false }).toFile(`${OUT}/${name}`);

await save(dark.data, "logo.png", 1200);
await save(light.data, "logo-white.png", 1200);
// Smaller display sizes (the site renders the logo at <= 360px wide).
await save(dark.data, "logo-sm.png", 480);
await save(light.data, "logo-white-sm.png", 480);

/* The mark: the cloud + star. Cut out by connected components — anything
   that touches the very top of the trimmed logo (the cloud and the star) is
   kept; every letter is dropped. This works for both logo variants without
   hand-tuned crop boxes. */
const markCrop = async (buf) => {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const alpha = (i) => data[i * 4 + 3];
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || alpha(start) < 24) continue;
    const id = comps.length;
    const comp = { minY: h, minX: w, maxX: 0, maxY: 0, px: 0 };
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w;
      const y = (p - x) / w;
      comp.px++;
      if (y < comp.minY) comp.minY = y;
      if (y > comp.maxY) comp.maxY = y;
      if (x < comp.minX) comp.minX = x;
      if (x > comp.maxX) comp.maxX = x;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (label[q] === -1 && alpha(q) >= 24) {
          label[q] = id;
          stack.push(q);
        }
      }
    }
    comps.push(comp);
  }
  const keep = new Set(comps.map((c, i) => (c.minY < h * 0.12 && c.px > 400 ? i : -1)).filter((i) => i >= 0));
  const out = Buffer.from(data);
  for (let i = 0; i < w * h; i++) if (!keep.has(label[i])) out[i * 4 + 3] = 0;
  return sharp(out, { raw: { width: w, height: h, channels: 4 } }).trim({ threshold: 8 }).png().toBuffer();
};
const markDark = await markCrop(dark.data);
const markLight = await markCrop(light.data);
await save(markDark, "mark.png", 640);
await save(markLight, "mark-white.png", 640);
console.log("✓ logos + mark");

/* Favicon / app icons: the master mark (favicon-logo.png, white on
   transparent) trimmed and centred on midnight. Small sizes fill more of the
   tile so the cloud stays legible at 16px. */
const faviconMark = await sharp("design/brand/favicon-logo.png").trim({ threshold: 8 }).toBuffer();
const icon = async (size, radius, fill = 0.64) => {
  const inner = Math.round(size * fill);
  const m = await sharp(faviconMark).resize({ width: inner, height: inner, fit: "inside" }).toBuffer();
  const bg = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${radius}" fill="${NAVY_BG}"/></svg>`,
  );
  return sharp(bg).composite([{ input: m, gravity: "centre" }]).png().toBuffer();
};
const write = (buf, file) => fs.promises.writeFile(file, buf);

await write(await icon(512, 112), "src/app/icon.png");
await write(await icon(180, 0), "src/app/apple-icon.png");
await write(await icon(192, 112), "public/icons/icon-192.png");
await write(await icon(512, 112), "public/icons/icon-512.png");
// Maskable variant: full-bleed square, mark inside the safe zone.
await write(await icon(512, 0, 0.5), "public/icons/icon-maskable-512.png");

/* favicon.ico — PNG-compressed entries at 16, 32 and 48 px. */
const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((n) => icon(n, Math.round(n * 0.22), n <= 32 ? 0.74 : 0.68)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = 6 + sizes.length * 16;
const entries = pngs.map((png, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 0);
  e.writeUInt8(sizes[i] === 256 ? 0 : sizes[i], 1);
  e.writeUInt16LE(1, 4);
  e.writeUInt16LE(32, 6);
  e.writeUInt32LE(png.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += png.length;
  return e;
});
await write(Buffer.concat([header, ...entries, ...pngs]), "src/app/favicon.ico");

/* icon.svg — scalable favicon for browsers that prefer SVG (embeds the PNG). */
const svgPng = (await icon(256, 56)).toString("base64");
await write(
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256"><image width="256" height="256" href="data:image/png;base64,${svgPng}"/></svg>`),
  "src/app/icon.svg",
);
console.log("✓ favicon.ico + icon.svg + app icons");

/* Open Graph + Twitter card: the designed master (og-meta.png, 16:9) cover-
   cropped to the standard 1200×630 and saved as an optimised JPEG. */
const og = await sharp("design/brand/og-meta.png")
  .resize(1200, 630, { fit: "cover", position: "centre" })
  .jpeg({ quality: 86, mozjpeg: true })
  .toBuffer();
await write(og, "src/app/opengraph-image.jpg");
await write(og, "src/app/twitter-image.jpg");
console.log("✓ open graph + twitter image", Math.round(og.length / 1024) + " KB");
