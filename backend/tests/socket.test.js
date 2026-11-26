import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

describe("Socket multi-device presence & read-receipt security", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("tracks multiple sockets per user and enforces authenticated socket.userId on messagesRead", async () => {
    const connectionHandlers = [];
    const emittedEvents = [];

    const makeMockSocket = (id, userId) => {
      const listeners = {};
      return {
        id,
        userId,
        listeners,
        on: vi.fn((event, handler) => {
          listeners[event] = handler;
        }),
      };
    };

    const mockIo = {
      use: vi.fn(),
      emit: vi.fn((event, payload) => {
        emittedEvents.push({ target: "all", event, payload });
      }),
      to: vi.fn((socketId) => ({
        emit: (event, payload) => {
          emittedEvents.push({ target: socketId, event, payload });
        },
      })),
      on: vi.fn((event, handler) => {
        if (event === "connection") connectionHandlers.push(handler);
      }),
    };

    vi.doMock("socket.io", () => ({
      Server: class MockServer {
        constructor() {
          return mockIo;
        }
      },
    }));

    const { getReceiverSocketIds, getReceiverSocketId } = await import("../src/lib/socket.js");
    const onConnection = connectionHandlers[0];

    const userA = new mongoose.Types.ObjectId().toString();
    const userB = new mongoose.Types.ObjectId().toString();

    const laptopSocket = makeMockSocket("sock-laptop", userA);
    const phoneSocket = makeMockSocket("sock-phone", userA);
    const partnerSocket = makeMockSocket("sock-partner", userB);

    onConnection(laptopSocket);
    onConnection(phoneSocket);
    onConnection(partnerSocket);

    expect(getReceiverSocketIds(userA)).toEqual(["sock-laptop", "sock-phone"]);
    expect(getReceiverSocketId(userA)).toBe("sock-phone");

    // Partner emits spoofed readerId; server must override with authenticated partnerSocket.userId
    partnerSocket.listeners.messagesRead({
      readerId: "spoofed-user-id",
      chatUserId: userA,
    });

    const deliveredToLaptop = emittedEvents.find(
      (e) => e.target === "sock-laptop" && e.event === "messagesRead"
    );
    const deliveredToPhone = emittedEvents.find(
      (e) => e.target === "sock-phone" && e.event === "messagesRead"
    );

    expect(deliveredToLaptop?.payload).toEqual({ readerId: userB, chatUserId: userA });
    expect(deliveredToPhone?.payload).toEqual({ readerId: userB, chatUserId: userA });

    // Disconnecting laptop leaves phone online
    laptopSocket.listeners.disconnect();
    expect(getReceiverSocketIds(userA)).toEqual(["sock-phone"]);
  });
});
