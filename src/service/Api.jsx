
import axios from 'axios';

const API_URL = import.meta.env.VITE_SPRING_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      window.dispatchEvent(new Event('app:logout'));
    }
    return Promise.reject(error);
  }
);


export default api;
