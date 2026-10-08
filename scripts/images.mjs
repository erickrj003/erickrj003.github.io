import { readdir, mkdir, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "assets/img";
const OUT_DIR = "assets/img/generated";
const WIDTHS = [480, 768, 1200, 1600];
const FORMATS = [
  { ext: "avif", options: { quality: 55, effort: 5 } },
  { ext: "webp", options: { quality: 78 } },
  { ext: "jpg", options: { quality: 80, mozjpeg: true } },
];

const INPUT_PATTERN = /\.(jpe?g|png)$/i;
const SKIP = /^(loading\.gif|placeholder|h3)/i;

function bytes(n) {
  return n > 1_048_576 ? `${(n / 1_048_576).toFixed(2)} MB` : `${Math.round(n / 1024)} KB`;
}

await mkdir(OUT_DIR, { recursive: true });

const entries = await readdir(SOURCE_DIR, { withFileTypes: true });
const sources = entries
  .filter((e) => e.isFile() && INPUT_PATTERN.test(e.name) && !SKIP.test(e.name))
  .map((e) => e.name);

const manifest = {};
let originalTotal = 0;
let bestTotal = 0;

for (const name of sources) {
  const inputPath = path.join(SOURCE_DIR, name);
  const stem = path.parse(name).base.replace(/\.[^.]+$/, "");
  const image = sharp(inputPath);
  const meta = await image.metadata();
  const { size: originalSize } = await stat(inputPath);

  const widths = WIDTHS.filter((w) => w <= meta.width);
  if (widths.length === 0) widths.push(meta.width);

  const record = {
    width: meta.width,
    height: meta.height,
    aspect: +(meta.width / meta.height).toFixed(4),
    widths,
    sources: {},
  };

  for (const { ext, options } of FORMATS) {
    record.sources[ext] = [];

    for (const width of widths) {
      const outName = `${stem}-${width}.${ext}`;
      const outPath = path.join(OUT_DIR, outName);

      await sharp(inputPath)
        .resize({ width, withoutEnlargement: true })
        .toFormat(ext === "jpg" ? "jpeg" : ext, options)
        .toFile(outPath);

      record.sources[ext].push({ width, url: `/${OUT_DIR}/${outName}` });
    }
  }

  const widest = Math.max(...widths);
  const { size: avifSize } = await stat(path.join(OUT_DIR, `${stem}-${widest}.avif`));

  originalTotal += originalSize;
  bestTotal += avifSize;

  manifest[`/${SOURCE_DIR}/${name}`] = record;

  console.log(
    `${name.padEnd(26)} ${meta.width}x${meta.height}  ${bytes(originalSize).padStart(8)} -> ${bytes(avifSize).padStart(8)} avif`
  );
}

await mkdir("_data", { recursive: true });
await writeFile("_data/images.json", JSON.stringify(manifest, null, 2));

const saved = Math.round((1 - bestTotal / originalTotal) * 100);
console.log(`\n${sources.length} images   ${bytes(originalTotal)} -> ${bytes(bestTotal)} as AVIF  (-${saved}%)`);
