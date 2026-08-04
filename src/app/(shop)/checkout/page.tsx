import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getUserAddresses } from "@/server/services/address.service";
import { getRewardPoints } from "@/server/services/wallet.service";
import { isStub } from "@/server/payments/razorpay";
import { CheckoutClient } from "./checkout-client";

export const metadata: Metadata = { title: "Checkout · 5XL" };

export default async function CheckoutPage() {
  const user = await requireUser(); // redirects to /login if signed out
  const [addresses, rewardPoints] = await Promise.all([
    getUserAddresses(user.id),
    getRewardPoints(user.id),
  ]);

  return (
    <div className="container-5xl py-10">
      <h1 className="mb-6 font-display text-3xl font-extrabold uppercase tracking-tight">
        Checkout
      </h1>
      <CheckoutClient
        savedAddresses={addresses}
        defaultName={user.name ?? ""}
        stubMode={isStub}
        rewardPoints={rewardPoints}
      />
    </div>
  );
}
