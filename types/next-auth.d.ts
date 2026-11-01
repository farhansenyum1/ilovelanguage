import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    onboardedAt?: Date | null;
    role?: "USER" | "ADMIN";
  }
  interface Session {
    user: {
      id: string;
      username?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      onboardedAt?: Date | null;
      role?: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
}