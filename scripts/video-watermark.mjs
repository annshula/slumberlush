/**
 * Burns a small, tasteful URL watermark into a hero video and writes a
 * web-optimised copy plus a poster frame.
 *
 *   node scripts/video-watermark.mjs <input.mp4> <font.ttf> [out-name]
 *
 * · <font.ttf>  Cormorant Garamond Medium (the site's heading face). The text
 *               is converted to vector outlines first, so ffmpeg needs no
 *               font support and the lettering is crisp at any size.
 * · Output      public/videos/<out-name>.mp4   (muted, H.264, faststart)
 *               public/videos/<out-name>-poster.jpg
 *
 * Needs ffmpeg/ffprobe on PATH and `opentype.js` (npm i -D opentype.js@1).
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import opentype from "opentype.js";
import sharp from "sharp";

const [input, fontPath, outName = "hero"] = process.argv.slice(2);
if (!input || !fontPath) {
  console.error("usage: node scripts/video-watermark.mjs <input.mp4> <font.ttf> [out-name]");
  process.exit(1);
}

const TEXT = "www.slumberlush.com";
const INK = "#232a3d"; // site "dusk-900"
const OPACITY = 0.62;
const TRACKING = 0.14; // em
const MARGIN_X = 0.034; // of video width
const MARGIN_Y = 0.045; // of video height
const WIDTH_SHARE = 0.135; // watermark width as a share of video width

const probe = JSON.parse(
  execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", input], { encoding: "utf8" }),
);
const { width: W, height: H } = probe.streams[0];

/* Lay the text out as outlines with generous letter-spacing. */
const font = opentype.loadSync(fontPath);
const size = 100;
let x = 0;
const paths = [];
for (const ch of TEXT) {
  const glyph = font.charToGlyph(ch);
  paths.push(glyph.getPath(x, 0, size).toPathData(2));
  x += (glyph.advanceWidth * size) / font.unitsPerEm + size * TRACKING;
}
const textW = x - size * TRACKING;
const asc = (font.ascender * size) / font.unitsPerEm;
const desc = (-font.descender * size) / font.unitsPerEm;
const textH = asc + desc;

const wmW = Math.round(W * WIDTH_SHARE);
const scale = wmW / textW;
const wmH = Math.ceil(textH * scale);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${wmW}" height="${wmH}" viewBox="0 0 ${textW} ${textH}">
  <g transform="translate(0 ${asc})" fill="${INK}" fill-opacity="${OPACITY}">${paths.map((d) => `<path d="${d}"/>`).join("")}</g>
</svg>`;

const tmp = "design/video/_watermark.png";
fs.mkdirSync("design/video", { recursive: true });
await sharp(Buffer.from(svg), { density: 300 }).resize({ width: wmW }).png().toFile(tmp);

const ox = Math.round(W * MARGIN_X);
const oy = H - Math.round(H * MARGIN_Y) - wmH;

fs.mkdirSync("public/videos", { recursive: true });
const out = `public/videos/${outName}.mp4`;
execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-y",
    "-i", input,
    "-i", tmp,
    "-filter_complex", `[0:v][1:v]overlay=${ox}:${oy}:format=auto,format=yuv420p`,
    "-an",
    "-c:v", "libx264", "-preset", "slow", "-crf", "21",
    "-profile:v", "high", "-level", "4.1",
    "-movflags", "+faststart",
    out,
  ],
  { stdio: "inherit" },
);

/* Poster: the first frame, so the hero never flashes blank while the video loads. */
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", out, "-frames:v", "1", "-q:v", "3", `public/videos/${outName}-poster.jpg`], { stdio: "inherit" });

const kb = (f) => Math.round(fs.statSync(f).size / 1024) + " KB";
console.log(`✓ ${out} (${W}×${H}, ${kb(out)})`);
console.log(`✓ public/videos/${outName}-poster.jpg (${kb(`public/videos/${outName}-poster.jpg`)})`);
console.log(`  watermark ${wmW}×${wmH}px at ${ox},${oy}`);
