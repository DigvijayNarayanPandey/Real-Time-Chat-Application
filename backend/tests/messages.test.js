import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";

vi.mock("../src/lib/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn.example.com/msg.png" }),
    },
  },
}));

import { app } from "../src/server.js";
import User from "../src/models/User.js";
import { userRepository } from "../src/repositories/user.repository.js";
import { messageRepository } from "../src/repositories/message.repository.js";
import { generateAccessToken } from "../src/lib/utils.js";

describe("Messages API Integration & Validation", () => {
  const userId = new mongoose.Types.ObjectId();
  const partnerId = new mongoose.Types.ObjectId();
  const authCookie = `jwt=${generateAccessToken(userId.toString())}`;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: userId,
        fullName: "Sender User",
        email: "sender@example.com",
        profilePic: "",
      }),
    });
  });

  it("rejects invalid ObjectId parameter on GET /api/messages/:id with 400", async () => {
    const res = await request(app)
      .get("/api/messages/not-a-valid-id")
      .set("Cookie", [authCookie]);

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Invalid id parameter");
  });

  it("rejects sending a message to yourself with 400", async () => {
    const res = await request(app)
      .post(`/api/messages/send/${userId.toString()}`)
      .set("Cookie", [authCookie])
      .send({ text: "Hello me" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Cannot send messages to yourself.");
  });

  it("rejects empty text/image messages with 400", async () => {
    const res = await request(app)
      .post(`/api/messages/send/${partnerId.toString()}`)
      .set("Cookie", [authCookie])
      .send({ text: "   " });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Text or image is required.");
  });

  it("returns 404 when sending a message to a non-existent receiver", async () => {
    vi.spyOn(userRepository, "existsById").mockResolvedValue(null);

    const res = await request(app)
      .post(`/api/messages/send/${partnerId.toString()}`)
      .set("Cookie", [authCookie])
      .send({ text: "Hi there" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Receiver not found.");
  });

  it("creates a message and returns 201", async () => {
    vi.spyOn(userRepository, "existsById").mockResolvedValue({ _id: partnerId });
    const createdMsg = {
      _id: new mongoose.Types.ObjectId(),
      senderId: userId,
      receiverId: partnerId,
      text: "Hello partner!",
      readAt: null,
      createdAt: new Date(),
    };
    vi.spyOn(messageRepository, "createMessage").mockResolvedValue(createdMsg);

    const res = await request(app)
      .post(`/api/messages/send/${partnerId.toString()}`)
      .set("Cookie", [authCookie])
      .send({ text: "  Hello partner!  " });

    expect(res.status).toBe(201);
    expect(res.body.text).toBe("Hello partner!");
  });

  it("returns chat partners in aggregated order", async () => {
    const partner2Id = new mongoose.Types.ObjectId();
    vi.spyOn(messageRepository, "findChatPartnerIds").mockResolvedValue([
      partner2Id.toString(),
      partnerId.toString(),
    ]);
    vi.spyOn(userRepository, "findByIds").mockResolvedValue([
      { _id: partnerId, fullName: "First", email: "first@example.com" },
      { _id: partner2Id, fullName: "Second", email: "second@example.com" },
    ]);

    const res = await request(app)
      .get("/api/messages/chats")
      .set("Cookie", [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.map((u) => u.fullName)).toEqual(["Second", "First"]);
  });

  it("marks messages as read for valid userId", async () => {
    const markSpy = vi
      .spyOn(messageRepository, "markConversationAsRead")
      .mockResolvedValue({ modifiedCount: 2 });

    const res = await request(app)
      .patch(`/api/messages/read/${partnerId.toString()}`)
      .set("Cookie", [authCookie]);

    expect(res.status).toBe(200);
    expect(markSpy).toHaveBeenCalledWith(partnerId.toString(), userId);
  });
});
