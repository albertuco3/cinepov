/**
 * Seed de DESARROLLO. Destructivo: borra todos los usuarios (y, en cascada,
 * sus valoraciones, listas, seguimientos y notificaciones) y crea usuarios
 * ficticios con valoraciones aleatorias para poder ver la interfaz con datos.
 *
 * Nunca debe ejecutarse contra la base de datos de producción. Para evitarlo:
 * - se niega a ejecutarse en producción (NODE_ENV=production o en Vercel);
 * - exige confirmarlo explícitamente: SEED_DEV_CONFIRM=borrar-y-rellenar.
 *
 * Las diferencias entre grupos son aleatorias (semilla fija), no estereotipos:
 * sirven para probar la interfaz, no dicen nada de nadie.
 *
 * Requiere el catálogo base: ejecuta antes `npm run db:seed`.
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const CONFIRMATION = "borrar-y-rellenar";
const USERS = 400;
const RATING_PROBABILITY = 0.45;
const GENDERS = ["male", "female", "non_binary"] as const;

if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
  throw new Error("seed-dev se niega a ejecutarse en producción.");
}
if (process.env.SEED_DEV_CONFIRM !== CONFIRMATION) {
  throw new Error(
    `seed-dev BORRA todos los usuarios de la base de datos. Si es lo que quieres, ejecútalo con SEED_DEV_CONFIRM=${CONFIRMATION}.`
  );
}

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL no está configurada para el seed.");
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

/** Generador pseudoaleatorio con semilla (mulberry32): mismos datos en cada ejecución. */
function seededRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const random = seededRandom(2026);
  const currentYear = new Date().getFullYear();

  const movies = await prisma.movie.findMany({
    where: { isFeatured: true },
    select: { id: true, tmdbRating: true },
  });
  if (movies.length === 0) {
    throw new Error("No hay catálogo. Ejecuta antes `npm run db:seed`.");
  }

  await prisma.user.deleteMany();
  await prisma.rateLimit.deleteMany();
  console.log("Usuarios y datos asociados borrados.");

  // Mayoría de edad garantizada: de 18 a 75 años.
  const users = Array.from({ length: USERS }, (_, i) => ({
    email: `dev.${i + 1}@example.test`,
    displayName: `Usuario de prueba ${i + 1}`,
    birthYear: currentYear - 18 - Math.floor(random() * 58),
    gender: GENDERS[random() < 0.48 ? 0 : random() < 0.96 ? 1 : 2],
    emailVerified: new Date(),
    onboardingCompleted: true,
  }));
  await prisma.user.createMany({ data: users });
  const created = await prisma.user.findMany({ select: { id: true, gender: true, birthYear: true } });

  // Cada película recibe un desplazamiento aleatorio por grupo para que la
  // interfaz muestre brechas de distinto tamaño.
  const ratings = [];
  for (const movie of movies) {
    const base = movie.tmdbRating && movie.tmdbRating > 0 ? movie.tmdbRating : 7;
    const offsets = new Map<string, number>();
    for (const user of created) {
      if (random() > RATING_PROBABILITY) continue;
      const group = `${user.gender}:${Math.floor((currentYear - user.birthYear) / 10)}`;
      if (!offsets.has(group)) offsets.set(group, (random() - 0.5) * 3);
      const noise = (random() - 0.5) * 2.4;
      const score = Math.round(Math.min(10, Math.max(1, base + (offsets.get(group) ?? 0) + noise)));
      ratings.push({ userId: user.id, movieId: movie.id, score });
    }
  }
  await prisma.rating.createMany({ data: ratings });

  console.log(`Creados ${created.length} usuarios de prueba y ${ratings.length} valoraciones.`);
}

main()
  .catch((e) => {
    console.error("Error ejecutando seed-dev:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
