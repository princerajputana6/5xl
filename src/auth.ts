import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { authConfig } from "@/auth.config";
import { db } from "@/server/db";
import { users } from "@/server/schema";
import type { Role } from "@/server/rbac";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await db()
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .get();

        if (!user || user.status === "blocked") return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Best-effort last-login stamp; never block auth on it.
        void (async () => {
          try {
            await db().update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
          } catch {
            /* ignore */
          }
        })();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as Role,
          image: user.avatar ?? null,
        };
      },
    }),
  ],
});
