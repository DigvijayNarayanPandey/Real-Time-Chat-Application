import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "./useAuthStore";

function readInitialSoundEnabled() {
  try {
    return JSON.parse(localStorage.getItem("isSoundEnabled")) === true;
  } catch {
    return false;
  }
}

let notificationAudio = null;
function playNotificationSound() {
  if (typeof Audio === "undefined") return;
  if (!notificationAudio) {
    notificationAudio = new Audio("/sounds/notification.mp3");
  }
  notificationAudio.currentTime = 0;
  notificationAudio.play().catch(() => {});
}

export const useChatStore = create((set, get) => ({
  allContacts: [],
  chats: [],
  messages: [],
  activeTab: "chats",
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastReadByPartnerAt: {},
  isSoundEnabled: readInitialSoundEnabled(),

  toggleSound: () => {
    const nextValue = !get().isSoundEnabled;
    try {
      localStorage.setItem("isSoundEnabled", JSON.stringify(nextValue));
    } catch {
      // Ignore storage errors
    }
    set({ isSoundEnabled: nextValue });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  setSelectedUser: async (selectedUser) => {
    const prevSelectedId = get().selectedUser?._id;
    const nextSelectedId = selectedUser?._id;

    set({
      selectedUser,
      ...(prevSelectedId !== nextSelectedId ? { messages: [] } : {}),
    });

    if (selectedUser) {
      try {
        await axiosInstance.patch(`/messages/read/${selectedUser._id}`);
        const { socket, authUser } = useAuthStore.getState();
        if (socket && authUser?._id) {
          socket.emit("messagesRead", {
            readerId: authUser._id,
            chatUserId: selectedUser._id,
          });
        }
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    }
  },

  markLocalMessagesAsRead: (readerId) => {
    if (!readerId) return;
    const { authUser } = useAuthStore.getState();
    if (!authUser?._id) return;

    const readTimestamp = new Date().toISOString();
    const readerIdStr = String(readerId);
    const currentUserIdStr = String(authUser._id);

    set((state) => ({
      lastReadByPartnerAt: {
        ...state.lastReadByPartnerAt,
        [readerIdStr]: readTimestamp,
      },
      messages: state.messages.map((msg) => {
        if (
          String(msg.senderId) === currentUserIdStr &&
          String(msg.receiverId) === readerIdStr &&
          !msg.readAt
        ) {
          return { ...msg, readAt: readTimestamp };
        }
        return msg;
      }),
    }));
  },

  getAllContacts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/contacts");
      set({ allContacts: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load contacts");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMyChatPartners: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/chats");
      set({ chats: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load chats");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessagesByUserId: async (userId) => {
    if (!userId) return;
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      if (String(get().selectedUser?._id) === String(userId)) {
        set({ messages: res.data });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const { authUser } = useAuthStore.getState();
    if (!selectedUser?._id || !authUser?._id) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: authUser._id,
      receiverId: selectedUser._id,
      text: messageData.text,
      image: messageData.image,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    set({ messages: [...messages, optimisticMessage] });

    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      const partnerIdStr = String(selectedUser._id);
      const partnerReadAt = get().lastReadByPartnerAt[partnerIdStr];
      const savedMessage =
        !res.data.readAt &&
        partnerReadAt &&
        new Date(partnerReadAt).getTime() >= new Date(res.data.createdAt).getTime()
          ? { ...res.data, readAt: partnerReadAt }
          : res.data;

      set((state) => ({
        messages: state.messages.map((msg) => (msg._id === tempId ? savedMessage : msg)),
      }));
    } catch (error) {
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== tempId),
      }));
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    // Prevent duplicate handlers if subscribe is called after socket reconnects
    get().unsubscribeFromMessages();

    const handleNewMessage = async (newMessage) => {
      const state = get();
      if (!state.selectedUser) return;

      const isFromSelectedUser = String(newMessage.senderId) === String(state.selectedUser._id);
      if (!isFromSelectedUser) return;

      set({ messages: [...state.messages, newMessage] });

      try {
        await axiosInstance.patch(`/messages/read/${state.selectedUser._id}`);
        const { socket: currentSocket, authUser } = useAuthStore.getState();
        if (currentSocket && authUser?._id) {
          currentSocket.emit("messagesRead", {
            readerId: authUser._id,
            chatUserId: state.selectedUser._id,
          });
        }
      } catch (error) {
        console.error("Failed to mark incoming message as read:", error);
      }

      if (get().isSoundEnabled) {
        playNotificationSound();
      }
    };

    socket.newMessageHandler = handleNewMessage;
    socket.on("newMessage", handleNewMessage);
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    if (socket.newMessageHandler) {
      socket.off("newMessage", socket.newMessageHandler);
      socket.newMessageHandler = null;
    }
  },
}));
