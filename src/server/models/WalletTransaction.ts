import { Schema, type InferSchemaType } from "mongoose";
import { defineModel } from "@/server/db";

/** Immutable ledger entry for a user's reward points or wallet balance. */
const WalletTransactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["points", "wallet"], required: true },
    type: { type: String, enum: ["earn", "redeem", "refund", "adjust"], required: true },
    amount: { type: Number, required: true }, // signed: +credit / -debit
    balanceAfter: { type: Number, required: true },
    orderNumber: { type: String },
    note: { type: String, default: "" },
  },
  { timestamps: true }
);

export type WalletTransactionDoc = InferSchemaType<typeof WalletTransactionSchema> & {
  _id: string;
};

export const WalletTransaction = defineModel<WalletTransactionDoc>("WalletTransaction", WalletTransactionSchema);
