import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('armazem_token');
      sessionStorage.removeItem('armazem_token');
      if (window.location.pathname.startsWith('/app')) {
        toast.error('Sessão expirada. Por favor, faça login novamente.');
        setTimeout(() => (window.location.href = '/login'), 800);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
