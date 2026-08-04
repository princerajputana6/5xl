import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          New password
        </h1>
        <p className="text-sm text-muted-foreground">
          Choose a strong password you don&apos;t use anywhere else.
        </p>
      </div>

      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-semibold text-foreground underline underline-offset-4 hover:no-underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
