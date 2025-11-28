// frontend/src/config.js

// Railway backend for auth, history, llm etc.
const API_BASE = "https://dermadetect-backend-production.up.railway.app";

// HuggingFace backend for ML predictions
const HF_PREDICT = "https://vasavi07-dermadetect-ml-model.hf.space";

const join = (base, path) => {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

export const API_ENDPOINTS = {
  // Auth
  SIGNUP: join(API_BASE, '/api/auth/register'),
  LOGIN: join(API_BASE, '/api/auth/login'),

  // Users
  PROFILE: join(API_BASE, '/api/user/profile'),
  HISTORY: join(API_BASE, '/api/user/history'),

  // PREDICTION (coming from HuggingFace)
  PREDICT: join(HF_PREDICT, '/api/predict'),

  // Misc endpoints
  PERFORMANCE: join(API_BASE, '/api/performance'),
  LLM_ADVICE: join(API_BASE, '/api/llm/advice'),

  // HEALTH check for ML
  HEALTH: join(HF_PREDICT, '/api/health'),
};

// Generic API call (JSON)
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(endpoint, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Image Upload / Prediction
export const uploadImage = async (file, additionalData = {}) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    // Add extra fields from form if any
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    // IMPORTANT: Use HuggingFace for prediction
    const response = await fetch(API_ENDPOINTS.PREDICT, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Image upload failed:', error);
    throw error;
  }
};

export default API_BASE;
