import api from './api.js';

const medicalServiceWorkflowService = {
  getQueue: (params, signal) => api.get('/services/queue', { params, signal }),
  getRequest: (id, signal) => api.get(`/services/requests/${id}`, { signal }),
  accept: (id) => api.post(`/services/requests/${id}/accept`),
  start: (id) => api.post(`/services/requests/${id}/start`),
  unable: (id, reason) => api.post(`/services/requests/${id}/unable`, { reason }),
  complete: (id, data) => api.post(`/services/requests/${id}/complete`, data),
  downloadAttachment: (id) => api.get(`/services/requests/${id}/attachment`, { responseType: 'blob' }),
};

export default medicalServiceWorkflowService;
