import bcrypt from "bcryptjs";
import { connectDB } from "@/server/db";
import { User } from "@/server/models/User";
import { registerSchema, type RegisterInput } from "@/lib/validators/auth";
import { sendEmailSafe } from "@/server/email/mailer";
import { welcomeEmail } from "@/server/email/templates";

export class AuthError extends Error {
  constructor(
    message: string,
    public status = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function registerUser(input: RegisterInput) {
  const data = registerSchema.parse(input);
  await connectDB();

  const existing = await User.findOne({ email: data.email.toLowerCase() })
    .select("_id")
    .lean();
  if (existing) {
    throw new AuthError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await User.create({
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || undefined,
    passwordHash,
    role: "customer",
  });

  // OTP verification is stubbed for M1. When an SMS/email provider is wired,
  // dispatch the code here and gate emailVerified/phoneVerified on it.
  await issueOtpStub(user.email);

  // Best-effort welcome email (stub-logged until RESEND_API_KEY is set).
  const { subject, html } = welcomeEmail(user.name);
  sendEmailSafe({ to: user.email, subject, html });

  return { id: String(user._id), email: user.email, name: user.name };
}

/**
 * STUB — M1 only. Returns a fixed dev code instead of sending a real OTP.
 * Replace with MSG91/Twilio (phone) or Resend (email) at the OTP milestone.
 */
export async function issueOtpStub(identifier: string) {
  const code = "000000";
  if (process.env.NODE_ENV !== "production") {
    console.info(`[OTP:stub] code for ${identifier} = ${code}`);
  }
  return { sent: true, devCode: code };
}
