import { useState, useRef } from "react";
import { Settings } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useTheme } from "../hooks/useTheme";
import { readImageFileAsDataUrl } from "../lib/imageUpload";
import SettingsModal from "./SettingsModal";

function ProfileHeader() {
  const { authUser, logout, updateProfile, onlineUsers } = useAuthStore();
  const { isSoundEnabled, toggleSound } = useChatStore();
  const { theme, setTheme } = useTheme();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const fileInputRef = useRef(null);
  const isOnline = onlineUsers.includes(authUser?._id);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await readImageFileAsDataUrl(file);
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
      setSelectedImg(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="shrink-0 p-4 border-b border-base-content/10 bg-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`avatar shrink-0 ${isOnline ? "online" : "offline"}`}>
              <button
                type="button"
                className="w-12 h-12 rounded-full overflow-hidden relative group"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                aria-label="Change profile photo"
              >
                <img
                  src={selectedImg || authUser?.profilePic || "/avatar.png"}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <span className="text-white text-[10px] font-medium">Change</span>
                </div>
              </button>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-base-content truncate max-w-[160px]">
                {authUser?.fullName}
              </h3>
              <p className={`text-xs font-medium ${isOnline ? "text-success" : "text-base-content/50"}`}>
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
            aria-label="Open settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          theme={theme}
          setTheme={setTheme}
          authUser={authUser}
          isOnline={isOnline}
          isSoundEnabled={isSoundEnabled}
          toggleSound={toggleSound}
          logout={logout}
        />
      )}
    </>
  );
}
export default ProfileHeader;
