import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import cors from "cors";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import { corsOptions } from "./lib/cors.js";
import { connectDB } from "./lib/db.js";
import { ENV, validateEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { app, server } from "./lib/socket.js";
import { securityHeaders } from "./middleware/securityHeaders.middleware.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const __dirname = path.resolve();
const PORT = ENV.PORT || 3000;

app.set("trust proxy", 1);
app.use(express.json({ limit: "5mb" }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(securityHeaders);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Health check endpoint for uptime monitoring
app.get("/api", (_req, res) => {
  res.status(200).send("API is running");
});

app.use("/api/*", notFoundHandler);

if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.use(errorHandler);

if (ENV.NODE_ENV !== "test") {
  validateEnv();
  server.listen(PORT, () => {
    logger.info("Server listening", { port: PORT, env: ENV.NODE_ENV || "development" });
    connectDB();
  });
}

export { app, server };
