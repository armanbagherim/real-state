import { cp, access } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
process.env.UPLOAD_DIR = path.resolve(
  root,
  process.env.UPLOAD_DIR ?? "uploads",
);
process.env.HOSTNAME ||= "0.0.0.0";
const standalone = path.join(root, ".next", "standalone");
await access(path.join(standalone, "server.js"));
await cp(path.join(root, "public"), path.join(standalone, "public"), {
  recursive: true,
});
await cp(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static"),
  { recursive: true },
);
await import(pathToFileURL(path.join(standalone, "server.js")).href);
