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

export const api = {
  get: async (endpoint: string) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  },
  
  post: async (endpoint: string, data: any) => {
    const response = await fetch(`${getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response;
  },
  
  put: (endpoint: string, data: any) => makeAuthenticatedRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  delete: (endpoint: string) => makeAuthenticatedRequest(endpoint, {
    method: 'DELETE',
  }),
}; 