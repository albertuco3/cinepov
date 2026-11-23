/**
 * Retira de la base de datos los votos sintéticos de arranque y los usuarios
 * bot que los emitían. Se ejecuta una sola vez, al dejar de usarlos.
 *
 * Sin confirmación solo informa de lo que borraría. Para borrar de verdad:
 *   REMOVE_SYNTHETIC_CONFIRM=si npm run db:remove-synthetic
 *
 * Un usuario solo se borra si su email es de bot ("bot.N@cinepov.local") y no
 * tiene ninguna valoración real.
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const botWhere = {
  email: { startsWith: "bot.", endsWith: "@cinepov.local" },
  ratings: { none: { isArtificial: false } },
};

async function main() {
  const [syntheticRatings, bots] = await Promise.all([
    prisma.rating.count({ where: { isArtificial: true } }),
    prisma.user.count({ where: botWhere }),
  ]);
  console.log(`Votos sintéticos: ${syntheticRatings}. Usuarios bot sin votos reales: ${bots}.`);

  if (process.env.REMOVE_SYNTHETIC_CONFIRM !== "si") {
    console.log("Modo de prueba: no se ha borrado nada. Usa REMOVE_SYNTHETIC_CONFIRM=si para borrar.");
    return;
  }

  const [ratings, users] = await prisma.$transaction([
    prisma.rating.deleteMany({ where: { isArtificial: true } }),
    prisma.user.deleteMany({ where: botWhere }),
  ]);
  console.log(`Borrados ${ratings.count} votos sintéticos y ${users.count} usuarios bot.`);
}

main()
  .catch((e) => {
    console.error("Error retirando los datos sintéticos:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
