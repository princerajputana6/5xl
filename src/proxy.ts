import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Next.js 16 renamed the "middleware" convention to "proxy". Auth.js's `auth`
// handler doubles as the edge proxy: it runs the `authorized` callback in
// authConfig to gate /account and /admin routes.
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
