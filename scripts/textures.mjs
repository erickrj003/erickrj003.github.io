import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SIZE = 1024;
const OUT_DIR = "assets/img/textures";

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function mixRgb(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
  ];
}

function clampByte(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function hash2(ix, iy, seed) {
  let n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ seed;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y, periodX, periodY, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = fade(x - x0);
  const fy = fade(y - y0);
  const wrapX = (i) => ((i % periodX) + periodX) % periodX;
  const wrapY = (i) => ((i % periodY) + periodY) % periodY;
  const n00 = hash2(wrapX(x0), wrapY(y0), seed);
  const n10 = hash2(wrapX(x0 + 1), wrapY(y0), seed);
  const n01 = hash2(wrapX(x0), wrapY(y0 + 1), seed);
  const n11 = hash2(wrapX(x0 + 1), wrapY(y0 + 1), seed);
  return lerp(lerp(n00, n10, fx), lerp(n01, n11, fx), fy);
}

function fbm(x, y, scaleX, scaleY, octaves, seed) {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  let sx = scaleX;
  let sy = scaleY;
  for (let o = 0; o < octaves; o++) {
    if (sx < 1 || sy < 1) break;
    sum += amp * valueNoise(x / sx, y / sy, SIZE / sx, SIZE / sy, seed + o * 19);
    norm += amp;
    amp *= 0.5;
    sx /= 2;
    sy /= 2;
  }
  return sum / norm;
}

function paintWood() {
  const pixels = Buffer.alloc(SIZE * SIZE * 3);
  const base = [214, 192, 156];
  const dark = [186, 158, 116];
  const light = [236, 222, 194];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const grain = fbm(x, y, 128, 8, 5, 11);
      const board = fbm(x, y, 256, 128, 3, 3);
      const warp = (grain - 0.5) * 42 + (board - 0.5) * 18;
      const rings =
        0.5 +
        0.32 * Math.sin(((y + warp) * Math.PI * 2) / 32) +
        0.18 * Math.sin(((y + warp * 0.6) * Math.PI * 2) / 64);
      const pores = fbm(x, y, 8, 4, 3, 47);
      const dust = hash2(x, y, 7);

      let t = grain * 0.5 + rings * 0.32 + board * 0.12 + pores * 0.06;
      t = Math.min(1, Math.max(0, t));

      let rgb = mixRgb(dark, base, 0.35 + t * 0.65);
      rgb = mixRgb(rgb, light, t * 0.38);

      if (pores > 0.72 && grain > 0.38) {
        rgb = mixRgb(rgb, dark, (pores - 0.72) * 1.6);
      }

      rgb[0] += (dust - 0.5) * 7;
      rgb[1] += (dust - 0.5) * 5;
      rgb[2] += (dust - 0.5) * 4;

      const i = (y * SIZE + x) * 3;
      pixels[i] = clampByte(rgb[0]);
      pixels[i + 1] = clampByte(rgb[1]);
      pixels[i + 2] = clampByte(rgb[2]);
    }
  }

  return pixels;
}

function paintDamascus() {
  const pixels = Buffer.alloc(SIZE * SIZE * 3);
  const black = [1, 1, 2];
  const charcoal = [10, 10, 12];
  const steel = [32, 33, 36];
  const shine = [58, 60, 64];

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x / SIZE) * Math.PI * 2;
      const v = (y / SIZE) * Math.PI * 2;

      const flow =
        v +
        0.34 * Math.sin(u * 2) +
        0.18 * Math.sin(u * 5 + v * 3) +
        0.08 * Math.sin(u * 9 + v) +
        0.05 * Math.sin(u * 13 + v * 5);
      const t = flow * 7 + 0.2 * Math.sin(u * 7 + v * 2);

      const folded = Math.abs(Math.sin(t));
      const nested = Math.abs(Math.sin(t * 2 + 0.7));
      const band = Math.pow(folded, 0.55) * 0.72 + Math.pow(nested, 1.15) * 0.28;
      const ridge = Math.pow(Math.abs(Math.cos(t)), 12);

      const grain = fbm(x, y, 16, 16, 4, 23);
      const dust = hash2(x, y, 31);

      let rgb = mixRgb(black, charcoal, 0.25 + grain * 0.3);
      rgb = mixRgb(rgb, steel, band * 0.52);
      rgb = mixRgb(rgb, shine, ridge * 0.06);

      rgb[0] += (dust - 0.5) * 3;
      rgb[1] += (dust - 0.5) * 3;
      rgb[2] += (dust - 0.5) * 3;

      const i = (y * SIZE + x) * 3;
      pixels[i] = clampByte(rgb[0]);
      pixels[i + 1] = clampByte(rgb[1]);
      pixels[i + 2] = clampByte(rgb[2]);
    }
  }

  return pixels;
}

async function writeTexture(name, pixels) {
  const out = path.join(OUT_DIR, `${name}.webp`);
  await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 3 } })
    .webp({ quality: 86, effort: 5 })
    .toFile(out);
  return out;
}

await mkdir(OUT_DIR, { recursive: true });
const wood = await writeTexture("wood", paintWood());
const damascus = await writeTexture("damascus", paintDamascus());
console.log(`wrote ${wood}`);
console.log(`wrote ${damascus}`);
