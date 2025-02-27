import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  // Environment variables'ı logla
  console.log('VITE_API_URL:', process.env.VITE_API_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  // Önce VITE_API_URL'i kontrol et
  if (process.env.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  
  // Fallback olarak NODE_ENV'e göre URL belirle
  if (process.env.NODE_ENV === 'production') {
    return 'https://ebced2.onrender.com';
  }
  
  return 'http://localhost:8000';
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
      // API URL'ini logla
      const url = `${getBaseUrl()}${endpoint}`;
      console.log('Making GET request to:', url);
      
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
      // API URL'ini logla
      const url = `${getBaseUrl()}${endpoint}`;
      console.log('Making POST request to:', url, 'with data:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },
  
  put: (endpoint: string, data: any) => makeAuthenticatedRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (endpoint: string) => makeAuthenticatedRequest(endpoint, {
    method: 'DELETE',
  }),
}; 