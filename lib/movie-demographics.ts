import { db } from "./db";
import { buildDemographicsPayload, type DemographicsPayload, type RatingCell } from "./demographics";
import { COUNTED_RATING_SQL, countedRatingWhere } from "./rating-filters";

interface CellRow {
  movieId: string;
  gender: string;
  birthYear: number;
  sum: number;
  sumSq: number;
  count: number;
}

/**
 * Único punto de lectura de los datos demográficos.
 *
 * Agrega en la base de datos por película, género y año de nacimiento: lo que
 * viaja son como mucho unas 250 filas por película, tenga cien valoraciones o
 * cien mil. Solo incluye valoraciones que cuentan (`COUNTED_RATING_SQL`).
 */
export async function getRatingCells(movieIds: string[]): Promise<Map<string, RatingCell[]>> {
  const cellsByMovie = new Map<string, RatingCell[]>(movieIds.map((id) => [id, []]));
  if (movieIds.length === 0) return cellsByMovie;

  const rows = await db.$queryRaw<CellRow[]>`
    SELECT r."movieId", u."gender", u."birthYear",
           SUM(r."score")::int AS "sum", SUM(r."score" * r."score")::int AS "sumSq", COUNT(*)::int AS "count"
    FROM "Rating" r
    JOIN "User" u ON u."id" = r."userId"
    WHERE r."movieId" = ANY(${movieIds}) AND ${COUNTED_RATING_SQL}
    GROUP BY r."movieId", u."gender", u."birthYear"
  `;

  for (const row of rows) {
    cellsByMovie.get(row.movieId)?.push({
      gender: row.gender,
      birthYear: row.birthYear,
      sum: row.sum,
      sumSq: row.sumSq,
      count: row.count,
    });
  }
  return cellsByMovie;
}

/** Desglose demográfico completo de una película. */
export async function getMovieDemographics(movieId: string): Promise<DemographicsPayload> {
  const cells = await getRatingCells([movieId]);
  return buildDemographicsPayload(movieId, cells.get(movieId) ?? []);
}

/**
 * Películas con más valoraciones que cuentan, de más a menos.
 *
 * Los rankings que solo pueden calcularse sobre un subconjunto (polarizantes,
 * consenso, recomendaciones) deben partir de aquí: cortar sin ordenar elige
 * películas arbitrarias que además cambian entre peticiones.
 */
export async function getMostRatedMovieIds(minCount: number, limit: number): Promise<string[]> {
  const grouped = await db.rating.groupBy({
    by: ["movieId"],
    where: countedRatingWhere(),
    _count: { movieId: true },
    having: { movieId: { _count: { gte: minCount } } },
    orderBy: { _count: { movieId: "desc" } },
    take: limit,
  });
  return grouped.map((g) => g.movieId);
}

/** Desglose de varias películas en una sola consulta. */
export async function getManyMovieDemographics(movieIds: string[]): Promise<Map<string, DemographicsPayload>> {
  const cells = await getRatingCells(movieIds);
  return new Map(movieIds.map((id) => [id, buildDemographicsPayload(id, cells.get(id) ?? [])]));
}
