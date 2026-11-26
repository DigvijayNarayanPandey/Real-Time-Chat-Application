import { describe, it, expect, vi, beforeEach } from "vitest";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

describe("useChatStore read receipts & messaging", () => {
  beforeEach(() => {
    useAuthStore.setState({
      authUser: { _id: "user-1", fullName: "Sender" },
      socket: { emit: vi.fn(), on: vi.fn(), off: vi.fn() },
    });
    useChatStore.setState({
      selectedUser: { _id: "user-2", fullName: "Receiver" },
      messages: [
        {
          _id: "msg-1",
          senderId: "user-1",
          receiverId: "user-2",
          text: "Hello",
          createdAt: "2026-11-26T10:00:00.000Z",
          readAt: null,
        },
        {
          _id: "msg-2",
          senderId: "user-2",
          receiverId: "user-1",
          text: "Reply",
          createdAt: "2026-11-26T10:01:00.000Z",
          readAt: null,
        },
      ],
      isMessagesLoading: false,
      lastReadByPartnerAt: {},
    });
  });

  it("updates readAt locally on markLocalMessagesAsRead without setting isMessagesLoading", () => {
    const getMessagesSpy = vi.spyOn(axiosInstance, "get");

    useChatStore.getState().markLocalMessagesAsRead("user-2");

    const state = useChatStore.getState();
    expect(state.isMessagesLoading).toBe(false);
    expect(getMessagesSpy).not.toHaveBeenCalled();
    expect(state.messages[0].readAt).toBeTruthy();
    expect(state.messages[1].readAt).toBeNull();
  });

  it("replaces optimistic temp message and preserves rollback on API failure", async () => {
    vi.spyOn(axiosInstance, "post").mockRejectedValueOnce(new Error("Network error"));

    await useChatStore.getState().sendMessage({ text: "Failing message" });

    expect(useChatStore.getState().messages).toHaveLength(2);
  });
});
