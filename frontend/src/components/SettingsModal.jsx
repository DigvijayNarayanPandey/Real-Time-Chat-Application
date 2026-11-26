import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  LogOutIcon,
  Volume2Icon,
  VolumeOffIcon,
  X,
  Camera,
  Trash2,
  User,
  Mail,
  CalendarDays,
  Wifi,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { readImageFileAsDataUrl } from "../lib/imageUpload";

let clickAudio = null;
function playMouseClick() {
  if (typeof Audio === "undefined") return;
  if (!clickAudio) {
    clickAudio = new Audio("/sounds/mouse-click.mp3");
  }
  clickAudio.currentTime = 0;
  clickAudio.play().catch(() => {});
}

const THEMES = [
  "light", "dark", "cupcake", "bumblebee", "emerald", "corporate",
  "synthwave", "retro", "cyberpunk", "valentine", "halloween",
  "garden", "forest", "aqua", "lofi", "pastel", "fantasy",
  "wireframe", "black", "luxury", "dracula", "cmyk", "autumn",
  "business", "acid", "lemonade", "night", "coffee", "winter",
  "dim", "nord", "sunset",
];

const SettingsModal = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  authUser,
  isOnline,
  isSoundEnabled,
  toggleSound,
  logout,
}) => {
  const { updateProfile } = useAuthStore();
  const fileInputRef = useRef(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const joinDate = authUser?.createdAt
    ? new Date(authUser.createdAt).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Recently";

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64Image = await readImageFileAsDataUrl(file);
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
      setSelectedImg(null);
      setConfirmDelete(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeletePhoto = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSelectedImg(null);
    setConfirmDelete(false);
    await updateProfile({ deletePic: true });
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="bg-base-200 border border-base-content/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-content/10 bg-base-300">
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            <h2 id="settings-modal-title" className="text-lg font-bold text-base-content">
              Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-base-content"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/30 bg-base-300 shadow-xl">
                <img
                  src={selectedImg || authUser?.profilePic || "/avatar.png"}
                  alt={authUser?.fullName || "User avatar"}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary btn-sm btn-circle shadow-md"
                  title="Upload new photo"
                  aria-label="Upload new photo"
                >
                  <Camera className="size-4" />
                </button>
                {authUser?.profilePic && (
                  <button
                    type="button"
                    onClick={handleDeletePhoto}
                    className="btn btn-error btn-sm btn-circle shadow-md"
                    title={confirmDelete ? "Click again to confirm deletion" : "Delete photo"}
                    aria-label={confirmDelete ? "Confirm delete photo" : "Delete photo"}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            {confirmDelete && (
              <div className="flex items-center gap-2 text-xs text-error">
                <span>Click trash again to confirm removal</span>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="link link-neutral"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
              Profile
            </h3>

            <div className="flex items-center gap-3 bg-base-300 rounded-xl px-4 py-3">
              <User className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-base-content/40 font-medium">Full Name</p>
                <p className="text-sm font-semibold text-base-content truncate">{authUser?.fullName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-base-300 rounded-xl px-4 py-3">
              <Mail className="size-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-base-content/40 font-medium">Email</p>
                <p className="text-sm font-semibold text-base-content truncate">{authUser?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-base-300 rounded-xl px-4 py-3">
              <CalendarDays className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-base-content/40 font-medium">Member Since</p>
                <p className="text-sm font-semibold text-base-content">{joinDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-base-300 rounded-xl px-4 py-3">
              <Wifi className="size-4 text-primary shrink-0" />
              <div>
                <p className="text-xs text-base-content/40 font-medium">Status</p>
                <p className={`text-sm font-semibold ${isOnline ? "text-success" : "text-base-content/50"}`}>
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>
          </div>

          <div className="divider my-0" />

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
              Appearance
            </h3>
            <label htmlFor="theme-selector" className="text-sm font-medium text-base-content block">
              Theme
            </label>
            <select
              id="theme-selector"
              className="select select-bordered w-full"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="divider my-0" />

          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/40">
              Preferences
            </h3>

            <div className="flex items-center justify-between bg-base-300 rounded-xl px-4 py-3">
              <span className="text-sm font-medium text-base-content">Sound Effects</span>
              <button
                type="button"
                onClick={() => {
                  playMouseClick();
                  toggleSound();
                }}
                className={`btn btn-sm btn-circle ${isSoundEnabled ? "btn-primary" : "btn-ghost"}`}
                title={isSoundEnabled ? "Disable sound" : "Enable sound"}
                aria-label={isSoundEnabled ? "Disable sound" : "Enable sound"}
              >
                {isSoundEnabled ? <Volume2Icon className="size-4" /> : <VolumeOffIcon className="size-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={logout}
              className="btn btn-error btn-outline w-full gap-2"
            >
              <LogOutIcon className="size-4" />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SettingsModal;
