// src/services/api.js
import axios from "axios";

// =========================================================
// 🚀 FORCE USE API URL ONLY FROM .env (backend base URL)
// =========================================================

// Prefer explicit env var, otherwise assume the same host serving the frontend
let API_URL = process.env.REACT_APP_API_URL || '';
// If an old hard-coded LAN IP or known legacy host is present in env, ignore it
if (API_URL && (API_URL.includes('192.168.54.') || API_URL.includes('backend.loca.lt'))) {
  console.warn('Ignoring legacy REACT_APP_API_URL:', API_URL);
  API_URL = '';
}

if (!API_URL) {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    // Prefer same-origin (protocol + host + port) so when the frontend is
    // served via a tunnel (https://...) the API calls go to the same origin.
    // Fall back to localhost:5000 for local development.
    try {
      const origin = window.location.origin;
      if (origin && !origin.includes('localhost')) {
        try {
          const u = new URL(origin);
          // If frontend is served from a different port (e.g. 8000), map to port 5002 on same host
          if (u.port && u.port !== '5000') {
            API_URL = `${u.protocol}//${u.hostname}:5000`;
          } else {
            API_URL = origin; // e.g. https://odd-mugs-rule.loca.lt
          }
        } catch (e) {
          API_URL = origin;
        }
      } else {
        API_URL = 'http://localhost:5000';
      }
    } catch (e) {
      API_URL = 'http://localhost:5000';
    }
  } else {
    API_URL = 'http://localhost:5000';
  }
}

console.log("🔗 USING API URL:", API_URL);
const api = axios.create({
  baseURL: API_URL,
});

// =========================================================
// 🔐 Attach token automatically
// =========================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// =========================================================
// ❗ Auto logout on 401
// =========================================================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// =========================================================
// 🔐 AUTH APIs
// =========================================================
export const authAPI = {
  // Backend mounts auth routes under /api/auth
  login: (email, password) => api.post("/api/auth/login", { email, password }),
  register: (userData) => api.post("/api/auth/register", userData),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// =========================================================
// 👤 USER APIs
// =========================================================
export const userAPI = {
  // Backend mounts user routes under /api/user
  getProfile: () => api.get("/api/user/profile"),
  updateProfile: (data) => api.put("/api/user/profile", data),
  getHistory: () => api.get("/api/user/history"),
};

// =========================================================
// 🔍 PREDICTION APIs
// =========================================================
export const predictionAPI = {
  predict: (formData) =>
    api.post("/api/predict", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getPrediction: (id) => api.get(`/api/predict/${id}`),
};

// =========================================================
// 🧠 LLM APIs (note: backend mounts these under /api/llm)
// =========================================================
export const llmAPI = {
  getAdvice: (disease, symptoms, id, severity = "moderate", duration = "") =>
    api.post("/api/llm/advice", {
      disease,
      symptoms,
      predictionId: id,
      severity,
      duration,
    }),
  checkHealth: () => api.get("/api/llm/health"),
  debug: () => api.get("/api/llm/debug"),
};

export default api;
