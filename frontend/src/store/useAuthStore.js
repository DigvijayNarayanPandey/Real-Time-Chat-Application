import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { SOCKET_BASE_URL } from "../lib/config";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isCheckingAuth: true,
  isSigningUp: false,
  isLoggingIn: false,
  socket: null,
  onlineUsers: [],

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch {
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully!");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup request failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response?.data?.message || "Login request failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
      toast.success("Logged out successfully");
    } catch {
      toast.error("Error logging out");
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Profile update failed");
    }
  },

  connectSocket: () => {
    const { authUser, socket: existingSocket } = get();
    if (!authUser) return;
    if (existingSocket?.connected) return;

    if (existingSocket) {
      get().disconnectSocket();
    }

    const socket = io(SOCKET_BASE_URL, {
      withCredentials: true,
    });

    const handleOnlineUsers = (userIds) => {
      set({ onlineUsers: Array.isArray(userIds) ? userIds : [] });
    };

    socket.onlineUsersHandler = handleOnlineUsers;
    socket.on("getOnlineUsers", handleOnlineUsers);
    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (!socket) return;

    if (socket.onlineUsersHandler) {
      socket.off("getOnlineUsers", socket.onlineUsersHandler);
      socket.onlineUsersHandler = null;
    }

    socket.disconnect();
    set({ socket: null, onlineUsers: [] });
  },
}));
