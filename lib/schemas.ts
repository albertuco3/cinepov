import { z } from "zod";
import { validateDisplayName, sanitizeText, LIMITS } from "./sanitize";

const currentYear = new Date().getFullYear();
export const MIN_BIRTH_YEAR = 1920;
export const MAX_BIRTH_YEAR = currentYear - 6;

// Géneros demográficos soportados
export const GENDER_VALUES = ["male", "female", "non_binary"] as const;

/**
 * Esquema de validación para el registro de nuevos usuarios
 */
export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .email("El email introducido no es válido.")
    .max(120, "El email es demasiado largo."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100, "La contraseña no puede exceder los 100 caracteres."),
  displayName: z
    .string()
    .trim()
    .min(1, "El nombre público es obligatorio.")
    .refine((val) => validateDisplayName(val).ok, {
      message: "El nombre público debe tener entre 2 y 40 caracteres y no estar reservado.",
    })
    .transform((val) => {
      const res = validateDisplayName(val);
      return res.ok ? res.value : val;
    }),
  birthYear: z.coerce
    .number()
    .int("El año de nacimiento debe ser un número entero.")
    .min(MIN_BIRTH_YEAR, `El año de nacimiento mínimo es ${MIN_BIRTH_YEAR}.`)
    .max(MAX_BIRTH_YEAR, `El año de nacimiento máximo es ${MAX_BIRTH_YEAR}.`),
  gender: z.enum(GENDER_VALUES, {
    error: "El género seleccionado no es válido. Debe ser hombre, mujer o no binario.",
  }),
  website: z.string().optional(), // Honeypot antiabuso
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Esquema de validación para completar el perfil demográfico (Fase Welcome / Onboarding)
 */
export const completeProfileSchema = z.object({
  birthYear: z.coerce
    .number()
    .int("El año de nacimiento debe ser un número entero.")
    .min(MIN_BIRTH_YEAR, `El año de nacimiento mínimo es ${MIN_BIRTH_YEAR}.`)
    .max(MAX_BIRTH_YEAR, `El año de nacimiento máximo es ${MAX_BIRTH_YEAR}.`),
  gender: z.enum(GENDER_VALUES, {
    error: "El género seleccionado no es válido. Debe ser hombre, mujer o no binario.",
  }),
});

export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

/**
 * Esquema de validación para emitir o actualizar una valoración (1 a 10)
 */
export const ratingSchema = z.object({
  movieId: z.string().min(1, "El identificador de la película no puede estar vacío."),
  score: z.coerce
    .number()
    .int("La puntuación debe ser un número entero.")
    .min(1, "La nota mínima permitida es 1.")
    .max(10, "La nota máxima permitida es 10."),
});

export type RatingInput = z.infer<typeof ratingSchema>;

/**
 * Esquema de validación para reseñas de películas
 */
export const reviewSchema = z.object({
  movieId: z.string().min(1, "El ID de la película no puede estar vacío."),
  content: z
    .string()
    .trim()
    .min(3, "La reseña debe contener al menos 3 caracteres.")
    .max(LIMITS.reviewText, `La reseña no puede superar los ${LIMITS.reviewText} caracteres.`)
    .transform(sanitizeText),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

/**
 * Esquema de validación para mensajes de feedback y contacto
 */
export const feedbackSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre no puede estar vacío.")
    .max(LIMITS.displayName, "El nombre es demasiado largo.")
    .transform(sanitizeText),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "El email es obligatorio.")
    .email("El email de contacto no es válido.")
    .max(120, "El email es demasiado largo."),
  message: z
    .string()
    .trim()
    .min(5, "El mensaje debe tener al menos 5 caracteres.")
    .max(LIMITS.feedbackMessage, `El mensaje no puede superar los ${LIMITS.feedbackMessage} caracteres.`)
    .transform(sanitizeText),
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

export const feedbackCategoryValues = ["suggestion", "bug", "other"] as const;

export const feedbackSubmissionSchema = z.object({
  category: z.enum(feedbackCategoryValues, {
    error: "Categoría de sugerencia inválida. Debe ser suggestion, bug u other.",
  }),
  message: z
    .string()
    .trim()
    .min(5, "El mensaje debe tener al menos 5 caracteres.")
    .max(LIMITS.feedbackMessage, `El mensaje no puede superar los ${LIMITS.feedbackMessage} caracteres.`)
    .transform(sanitizeText),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

/**
 * Helper para extraer de forma limpia el primer mensaje de error legible de Zod
 */
export function getFirstZodError(error: z.ZodError): string {
  const firstIssue = error.issues[0];
  return firstIssue?.message || "Los datos enviados no son válidos.";
}
