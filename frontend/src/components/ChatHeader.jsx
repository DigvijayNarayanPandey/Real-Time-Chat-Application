import { XIcon, ArrowLeftIcon } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const selectedUser = useChatStore((state) => state.selectedUser);
  const setSelectedUser = useChatStore((state) => state.setSelectedUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const isOnline = onlineUsers.includes(selectedUser._id);

  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };
    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div
      className="shrink-0 sticky top-0 z-20 flex justify-between items-center bg-base-200 border-b
   border-base-content/10 min-h-[72px] md:min-h-[84px] px-4 md:px-6 w-full"
    >
      <div className="flex items-center space-x-3 min-w-0">
        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className="md:hidden text-base-content/70 hover:text-base-content transition-colors mr-1 p-1 rounded-lg"
          aria-label="Back to conversations"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>

        <div className={`avatar shrink-0 ${isOnline ? "online" : "offline"}`}>
          <div className="w-10 md:w-12 rounded-full">
            <img src={selectedUser.profilePic || "/avatar.png"} alt={selectedUser.fullName} />
          </div>
        </div>

        <div className="min-w-0">
          <h3 className="text-base-content font-medium text-sm md:text-base truncate">
            {selectedUser.fullName}
          </h3>
          <p className="text-base-content/60 text-xs md:text-sm">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSelectedUser(null)}
        className="hidden md:block p-1 rounded-lg text-base-content/60 hover:text-base-content transition-colors"
        aria-label="Close chat"
      >
        <XIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
export default ChatHeader;
