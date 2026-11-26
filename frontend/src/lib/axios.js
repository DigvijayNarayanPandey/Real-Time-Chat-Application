import axios from "axios";
import { API_BASE_URL } from "./config";

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000,
});

const AUTH_NO_REFRESH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh", "/auth/logout"];

let refreshPromise = null;

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";

    const shouldSkipRefresh =
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      AUTH_NO_REFRESH_PATHS.some((path) => requestUrl.includes(path));

    if (shouldSkipRefresh) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axiosInstance.post("/auth/refresh").finally(() => {
          refreshPromise = null;
        });
      }

      await refreshPromise;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);
