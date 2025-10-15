// API utility functions for backend integration
const API_BASE = 'http://localhost:8000/api/chat';

// Generate or retrieve session ID
export const getSessionId = () => {
  let sessionId = sessionStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
};

// Get user ID (can be enhanced with real auth)
export const getUserId = () => {
  return localStorage.getItem('userId') || 'anonymous';
};

// Common headers for tracking
const getHeaders = (additionalHeaders = {}) => ({
  'Content-Type': 'application/json',
  'X-Session-Id': getSessionId(),
  'X-User-Id': getUserId(),
  ...additionalHeaders
});

// PDF Upload
export const uploadPdf = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);
  
  const response = await fetch(`${API_BASE}/pdf-upload`, {
    method: 'POST',
    headers: {
      'X-Session-Id': getSessionId(),
      'X-User-Id': getUserId(),
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }
  
  return response.json();
};

// Ask Question
export const askQuestion = async (query) => {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ query }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Query failed');
  }
  
  return response.json();
};

// Get Recommendations
export const getRecommendations = async (behavior, topN = 3) => {
  const response = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ behavior, topN }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Recommendation failed');
  }
  
  return response.json();
};

// Get Products
export const getProducts = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.category) params.append('category', filters.category);
  if (filters.minPrice) params.append('minPrice', filters.minPrice);
  if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
  if (filters.search) params.append('search', filters.search);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.skip) params.append('skip', filters.skip);
  
  const response = await fetch(`${API_BASE}/products?${params}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch products');
  }
  
  return response.json();
};

// Create Product
export const createProduct = async (product) => {
  const response = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(product),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create product');
  }
  
  return response.json();
};

// Get User Interactions
export const getUserInteractions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.sessionId) params.append('sessionId', filters.sessionId);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.type) params.append('type', filters.type);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.skip) params.append('skip', filters.skip);
  
  const response = await fetch(`${API_BASE}/interactions?${params}`, {
    headers: getHeaders(),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch interactions');
  }
  
  return response.json();
};
