import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientApi } from '../../services/patientApi';
import { HospitalIcon, CheckCircleIcon, AlertCircleIcon, ArrowRightIcon } from '../../components/common/Icons';

export default function RegisterPage() {
  const navigate = useNavigate();

  // Wizard state: 1 = Step 1 Account Form, '1_otp' = Step 1 OTP Verification, 2 = Step 2 Demographics Form, 3 = Complete
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Step 1: Account Form Data
  const [accountData, setAccountData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountErrors, setAccountErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // OTP Verification State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Step 2: Patient Demographic Data
  const [profileData, setProfileData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Success result
  const [completedInfo, setCompletedInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Cooldown timer for OTP Resend
  useEffect(() => {
    let timer;
    if (currentStep === '1_otp' && resendCooldown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCooldown]);

  // Auto redirect countdown on Step 3
  useEffect(() => {
    let timer;
    if (currentStep === 3 && redirectCountdown > 0) {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (currentStep === 3 && redirectCountdown === 0) {
      navigate('/login', {
        state: {
          prefilledLogin: accountData.email,
          successMessage: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.',
        },
      });
    }
    return () => clearInterval(timer);
  }, [currentStep, redirectCountdown, navigate, accountData.email]);

  // Debounced Username availability check
  useEffect(() => {
    const rawUsername = accountData.username.trim();
    if (!rawUsername || !/^[A-Za-z0-9._-]{3,60}$/.test(rawUsername)) {
      setUsernameAvailable(null);
      return;
    }
    const handler = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const available = await patientApi.checkUsername(rawUsername);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [accountData.username]);

  // Handle Step 1 Input Change
  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (accountErrors[name]) {
      setAccountErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate Step 1 Form
  const validateStep1 = () => {
    const errors = {};
    const usernameRegex = /^[A-Za-z0-9._-]{3,60}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!accountData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    } else if (accountData.fullName.length > 150) {
      errors.fullName = 'Họ tên tối đa 150 ký tự.';
    }

    if (!accountData.username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (!usernameRegex.test(accountData.username)) {
      errors.username = 'Tên đăng nhập từ 3–60 ký tự, gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
    } else if (usernameAvailable === false) {
      errors.username = 'Tên đăng nhập đã được sử dụng.';
    }

    if (!accountData.email.trim()) {
      errors.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!emailRegex.test(accountData.email)) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    if (!accountData.password) {
      errors.password = 'Vui lòng nhập mật khẩu.';
    } else if (accountData.password.length < 8) {
      errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
    }

    if (!accountData.confirmPassword) {
      errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (accountData.password !== accountData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (!accountData.agreeTerms) {
      errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng của bệnh viện.';
    }

    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Step 1: Register Account & Dispatch OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateStep1()) return;

    setLoading(true);
    try {
      await patientApi.register({
        username: accountData.username.trim(),
        fullName: accountData.fullName.trim(),
        email: accountData.email.trim().toLowerCase(),
        password: accountData.password,
        confirmPassword: accountData.confirmPassword,
        agreeTerms: accountData.agreeTerms,
      });

      setResendCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setCurrentStep('1_otp');
      setGlobalSuccess(`Mã xác thực 6 chữ số đã được gửi tới ${accountData.email}`);
      // Pre-fill full name into Step 2
      setProfileData((prev) => ({
        ...prev,
        fullName: accountData.fullName.trim(),
      }));
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'USERNAME_IN_USE') {
        setAccountErrors((prev) => ({ ...prev, username: 'Tên đăng nhập đã được sử dụng.' }));
      } else if (resp?.code === 'EMAIL_IN_USE') {
        setAccountErrors((prev) => ({ ...prev, email: 'Email đã được sử dụng. Nếu bạn chưa hoàn tất, hãy gửi lại mã OTP.' }));
      } else if (resp?.fieldErrors) {
        setAccountErrors(resp.fieldErrors);
      } else {
        setGlobalError(resp?.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Handlers (6-box navigation & paste)
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    setOtpError('');

    // Focus next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpValues(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setOtpError('');
    setGlobalError('');
    try {
      await patientApi.resendOtp(accountData.email.trim().toLowerCase());
      setResendCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setGlobalSuccess('Mã OTP mới đã được gửi tới email của bạn.');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const resp = err.response?.data;
      setOtpError(resp?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Action
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setLoading(true);
    setOtpError('');
    try {
      await patientApi.verifyOtp(accountData.email.trim().toLowerCase(), otpCode);
      setGlobalSuccess('Xác thực OTP thành công! Vui lòng hoàn tất hồ sơ bệnh nhân.');
      setCurrentStep(2);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'OTP_EXPIRED') {
        setOtpError('Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã OTP".');
      } else if (resp?.code === 'OTP_ATTEMPTS_EXCEEDED') {
        setOtpError('Bạn đã nhập sai 5 lần. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.');
      } else {
        setOtpError(resp?.message || 'Mã OTP không đúng. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Input Handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Step 2 Form Validation
  const validateStep2 = () => {
    const errors = {};
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    const today = new Date().toISOString().split('T')[0];

    if (!profileData.fullName.trim()) {
      errors.fullName = 'Họ và tên bệnh nhân không được để trống.';
    } else if (profileData.fullName.length > 150) {
      errors.fullName = 'Họ tên tối đa 150 ký tự.';
    }

    if (!profileData.dateOfBirth) {
      errors.dateOfBirth = 'Vui lòng chọn ngày sinh.';
    } else if (profileData.dateOfBirth > today) {
      errors.dateOfBirth = 'Ngày sinh không được ở tương lai.';
    }

    if (!profileData.gender) {
      errors.gender = 'Vui lòng chọn giới tính.';
    }

    if (!profileData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (!phoneRegex.test(profileData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).';
    }

    if (!profileData.address.trim()) {
      errors.address = 'Vui lòng nhập địa chỉ.';
    } else if (profileData.address.trim().length < 5) {
      errors.address = 'Địa chỉ tối thiểu 5 ký tự.';
    } else if (profileData.address.length > 500) {
      errors.address = 'Địa chỉ tối đa 500 ký tự.';
    }

    if (profileData.emergencyContactPhone && profileData.emergencyContactPhone.trim()) {
      if (!phoneRegex.test(profileData.emergencyContactPhone.trim())) {
        errors.emergencyContactPhone = 'Số điện thoại người liên hệ khẩn cấp không hợp lệ.';
      }
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Step 2: Complete Profile
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await patientApi.completeProfile({
        email: accountData.email.trim().toLowerCase(),
        fullName: profileData.fullName.trim(),
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        phone: profileData.phone.trim(),
        address: profileData.address.trim(),
        emergencyContactName: profileData.emergencyContactName.trim() || null,
        emergencyContactPhone: profileData.emergencyContactPhone.trim() || null,
      });

      setCompletedInfo(res.data);
      setCurrentStep(3);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'PROFILE_ALREADY_COMPLETED') {
        setGlobalError('Hồ sơ bệnh nhân đã được hoàn tất trước đó.');
      } else if (resp?.code === 'OTP_NOT_VERIFIED') {
        setGlobalError('Email chưa được xác thực OTP. Vui lòng quay lại xác thực.');
      } else if (resp?.fieldErrors) {
        setProfileErrors(resp.fieldErrors);
      } else {
        setGlobalError(resp?.message || 'Không thể hoàn tất hồ sơ. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Hospital Branding Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 mb-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
              <HospitalIcon className="w-7 h-7" />
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">Bệnh viện Đa khoa Quốc tế</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản bệnh nhân</h1>
          <p className="text-slate-600 text-sm mt-1">Đăng ký nhanh chóng trong 2 bước với xác thực email an toàn</p>
        </div>

        {/* 2-Step Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: currentStep === 1 || currentStep === '1_otp' ? '50%' : '100%',
                }}
              />
            </div>

            {/* Step 1 Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  currentStep === 2 || currentStep === 3
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                    : 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                }`}
              >
                {currentStep === 2 || currentStep === 3 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 mt-2">Tài khoản & Xác thực OTP</span>
            </div>

            {/* Step 2 Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  currentStep === 3
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                    : currentStep === 2
                    ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                {currentStep === 3 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '2'
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 mt-2">Hồ sơ bệnh nhân</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {globalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>{globalError}</div>
          </div>
        )}

        {globalSuccess && currentStep !== 3 && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>{globalSuccess}</div>
          </div>
        )}

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* ========================================================================= */}
          {/* STEP 1A: ACCOUNT REGISTRATION FORM                                        */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="p-6 sm:p-8 space-y-5">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Bước 1: Thiết lập thông tin tài khoản</h2>
                <p className="text-xs text-slate-500 mt-1">Thông tin đăng nhập dùng để truy cập hệ thống và đặt lịch khám.</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={accountData.fullName}
                  onChange={handleAccountChange}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                    accountErrors.fullName
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {accountErrors.fullName && <p className="text-xs text-red-600 mt-1">{accountErrors.fullName}</p>}
              </div>

              {/* Username with Availability Indicator */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={accountData.username}
                    onChange={handleAccountChange}
                    placeholder="3–60 ký tự, ví dụ: nguyenvanan"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.username
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : usernameAvailable === true
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingUsername && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <AlertCircleIcon className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {accountErrors.username ? (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.username}</p>
                ) : usernameAvailable === true ? (
                  <p className="text-xs text-emerald-600 mt-1">Tên đăng nhập khả dụng.</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Gồm chữ cái, chữ số, dấu chấm, gạch dưới hoặc gạch ngang.</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountChange}
                  placeholder="an.nguyen@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                    accountErrors.email
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {accountErrors.email ? (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.email}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Mã xác thực OTP sẽ được gửi tới email này qua SMTP.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={accountData.password}
                    onChange={handleAccountChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.password
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {accountErrors.password && <p className="text-xs text-red-600 mt-1">{accountErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={accountData.confirmPassword}
                    onChange={handleAccountChange}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {accountErrors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.confirmPassword}</p>
                )}
              </div>

              {/* Agree to terms */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={accountData.agreeTerms}
                    onChange={handleAccountChange}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Điều khoản sử dụng
                    </a>{' '}
                    và{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Chính sách bảo mật
                    </a>{' '}
                    của Bệnh viện Đa khoa Quốc tế.
                  </span>
                </label>
                {accountErrors.agreeTerms && (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.agreeTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xử lý & gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục & Nhận mã OTP qua Email</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Đăng nhập tại đây
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 1B: OTP VERIFICATION MODAL / SUB-STEP                                 */}
          {/* ========================================================================= */}
          {currentStep === '1_otp' && (
            <form onSubmit={handleVerifyOtp} className="p-6 sm:p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Xác thực mã OTP qua Email</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Mã xác thực gồm 6 chữ số đã được gửi đến: <br />
                  <span className="font-semibold text-slate-900">{accountData.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  Đổi email hoặc sửa thông tin
                </button>
              </div>

              {/* 6 Individual OTP Boxes */}
              <div>
                <label className="block text-center text-xs font-medium text-slate-700 mb-3">
                  Nhập mã 6 chữ số
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition ${
                        otpError
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  ))}
                </div>
                {otpError && <p className="text-xs text-red-600 text-center mt-2.5 font-medium">{otpError}</p>}
                <p className="text-[11px] text-slate-400 text-center mt-2">Mã xác thực có hiệu lực trong vòng 5 phút</p>
              </div>

              {/* Verify Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || otpValues.join('').length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực OTP...</span>
                    </>
                  ) : (
                    <span>Xác thực OTP & Chuyển sang Bước 2</span>
                  )}
                </button>
              </div>

              {/* Resend Cooldown Section */}
              <div className="text-center pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Chưa nhận được mã?{' '}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      Gửi lại mã OTP
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Gửi lại mã sau ({String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:
                      {String(resendCooldown % 60).padStart(2, '0')})
                    </span>
                  )}
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PATIENT DEMOGRAPHICS FORM                                          */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
                  <CheckCircleIcon className="w-4 h-4" />
                  Tài khoản đã kích hoạt ({accountData.email})
                </div>
                <h2 className="text-lg font-bold text-slate-800">Bước 2: Hoàn tất hồ sơ bệnh nhân</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng điền thông tin để phục vụ lập hồ sơ y tế và tiếp đón khám bệnh.
                </p>
              </div>

              {/* SECTION 1: REQUIRED PERSONAL DEMOGRAPHICS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>1. Thông tin cá nhân của bạn</span>
                  </h3>
                  <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    * Bắt buộc
                  </span>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Họ và tên bệnh nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.fullName
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.fullName && <p className="text-xs text-red-600 mt-1">{profileErrors.fullName}</p>}
                </div>

                {/* Ngày sinh & Giới tính */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      max={new Date().toISOString().split('T')[0]}
                      value={profileData.dateOfBirth}
                      onChange={handleProfileChange}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                        profileErrors.dateOfBirth
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {profileErrors.dateOfBirth && (
                      <p className="text-xs text-red-600 mt-1">{profileErrors.dateOfBirth}</p>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Ví dụ: 0901234567"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.phone
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.phone ? (
                    <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">10–11 số, bắt đầu bằng 0 hoặc +84</p>
                  )}
                </div>

                {/* Email (Read-only from Step 1) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email liên hệ (Đã xác thực OTP)
                  </label>
                  <input
                    type="email"
                    value={accountData.email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Địa chỉ liên hệ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.address
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.address && <p className="text-xs text-red-600 mt-1">{profileErrors.address}</p>}
                </div>
              </div>

              {/* SECTION 2: OPTIONAL GUARDIAN / EMERGENCY CONTACT */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    2. Người liên hệ khẩn cấp / Người giám hộ
                  </h3>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Thông tin người thân để bệnh viện liên lạc khi cần thiết (không bắt buộc).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Họ tên người liên hệ khẩn cấp
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={profileData.emergencyContactName}
                      onChange={handleProfileChange}
                      placeholder="Ví dụ: Nguyễn Thị Bình"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Số điện thoại người liên hệ
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={profileData.emergencyContactPhone}
                      onChange={handleProfileChange}
                      placeholder="Ví dụ: 0909888777"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                        profileErrors.emergencyContactPhone
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {profileErrors.emergencyContactPhone && (
                      <p className="text-xs text-red-600 mt-1">{profileErrors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Profile Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu hồ sơ bệnh nhân...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      <span>Hoàn tất đăng ký</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUCCESS & REDIRECT SCREEN                                         */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="p-8 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircleIcon className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Đăng ký thành công!</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Chúc mừng bệnh nhân <span className="font-semibold text-slate-900">{completedInfo?.fullName}</span>. Hồ sơ y tế của bạn đã được khởi tạo thành công trên hệ thống.
                </p>
              </div>

              {/* Patient Code Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Mã bệnh nhân của bạn</div>
                <div className="text-xl font-mono font-bold text-blue-700 mt-1 select-all">
                  {completedInfo?.patientCode || 'PT-REGISTERED'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Vui lòng lưu lại mã này hoặc xuất trình số điện thoại khi đến quầy tiếp đón.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate('/login', {
                      state: {
                        prefilledLogin: accountData.email,
                        successMessage: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.',
                      },
                    })
                  }
                  className="w-full max-w-md mx-auto py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập ngay</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
                <p className="text-xs text-slate-400 mt-3">
                  Tự động chuyển hướng sau <span className="font-semibold text-slate-700">{redirectCountdown}s</span>...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
