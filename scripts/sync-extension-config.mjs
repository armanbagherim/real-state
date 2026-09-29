import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const envFiles = [".env.local", ".env"];
let apiBase = process.env.EXTENSION_API_URL || process.env.NEXTAUTH_URL || "";
for (const file of envFiles) {
  if (apiBase) break;
  try {
    const content = await readFile(path.join(root, file), "utf8");
    const match = content.match(/^EXTENSION_API_URL\s*=\s*(.+)$/m) || content.match(/^NEXTAUTH_URL\s*=\s*(.+)$/m);
    if (match) apiBase = match[1].trim().replace(/^['"]|['"]$/g, "");
  } catch {
    // The shell environment may provide NEXTAUTH_URL instead.
  }
}
if (!apiBase) throw new Error("NEXTAUTH_URL is required to configure the extension");
const config = `globalThis.ASHIAN_EXTENSION_CONFIG = ${JSON.stringify({ apiBase: apiBase.replace(/\/$/, "") })};\n`;
await writeFile(path.join(root, "extension", "config.js"), config);
console.log(`Extension API base configured from environment: ${apiBase}`);
