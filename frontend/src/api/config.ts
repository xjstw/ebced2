import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://ebced2.onrender.com'; // Render'daki backend URL'i
  }
  return 'http://localhost:8000'; // Geliştirme ortamı için local URL
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
      const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      handleApiError(error);
    }
  },
  
  post: async (endpoint: string, data: any) => {
    try {
      const response = await fetch(`${getBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      handleApiError(error);
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