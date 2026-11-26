import mongoose from "mongoose";
import dns from "dns";
import { ENV } from "./env.js";
import { logger } from "./logger.js";

/**
 * Establishes MongoDB connection. Public DNS override is opt-in via USE_PUBLIC_DNS=true.
 */
export const connectDB = async () => {
  try {
    const { MONGO_URI } = ENV;
    if (!MONGO_URI) throw new Error("MONGO_URI is not set");

    if (ENV.USE_PUBLIC_DNS === "true") {
      dns.setServers(["8.8.8.8", "8.8.4.4"]);
    }

    const conn = await mongoose.connect(MONGO_URI);
    logger.info("MongoDB connected", { host: conn.connection.host });
  } catch (error) {
    logger.error("Failed to connect to MongoDB", { error });
    process.exit(1);
  }
};
