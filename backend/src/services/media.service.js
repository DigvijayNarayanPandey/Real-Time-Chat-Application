import cloudinary from "../lib/cloudinary.js";
import { AppError } from "../middleware/error.middleware.js";
import { logger } from "../lib/logger.js";

export const mediaService = {
  async uploadImage(dataUri, folder = "chat-app") {
    try {
      const uploadResponse = await cloudinary.uploader.upload(dataUri, {
        folder,
        resource_type: "image",
      });
      return uploadResponse.secure_url;
    } catch (error) {
      logger.error("Cloudinary image upload failed", { error, folder });
      throw new AppError("Failed to upload image", 502);
    }
  },
};
