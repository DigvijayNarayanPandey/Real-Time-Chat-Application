import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../lib/env.js";
import { logger } from "../lib/logger.js";
import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
  sanitizeUser,
} from "../lib/utils.js";
import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { AppError } from "../middleware/error.middleware.js";
import { userRepository } from "../repositories/user.repository.js";
import { mediaService } from "./media.service.js";

const PASSWORD_SALT_ROUNDS = 12;

async function issueSessionTokens(userId) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  const hashedRefreshToken = await hashRefreshToken(refreshToken);
  await userRepository.updateRefreshToken(userId, hashedRefreshToken);

  return { accessToken, refreshToken };
}

function extractUserIdFromAnyToken(accessToken, refreshToken) {
  if (accessToken && ENV.JWT_SECRET) {
    try {
      const decoded = jwt.verify(accessToken, ENV.JWT_SECRET, { ignoreExpiration: true });
      if (decoded?.userId) return decoded.userId;
    } catch {
      // Ignore malformed access token on logout
    }
  }

  if (refreshToken && ENV.JWT_REFRESH_SECRET) {
    try {
      const decoded = jwt.verify(refreshToken, ENV.JWT_REFRESH_SECRET, { ignoreExpiration: true });
      if (decoded?.userId) return decoded.userId;
    } catch {
      // Ignore malformed refresh token on logout
    }
  }

  return null;
}

export const authService = {
  async signup({ fullName, email, password }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError("Email already exists", 400);
    }

    const salt = await bcrypt.genSalt(PASSWORD_SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);

    const savedUser = await userRepository.createUser({
      fullName,
      email,
      password: hashedPassword,
    });

    const tokens = await issueSessionTokens(savedUser._id);

    try {
      await sendWelcomeEmail(savedUser.email, savedUser.fullName, ENV.CLIENT_URL);
    } catch (error) {
      logger.error("Failed to send welcome email", { error, userId: savedUser._id.toString() });
    }

    return {
      user: sanitizeUser(savedUser),
      ...tokens,
    };
  },

  async login({ email, password }) {
    const user = await userRepository.findByEmail(email, { includePassword: true });
    if (!user) {
      throw new AppError("Invalid credentials", 400);
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 400);
    }

    const tokens = await issueSessionTokens(user._id);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async logout({ accessToken, refreshToken }) {
    const userId = extractUserIdFromAnyToken(accessToken, refreshToken);
    if (userId) {
      await userRepository.updateRefreshToken(userId, null);
    }
  },

  async updateProfile(userId, { profilePic, deletePic }) {
    const nextProfilePic = deletePic
      ? ""
      : await mediaService.uploadImage(profilePic, "chat-app/profiles");

    const updatedUser = await userRepository.updateProfilePic(userId, nextProfilePic);
    if (!updatedUser) {
      throw new AppError("User not found", 404);
    }

    return sanitizeUser(updatedUser);
  },

  async refreshSession(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      throw new AppError("Unauthorized - No refresh token provided", 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(incomingRefreshToken, ENV.JWT_REFRESH_SECRET);
    } catch {
      throw new AppError("Unauthorized - Invalid refresh token", 401);
    }

    const user = await userRepository.findById(decoded.userId, { includeRefreshToken: true });
    if (!user) {
      throw new AppError("Unauthorized - Invalid refresh token", 401);
    }

    const isValid = await verifyRefreshToken(incomingRefreshToken, user.refreshToken);
    if (!isValid) {
      throw new AppError("Unauthorized - Invalid refresh token", 401);
    }

    const tokens = await issueSessionTokens(user._id);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },
};
