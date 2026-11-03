import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: Attach session token
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

// Response interceptor: Handle 401 unauthorized
api.interceptors.response.use(
  (response) =>
    response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log(error)
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH API ====================
export const authApi = {
  login: async (credentials) => {
    // Normalizes username/email into `username` field expected by backend LoginRequest
    const payload = {
      username: (credentials.username || credentials.login || credentials.email || '').trim(),
      password: credentials.password,
    };
    const response = await api.post('/auth/login', payload);
    return response.data; // { token, user: { id, accountId, username, fullName, role, staffId, patientId } }
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data; // UserInfoResponse
  },
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

// ==================== PATIENT API ====================
export const patientApi = {
  checkUsername: async (username) => {
    const response = await api.get('/patients/check-username', { params: { username } });
    return response.data; // boolean
  },
  register: async (data) => {
    // data: { username, fullName, email, password, confirmPassword, agreeTerms: true }
    const response = await api.post('/patients/register', data);
    return response.data; // OtpView: { message, username, email, otpExpiresAt, resendAvailableAt }
  },
  sendOtp: async (email) => {
    const response = await api.post('/patients/send-otp', { email });
    return response.data;
  },
  resendOtp: async (email) => {
    const response = await api.post('/patients/send-otp', { email });
    return response.data;
  },
  verifyOtp: async (email, otp) => {
    const response = await api.post('/patients/verify-otp', { email, otp });
    return response.data; // VerifiedView: { message, username, email }
  },
  completeProfile: async (profileData) => {
    // profileData: { email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }
    const response = await api.post('/patients/complete-profile', profileData);
    return response.data; // ApiResponse<{ patientId, patientCode, fullName }>
  },
  getMyAppointments: async () => {
    const response = await api.get('/patient/appointments');
    return response.data;
  },
};

// ==================== APPOINTMENT API ====================
export const appointmentApi = {
  getAvailableSlots: async (date, doctorId) => {
    const response = await api.get('/appointments/available-slots', {
      params: { date, doctorId },
    });
    return response.data;
  },
  getDetail: async (id) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },
  cancel: async (id, reason) => {
    const response = await api.post(`/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  reschedule: async (id, newSlotId, reason) => {
    const payload = {
      newAppointmentSlotId: newSlotId,
      newSlotId: newSlotId,
      reason: reason || 'Đổi lịch hẹn qua cổng bệnh nhân',
    };
    const response = await api.put(`/appointments/${id}/reschedule`, payload);
    return response.data;
  },
  checkout: async (data, amount = 280000) => {
    const response = await api.post('/public/appointments/checkout', data, { params: { amount } });
    return response.data;
  },
  getTicket: async (id) => {
    const response = await api.get(`/public/appointments/${id}/ticket`);
    return response.data;
  },
};

// ==================== RECEPTIONIST API ====================
export const receptionApi = {
  listAppointments: async (params = {}) => {
    const response = await api.get('/reception/appointments', { params });
    return response.data;
  },
  getAppointmentDetail: async (id) => {
    const response = await api.get(`/reception/appointments/${id}`);
    return response.data;
  },
  getOptions: async (date) => {
    const response = await api.get('/reception/options', { params: { date } });
    return response.data;
  },
  createAppointment: async (data) => {
    const response = await api.post('/reception/appointments', data);
    return response.data;
  },
  checkIn: async (id) => {
    const response = await api.post(`/reception/appointments/${id}/check-in`);
    return response.data;
  },
  undoCheckIn: async (id) => {
    const response = await api.post(`/reception/appointments/${id}/undo-check-in`);
    return response.data;
  },
  cancelAppointment: async (id, reason) => {
    const response = await api.post(`/reception/appointments/${id}/cancel`, { reason });
    return response.data;
  },
  rescheduleAppointment: async (id, slotId) => {
    const response = await api.post(`/reception/appointments/${id}/reschedule`, { slotId });
    return response.data;
  },
  listPatients: async (params = {}) => {
    const response = await api.get('/reception/patients', { params });
    return response.data;
  },
  getPatientDetail: async (id) => {
    const response = await api.get(`/reception/patients/${id}`);
    return response.data;
  },
  createPatient: async (patientData) => {
    const response = await api.post('/reception/patients', patientData);
    return response.data;
  },
  updatePatient: async (id, patientData) => {
    const response = await api.put(`/reception/patients/${id}`, patientData);
    return response.data;
  },
  updatePatientStatus: async (id, status) => {
    const response = await api.put(`/reception/patients/${id}/status`, { status });
    return response.data;
  },
};

// ==================== DOCTOR API ====================
export const doctorApi = {
  getAppointments: async (params = {}) => {
    const response = await api.get('/doctor/appointments', { params });
    return response.data;
  },
};
