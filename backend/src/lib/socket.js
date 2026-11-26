import { Server } from "socket.io";
import http from "http";
import express from "express";
import mongoose from "mongoose";
import { allowedOrigins } from "./cors.js";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";
import { logger } from "./logger.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

// Track all active socket IDs per user so multi-device/multi-tab sessions stay synced
const userSocketMap = new Map(); // Map<string, Set<string>>

export function getReceiverSocketIds(userId) {
  const sockets = userSocketMap.get(String(userId));
  return sockets ? Array.from(sockets) : [];
}

export function getReceiverSocketId(userId) {
  const socketIds = getReceiverSocketIds(userId);
  return socketIds.length > 0 ? socketIds[socketIds.length - 1] : undefined;
}

export function emitToUser(userId, event, payload) {
  const socketIds = getReceiverSocketIds(userId);
  for (const socketId of socketIds) {
    io.to(socketId).emit(event, payload);
  }
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  logger.info("Socket connected", { userId, socketId: socket.id });

  if (!userSocketMap.has(userId)) {
    userSocketMap.set(userId, new Set());
  }
  userSocketMap.get(userId).add(socket.id);

  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    logger.info("Socket disconnected", { userId, socketId: socket.id });
    const sockets = userSocketMap.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        userSocketMap.delete(userId);
      }
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });

  // Always enforce the authenticated socket.userId as readerId to prevent spoofing
  socket.on("messagesRead", (payload) => {
    const chatUserId = payload?.chatUserId;
    if (!chatUserId || !mongoose.Types.ObjectId.isValid(chatUserId)) {
      return;
    }

    emitToUser(chatUserId, "messagesRead", {
      readerId: userId,
      chatUserId: String(chatUserId),
    });
  });
});

export { io, app, server };
