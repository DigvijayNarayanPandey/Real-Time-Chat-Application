import "dotenv/config";

export const ENV = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  CLIENT_URL: process.env.CLIENT_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  ARCJET_KEY: process.env.ARCJET_KEY,
  ARCJET_ENV: process.env.ARCJET_ENV,
  USE_PUBLIC_DNS: process.env.USE_PUBLIC_DNS,
};

const REQUIRED_ENV_VARS = ["MONGO_URI", "JWT_SECRET", "JWT_REFRESH_SECRET"];

/**
 * Validates required environment variables at startup without exposing secret values.
 */
export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !ENV[key] || !String(ENV[key]).trim());
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (ENV.JWT_SECRET.length < 32 || ENV.JWT_REFRESH_SECRET.length < 32) {
    console.warn("Warning: JWT secrets should be at least 32 characters long.");
  }
};
