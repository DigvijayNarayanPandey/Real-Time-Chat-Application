import { emitToUser } from "../lib/socket.js";
import { AppError } from "../middleware/error.middleware.js";
import { userRepository } from "../repositories/user.repository.js";
import { messageRepository } from "../repositories/message.repository.js";
import { mediaService } from "./media.service.js";

export const messageService = {
  async getAllContacts(loggedInUserId, pagination) {
    return await userRepository.findAllExcept(loggedInUserId, pagination);
  },

  async getMessagesByUserId(myId, userToChatId, pagination) {
    return await messageRepository.findConversation(myId, userToChatId, pagination);
  },

  async sendMessage({ senderId, receiverId, text, image }) {
    if (senderId.equals(receiverId)) {
      throw new AppError("Cannot send messages to yourself.", 400);
    }

    const receiverExists = await userRepository.existsById(receiverId);
    if (!receiverExists) {
      throw new AppError("Receiver not found.", 404);
    }

    let imageUrl;
    if (image) {
      imageUrl = await mediaService.uploadImage(image, "chat-app/messages");
    }

    const newMessage = await messageRepository.createMessage({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    emitToUser(receiverId.toString(), "newMessage", newMessage);

    return newMessage;
  },

  async getChatPartners(loggedInUserId, pagination) {
    const partnerIds = await messageRepository.findChatPartnerIds(loggedInUserId, pagination);
    if (partnerIds.length === 0) return [];

    const partners = await userRepository.findByIds(partnerIds);
    const partnerMap = new Map(partners.map((partner) => [partner._id.toString(), partner]));

    // Preserve most-recent-conversation ordering returned by the aggregation pipeline
    return partnerIds.map((id) => partnerMap.get(id)).filter(Boolean);
  },

  async markMessagesAsRead(senderId, receiverId) {
    await messageRepository.markConversationAsRead(senderId, receiverId);
  },
};
