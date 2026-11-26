import { useEffect, useRef, useMemo, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { formatDateHeader, formatMessageTime, getLocalDateKey } from "../lib/dateUtils";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Check, CheckCheck } from "lucide-react";

function ChatContainer() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const messages = useChatStore((state) => state.messages);
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading);

  const getMessagesByUserId = useChatStore((state) => state.getMessagesByUserId);
  const subscribeToMessages = useChatStore((state) => state.subscribeToMessages);
  const unsubscribeFromMessages = useChatStore((state) => state.unsubscribeFromMessages);
  const markLocalMessagesAsRead = useChatStore((state) => state.markLocalMessagesAsRead);

  const authUser = useAuthStore((state) => state.authUser);
  const socket = useAuthStore((state) => state.socket);

  const messageEndRef = useRef(null);

  const processedMessages = useMemo(() => {
    if (!messages || messages.length === 0) return [];

    const processed = [];
    let previousDateKey = null;

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const dateKey = getLocalDateKey(msg.createdAt);
      if (previousDateKey !== dateKey) {
        processed.push({
          type: "date",
          dateKey,
          label: formatDateHeader(msg.createdAt),
        });
        previousDateKey = dateKey;
      }
      processed.push({ type: "message", message: msg });
    }

    return processed;
  }, [messages]);

  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessagesByUserId(selectedUser._id);
  }, [selectedUser?._id, getMessagesByUserId]);

  useEffect(() => {
    if (!selectedUser?._id || !socket) return;
    subscribeToMessages();

    return () => {
      unsubscribeFromMessages();
    };
  }, [selectedUser?._id, socket, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleMessagesRead = useCallback(
    ({ readerId }) => {
      if (
        !authUser?._id ||
        !selectedUser?._id ||
        String(authUser._id) === String(readerId) ||
        String(readerId) !== String(selectedUser._id)
      ) {
        return;
      }
      markLocalMessagesAsRead(readerId);
    },
    [selectedUser?._id, authUser?._id, markLocalMessagesAsRead]
  );

  useEffect(() => {
    if (!socket) return;
    socket.on("messagesRead", handleMessagesRead);
    return () => {
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, handleMessagesRead]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <ChatHeader />

      <div className="flex-1 min-h-0 px-3 md:px-6 overflow-y-auto py-4 md:py-8">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-4 md:space-y-6">
            {processedMessages.map((item) => {
              if (item.type === "date") {
                return (
                  <div key={`date-${item.dateKey}`} className="flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-base-200/90 text-base-content/70 shadow-sm border border-base-content/10">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const msg = item.message;
              const isSentByCurrentUser = String(msg.senderId) === String(authUser?._id);

              let receipt = null;
              if (isSentByCurrentUser) {
                receipt = msg.readAt ? (
                  <CheckCheck
                    aria-label="Read"
                    className="w-3.5 h-3.5 shrink-0 text-sky-300 drop-shadow-[0_1px_1px_rgba(0,0,0,0.45)]"
                  />
                ) : (
                  <Check
                    aria-label="Sent"
                    className="w-3.5 h-3.5 shrink-0 text-primary-content/75"
                  />
                );
              }

              return (
                <div
                  key={`message-${msg._id}`}
                  className={`chat ${isSentByCurrentUser ? "chat-end" : "chat-start"}`}
                >
                  <div
                    className={`chat-bubble ${
                      isSentByCurrentUser ? "chat-bubble-primary" : "chat-bubble-neutral"
                    }`}
                  >
                    {msg.image && (
                      <img src={msg.image} alt="Shared" className="rounded-lg h-48 object-cover" />
                    )}
                    {msg.text && <p className={msg.image ? "mt-2" : ""}>{msg.text}</p>}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <time className="text-[11px] opacity-75 leading-none">
                        {formatMessageTime(msg.createdAt)}
                      </time>
                      {receipt}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      <MessageInput />
    </div>
  );
}

export default ChatContainer;
