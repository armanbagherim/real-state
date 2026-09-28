import { config } from "dotenv";
config({ path: ".env.local" });
const { PrismaClient } = await import("@prisma/client");
const db = new PrismaClient();
try {
  const tables = await db.$queryRaw<
    { table_name: string }[]
  >`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log(
    JSON.stringify({
      connected: true,
      tables: tables.map((t) => t.table_name),
    }),
  );
} catch {
  console.error(
    "Database connection failed. Check connectivity and local environment.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
