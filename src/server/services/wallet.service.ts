import { connectDB } from "@/server/db";
import { User } from "@/server/models/User";
import { WalletTransaction, type WalletTransactionDoc } from "@/server/models/WalletTransaction";
import { pointsEarnedFor } from "@/lib/cart-pricing";
import { HttpError } from "@/server/errors";

type Kind = "points" | "wallet";
type TxnType = "earn" | "redeem" | "refund" | "adjust";

const FIELD: Record<Kind, "rewardPoints" | "walletBalance"> = {
  points: "rewardPoints",
  wallet: "walletBalance",
};

export type WalletTxnDTO = {
  id: string;
  kind: Kind;
  type: TxnType;
  amount: number;
  balanceAfter: number;
  orderNumber: string | null;
  note: string;
  createdAt: string;
};

export type WalletState = {
  rewardPoints: number;
  walletBalance: number;
  transactions: WalletTxnDTO[];
};

/** Apply a signed delta to a balance and append a ledger entry. */
async function record(
  userId: string,
  kind: Kind,
  type: TxnType,
  amount: number,
  note: string,
  orderNumber?: string
): Promise<void> {
  if (amount === 0) return;
  await connectDB();
  const field = FIELD[kind];
  // Clamp so balances never go negative.
  const user = await User.findByIdAndUpdate(
    userId,
    [
      {
        $set: {
          [field]: {
            $max: [0, { $add: [{ $ifNull: [`$${field}`, 0] }, amount] }],
          },
        },
      },
    ],
    { new: true }
  )
    .select(field)
    .lean();
  if (!user) throw new HttpError("User not found.", 404);
  const balanceAfter = (user as unknown as Record<string, number>)[field] ?? 0;
  await WalletTransaction.create({
    user: userId,
    kind,
    type,
    amount,
    balanceAfter,
    orderNumber,
    note,
  });
}

export async function earnPointsForOrder(
  userId: string,
  orderNumber: string,
  orderTotal: number
): Promise<number> {
  const points = pointsEarnedFor(orderTotal);
  if (points > 0) {
    await record(userId, "points", "earn", points, `Earned on ${orderNumber}`, orderNumber);
  }
  return points;
}

export async function redeemPointsForOrder(
  userId: string,
  orderNumber: string,
  points: number
): Promise<void> {
  if (points > 0) {
    await record(userId, "points", "redeem", -points, `Redeemed on ${orderNumber}`, orderNumber);
  }
}

/** Admin credit/debit. `amount` is signed. */
export async function adjustBalance(
  userId: string,
  kind: Kind,
  amount: number,
  note: string
): Promise<void> {
  await record(userId, kind, "adjust", amount, note || "Manual adjustment");
}

export async function getWalletState(userId: string): Promise<WalletState> {
  await connectDB();
  const [user, txns] = await Promise.all([
    User.findById(userId).select("rewardPoints walletBalance").lean(),
    WalletTransaction.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);
  return {
    rewardPoints: user?.rewardPoints ?? 0,
    walletBalance: user?.walletBalance ?? 0,
    transactions: (txns as unknown as WalletTransactionDoc[]).map((t) => ({
      id: String(t._id),
      kind: t.kind as Kind,
      type: t.type as TxnType,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      orderNumber: t.orderNumber ?? null,
      note: t.note ?? "",
      createdAt: new Date(t.createdAt).toISOString(),
    })),
  };
}

export async function getRewardPoints(userId: string): Promise<number> {
  await connectDB();
  const user = await User.findById(userId).select("rewardPoints").lean();
  return user?.rewardPoints ?? 0;
}
