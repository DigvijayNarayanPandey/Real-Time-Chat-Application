const ALLOWED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const MAX_RAW_IMAGE_BYTES = 3.5 * 1024 * 1024; // Keeps base64 payload within 5MB server body limit

/**
 * Validates an image File and resolves with its base64 data URL.
 */
export function readImageFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file selected"));
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      reject(new Error("Please select a valid image file (PNG, JPEG, WEBP, or GIF)"));
      return;
    }

    if (file.size > MAX_RAW_IMAGE_BYTES) {
      reject(new Error("Image size must be under 3.5MB"));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read image file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read image file"));
    reader.readAsDataURL(file);
  });
}
