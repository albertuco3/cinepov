import { describe, it, expect } from "vitest";
import {
  registerSchema,
  completeProfileSchema,
  ratingSchema,
  feedbackSchema,
  reviewSchema,
  getFirstZodError,
} from "./schemas";

describe("Validaciones Zod (lib/schemas.ts)", () => {
  describe("registerSchema", () => {
    it("valida un usuario correcto", () => {
      const result = registerSchema.safeParse({
        email: "cinefilo@example.com",
        password: "password123",
        displayName: "Cinemaníaco",
        birthYear: 1995,
        gender: "male",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("cinefilo@example.com");
        expect(result.data.displayName).toBe("Cinemaníaco");
        expect(result.data.birthYear).toBe(1995);
      }
    });

    it("rechaza emails no válidos", () => {
      const result = registerSchema.safeParse({
        email: "invalido",
        password: "password123",
        displayName: "Usuario",
        birthYear: 1995,
        gender: "female",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstZodError(result.error)).toContain("email");
      }
    });

    it("rechaza contraseñas de menos de 8 caracteres", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "123",
        displayName: "Usuario",
        birthYear: 1995,
        gender: "female",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstZodError(result.error)).toContain("8 caracteres");
      }
    });

    it("rechaza años de nacimiento fuera de rango", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        displayName: "Usuario",
        birthYear: 1900,
        gender: "female",
      });

      expect(result.success).toBe(false);
    });

    it("rechaza géneros no soportados", () => {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "password123",
        displayName: "Usuario",
        birthYear: 1995,
        gender: "alien",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("completeProfileSchema", () => {
    it("valida perfiles demográficos correctos", () => {
      const result = completeProfileSchema.safeParse({
        birthYear: "1988",
        gender: "non_binary",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.birthYear).toBe(1988);
        expect(result.data.gender).toBe("non_binary");
      }
    });
  });

  describe("ratingSchema", () => {
    it("permite notas enteras del 1 al 10", () => {
      expect(ratingSchema.safeParse({ movieId: "m-1", score: 1 }).success).toBe(true);
      expect(ratingSchema.safeParse({ movieId: "m-1", score: 10 }).success).toBe(true);
      expect(ratingSchema.safeParse({ movieId: "m-1", score: "7" }).success).toBe(true);
    });

    it("rechaza notas fuera del rango 1-10", () => {
      expect(ratingSchema.safeParse({ movieId: "m-1", score: 0 }).success).toBe(false);
      expect(ratingSchema.safeParse({ movieId: "m-1", score: 11 }).success).toBe(false);
      expect(ratingSchema.safeParse({ movieId: "m-1", score: -5 }).success).toBe(false);
    });

    it("rechaza movieId vacío", () => {
      expect(ratingSchema.safeParse({ movieId: "", score: 8 }).success).toBe(false);
    });
  });

  describe("feedbackSchema", () => {
    it("valida mensajes de feedback y sanea el contenido", () => {
      const result = feedbackSchema.safeParse({
        name: "Alberto <script>alert(1)</script>",
        email: "test@example.com",
        message: "Me encanta el desglose demográfico.",
        rating: 5,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Alberto");
        expect(result.data.message).toBe("Me encanta el desglose demográfico.");
      }
    });
  });
});
