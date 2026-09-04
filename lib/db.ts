import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Cliente de Prisma sobre PostgreSQL.
 *
 * Por qué PostgreSQL y no SQLite: el sistema de ficheros de las funciones
 * serverless es de solo lectura y efímero, así que una base de datos en fichero
 * pierde toda escritura en el siguiente arranque en frío. La aplicación
 * parecería funcionar y no persistiría nada.
 *
 * `DATABASE_URL` debe apuntar al pool de conexiones (en Neon, el host que
 * termina en `-pooler`). Sin pooling, un pico de tráfico agota el límite de
 * conexiones de la base de datos porque cada invocación abre la suya.
 * `DIRECT_URL` es la conexión directa que usa Prisma para las migraciones.
 */

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Copia .env.example a .env y configura la cadena de conexión de PostgreSQL."
    );
  }

  const adapter = new PrismaPg({
    connectionString,
    // Límite conservador por instancia: en serverless hay muchas instancias
    // concurrentes y cada una mantiene su propio pool.
    max: process.env.NODE_ENV === "production" ? 5 : 10,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 30_000,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

// En desarrollo se reutiliza la instancia entre recargas del módulo para no
// agotar las conexiones con cada cambio de código.
export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
