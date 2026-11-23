import { describe, it, expect } from "vitest";
import {
  registerSchema,
  completeProfileSchema,
  ratingSchema,
  feedbackSchema,
  updateProfileSchema,
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
        isAdult: true,
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
        isAdult: true,
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
        isAdult: true,
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
        isAdult: true,
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
        isAdult: true,
      });

      expect(result.success).toBe(false);
    });
  });

  describe("edad mínima", () => {
    const base = {
      email: "test@example.com",
      password: "password123",
      displayName: "Usuario",
      gender: "female",
    };
    const thisYear = new Date().getFullYear();

    it("acepta a quien nació hace 18 años o más", () => {
      expect(registerSchema.safeParse({ ...base, birthYear: thisYear - 18, isAdult: true }).success).toBe(true);
    });

    it("rechaza a menores de 18 años", () => {
      const result = registerSchema.safeParse({ ...base, birthYear: thisYear - 17, isAdult: true });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(getFirstZodError(result.error)).toContain("18 años");
      }
    });

    it("exige la declaración explícita de mayoría de edad", () => {
      expect(registerSchema.safeParse({ ...base, birthYear: 1990 }).success).toBe(false);
      expect(registerSchema.safeParse({ ...base, birthYear: 1990, isAdult: false }).success).toBe(false);
      expect(completeProfileSchema.safeParse({ birthYear: 1990, gender: "male" }).success).toBe(false);
    });

    it("también se aplica al editar el perfil", () => {
      expect(
        updateProfileSchema.safeParse({ displayName: "Usuario", birthYear: thisYear - 10, gender: "male" }).success
      ).toBe(false);
      expect(
        updateProfileSchema.safeParse({ displayName: "Usuario", birthYear: 1990, gender: "male" }).success
      ).toBe(true);
    });
  });

  describe("completeProfileSchema", () => {
    it("valida perfiles demográficos correctos", () => {
      const result = completeProfileSchema.safeParse({
        birthYear: "1988",
        gender: "non_binary",
        isAdult: true,
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
