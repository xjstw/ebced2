import { useAuth } from '../context/AuthContext';

const getBaseUrl = () => {
  // Environment variables'ı logla
  const apiUrl = __VITE_API_URL__ || (__MODE__ === 'production' ? 'https://ebced2.onrender.com' : 'http://localhost:8000');
  console.log('Current API URL:', apiUrl);
  console.log('Environment Mode:', __MODE__);
  return apiUrl;
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
      console.log('Making GET request to:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
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
      console.log('Making POST request to:', url);
      console.log('Request data:', data);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response;
    } catch (error) {
      console.error('API Error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Sunucuya bağlanılamadı. API endpoint\'in erişilebilir olduğundan emin olun.');
      }
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