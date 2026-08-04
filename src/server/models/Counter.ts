import { Schema, model, models, type Model } from "mongoose";

/**
 * Atomic named sequence. Used to mint human-friendly, monotonic order numbers
 * without leaking Mongo ObjectIds. One document per counter (e.g. "order").
 */
type CounterDoc = { _id: string; seq: number };

const CounterSchema = new Schema<CounterDoc>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter: Model<CounterDoc> =
  (models.Counter as Model<CounterDoc>) ??
  model<CounterDoc>("Counter", CounterSchema);

/** Increment and return the next value of a named counter (atomic upsert). */
export async function nextSequence(name: string): Promise<number> {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  ).lean();
  return doc!.seq;
}
