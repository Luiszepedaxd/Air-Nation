import sharp from "sharp";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, "..", "public", "icons");

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#CC4B37"/>
  <path d="M256 80L432 176V336L256 432L80 336V176L256 80Z" fill="#FFFFFF"/>
</svg>`;

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-180.png", 180],
  ["icon-32.png", 32],
  ["icon-16.png", 16],
];

mkdirSync(iconsDir, { recursive: true });

const input = Buffer.from(SVG);

for (const [name, size] of sizes) {
  const out = join(iconsDir, name);
  await sharp(input).resize(size, size).png().toFile(out);
  console.log("Wrote", out);
}
