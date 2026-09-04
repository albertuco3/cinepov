import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Las migraciones deben ir por la conexión directa, no por el pool:
    // PgBouncer en modo transacción no admite las sentencias que emite Prisma
    // al migrar. En producción define DIRECT_URL; en local basta DATABASE_URL.
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
