/**
 * Retira de la base de datos todo lo que no son personas reales:
 * - los votos sintéticos de arranque y los usuarios bot que los emitían
 *   ("bot.N@cinepov.local");
 * - los usuarios de prueba de los seeds ("@example.com" y "@example.test"),
 *   que tienen el email verificado y contarían como personas reales.
 *
 * Se ejecuta una vez, antes de abrir la base de producción. Sin confirmación
 * solo informa de lo que borraría. Para borrar de verdad:
 *   REMOVE_SYNTHETIC_CONFIRM=si npm run db:remove-synthetic
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const fakeUsersWhere = {
  OR: [
    { email: { startsWith: "bot.", endsWith: "@cinepov.local" } },
    { email: { endsWith: "@example.com" } },
    { email: { endsWith: "@example.test" } },
  ],
};

async function main() {
  const [syntheticRatings, fakeUsers, fakeUsersRatings, keptUsers] = await Promise.all([
    prisma.rating.count({ where: { isArtificial: true } }),
    prisma.user.count({ where: fakeUsersWhere }),
    prisma.rating.count({ where: { isArtificial: false, user: fakeUsersWhere } }),
    prisma.user.count({ where: { NOT: fakeUsersWhere } }),
  ]);
  console.log(
    `Votos sintéticos: ${syntheticRatings}. Usuarios bot o de prueba: ${fakeUsers} ` +
      `(con ${fakeUsersRatings} valoraciones no sintéticas). Usuarios que se conservan: ${keptUsers}.`
  );

  if (process.env.REMOVE_SYNTHETIC_CONFIRM !== "si") {
    console.log("Modo de prueba: no se ha borrado nada. Usa REMOVE_SYNTHETIC_CONFIRM=si para borrar.");
    return;
  }

  // Borrar los usuarios elimina en cascada sus valoraciones, listas y demás.
  const [ratings, users] = await prisma.$transaction([
    prisma.rating.deleteMany({ where: { isArtificial: true } }),
    prisma.user.deleteMany({ where: fakeUsersWhere }),
  ]);
  console.log(`Borrados ${ratings.count} votos sintéticos y ${users.count} usuarios bot o de prueba.`);
}

main()
  .catch((e) => {
    console.error("Error retirando los datos sintéticos:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
