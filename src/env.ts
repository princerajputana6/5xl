import { z } from "zod";

/**
 * Validated environment. Import from here instead of reading process.env
 * directly so misconfiguration fails fast and types are guaranteed.
 *
 * M1 only requires MONGODB_URI + AUTH_SECRET. Payment / media / email keys
 * are optional now and become required at their milestones (M3 / M5).
 */
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Auth.js v5
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_URL: z.string().url().optional(),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  // Google Tag Manager container id (optional; falls back to the site default)
  NEXT_PUBLIC_GTM_ID: z.string().optional(),

  // Deferred integrations (optional until their milestone)
  // Razorpay (M3): when key id/secret are absent the payment gateway runs in
  // a self-contained STUB mode so checkout works end-to-end without real keys.
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`❌ Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
