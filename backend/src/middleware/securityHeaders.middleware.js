import { ENV } from "../lib/env.js";
import { allowedOrigins } from "../lib/cors.js";

export const securityHeaders = (req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  if (ENV.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  const connectSources = [
    "'self'",
    "ws:",
    "wss:",
    "https://api.resend.com",
    "https://res.cloudinary.com",
    ...allowedOrigins,
  ];

  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; font-src 'self' https://fonts.gstatic.com; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; connect-src ${[...new Set(connectSources)].join(" ")};`
  );

  next();
};
