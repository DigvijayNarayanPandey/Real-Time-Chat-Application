import { asyncHandler } from "../middleware/error.middleware.js";
import {
  clearAuthCookies,
  sanitizeUser,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "../lib/utils.js";
import { authService } from "../services/auth.service.js";

export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.signup({
    fullName,
    email,
    password,
  });

  setAccessTokenCookie(accessToken, res);
  setRefreshTokenCookie(refreshToken, res);

  res.status(201).json(user);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  setAccessTokenCookie(accessToken, res);
  setRefreshTokenCookie(refreshToken, res);

  res.status(200).json(user);
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout({
    accessToken: req.cookies?.jwt,
    refreshToken: req.cookies?.refreshToken,
  });

  clearAuthCookies(res);
  res.status(200).json({ message: "Logged out successfully" });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { profilePic, deletePic } = req.body;
  const updatedUser = await authService.updateProfile(req.user._id, {
    profilePic,
    deletePic,
  });

  res.status(200).json(updatedUser);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken;
  const { user, accessToken, refreshToken: newRefreshToken } =
    await authService.refreshSession(incomingRefreshToken);

  setAccessTokenCookie(accessToken, res);
  setRefreshTokenCookie(newRefreshToken, res);

  res.status(200).json(user);
});

export const checkAuth = (req, res) => {
  res.status(200).json(sanitizeUser(req.user));
};
