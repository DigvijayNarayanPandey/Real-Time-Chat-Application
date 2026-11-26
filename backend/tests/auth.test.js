import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

vi.mock("../src/emails/emailHandlers.js", () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/lib/cloudinary.js", () => ({
  default: {
    uploader: {
      upload: vi.fn().mockResolvedValue({ secure_url: "https://cdn.example.com/avatar.png" }),
    },
  },
}));

import { app } from "../src/server.js";
import User from "../src/models/User.js";
import { userRepository } from "../src/repositories/user.repository.js";
import { generateAccessToken, generateRefreshToken } from "../src/lib/utils.js";

describe("Auth API Integration & Security", () => {
  const userId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects NoSQL injection object payloads on login with 400", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: { $ne: null }, password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Email and password are required");
  });

  it("validates signup input fields and password length", async () => {
    const res = await request(app).post("/api/auth/signup").send({
      fullName: "Alice",
      email: "not-an-email",
      password: "short",
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe("Password must be at least 8 characters");
  });

  it("creates user on signup, sets httpOnly cookies, and omits password/refreshToken", async () => {
    vi.spyOn(userRepository, "findByEmail").mockResolvedValue(null);
    vi.spyOn(userRepository, "createUser").mockResolvedValue({
      _id: userId,
      fullName: "Alice Smith",
      email: "alice@example.com",
      password: "hashed_password",
      profilePic: "",
      refreshToken: "hashed_refresh",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.spyOn(userRepository, "updateRefreshToken").mockResolvedValue({});

    const res = await request(app).post("/api/auth/signup").send({
      fullName: "  Alice Smith  ",
      email: "ALICE@EXAMPLE.COM",
      password: "Password123!",
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      fullName: "Alice Smith",
      email: "alice@example.com",
      profilePic: "",
    });
    expect(res.body.password).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();

    const setCookieHeader = res.headers["set-cookie"] || [];
    expect(setCookieHeader.some((c) => c.startsWith("jwt="))).toBe(true);
    expect(setCookieHeader.some((c) => c.startsWith("refreshToken="))).toBe(true);
  });

  it("returns 401 instead of 500 when access token is expired", async () => {
    const expiredToken = jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, {
      expiresIn: "-1s",
    });

    const res = await request(app)
      .get("/api/auth/check")
      .set("Cookie", [`jwt=${expiredToken}`]);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized - Token expired");
  });

  it("omits password and refreshToken on PUT /api/auth/update-profile", async () => {
    const token = generateAccessToken(userId.toString());

    vi.spyOn(User, "findById").mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: userId,
        fullName: "Alice Smith",
        email: "alice@example.com",
        profilePic: "",
      }),
    });

    vi.spyOn(userRepository, "updateProfilePic").mockResolvedValue({
      _id: userId,
      fullName: "Alice Smith",
      email: "alice@example.com",
      password: "$2a$12$shouldneverleak",
      refreshToken: "$2a$12$shouldneverleak",
      profilePic: "https://cdn.example.com/avatar.png",
    });

    const res = await request(app)
      .put("/api/auth/update-profile")
      .set("Cookie", [`jwt=${token}`])
      .send({
        profilePic: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
      });

    expect(res.status).toBe(200);
    expect(res.body.profilePic).toBe("https://cdn.example.com/avatar.png");
    expect(res.body.password).toBeUndefined();
    expect(res.body.refreshToken).toBeUndefined();
  });

  it("rotates refresh token on POST /api/auth/refresh and clears token on logout", async () => {
    const refresh = generateRefreshToken(userId.toString());
    const hashed = await bcrypt.hash(refresh, 4);

    vi.spyOn(userRepository, "findById").mockResolvedValue({
      _id: userId,
      fullName: "Alice Smith",
      email: "alice@example.com",
      profilePic: "",
      refreshToken: hashed,
    });
    const updateRefreshSpy = vi
      .spyOn(userRepository, "updateRefreshToken")
      .mockResolvedValue({});

    const refreshRes = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refreshToken=${refresh}`]);

    expect(refreshRes.status).toBe(200);
    expect(updateRefreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshRes.body.refreshToken).toBeUndefined();

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refreshToken=${refresh}`]);

    expect(logoutRes.status).toBe(200);
    expect(updateRefreshSpy).toHaveBeenLastCalledWith(userId.toString(), null);
  });
});
