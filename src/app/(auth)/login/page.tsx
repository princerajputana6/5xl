import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to track orders, manage subscriptions and more.
        </p>
      </div>

      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        New to 5XL?{" "}
        <Link href="/register" className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
