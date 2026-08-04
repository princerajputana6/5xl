import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { connectDB } from "@/server/db";
import { User } from "@/server/models/User";

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

        await connectDB();
        const user = await User.findOne({ email })
          .select("+passwordHash")
          .lean();

        if (!user || user.status === "blocked") return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Best-effort last-login stamp; never block auth on it.
        User.updateOne({ _id: user._id }, { lastLoginAt: new Date() }).catch(
          () => {}
        );

        return {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.avatar ?? null,
        };
      },
    }),
  ],
});
