import express from "express";
import {
  signup,
  login,
  logout,
  updateProfile,
  refreshToken,
  checkAuth,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { authRateLimiter } from "../middleware/authRateLimit.middleware.js";
import {
  validateLogin,
  validateSignup,
  validateUpdateProfile,
} from "../middleware/validate.middleware.js";

const router = express.Router();

router.use(arcjetProtection);

router.post("/signup", authRateLimiter, validateSignup, signup);
router.post("/login", authRateLimiter, validateLogin, login);
router.post("/logout", logout);
router.post("/refresh", refreshToken);

router.put("/update-profile", protectRoute, validateUpdateProfile, updateProfile);
router.get("/check", protectRoute, checkAuth);

export default router;
