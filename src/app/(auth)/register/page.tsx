import Link from "next/link";
import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Join 5XL
        </h1>
        <p className="text-sm text-muted-foreground">
          Create your account to start fuelling beyond limits.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
