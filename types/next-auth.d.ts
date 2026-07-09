import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    gender: string;
    birthYear: number;
    onboardingCompleted: boolean;
    ratingsCount: number;
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
  }
}
