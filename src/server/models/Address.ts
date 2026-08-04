import { Schema, model, models, type Model, type InferSchemaType } from "mongoose";

const AddressSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    label: { type: String, default: "Home" }, // Home / Work / Other
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type AddressDoc = InferSchemaType<typeof AddressSchema> & { _id: string };

export const Address: Model<AddressDoc> =
  (models.Address as Model<AddressDoc>) ??
  model<AddressDoc>("Address", AddressSchema);
