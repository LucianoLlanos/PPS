import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Cambia el puerto si tu backend usa otro
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage on every request if present
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Error silencioso
  }
  return config;
});

export default api;
