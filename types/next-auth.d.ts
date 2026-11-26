// Importaciones de solo efecto: convierten el fichero en módulo para poder ampliar los tipos.
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    gender: string;
    birthYear: number;
    onboardingCompleted: boolean;
    ratingsCount: number;
    emailVerified: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      gender: string;
      birthYear: number;
      onboardingCompleted: boolean;
      ratingsCount: number;
    emailVerified: boolean;
      image?: string | null;
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    gender: string;
    birthYear: number;
    onboardingCompleted: boolean;
    ratingsCount: number;
    emailVerified: boolean;
  }
}
