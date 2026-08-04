import { env } from "@/env";

/**
 * Email abstraction over Resend.
 *
 * When RESEND_API_KEY is set we send via the Resend REST API. Otherwise we run
 * in **stub mode**: the email is logged to the server console instead of sent,
 * so transactional flows work end-to-end with no key and swap to real delivery
 * automatically once configured. All sends are best-effort — callers should
 * never block on or fail because of email.
 */

const API_KEY = env.RESEND_API_KEY?.trim() || "";
export const isEmailLive = Boolean(API_KEY);
export const emailMode: "live" | "stub" = isEmailLive ? "live" : "stub";

const FROM = env.EMAIL_FROM?.trim() || "5XL Nutrition <onboarding@resend.dev>";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; mode: string }> {
  if (!input.to) return { ok: false, mode: emailMode };

  if (!isEmailLive) {
    console.info(
      `[email:stub] → ${input.to} | "${input.subject}" (${input.html.length} bytes html). ` +
        `Set RESEND_API_KEY to send for real.`
    );
    return { ok: true, mode: "stub" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend failed (${res.status}): ${detail}`);
      return { ok: false, mode: "live" };
    }
    return { ok: true, mode: "live" };
  } catch (err) {
    console.error("[email] send error", err);
    return { ok: false, mode: "live" };
  }
}

/** Fire-and-forget send that never throws — safe to call without awaiting. */
export function sendEmailSafe(input: SendEmailInput): void {
  sendEmail(input).catch((err) => console.error("[email] safe send error", err));
}
