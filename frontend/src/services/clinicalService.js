import api from './api.js';

const clinicalService = {
  getEncounter: (id, signal) => api.get(`/doctor/encounters/${id}`, { signal }),
  getHistory: (id, signal) =>
    api.get(`/doctor/encounters/${id}/history`, { signal }),
  getServices: (signal) => api.get('/doctor/services', { signal }),
  saveExamination: (id, data) =>
    api.put(`/doctor/encounters/${id}/examination`, data),
  saveTreatment: (id, data) =>
    api.put(`/doctor/encounters/${id}/treatment`, data),
  createRequest: (id, data) =>
    api.post(`/doctor/encounters/${id}/requests`, data),
  updateRequest: (id, requestId, data) =>
    api.put(`/doctor/encounters/${id}/requests/${requestId}`, {
      medicalServiceId: data.medicalServiceId,
      priority: data.priority,
      clinicalIndication: data.clinicalIndication,
    }),
  cancelRequest: (id, requestId, data) =>
    api.post(`/doctor/encounters/${id}/requests/${requestId}/cancel`, data),
  reviewResult: (id, resultId, data) =>
    api.post(`/doctor/encounters/${id}/results/${resultId}/review`, data),
  completeEncounter: (id) => api.post(`/doctor/encounters/${id}/complete`),
  downloadAttachment: (id, requestId) =>
    api.get(`/doctor/encounters/${id}/requests/${requestId}/attachment`, {
      responseType: 'blob',
    }),
};

export default clinicalService;
