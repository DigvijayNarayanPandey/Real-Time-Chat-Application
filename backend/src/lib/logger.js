const SENSITIVE_KEY_PATTERN = /password|token|secret|cookie|authorization|apikey|api_key/i;

/**
 * Recursively redacts sensitive fields before writing log metadata.
 */
function redactSensitiveData(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value !== "object") return value;
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
    };
  }
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveData(item, seen));
  }

  const sanitized = {};
  for (const [key, val] of Object.entries(value)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = redactSensitiveData(val, seen);
    }
  }
  return sanitized;
}

function formatDevLine(timestamp, level, message, safeMeta) {
  const time = timestamp.slice(11, 19);
  const tag = level.toUpperCase().padEnd(5, " ");
  if (!safeMeta || Object.keys(safeMeta).length === 0) {
    return `[${time}] ${tag} ${message}`;
  }
  return `[${time}] ${tag} ${message} ${JSON.stringify(safeMeta)}`;
}

function writeLog(level, message, meta = {}) {
  const env = process.env.NODE_ENV;
  if (env === "test" && level !== "error") {
    return;
  }

  const timestamp = new Date().toISOString();
  const hasMeta = Object.keys(meta).length > 0;
  const safeMeta = hasMeta ? redactSensitiveData(meta) : undefined;

  const output =
    env === "development"
      ? formatDevLine(timestamp, level, message, safeMeta)
      : JSON.stringify({
          timestamp,
          level,
          message,
          ...(safeMeta ? { meta: safeMeta } : {}),
        });

  if (level === "error") {
    console.error(output);
  } else if (level === "warn") {
    console.warn(output);
  } else {
    console.log(output);
  }
}

export const logger = {
  info: (message, meta) => writeLog("info", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  error: (message, meta) => writeLog("error", message, meta),
};
