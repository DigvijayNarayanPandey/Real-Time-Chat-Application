import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LoginPage from "../pages/LoginPage";
import ChatContainer from "../components/ChatContainer";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { axiosInstance } from "../lib/axios";

describe("Frontend Components", () => {
  beforeEach(() => {
    vi.spyOn(axiosInstance, "get").mockResolvedValue({ data: [] });
  });

  it("validates LoginPage email and password before calling login", () => {
    const loginSpy = vi.fn();
    useAuthStore.setState({ login: loginSpy, isLoggingIn: false });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(loginSpy).not.toHaveBeenCalled();
  });

  it("renders ChatHeader with accessible mobile back button and read/unread ticks", () => {
    const socketHandlers = {};
    const mockSocket = {
      on: vi.fn((event, fn) => {
        socketHandlers[event] = fn;
      }),
      off: vi.fn(),
      emit: vi.fn(),
    };

    useAuthStore.setState({
      authUser: { _id: "user-1", fullName: "Me" },
      socket: mockSocket,
      onlineUsers: ["user-2"],
    });

    useChatStore.setState({
      selectedUser: { _id: "user-2", fullName: "John Doe", profilePic: "" },
      isMessagesLoading: false,
      messages: [
        {
          _id: "m1",
          senderId: "user-1",
          receiverId: "user-2",
          text: "Unread message",
          createdAt: new Date().toISOString(),
          readAt: null,
        },
        {
          _id: "m2",
          senderId: "user-1",
          receiverId: "user-2",
          text: "Read message",
          createdAt: new Date().toISOString(),
          readAt: new Date().toISOString(),
        },
      ],
      getMessagesByUserId: vi.fn(),
      subscribeToMessages: vi.fn(),
      unsubscribeFromMessages: vi.fn(),
    });

    render(<ChatContainer />);

    expect(screen.getByRole("button", { name: "Back to conversations" })).toBeInTheDocument();
    expect(screen.getByLabelText("Sent")).toBeInTheDocument();
    expect(screen.getByLabelText("Read")).toBeInTheDocument();
  });
});
