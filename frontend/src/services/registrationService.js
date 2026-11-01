import api from './api.js';

export const checkUsername = (username, options = {}) =>
  api.get('/auth/check-username', { params: { username }, ...options });

export const registerPatient = (values) => api.post('/auth/register', values);
export const resendRegistrationOtp = (email) =>
  api.post('/auth/send-otp', { email });
export const verifyRegistrationOtp = (email, otp) =>
  api.post('/auth/verify-otp', { email, otp });
