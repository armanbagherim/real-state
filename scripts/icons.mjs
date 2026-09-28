import sharp from "sharp";
import { mkdir } from "node:fs/promises";
await mkdir("public/icons", { recursive: true });
const svg = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="110" fill="#147d70"/><path d="M136 245L256 143L376 245V365H290V287H222V365H136Z" fill="none" stroke="white" stroke-width="27" stroke-linecap="round" stroke-linejoin="round"/><circle cx="374" cy="146" r="17" fill="#b7e2ae"/></svg>',
);
for (const size of [192, 512])
  await sharp(svg)
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
await sharp(svg).png().toFile("public/icons/maskable-512.png");
