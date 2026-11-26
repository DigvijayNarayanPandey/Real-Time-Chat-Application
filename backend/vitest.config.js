import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    env: {
      NODE_ENV: "test",
      MONGO_URI: "mongodb://localhost:27017/chat-app-test",
      JWT_SECRET: "test_jwt_secret_key_with_at_least_32_characters",
      JWT_REFRESH_SECRET: "test_jwt_refresh_secret_with_at_least_32_chars",
      CLIENT_URL: "http://localhost:5173",
    },
  },
});
