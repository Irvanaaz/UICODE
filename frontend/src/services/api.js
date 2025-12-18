// Setup Axios: Agar Frontend bisa ngobrol sama Backend.

import axios from 'axios';

// 1. Buat instance Axios (alamat backend)
const api = axios.create({
  baseURL: 'http://127.0.0.1:8000', // Pastikan port backend benar (8000)
});

// 2. Interceptor: Otomatis selipkan Token di setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;