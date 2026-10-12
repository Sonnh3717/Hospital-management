import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081/api',
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('swd.session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (cause) => {
    if (axios.isCancel(cause)) return Promise.reject(cause);
    let payload = cause.response?.data;
    if (payload instanceof Blob) {
      try {
        payload = JSON.parse(await payload.text());
      } catch {
        payload = null;
      }
    }
    const error = new Error(
      payload?.message ||
        (cause.response
          ? 'Không thể thực hiện thao tác. Vui lòng thử lại.'
          : 'Không kết nối được máy chủ. Vui lòng kiểm tra kết nối và thử lại.'),
    );
    error.status = cause.response?.status;
    error.code = payload?.code || 'CONNECTION_ERROR';
    error.fieldErrors = payload?.fieldErrors || {};
    error.blockers = payload?.blockers || [];
    if (error.status === 401 && !cause.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('swd-session-expired'));
    }
    return Promise.reject(error);
  },
);

export default api;
