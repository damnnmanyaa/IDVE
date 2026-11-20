import axios from "axios";

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, "");
const isDevelopment = import.meta.env.DEV;
const API_BASE_URL = configuredApiBaseUrl || (isDevelopment ? "http://localhost:8080" : "");
const API_BASE_CONFIGURED = Boolean(configuredApiBaseUrl) || isDevelopment;
const TOKEN_KEY = "token";

const apiUrl = (path) => {
  if (!API_BASE_CONFIGURED) {
    throw new Error("Backend URL is not configured. Set VITE_API_BASE_URL for this deployment.");
  }

  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    if (!API_BASE_CONFIGURED) {
      return Promise.reject(new Error("Backend URL is not configured. Set VITE_API_BASE_URL for this deployment."));
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isUnauthorizedHandlingInProgress = false;

const handleUnauthorized = () => {
  if (isUnauthorizedHandlingInProgress) return;

  isUnauthorizedHandlingInProgress = true;
  localStorage.removeItem(TOKEN_KEY);
  window.location.replace("/login");
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      handleUnauthorized();
    }

    return Promise.reject(error);
  }
);

export { api, apiUrl, API_BASE_URL, API_BASE_CONFIGURED };
export default api;
