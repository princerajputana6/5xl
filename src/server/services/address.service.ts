import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { addresses, type AddressRow } from "@/server/schema";
import { HttpError } from "@/server/errors";
import type { AddressInput } from "@/lib/validators/checkout";

export type SavedAddress = AddressInput & { id: string; isDefault: boolean };

/** How many addresses one account may keep. */
export const MAX_ADDRESSES = 10;

function toDTO(a: AddressRow): SavedAddress {
  return {
    id: a.id,
    label: (a.label as SavedAddress["label"]) ?? "Home",
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country ?? "India",
    isDefault: Boolean(a.isDefault),
  };
}

function mapInput(input: AddressInput) {
  return {
    label: input.label ?? "Home",
    name: input.name,
    phone: input.phone,
    line1: input.line1,
    line2: input.line2 ?? "",
    city: input.city,
    state: input.state,
    pincode: input.pincode,
    country: input.country ?? "India",
  };
}

export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  const docs = await db()
    .select()
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .orderBy(desc(addresses.isDefault), desc(addresses.updatedAt))
    .all();
  return docs.map(toDTO);
}

export async function saveAddress(userId: string, input: AddressInput): Promise<SavedAddress> {
  const existing = await db()
    .select({ n: count() })
    .from(addresses)
    .where(eq(addresses.userId, userId))
    .get();
  const total = existing?.n ?? 0;
  if (total >= MAX_ADDRESSES) {
    throw new HttpError(
      `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`,
      409
    );
  }
  const [row] = await db()
    .insert(addresses)
    .values({ userId, ...mapInput(input), isDefault: total === 0 })
    .returning();
  return toDTO(row);
}

/** Update one of the user's own addresses. */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput
): Promise<SavedAddress> {
  const [row] = await db()
    .update(addresses)
    .set(mapInput(input))
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();
  if (!row) throw new HttpError("Address not found.", 404);
  return toDTO(row);
}

/**
 * Delete one of the user's own addresses. If the default is removed, the most
 * recently updated remaining address is promoted so the account always has one.
 */
export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  const [removed] = await db()
    .delete(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .returning();
  if (!removed) throw new HttpError("Address not found.", 404);

  if (removed.isDefault) {
    const next = await db()
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.updatedAt))
      .get();
    if (next) {
      await db().update(addresses).set({ isDefault: true }).where(eq(addresses.id, next.id));
    }
  }
}

/** Make one address the default, clearing the flag on the others. */
export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  const owned = await db()
    .select({ id: addresses.id })
    .from(addresses)
    .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
    .get();
  if (!owned) throw new HttpError("Address not found.", 404);

  await db().update(addresses).set({ isDefault: false }).where(eq(addresses.userId, userId));
  await db().update(addresses).set({ isDefault: true }).where(eq(addresses.id, addressId));
}
