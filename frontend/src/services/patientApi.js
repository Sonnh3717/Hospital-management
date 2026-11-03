import api from './api';

export const patientApi = {
  // Check if username is available (returns boolean)
  checkUsername: async (username) => {
    const res = await api.get('/patients/check-username', { params: { username } });
    return res.data;
  },

  // Step 1: Register account & trigger real SMTP OTP dispatch
  register: async (payload) => {
    // payload: { username, fullName, email, password, confirmPassword, agreeTerms: true }
    const res = await api.post('/patients/register', payload);
    return res.data; // OtpView: { message, username, email, otpExpiresAt, resendAvailableAt }
  },

  // Send OTP
  sendOtp: async (email) => {
    const res = await api.post('/patients/send-otp', { email });
    return res.data;
  },

  // Resend OTP alias
  resendOtp: async (email) => {
    const res = await api.post('/patients/send-otp', { email });
    return res.data;
  },

  // Verify 6-digit OTP
  verifyOtp: async (email, otp) => {
    const res = await api.post('/patients/verify-otp', { email, otp });
    return res.data; // VerifiedView: { message, username, email }
  },

  // Step 2: Complete patient demographic profile
  completeProfile: async (payload) => {
    // payload: { email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }
    const res = await api.post('/patients/complete-profile', payload);
    return res.data; // ApiResponse<CompletedProfileView>: { code: 200, success: true, data: { patientId, patientCode, fullName } }
  },

  // Patient appointments
  getMyAppointments: async () => {
    const res = await api.get('/patient/appointments');
    return res.data;
  },
};

export default patientApi;
