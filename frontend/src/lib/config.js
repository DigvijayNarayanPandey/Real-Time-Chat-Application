const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

function resolveEndpoints(baseUrl) {
  if (!baseUrl) {
    return {
      apiBaseUrl: "/api",
      socketBaseUrl: "/",
    };
  }

  if (baseUrl.endsWith("/api")) {
    return {
      apiBaseUrl: baseUrl,
      socketBaseUrl: baseUrl.slice(0, -4) || "/",
    };
  }

  return {
    apiBaseUrl: `${baseUrl}/api`,
    socketBaseUrl: baseUrl,
  };
}

export const { apiBaseUrl: API_BASE_URL, socketBaseUrl: SOCKET_BASE_URL } =
  resolveEndpoints(rawApiUrl);
