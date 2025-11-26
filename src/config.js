// frontend/src/config.js

// Your Railway backend URL
const API_BASE = "https://dermadetect-backend-production.up.railway.app";

const join = (base, path) => {
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
};

export const API_ENDPOINTS = {
  SIGNUP: join(API_BASE, '/api/auth/signup'),
  LOGIN: join(API_BASE, '/api/auth/login'),
  
  PROFILE: join(API_BASE, '/api/user/profile'),
  HISTORY: join(API_BASE, '/api/user/history'),

  PREDICT: join(API_BASE, '/api/predict'),
  PERFORMANCE: join(API_BASE, '/api/performance'),

  LLM_ADVICE: join(API_BASE, '/api/llm/advice'),
  HEALTH: join(API_BASE, '/api/health'),
};

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

export const uploadImage = async (file, additionalData = {}) => {
  try {
    const formData = new FormData();
    formData.append('image', file);

    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

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
