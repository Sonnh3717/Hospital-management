import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  HospitalIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  ArrowRightIcon,
  SparklesIcon,
} from '../../components/common/Icons';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // Dual credential state: maps to backend "username"
  const [loginIdentifier, setLoginIdentifier] = useState(
    location.state?.prefilledLogin || ''
  );
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  );
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Quick fill helper for Showcase demonstration
  const handleDemoFill = (identifier, demoPassword) => {
    setLoginIdentifier(identifier);
    setPassword(demoPassword);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const identifier = loginIdentifier.trim();
    if (!identifier) {
      setErrorMessage('Vui lòng nhập Email hoặc Tên đăng nhập');
      return;
    }
    if (!password) {
      setErrorMessage('Vui lòng nhập Mật khẩu');
      return;
    }

    try {
      setLoading(true);

      // AuthContext.login sends { username: identifier, password } to POST /api/auth/login
      // Backend automatically checks username or email via UserAccountRepository.findForLogin
      const user = await login({
        username: identifier,
        password: password,
      });

      // Determine redirect path by role
      let redirectPath = '/patient';
      if (user?.role === 'PATIENT') {
        redirectPath = '/patient';
      } else if (user?.role === 'RECEPTIONIST') {
        redirectPath = '/reception';
      } else if (user?.role === 'DOCTOR') {
        redirectPath = '/doctor';
      } else if (user?.role === 'ADMIN') {
        redirectPath = '/reception';
      }

      // Check if user was navigated here from a protected route
      const destination = location.state?.from?.pathname || redirectPath;
      navigate(destination, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.response?.status === 401) {
        setErrorMessage('Tên đăng nhập hoặc mật khẩu không chính xác');
      } else if (err.response?.status === 403) {
        setErrorMessage('Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt');
      } else {
        setErrorMessage('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-sky-500 selection:text-white">
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-100/50 via-teal-50/30 to-transparent pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-sky-600/25 group-hover:scale-105 transition-transform">
              <HospitalIcon className="w-8 h-8" />
            </div>
          </Link>
          <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
            Đăng nhập hệ thống
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Cổng thông tin y tế Bệnh viện Đa khoa Quốc tế
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl border border-slate-200/80 sm:px-10">
          {/* Success Banner if prefilled */}
          {successMessage && (
            <div
              className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium"
              role="alert"
            >
              {successMessage}
            </div>
          )}

          {/* Error Alert Display */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-800 text-sm"
              role="alert"
            >
              <AlertCircleIcon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage('')}
                className="text-rose-400 hover:text-rose-600"
              >
                ✕
              </button>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Dual Credential Input: Email hoặc Tên đăng nhập */}
            <div>
              <label htmlFor="loginIdentifier" className="block text-sm font-bold text-slate-700 mb-1.5">
                Email hoặc Tên đăng nhập
              </label>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="loginIdentifier"
                  name="loginIdentifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="patient hoặc patient@hospital.vn"
                  className="block w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-5 h-5" />
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Hỗ trợ đăng nhập bằng tài khoản hoặc địa chỉ email đã đăng ký.
              </p>
            </div>

            {/* Password Input with Show/Hide Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Mật khẩu
                </label>
                {/* Quên mật khẩu link with href="#" as required by R3 */}
                <a
                  href="#"
                  id="link-forgot-password"
                  onClick={(e) => {
                    e.preventDefault();
                    setForgotModalOpen(true);
                  }}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu của bạn"
                  className="block w-full px-4 py-3 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                id="btn-login-submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Helper for Showcase / Grading */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Tài khoản kiểm thử nhanh (Demo)
              </span>
              <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDemoFill('patient', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 transition-colors"
              >
                Bệnh nhân
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('receptionist', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                Lễ tân
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('doctor', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors"
              >
                Bác sĩ
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link
                to="/register"
                id="link-go-to-register"
                className="font-bold text-sky-600 hover:text-sky-700 hover:underline"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="mt-6 text-center">
          <Link to="/" className="text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors">
            ← Quay lại Trang chủ Bệnh viện
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal (Friendly notification for R3 href="#") */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircleIcon className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Khôi phục mật khẩu</h3>
              <p className="text-sm text-slate-600 mt-2">
                Để đảm bảo an toàn thông tin hồ sơ bệnh án, vui lòng mang CMND/CCCD đến trực tiếp <strong>Quầy Tiếp Đón (Tầng 1)</strong> hoặc liên hệ hotline <strong className="text-sky-600">1900 6868</strong> để được cấp lại mật khẩu.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition-colors"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
