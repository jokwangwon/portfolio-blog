import axios from "axios";
import { store } from "@shell/state/store";
import { setCredentials, clearCredentials } from "@shell/state/authSlice";
import type { AuthResponse, UserInfo } from "@/src/types/api";

const apiClient = axios.create({
  baseURL: "/api/portal",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: attach access token
apiClient.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto refresh on 401/403
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<AuthResponse>(
          "/api/portal/auth/refresh",
          null,
          { withCredentials: true }
        );

        const meResponse = await axios.get<UserInfo>("/api/portal/auth/me", {
          headers: { Authorization: `Bearer ${data.accessToken}` },
        });

        store.dispatch(
          setCredentials({
            accessToken: data.accessToken,
            user: {
              username: meResponse.data.username,
              role: meResponse.data.authorities[0] || "ROLE_USER",
            },
          })
        );

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(clearCredentials());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
