import type { Metadata } from "next";
import { Sparkles, Wallet } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getWalletState } from "@/server/services/wallet.service";
import { formatINR, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Rewards & Wallet · 5XL" };

const TYPE_LABEL: Record<string, string> = {
  earn: "Earned",
  redeem: "Redeemed",
  refund: "Refund",
  adjust: "Adjustment",
};

export default async function RewardsPage() {
  const user = await requireUser();
  const { rewardPoints, walletBalance, transactions } = await getWalletState(user.id);

  return (
    <div className="container-5xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        Rewards & Wallet
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Reward points</span>
            <Sparkles className="size-5 text-primary" />
          </div>
          <p className="mt-2 font-display text-4xl font-extrabold">{rewardPoints}</p>
          <p className="text-xs text-muted-foreground">Worth {formatINR(rewardPoints)} at checkout · earn 2% back on every order</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Wallet balance</span>
            <Wallet className="size-5 text-primary" />
          </div>
          <p className="mt-2 font-display text-4xl font-extrabold">{formatINR(walletBalance)}</p>
          <p className="text-xs text-muted-foreground">Store credit from refunds and offers</p>
        </div>
      </div>

      <h2 className="mt-10 mb-3 font-display text-xl font-bold uppercase">History</h2>
      {transactions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No transactions yet. Place an order to start earning points!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-right font-medium">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="capitalize">{TYPE_LABEL[t.type] ?? t.type}</span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({t.kind === "points" ? "points" : "wallet"})
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{t.note}</td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right font-semibold",
                      t.amount >= 0 ? "text-emerald-600" : "text-destructive"
                    )}
                  >
                    {t.amount >= 0 ? "+" : "−"}
                    {t.kind === "wallet" ? formatINR(Math.abs(t.amount)) : Math.abs(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {t.kind === "wallet" ? formatINR(t.balanceAfter) : t.balanceAfter}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
