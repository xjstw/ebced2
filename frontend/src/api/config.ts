import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  // Vercel'de API endpoint'i
  const baseUrl = '/api';
  console.warn('API URL:', baseUrl);
  return baseUrl;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const headers = getAuthHeaders();
  
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Oturum süresi doldu. Lütfen tekrar giriş yapın.');
  }

  if (!response.ok) {
    throw new Error('İşlem sırasında bir hata oluştu');
  }

  return response;
};

// Hata yakalama ve işleme için yardımcı fonksiyon
const handleApiError = (error: any) => {
  console.error('API Error:', error);
  if (error.message === 'Failed to fetch') {
    throw new Error('Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.');
  }
  throw error;
};

export const api = {
  get: async (endpoint: string) => {
    try {
      const url = `${getBaseUrl()}${endpoint}`;
      console.warn('Making GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  post: async (endpoint: string, data: any) => {
    try {
      const url = `${getBaseUrl()}${endpoint}`;
      console.warn('Making POST request to:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  put: (endpoint: string, data: any) => api.post(endpoint, data),
  delete: (endpoint: string) => api.get(endpoint),
}; 