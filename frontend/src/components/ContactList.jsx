import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import UsersLoadingSkeleton from "./UsersLoadingSkeleton";
import { useAuthStore } from "../store/useAuthStore";

function ContactList() {
  const { getAllContacts, allContacts, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers } = useAuthStore();

  useEffect(() => {
    getAllContacts();
  }, [getAllContacts]);

  if (isUsersLoading) return <UsersLoadingSkeleton />;

  if (allContacts.length === 0) {
    return (
      <p className="text-center text-sm text-base-content/60 py-8">No contacts available yet.</p>
    );
  }

  return (
    <div className="space-y-1">
      {allContacts.map((contact) => (
        <button
          type="button"
          key={contact._id}
          className="w-full text-left flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-base-content/5 active:bg-base-content/10 transition-colors"
          onClick={() => setSelectedUser(contact)}
        >
          <div className={`avatar shrink-0 ${onlineUsers.includes(contact._id) ? "online" : "offline"}`}>
            <div className="size-12 rounded-full">
              <img src={contact.profilePic || "/avatar.png"} alt={contact.fullName} />
            </div>
          </div>
          <h4 className="text-base-content font-medium truncate">{contact.fullName}</h4>
        </button>
      ))}
    </div>
  );
}
export default ContactList;
