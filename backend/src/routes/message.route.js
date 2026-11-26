import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
  markMessagesAsRead,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import {
  validateObjectIdParam,
  validateSendMessage,
} from "../middleware/validate.middleware.js";

const router = express.Router();

// Rate-limit / bot-protect first, then authenticate
router.use(arcjetProtection, protectRoute);

router.get("/contacts", getAllContacts);
router.get("/chats", getChatPartners);
router.get("/:id", validateObjectIdParam("id"), getMessagesByUserId);
router.post("/send/:id", validateObjectIdParam("id"), validateSendMessage, sendMessage);
router.patch("/read/:userId", validateObjectIdParam("userId"), markMessagesAsRead);

export default router;
