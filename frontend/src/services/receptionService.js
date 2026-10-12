import api from './api.js';

const receptionService = {
  listAppointments: (params, { signal } = {}) => api.get('/reception/appointments', { params, signal }),
  getAppointment: (id, { signal } = {}) => api.get(`/reception/appointments/${id}`, { signal }),
  getOptions: (date, { signal } = {}) => api.get('/reception/options', { params: { date }, signal }),
  searchPatients: (search, { signal } = {}) => api.get('/reception/patients', { params: { search }, signal }),
  createAppointment: (payload) => api.post('/reception/appointments', payload),
  checkIn: (id) => api.post(`/reception/appointments/${id}/check-in`),
  undoCheckIn: (id) => api.post(`/reception/appointments/${id}/undo-check-in`),
  cancelAppointment: (id, reason) => api.post(`/reception/appointments/${id}/cancel`, { reason }),
  rescheduleAppointment: (id, slotId) => api.post(`/reception/appointments/${id}/reschedule`, { slotId }),
};

export default receptionService;
