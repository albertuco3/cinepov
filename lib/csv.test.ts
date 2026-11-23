import { describe, it, expect } from "vitest";
import { parseLetterboxdCsv, parseImdbCsv } from "./csv";

describe("Parser de CSV con PapaParse (lib/csv.ts)", () => {
  describe("parseLetterboxdCsv", () => {
    it("parsea correctamente un CSV típico de Letterboxd", () => {
      const csv = `Date,Name,Year,Letterboxd URI,Rating,Rewatch,Tags,Watched Date
2024-01-15,The Godfather,1972,https://boxd.it/2aHG,5,no,,2024-01-15
2024-02-10,Pulp Fiction,1994,https://boxd.it/2b9o,4.5,yes,,2024-02-10`;

      const result = parseLetterboxdCsv(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.movies).toHaveLength(2);
        expect(result.movies[0]).toEqual({
          title: "The Godfather",
          year: 1972,
          rating: 5,
        });
        expect(result.movies[1]).toEqual({
          title: "Pulp Fiction",
          year: 1994,
          rating: 4.5,
        });
      }
    });

    it("maneja títulos complejos con comas entrecomilladas y comillas escapadas", () => {
      const csv = `Name,Year,Rating
"Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb",1964,4.5
"Everything Everywhere All at Once",2022,4.0
"Movie, with ""quoted"" title and, commas",2020,3.5`;

      const result = parseLetterboxdCsv(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.movies).toHaveLength(3);
        expect(result.movies[0].title).toBe("Dr. Strangelove or: How I Learned to Stop Worrying and Love the Bomb");
        expect(result.movies[2].title).toBe('Movie, with "quoted" title and, commas');
        expect(result.movies[2].rating).toBe(3.5);
      }
    });

    it("falla de forma clara si faltan columnas requeridas", () => {
      const csv = `Date,Comment,Review
2024-01-01,Pelicula buena,Excelente`;

      const result = parseLetterboxdCsv(csv);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain("inválida");
      }
    });
  });

  describe("parseImdbCsv", () => {
    it("parsea correctamente un CSV típico de IMDb", () => {
      const csv = `Const,Your Rating,Date Rated,Title,URL,Title Type,IMDb Rating,Runtime (mins),Year,Genres,Num Votes,Release Date,Directors
tt0111161,10,2023-05-10,The Shawshank Redemption,https://www.imdb.com/title/tt0111161/,movie,9.3,142,1994,Drama,2800000,1994-09-23,Frank Darabont
tt0068646,9,2023-06-12,The Godfather,https://www.imdb.com/title/tt0068646/,movie,9.2,175,1972,"Crime, Drama",1900000,1972-03-24,Francis Ford Coppola`;

      const result = parseImdbCsv(csv);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.movies).toHaveLength(2);
        expect(result.movies[0]).toEqual({
          imdbId: "tt0111161",
          title: "The Shawshank Redemption",
          year: 1994,
          rating: 10,
        });
        expect(result.movies[1].imdbId).toBe("tt0068646");
        expect(result.movies[1].rating).toBe(9);
      }
    });
  });
});
