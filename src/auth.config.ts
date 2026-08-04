import type { NextAuthConfig } from "next-auth";
import { isStaff, type Role } from "@/server/rbac";

/**
 * Edge-safe Auth.js config. No database or Node-only imports here — this is
 * consumed by middleware. The Credentials provider (which touches Mongo) is
 * added on top in the Node-only src/auth.ts.
 */
export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: Role }).role ?? "customer";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as Role) ?? "customer";
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const role = auth?.user?.role as Role | undefined;
      const isLoggedIn = !!auth?.user;

      const isAccount = pathname.startsWith("/account");
      const isAdmin = pathname.startsWith("/admin");

      if (isAdmin) return isLoggedIn && isStaff(role);
      if (isAccount) return isLoggedIn;
      return true;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
