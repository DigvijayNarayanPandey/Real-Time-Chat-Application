import { describe, it, expect, vi } from "vitest";
import { createWelcomeEmailTemplate } from "../src/emails/emailTemplates.js";
import { createAuthRateLimiter } from "../src/middleware/authRateLimit.middleware.js";
import { AppError, errorHandler } from "../src/middleware/error.middleware.js";

describe("Security, Email Escaping & Rate Limiting", () => {
  it("escapes HTML in welcome email template and validates clientURL", () => {
    const html = createWelcomeEmailTemplate(
      '<script>alert("xss")</script>',
      "javascript:alert(1)"
    );

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
    expect(html).toContain('href="#"');
  });

  it("blocks requests exceeding auth rate limit and sets Retry-After", () => {
    const limiter = createAuthRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    const req = { ip: "10.0.0.1" };

    const makeRes = () => {
      const headers = {};
      return {
        headers,
        statusCode: 200,
        body: null,
        setHeader(k, v) {
          headers[k] = v;
        },
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          return this;
        },
      };
    };

    const next = vi.fn();
    limiter(req, makeRes(), next);
    limiter(req, makeRes(), next);
    expect(next).toHaveBeenCalledTimes(2);

    const blockedRes = makeRes();
    limiter(req, blockedRes, next);
    expect(blockedRes.statusCode).toBe(429);
    expect(blockedRes.headers["Retry-After"]).toBeDefined();
    expect(next).toHaveBeenCalledTimes(2);
  });

  it("hides internal error stack traces in centralized errorHandler", () => {
    const req = { method: "GET", originalUrl: "/api/test" };
    const res = {
      headersSent: false,
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    errorHandler(new Error("DB connection string secret leaked"), req, res, vi.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: "Internal server error" });

    errorHandler(new AppError("Bad request data", 400), req, res, vi.fn());
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Bad request data" });
  });
});
