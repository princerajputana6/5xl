import { connectDB } from "@/server/db";
import { Address } from "@/server/models/Address";
import type { AddressInput } from "@/lib/validators/checkout";

export type SavedAddress = AddressInput & { id: string; isDefault: boolean };

export async function getUserAddresses(userId: string): Promise<SavedAddress[]> {
  await connectDB();
  const docs = await Address.find({ user: userId })
    .sort({ isDefault: -1, updatedAt: -1 })
    .lean();
  return docs.map((a) => ({
    id: String(a._id),
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country ?? "India",
    isDefault: Boolean(a.isDefault),
  }));
}

export async function saveAddress(
  userId: string,
  input: AddressInput
): Promise<SavedAddress> {
  await connectDB();
  const count = await Address.countDocuments({ user: userId });
  const doc = await Address.create({
    user: userId,
    ...input,
    isDefault: count === 0, // first address becomes default
  });
  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    line1: doc.line1,
    line2: doc.line2 ?? "",
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    country: doc.country ?? "India",
    isDefault: Boolean(doc.isDefault),
  };
}
