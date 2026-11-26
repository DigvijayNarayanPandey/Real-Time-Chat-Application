import { asyncHandler } from "../middleware/error.middleware.js";
import { messageService } from "../services/message.service.js";

export const getAllContacts = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const contacts = await messageService.getAllContacts(req.user._id, { page, limit });
  res.status(200).json(contacts);
});

export const getMessagesByUserId = asyncHandler(async (req, res) => {
  const { id: userToChatId } = req.params;
  const { before, limit } = req.query;
  const messages = await messageService.getMessagesByUserId(req.user._id, userToChatId, {
    before,
    limit,
  });
  res.status(200).json(messages);
});

export const sendMessage = asyncHandler(async (req, res) => {
  const { text, image } = req.body;
  const { id: receiverId } = req.params;
  const newMessage = await messageService.sendMessage({
    senderId: req.user._id,
    receiverId,
    text,
    image,
  });
  res.status(201).json(newMessage);
});

export const getChatPartners = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const chatPartners = await messageService.getChatPartners(req.user._id, { page, limit });
  res.status(200).json(chatPartners);
});

export const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  await messageService.markMessagesAsRead(userId, req.user._id);
  res.status(200).json({ message: "Messages marked as read" });
});
