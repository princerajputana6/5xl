import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/server/db";
import { users, walletTransactions } from "@/server/schema";
import { pointsEarnedFor } from "@/lib/cart-pricing";
import { HttpError } from "@/server/errors";

type Kind = "points" | "wallet";
type TxnType = "earn" | "redeem" | "refund" | "adjust";

const COLUMN = {
  points: users.rewardPoints,
  wallet: users.walletBalance,
} as const;

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

/** Apply a signed delta to a balance (clamped at 0) and append a ledger entry. */
async function record(
  userId: string,
  kind: Kind,
  type: TxnType,
  amount: number,
  note: string,
  orderNumber?: string
): Promise<void> {
  if (amount === 0) return;
  const col = COLUMN[kind];
  // Clamp so balances never go negative, in a single statement, returning the
  // new balance.
  const updated = await db()
    .update(users)
    .set({ [kind === "points" ? "rewardPoints" : "walletBalance"]: sql`MAX(0, ${col} + ${amount})` })
    .where(eq(users.id, userId))
    .returning({ balanceAfter: col });
  if (updated.length === 0) throw new HttpError("User not found.", 404);
  const balanceAfter = updated[0].balanceAfter ?? 0;
  await db().insert(walletTransactions).values({
    userId,
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
  const [user, txns] = await Promise.all([
    db()
      .select({ rewardPoints: users.rewardPoints, walletBalance: users.walletBalance })
      .from(users)
      .where(eq(users.id, userId))
      .get(),
    db()
      .select()
      .from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt))
      .limit(50)
      .all(),
  ]);
  return {
    rewardPoints: user?.rewardPoints ?? 0,
    walletBalance: user?.walletBalance ?? 0,
    transactions: txns.map((t) => ({
      id: t.id,
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
  const user = await db()
    .select({ rewardPoints: users.rewardPoints })
    .from(users)
    .where(eq(users.id, userId))
    .get();
  return user?.rewardPoints ?? 0;
}
