import mongoose from "mongoose";
import { env } from "@/env";

/**
 * Cached Mongoose connection. Next.js hot-reloads modules in dev and runs
 * serverless functions in prod, both of which would otherwise open a new
 * connection per invocation. We cache the promise on globalThis.
 */
type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as {
  _mongoose?: MongooseCache;
};

const cache: MongooseCache =
  globalForMongoose._mongoose ?? { conn: null, promise: null };

if (!globalForMongoose._mongoose) {
  globalForMongoose._mongoose = cache;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      bufferCommands: false,
      dbName: "fivexl",
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}
