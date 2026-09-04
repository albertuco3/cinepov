import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import bcrypt from "bcrypt";
import { checkRateLimit, resetRateLimit } from "./rate-limit";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder_id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder_secret",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Por favor, introduce tu email y contraseña.");
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // 1. Comprobar rate limit contra fuerza bruta
        const limit = await checkRateLimit("login", normalizedEmail);
        if (!limit.allowed) {
          throw new Error(
            `Demasiados intentos fallidos. Por favor, espera ${Math.ceil(limit.retryAfterSeconds / 60)} minutos antes de volver a intentarlo.`
          );
        }

        // Buscar el usuario en la BD local
        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user || !user.passwordHash) {
          throw new Error("El email o la contraseña son incorrectos.");
        }

        // Comparar contraseñas
        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("El email o la contraseña son incorrectos.");
        }

        // Al iniciar sesión con éxito, se restablece el contador de intentos
        await resetRateLimit("login", normalizedEmail);

        // Contar valoraciones en la BD
        const ratingsCount = await db.rating.count({
          where: { userId: user.id },
        });

        // Retornar el objeto de usuario extendido
        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          gender: user.gender,
          birthYear: user.birthYear,
          onboardingCompleted: user.onboardingCompleted,
          ratingsCount,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.gender = user.gender;
        token.birthYear = user.birthYear;
        token.onboardingCompleted = user.onboardingCompleted;
        token.ratingsCount = user.ratingsCount;
      }
      
      // Permitir la actualización en caliente de los datos de la sesión del cliente
      if (trigger === "update") {
        if (session?.gender !== undefined) token.gender = session.gender;
        if (session?.birthYear !== undefined) token.birthYear = session.birthYear;
        if (session?.onboardingCompleted !== undefined) token.onboardingCompleted = session.onboardingCompleted;
        
        // Recalcular el recuento de valoraciones real de la BD en cada actualización
        const count = await db.rating.count({ where: { userId: token.id } });
        token.ratingsCount = count;
      }

      // Corrección retroactiva para sesiones antiguas activas
      if (token.id && token.ratingsCount === undefined) {
        const count = await db.rating.count({ where: { userId: token.id } });
        token.ratingsCount = count;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.gender = token.gender;
        session.user.birthYear = token.birthYear;
        session.user.onboardingCompleted = token.onboardingCompleted;
        session.user.ratingsCount = token.ratingsCount;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
