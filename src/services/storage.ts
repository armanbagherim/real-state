import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
export interface StorageProvider {
  save(data: Buffer): Promise<string>;
  read(key: string): Promise<Buffer>;
}
export class LocalStorage implements StorageProvider {
  private root = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  async save(data: Buffer) {
    const key = `${randomUUID()}.webp`;
    await mkdir(this.root, { recursive: true });
    const safe = await sharp(data, { limitInputPixels: 40000000 })
      .rotate()
      .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(path.join(this.root, key), safe, { flag: "wx" });
    return `/api/images/${key}`;
  }
  async read(key: string) {
    if (!/^[a-f0-9-]{36}\.webp$/.test(key))
      throw new Error("Invalid image key");
    return readFile(path.join(this.root, key));
  }
}
export const storage: StorageProvider = new LocalStorage();
