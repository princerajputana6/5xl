import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Verify OTP" };

export default function VerifyOtpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight">
          Verify your number
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send a one-time code to confirm your account.
        </p>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        OTP delivery is being finalised. Until an SMS/email provider is
        connected, verification is skipped in development. Your account is ready
        to use.
      </div>

      <Link
        href="/account"
        className="block w-full rounded-md bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:opacity-90"
      >
        Continue to dashboard
      </Link>
    </div>
  );
}
