import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';
import {
  HospitalIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ClockIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '../components/common/Icons';

export default function MainLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // HomePage (R1) implements its own dedicated sticky topbar and comprehensive footer
  if (location.pathname === '/' || location.pathname === '') {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* ---------------------------------------------------- */}
      {/* TOPBAR NAVIGATION */}
      {/* ---------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Hospital Logo & Brand Name */}
            <Link to="/" className="flex items-center gap-3.5 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <HospitalIcon className="w-7 h-7" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
                  Bệnh viện Đa khoa Quốc tế
                </span>
                <span className="text-xs font-medium text-slate-500 tracking-wider uppercase">
                  Hệ thống y tế chất lượng cao
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Trang chủ
              </Link>
              <a href="/#about" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Giới thiệu
              </a>
              <a href="/#departments" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Chuyên khoa
              </a>
              <a href="/#services" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Dịch vụ
              </a>
              <a href="/#workflow" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Quy trình
              </a>
              <a href="/#contact" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Liên hệ
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to={getRoleDashboardPath(user.role)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 font-semibold text-sm border border-sky-200 transition-all shadow-xs"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{user.fullName || user.username} ({user.role})</span>
                    <ChevronRightIcon className="w-4 h-4 ml-1" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Đăng xuất"
                    className="p-2.5 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    id="nav-btn-login"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:text-sky-600 hover:bg-slate-100/80 transition-all"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    id="nav-btn-register"
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 shadow-md shadow-sky-600/20 hover:shadow-lg hover:shadow-sky-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Đăng ký</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex sm:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3">
            <div className="flex flex-col space-y-2">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Trang chủ
              </Link>
              <a href="/#about" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Giới thiệu
              </a>
              <a href="/#departments" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Chuyên khoa
              </a>
              <a href="/#services" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Dịch vụ
              </a>
              <a href="/#workflow" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Quy trình
              </a>
              <a href="/#contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Liên hệ
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={getRoleDashboardPath(user.role)}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
                  >
                    Bảng điều khiển ({user.role})
                  </Link>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-sm"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
                  >
                    Đăng ký tài khoản
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
                  <HospitalIcon className="w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                  Bệnh viện Đa khoa Quốc tế
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-md">
                Hệ thống bệnh viện đa khoa tiêu chuẩn quốc tế, tiên phong ứng dụng công nghệ hiện đại trong thăm khám, chẩn đoán và điều trị y khoa.
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  Giấy phép BYT: 1234/BYT-GPHĐ
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
                  ISO 9001:2015
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Chuyên khoa & Dịch vụ
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="/#departments" className="hover:text-sky-400 transition-colors">Khoa Nội Tổng Quát</a></li>
                <li><a href="/#departments" className="hover:text-sky-400 transition-colors">Khoa Tim Mạch Can Thiệp</a></li>
                <li><a href="/#departments" className="hover:text-sky-400 transition-colors">Khoa Nhi Toàn Diện</a></li>
                <li><a href="/#departments" className="hover:text-sky-400 transition-colors">Khoa Da Liễu Thẩm Mỹ</a></li>
                <li><a href="/#services" className="hover:text-sky-400 transition-colors">Bảng giá dịch vụ công khai</a></li>
              </ul>
            </div>

            <div className="lg:col-span-4 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Thông tin liên hệ 24/7
              </h4>
              <div className="space-y-3 text-sm text-slate-400">
                <div className="flex items-start gap-3">
                  <MapPinIcon className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <span>123 Đường Giải Phóng, Phường Đồng Tâm, Quận Hai Bà Trưng, Hà Nội</span>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold text-white">Hotline Cấp cứu: </span>
                    <a href="tel:19006868" className="text-emerald-400 hover:underline font-bold">1900 6868</a>
                    <span> — (024) 3888 9999</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MailIcon className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>cskh@benhvienquocte.vn</span>
                </div>
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Thứ Hai - Thứ Bảy: 07:30 - 17:00 (Cấp cứu: 24/7)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 Bệnh viện Đa khoa Quốc tế. Bảo lưu mọi quyền.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-slate-400">Chính sách bảo mật</a>
              <a href="#" className="hover:text-slate-400">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-slate-400">Quy chế hoạt động</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
