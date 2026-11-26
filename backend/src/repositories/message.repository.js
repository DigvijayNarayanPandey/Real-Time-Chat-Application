import mongoose from "mongoose";
import Message from "../models/Message.js";

const MAX_MESSAGE_LIMIT = 500;

export const messageRepository = {
  async findConversation(userAId, userBId, { before, limit } = {}) {
    const filter = {
      $or: [
        { senderId: userAId, receiverId: userBId },
        { senderId: userBId, receiverId: userAId },
      ],
    };

    if (before) {
      const beforeDate = new Date(before);
      if (!Number.isNaN(beforeDate.getTime())) {
        filter.createdAt = { $lt: beforeDate };
      }
    }

    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      const safeLimit = Math.min(Math.floor(parsedLimit), MAX_MESSAGE_LIMIT);
      const recentDesc = await Message.find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit);
      return recentDesc.reverse();
    }

    return await Message.find(filter).sort({ createdAt: 1 });
  },

  async createMessage({ senderId, receiverId, text, image }) {
    const message = new Message({
      senderId,
      receiverId,
      text,
      image,
    });
    return await message.save();
  },

  async findChatPartnerIds(loggedInUserId, { page, limit } = {}) {
    const objectId = new mongoose.Types.ObjectId(loggedInUserId);

    const pipeline = [
      {
        $match: {
          $or: [{ senderId: objectId }, { receiverId: objectId }],
        },
      },
      {
        $project: {
          partnerId: {
            $cond: [{ $eq: ["$senderId", objectId] }, "$receiverId", "$senderId"],
          },
          createdAt: 1,
        },
      },
      {
        $group: {
          _id: "$partnerId",
          lastMessageAt: { $max: "$createdAt" },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ];

    const parsedLimit = Number(limit);
    if (Number.isFinite(parsedLimit) && parsedLimit > 0) {
      const safeLimit = Math.min(Math.floor(parsedLimit), 200);
      const safePage = Math.max(1, Number(page) || 1);
      pipeline.push({ $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit });
    }

    const results = await Message.aggregate(pipeline);
    return results.map((entry) => entry._id.toString());
  },

  markConversationAsRead(senderId, receiverId) {
    return Message.updateMany(
      {
        senderId,
        receiverId,
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    );
  },
};
