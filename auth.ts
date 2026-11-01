import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [Google],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.onboardedAt = user.onboardedAt;
        token.role = user.role;
      }
      if (trigger === "update" && session?.user) {
        token.username = session.user.username ?? token.username;
        token.onboardedAt = session.user.onboardedAt ?? token.onboardedAt;
        token.firstName = session.user.firstName ?? token.firstName;
        token.lastName = session.user.lastName ?? token.lastName;
        if ("image" in session.user) {
          token.picture = session.user.image ?? null;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | null | undefined;
        session.user.firstName = token.firstName as string | null | undefined;
        session.user.lastName = token.lastName as string | null | undefined;
        session.user.onboardedAt = token.onboardedAt as Date | null | undefined;
        session.user.role = token.role as "USER" | "ADMIN" | undefined;
      }
      return session;
    },
  },
});