import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, getRoleDashboardPath } from '../context/AuthContext';
import {
  HospitalIcon,
  HeartbeatIcon,
  StethoscopeIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  MenuIcon,
  XIcon,
  LogOutIcon,
  SparklesIcon,
} from '../components/common/Icons';

export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const stats = [
    {
      id: 'stat-doctors',
      count: '50+',
      label: 'Bác sĩ chuyên khoa',
      desc: 'Tiến sĩ, Thạc sĩ, BSCKII giàu kinh nghiệm',
      icon: StethoscopeIcon,
      color: 'bg-blue-50 text-blue-600 border-blue-100',
    },
    {
      id: 'stat-emergency',
      count: '24/7',
      label: 'Cấp cứu & Tiếp đón',
      desc: 'Ứng trực cấp cứu và tiếp đón bệnh nhân liên tục',
      icon: ClockIcon,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    },
    {
      id: 'stat-patients',
      count: '10,000+',
      label: 'Bệnh nhân tin tưởng',
      desc: 'Hàng ngàn lượt khám an toàn mỗi năm',
      icon: UserGroupIcon,
      color: 'bg-sky-50 text-sky-600 border-sky-100',
    },
    {
      id: 'stat-tech',
      count: '100%',
      label: 'Công nghệ khám hiện đại',
      desc: 'Hệ thống chẩn đoán hình ảnh thế hệ mới',
      icon: SparklesIcon,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    },
  ];

  const departments = [
    {
      name: 'Khoa Nội Tổng Quát',
      tag: 'Khám chuyên sâu',
      desc: 'Thăm khám toàn diện, điều trị bệnh lý tim mạch, nội tiết, chuyển hóa và đường hô hấp.',
      doctors: '12 Bác sĩ',
      icon: '🩺',
    },
    {
      name: 'Khoa Tim Mạch Can Thiệp',
      tag: 'Mũi nhọn',
      desc: 'Chẩn đoán sớm bệnh lý mạch vành, tăng huyết áp, rối loạn nhịp tim với máy siêu âm Doppler màu.',
      doctors: '8 Bác sĩ',
      icon: '❤️',
    },
    {
      name: 'Khoa Nhi Toàn Diện',
      tag: 'Tận tâm',
      desc: 'Chăm sóc sức khỏe trẻ sơ sinh và trẻ nhỏ, tư vấn dinh dưỡng và tiêm chủng phòng bệnh an toàn.',
      doctors: '10 Bác sĩ',
      icon: '👶',
    },
    {
      name: 'Khoa Da Liễu & Laser Thẩm Mỹ',
      tag: 'Công nghệ cao',
      desc: 'Điều trị mụn nang, viêm da cơ địa, trẻ hóa da và trị sẹo bằng công nghệ Laser vi điểm.',
      doctors: '9 Bác sĩ',
      icon: '✨',
    },
    {
      name: 'Khoa Ngoại & Chấn Thương',
      tag: 'Kỹ thuật cao',
      desc: 'Phẫu thuật ít xâm lấn, điều trị chấn thương chỉnh hình và phục hồi chức năng xương khớp.',
      doctors: '7 Bác sĩ',
      icon: '🦴',
    },
    {
      name: 'Khoa Tai Mũi Họng & Mắt',
      tag: 'Chính xác',
      desc: 'Nội soi tầm soát công nghệ cao, đo khúc xạ chuẩn xác và điều trị các bệnh lý giác quan.',
      doctors: '6 Bác sĩ',
      icon: '👁️',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Đăng Ký & Đặt Lịch',
      desc: 'Đăng ký tài khoản nhanh qua email xác thực OTP, chọn bác sĩ và khung giờ thuận tiện.',
    },
    {
      step: '02',
      title: 'Tiếp Đón Nhanh Chóng',
      desc: 'Đến quầy lễ tân tầng 1, quét mã hẹn khám để hoàn tất thủ tục check-in trong 60 giây.',
    },
    {
      step: '03',
      title: 'Khám Cùng Chuyên Gia',
      desc: 'Bác sĩ thăm khám lâm sàng kỹ lưỡng, chỉ định xét nghiệm nếu cần và tư vấn chi tiết.',
    },
    {
      step: '04',
      title: 'Theo Dõi Sức Khỏe',
      desc: 'Xem kết quả, đơn thuốc điện tử và chủ động quản lý lịch tái khám trên cổng bệnh nhân.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased selection:bg-sky-500 selection:text-white">
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
              <a href="#about" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Giới thiệu
              </a>
              <a href="#departments" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Chuyên khoa
              </a>
              <a href="#services" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Dịch vụ
              </a>
              <a href="#workflow" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Quy trình
              </a>
              <a href="#contact" className="text-sm font-semibold text-slate-600 hover:text-sky-600 transition-colors">
                Liên hệ
              </a>
            </nav>

            {/* Prominent Action Buttons (Đăng nhập & Đăng ký) */}
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
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Giới thiệu
              </a>
              <a href="#departments" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Chuyên khoa
              </a>
              <a href="#services" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Dịch vụ
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Quy trình
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50">
                Liên hệ
              </a>
            </div>
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={getRoleDashboardPath(user.role)}
                    className="w-full text-center px-4 py-2.5 rounded-xl bg-sky-600 text-white font-semibold text-sm"
                  >
                    Bảng điều khiển ({user.role})
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 font-semibold text-sm"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="w-full text-center px-4 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 text-sm"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
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

      {/* ---------------------------------------------------- */}
      {/* HERO SECTION */}
      {/* ---------------------------------------------------- */}
      <section id="about" className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32 bg-gradient-to-b from-sky-50/60 via-white to-slate-50">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-sky-300/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100/80 border border-sky-200 text-sky-800 text-xs sm:text-sm font-semibold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping"></span>
                <span>Tiêu chuẩn y khoa quốc tế — Phục vụ tận tâm</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
                Chăm sóc sức khỏe toàn diện với{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-teal-600 to-sky-700">
                  đội ngũ chuyên gia hàng đầu
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
                Hệ thống y tế hiện đại đạt chuẩn quốc tế, trang thiết bị tiên tiến cùng đội ngũ y bác sĩ tận tâm, sẵn sàng đồng hành vì sức khỏe cộng đồng.
              </p>

              {/* Call To Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to={isAuthenticated && user ? getRoleDashboardPath(user.role) : "/login"}
                  id="hero-cta-booking"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-sky-600 to-teal-600 text-white font-bold text-base shadow-xl shadow-sky-600/25 hover:shadow-2xl hover:shadow-sky-600/35 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 group"
                >
                  <CalendarIcon className="w-5 h-5 text-sky-200 group-hover:scale-110 transition-transform" />
                  <span>Đặt lịch ngay</span>
                  <ArrowRightIcon className="w-4 h-4 text-sky-200 group-hover:translate-x-1 transition-transform" />
                </Link>

                <a
                  href="#departments"
                  id="hero-cta-more"
                  className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white text-slate-700 font-semibold text-base border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <span>Tìm hiểu thêm</span>
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-slate-200/80 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-slate-600 font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Bác sĩ chuyên khoa đầu ngành</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Thủ tục tiếp đón 60 giây</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  <span>Bảo mật dữ liệu tuyệt đối</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Image with Overlay Badges */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Main Hero Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-sky-900/10 border-4 border-white bg-white">
                  <img
                    src="/images/consultation-hero.png"
                    alt="Tư vấn y tế chuyên nghiệp"
                    className="w-full h-auto object-cover object-center max-h-[520px] hover:scale-105 transition-transform duration-700"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Floating Badge 1: Top Right - Rating */}
                <div className="absolute -top-4 -right-4 sm:-right-6 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 font-bold text-lg">
                    ★
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">4.9 / 5.0</div>
                    <div className="text-xs text-slate-500">99.8% Bệnh nhân hài lòng</div>
                  </div>
                </div>

                {/* Floating Badge 2: Bottom Left - 24/7 Response */}
                <div className="absolute -bottom-6 -left-4 sm:-left-6 bg-white/95 backdrop-blur-md px-4 py-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                    <HeartbeatIcon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Trực 24/7</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">Cấp cứu & Tiếp đón</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* FEATURE HIGHLIGHTS / STATS CARDS */}
      {/* ---------------------------------------------------- */}
      <section id="services" className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className="p-6 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-sky-300 hover:shadow-xl hover:shadow-sky-500/5 hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${item.color} group-hover:scale-110 transition-transform`}>
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
                    {item.count}
                  </div>
                  <div className="text-base font-bold text-slate-800 mb-1">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 leading-relaxed">
                    {item.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* DEPARTMENT OVERVIEW SECTION */}
      {/* ---------------------------------------------------- */}
      <section id="departments" className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold uppercase tracking-wider">
              Khám chữa bệnh chuyên khoa
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Các chuyên khoa mũi nhọn hàng đầu
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Được trang bị cơ sở vật chất hiện đại, tiêu chuẩn kiểm soát nhiễm khuẩn khắt khe và đội ngũ y bác sĩ uy tín.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {departments.map((dept, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs hover:shadow-xl hover:shadow-slate-200/50 hover:border-sky-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                      {dept.icon}
                    </span>
                    <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
                      {dept.tag}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors mb-2.5">
                    {dept.name}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {dept.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>{dept.doctors} trực khám</span>
                  <Link
                    to={isAuthenticated && user ? getRoleDashboardPath(user.role) : "/login"}
                    className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-bold group-hover:translate-x-1 transition-all"
                  >
                    <span>Đặt khám</span>
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* WORKFLOW / HOW IT WORKS */}
      {/* ---------------------------------------------------- */}
      <section id="workflow" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold uppercase tracking-wider">
              Quy trình thông minh
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              4 Bước khám bệnh nhanh chóng & thuận tiện
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Chủ động đặt lịch và tiếp đón nhanh chóng, loại bỏ thời gian chờ đợi xếp hàng.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {workflowSteps.map((step) => (
              <div key={step.step} className="relative p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-4xl font-black text-sky-200 mb-4">
                  {step.step}
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">
                  {step.title}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA Banner inside Workflow */}
          <div className="mt-14 p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-sky-700 via-sky-600 to-teal-600 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Sẵn sàng trải nghiệm dịch vụ y tế chuẩn quốc tế?
              </h3>
              <p className="text-sky-100 text-base max-w-xl">
                Đăng ký tài khoản ngay hôm nay để nhận thông báo lịch khám và quản lý hồ sơ bệnh án trọn đời.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                to="/register"
                className="px-6 py-3.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-center text-sm shadow-md transition-all"
              >
                Đăng ký tài khoản
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded-xl bg-sky-800/80 hover:bg-sky-900 text-white font-semibold text-center text-sm border border-sky-400/30 transition-all"
              >
                Đăng nhập hệ thống
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- */}
      {/* PROFESSIONAL FOOTER */}
      {/* ---------------------------------------------------- */}
      <footer id="contact" className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800">
            {/* Hospital Branding & Certs */}
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

            {/* Quick Links */}
            <div className="lg:col-span-3 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Chuyên khoa & Dịch vụ
              </h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Nội Tổng Quát</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Tim Mạch Can Thiệp</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Nhi Toàn Diện</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Khoa Da Liễu Thẩm Mỹ</a></li>
                <li><a href="#departments" className="hover:text-sky-400 transition-colors">Bảng giá dịch vụ công khai</a></li>
              </ul>
            </div>

            {/* Emergency & Contact Details */}
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
