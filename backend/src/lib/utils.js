import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ENV } from "./env.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_COOKIE_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

function getBaseCookieOptions() {
  const isProduction = ENV.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "strict",
    secure: isProduction,
  };
}

export function getAccessCookieOptions() {
  return {
    ...getBaseCookieOptions(),
    maxAge: ACCESS_COOKIE_MAX_AGE_MS,
  };
}

export function getRefreshCookieOptions() {
  return {
    ...getBaseCookieOptions(),
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: "/api/auth/refresh",
  };
}

// Generate access token (short-lived)
export const generateAccessToken = (userId) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

// Generate refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  const { JWT_REFRESH_SECRET } = ENV;
  if (!JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
};

// Hash refresh token for storage in database
export const hashRefreshToken = async (token) => {
  const salt = await bcrypt.genSalt(BCRYPT_ROUNDS);
  return await bcrypt.hash(token, salt);
};

// Verify hashed refresh token
export const verifyRefreshToken = async (token, hashedToken) => {
  if (!token || !hashedToken) return false;
  return await bcrypt.compare(token, hashedToken);
};

// Set access token as httpOnly cookie
export const setAccessTokenCookie = (token, res) => {
  res.cookie("jwt", token, getAccessCookieOptions());
};

// Set refresh token as httpOnly cookie
export const setRefreshTokenCookie = (token, res) => {
  res.cookie("refreshToken", token, getRefreshCookieOptions());
};

// Clear auth cookies using identical attributes so browsers delete them in all environments
export const clearAuthCookies = (res) => {
  const baseOptions = getBaseCookieOptions();
  res.clearCookie("jwt", baseOptions);
  res.clearCookie("refreshToken", {
    ...baseOptions,
    path: "/api/auth/refresh",
  });
};

/**
 * Strips sensitive fields before serializing a user object to clients.
 */
export const sanitizeUser = (user) => {
  if (!user) return null;
  const plain = typeof user.toObject === "function" ? user.toObject() : user;
  return {
    _id: plain._id,
    fullName: plain.fullName,
    email: plain.email,
    profilePic: plain.profilePic ?? "",
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};
