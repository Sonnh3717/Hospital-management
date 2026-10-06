import api from './api.js';

const systemService = {
  getHealth: () => api.get('/health'),
};

export default systemService;

