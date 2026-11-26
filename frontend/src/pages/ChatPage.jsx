import { useChatStore } from "../store/useChatStore";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const activeTab = useChatStore((state) => state.activeTab);
  const selectedUser = useChatStore((state) => state.selectedUser);

  return (
    <div className="w-full h-[100dvh] flex overflow-hidden">
      {/* LEFT SIDE */}
      <div
        className={`w-full md:w-80 min-h-0 bg-base-200/50 backdrop-blur-sm flex flex-col overflow-hidden md:border-r border-base-content/10 ${
          selectedUser ? "hidden md:flex" : "flex"
        }`}
      >
        <ProfileHeader />
        <ActiveTabSwitch />

        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2">
          {activeTab === "chats" ? <ChatsList /> : <ContactList />}
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div
        className={`flex-1 min-h-0 flex flex-col overflow-hidden bg-base-100/50 backdrop-blur-sm ${
          selectedUser ? "flex" : "hidden md:flex"
        }`}
      >
        {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
      </div>
    </div>
  );
}
export default ChatPage;
