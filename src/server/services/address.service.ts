import { connectDB } from "@/server/db";
import { Address, type AddressDoc } from "@/server/models/Address";
import { HttpError } from "@/server/errors";
import type { AddressInput } from "@/lib/validators/checkout";

export type SavedAddress = AddressInput & { id: string; isDefault: boolean };

/** How many addresses one account may keep. */
export const MAX_ADDRESSES = 10;

function toDTO(a: AddressDoc): SavedAddress {
  return {
    id: String(a._id),
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

export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  await connectDB();
  const docs = await Address.find({ user: userId })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
  return docs.map((a) => toDTO(a as unknown as AddressDoc));
}

export async function saveAddress(
  userId: string,
  input: AddressInput
): Promise<SavedAddress> {
  await connectDB();
  const count = await Address.countDocuments({ user: userId });
  if (count >= MAX_ADDRESSES) {
    throw new HttpError(
      `You can save up to ${MAX_ADDRESSES} addresses. Delete one to add another.`,
      409
    );
  }
  const doc = await Address.create({
    user: userId,
    ...input,
    label: input.label ?? "Home",
    isDefault: count === 0, // first address becomes default
  });
  return toDTO(doc as unknown as AddressDoc);
}

/** Update one of the user's own addresses. */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressInput
): Promise<SavedAddress> {
  await connectDB();
  const doc = await Address.findOneAndUpdate(
    { _id: addressId, user: userId },
    { $set: { ...input, label: input.label ?? "Home" } },
    { new: true }
  ).lean();
  if (!doc) throw new HttpError("Address not found.", 404);
  return toDTO(doc as unknown as AddressDoc);
}

/**
 * Delete one of the user's own addresses. If the default is removed, the most
 * recently updated remaining address is promoted so the account always has one.
 */
export async function deleteAddress(userId: string, addressId: string): Promise<void> {
  await connectDB();
  const doc = await Address.findOneAndDelete({ _id: addressId, user: userId }).lean();
  if (!doc) throw new HttpError("Address not found.", 404);

  if (doc.isDefault) {
    const next = await Address.findOne({ user: userId }).sort({ updatedAt: -1 });
    if (next) {
      next.isDefault = true;
      await next.save();
    }
  }
}

/** Make one address the default, clearing the flag on the others. */
export async function setDefaultAddress(userId: string, addressId: string): Promise<void> {
  await connectDB();
  const owned = await Address.exists({ _id: addressId, user: userId });
  if (!owned) throw new HttpError("Address not found.", 404);

  await Address.updateMany({ user: userId }, { $set: { isDefault: false } });
  await Address.updateOne({ _id: addressId, user: userId }, { $set: { isDefault: true } });
}
