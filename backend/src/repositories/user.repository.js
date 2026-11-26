import User from "../models/User.js";

const SAFE_USER_FIELDS = "-password -refreshToken";
const DEFAULT_PAGE_LIMIT = 100;
const MAX_PAGE_LIMIT = 200;

function normalizeLimit(limit) {
  if (!limit) return null;
  const parsed = Number(limit);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_LIMIT;
  return Math.min(Math.floor(parsed), MAX_PAGE_LIMIT);
}

export const userRepository = {
  findByEmail(email, { includePassword = false } = {}) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select("+password");
    }
    return query;
  },

  findById(userId, { includeRefreshToken = false } = {}) {
    const query = User.findById(userId);
    if (includeRefreshToken) {
      query.select("+refreshToken");
    } else {
      query.select(SAFE_USER_FIELDS);
    }
    return query;
  },

  existsById(userId) {
    return User.exists({ _id: userId });
  },

  async createUser({ fullName, email, password }) {
    const user = new User({ fullName, email, password });
    return await user.save();
  },

  updateRefreshToken(userId, refreshToken) {
    return User.findByIdAndUpdate(userId, { refreshToken }, { new: true });
  },

  updateProfilePic(userId, profilePic) {
    return User.findByIdAndUpdate(
      userId,
      { profilePic },
      { new: true }
    ).select(SAFE_USER_FIELDS);
  },

  findAllExcept(excludeUserId, { page, limit } = {}) {
    const query = User.find({ _id: { $ne: excludeUserId } })
      .select(SAFE_USER_FIELDS)
      .sort({ fullName: 1 });

    const safeLimit = normalizeLimit(limit);
    if (safeLimit) {
      const safePage = Math.max(1, Number(page) || 1);
      query.skip((safePage - 1) * safeLimit).limit(safeLimit);
    }

    return query;
  },

  findByIds(userIds) {
    return User.find({ _id: { $in: userIds } }).select(SAFE_USER_FIELDS);
  },
};
