// src/services/api.js
import axios from "axios";

// =========================================================
// 🚀 API URL Configuration
// =========================================================

// For Vite, use VITE_ prefix, with Railway backend as fallback
const API_URL = import.meta?.env?.VITE_API_URL || 'https://dermadetect-backend-production.up.railway.app';

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
// 🧠 LLM APIs
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
