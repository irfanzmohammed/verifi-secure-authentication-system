
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const cached = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

const mongooseCache = cached.mongoose ?? {
  conn: null,
  promise: null,
};

cached.mongoose = mongooseCache;

export async function connectDB() {
  if (mongooseCache.conn) {
    return mongooseCache.conn;
  }

  if (!MONGODB_URI) {
    throw new Error("Please define MONGODB_URI in your environment variables.");
  }

  if (!mongooseCache.promise) {
    mongooseCache.promise = mongoose.connect(MONGODB_URI);
  }

  try {
    mongooseCache.conn = await mongooseCache.promise;
  } catch (error) {
    mongooseCache.promise = null;
    throw error;
  }

  return mongooseCache.conn;
}
