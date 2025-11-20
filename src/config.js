// frontend/src/config.js
// FIXED: Works with ngrok by using relative URLs

// Use relative paths so requests go to current origin (ngrok URL)
const API_BASE = '';

const join = (base, path) => {
  if (!base) return path.startsWith('/') ? path : `/${path}`;
  return `${base.replace(/\/+$/,'')}/${path.replace(/^\/+/, '')}`;
};

export const API_ENDPOINTS = {
  // Auth endpoints
  SIGNUP: join(API_BASE, '/api/auth/signup'),
  LOGIN: join(API_BASE, '/api/auth/login'),
  
  // User endpoints
  PROFILE: join(API_BASE, '/api/user/profile'),
  HISTORY: join(API_BASE, '/api/user/history'),

  // Prediction endpoint
  PREDICT: join(API_BASE, '/api/predict'),

  // Performance
  PERFORMANCE: join(API_BASE, '/api/performance'),

  // LLM endpoint
  LLM_ADVICE: join(API_BASE, '/api/llm/advice'),

  // Health check
  HEALTH: join(API_BASE, '/api/health'),
};

// Helper function for making API calls
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

// Helper for image uploads
export const uploadImage = async (file, additionalData = {}) => {
  try {
    const formData = new FormData();
    formData.append('image', file);
    
    // Add any additional form data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const response = await fetch(API_ENDPOINTS.PREDICT, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
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