import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { ENV } from "../lib/env.js";
import { logger } from "../lib/logger.js";

function extractCookieValue(cookieHeader, cookieName) {
  if (!cookieHeader || typeof cookieHeader !== "string") return null;
  const prefix = `${cookieName}=`;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }
  return null;
}

export const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = extractCookieValue(socket.handshake.headers?.cookie, "jwt");

    if (!token) {
      return next(new Error("Unauthorized - No Token Provided"));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch {
      return next(new Error("Unauthorized - Invalid Token"));
    }

    if (!decoded?.userId) {
      return next(new Error("Unauthorized - Invalid Token"));
    }

    const user = await User.findById(decoded.userId).select("-password -refreshToken");
    if (!user) {
      return next(new Error("User not found"));
    }

    socket.user = user;
    socket.userId = user._id.toString();

    logger.info("Socket authenticated", { userId: socket.userId });
    next();
  } catch (error) {
    logger.error("Error in socket authentication", { error });
    next(new Error("Unauthorized - Authentication failed"));
  }
};
