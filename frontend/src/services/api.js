import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 30000,
});

// Service callers receive the JSON payload directly.
api.interceptors.response.use((response) => response.data);

export default api;

