import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";
import { ROLES } from "@/server/rbac";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", index: true },

    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    avatar: { type: String },

    // Ledgers (balances denormalised for fast reads; txns tracked separately)
    walletBalance: { type: Number, default: 0, min: 0 },
    rewardPoints: { type: Number, default: 0, min: 0 },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: string };

export const User: Model<UserDoc> =
  (models.User as Model<UserDoc>) ?? model<UserDoc>("User", UserSchema);
