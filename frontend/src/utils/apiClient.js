import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response error interceptor to prevent unhandled rejections
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
    });

    // Don't redirect on upload errors - let the component handle it
    if (error.config?.url?.includes("/upload")) {
      return Promise.reject(error);
    }

    // For auth errors on other endpoints, you could redirect
    if (error.response?.status === 401) {
      console.warn("Unauthorized - Token may be expired");
      // You could redirect to login here if needed
    }

    return Promise.reject(error);
  },
);

export default apiClient;
