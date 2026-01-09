import mongoose from 'mongoose';

const MONGO_SERVER = process.env.MONGO_SERVER;
const MONGO_DB = process.env.MONGO_DB;
const MONGO_USER = process.env.MONGO_USER;
const MONGO_PASSWORD = process.env.MONGO_PASSWORD;

if (!MONGO_SERVER || !MONGO_DB || !MONGO_USER || !MONGO_PASSWORD) {
  throw new Error('Please define all MongoDB environment variables (MONGO_SERVER, MONGO_DB, MONGO_USER, MONGO_PASSWORD) inside .env.local');
}

// Construct MongoDB URI
const MONGODB_URI = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_SERVER}/${MONGO_DB}`;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      readPreference: 'secondaryPreferred' as const,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    throw e;
  }

  return cached!.conn;
}

export default connectDB;

