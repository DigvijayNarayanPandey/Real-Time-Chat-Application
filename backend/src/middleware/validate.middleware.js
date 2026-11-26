import mongoose from "mongoose";
import { AppError } from "./error.middleware.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const IMAGE_DATA_URI_REGEX = /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i;
const MAX_FULLNAME_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const MAX_MESSAGE_TEXT_LENGTH = 2000;
const MAX_IMAGE_DATA_URI_BYTES = 5 * 1024 * 1024;

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateImageDataUri(image) {
  if (typeof image !== "string" || !IMAGE_DATA_URI_REGEX.test(image)) {
    throw new AppError("Invalid image format. Allowed types: PNG, JPEG, WEBP, GIF.", 400);
  }
  if (Buffer.byteLength(image, "utf8") > MAX_IMAGE_DATA_URI_BYTES) {
    throw new AppError("Image exceeds maximum allowed size (5MB).", 400);
  }
}

export const validateSignup = (req, _res, next) => {
  const { fullName, email, password } = req.body || {};

  if (!isNonEmptyString(fullName) || !isNonEmptyString(email) || typeof password !== "string" || !password) {
    return next(new AppError("All fields are required", 400));
  }

  const trimmedName = fullName.trim();
  if (trimmedName.length > MAX_FULLNAME_LENGTH) {
    return next(new AppError(`Full name must be at most ${MAX_FULLNAME_LENGTH} characters`, 400));
  }

  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return next(new AppError("Password must be at least 8 characters", 400));
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return next(new AppError("Invalid email format", 400));
  }

  req.body.fullName = trimmedName;
  req.body.email = normalizedEmail;
  next();
};

export const validateLogin = (req, _res, next) => {
  const { email, password } = req.body || {};

  if (!isNonEmptyString(email) || typeof password !== "string" || !password) {
    return next(new AppError("Email and password are required", 400));
  }

  req.body.email = email.trim().toLowerCase();
  next();
};

export const validateUpdateProfile = (req, _res, next) => {
  const { profilePic, deletePic } = req.body || {};

  if (deletePic !== undefined && typeof deletePic !== "boolean") {
    return next(new AppError("Invalid deletePic flag", 400));
  }

  if (deletePic) {
    return next();
  }

  if (!isNonEmptyString(profilePic)) {
    return next(new AppError("Profile pic is required", 400));
  }

  validateImageDataUri(profilePic);
  next();
};

export const validateObjectIdParam = (paramName) => (req, _res, next) => {
  const value = req.params?.[paramName];
  if (!value || !mongoose.Types.ObjectId.isValid(value)) {
    return next(new AppError(`Invalid ${paramName} parameter`, 400));
  }
  next();
};

export const validateSendMessage = (req, _res, next) => {
  const { text, image } = req.body || {};

  if (text !== undefined && text !== null && typeof text !== "string") {
    return next(new AppError("Message text must be a string", 400));
  }

  const trimmedText = typeof text === "string" ? text.trim() : "";
  const hasImage = typeof image === "string" && image.trim().length > 0;

  if (image !== undefined && image !== null && image !== "" && typeof image !== "string") {
    return next(new AppError("Invalid image payload", 400));
  }

  if (!trimmedText && !hasImage) {
    return next(new AppError("Text or image is required.", 400));
  }

  if (trimmedText.length > MAX_MESSAGE_TEXT_LENGTH) {
    return next(new AppError(`Message text cannot exceed ${MAX_MESSAGE_TEXT_LENGTH} characters.`, 400));
  }

  if (hasImage) {
    validateImageDataUri(image);
  }

  req.body.text = trimmedText || undefined;
  req.body.image = hasImage ? image : undefined;
  next();
};
