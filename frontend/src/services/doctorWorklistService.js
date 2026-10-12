import api from './api.js';

const doctorWorklistService = {
  listPatients: (params, { signal } = {}) => api.get('/doctor/patients', { params, signal }),
  startEncounter: (appointmentId) => api.post(`/doctor/appointments/${appointmentId}/start`),
};

export default doctorWorklistService;
