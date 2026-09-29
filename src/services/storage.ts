import { mkdir, writeFile, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { AwsClient } from "aws4fetch";
export interface StorageProvider {
  save(data: Buffer): Promise<string>;
  read(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}
const IMAGE_KEY = /^[a-f0-9-]{36}\.webp$/;
const encode = (data: Buffer) =>
  sharp(data, { limitInputPixels: 40000000 })
    .rotate()
    .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
export class LocalStorage implements StorageProvider {
  private root = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
  async save(data: Buffer) {
    const key = `${randomUUID()}.webp`;
    await mkdir(this.root, { recursive: true });
    await writeFile(path.join(this.root, key), await encode(data), {
      flag: "wx",
    });
    return `/api/images/${key}`;
  }
  async read(key: string) {
    if (!IMAGE_KEY.test(key)) throw new Error("Invalid image key");
    return readFile(path.join(this.root, key));
  }
  async remove(key: string) {
    if (!IMAGE_KEY.test(key)) throw new Error("Invalid image key");
    await rm(path.join(this.root, key), { force: true });
  }
}
export class ObjectStorage implements StorageProvider {
  private client: AwsClient;
  private base: string;
  constructor(cfg: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  }) {
    this.base = `${cfg.endpoint.replace(/\/+$/, "")}/${cfg.bucket}`;
    this.client = new AwsClient({
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
      region: cfg.region,
      service: "s3",
    });
  }
  private url(key: string) {
    return `${this.base}/${key}`;
  }
  async save(data: Buffer) {
    const key = `${randomUUID()}.webp`;
    const res = await this.client.fetch(this.url(key), {
      method: "PUT",
      body: await encode(data),
      headers: { "content-type": "image/webp" },
    });
    if (!res.ok) throw new Error(`Object storage put failed: ${res.status}`);
    return `/api/images/${key}`;
  }
  async read(key: string) {
    if (!IMAGE_KEY.test(key)) throw new Error("Invalid image key");
    const res = await this.client.fetch(this.url(key));
    if (!res.ok) throw new Error(`Object storage get failed: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  async remove(key: string) {
    if (!IMAGE_KEY.test(key)) throw new Error("Invalid image key");
    const res = await this.client.fetch(this.url(key), { method: "DELETE" });
    if (!res.ok && res.status !== 404)
      throw new Error(`Object storage delete failed: ${res.status}`);
  }
}
const s3 = {
  endpoint: process.env.STORAGE_S3_ENDPOINT,
  region: process.env.STORAGE_S3_REGION,
  bucket: process.env.STORAGE_S3_BUCKET,
  accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
};
if (s3.bucket) {
  const missing = Object.entries(s3)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  if (missing.length)
    throw new Error(
      `Incomplete STORAGE_S3_* config, missing: ${missing.join(", ")}`,
    );
}
export const storage: StorageProvider = s3.bucket
  ? new ObjectStorage({
      endpoint: s3.endpoint ?? "",
      region: s3.region ?? "us-east-1",
      bucket: s3.bucket,
      accessKeyId: s3.accessKeyId ?? "",
      secretAccessKey: s3.secretAccessKey ?? "",
    })
  : new LocalStorage();
