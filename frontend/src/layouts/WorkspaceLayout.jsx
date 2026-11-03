import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HospitalIcon,
  CalendarIcon,
  ClockIcon,
  UserPlusIcon,
  CalendarCheckIcon,
  UserGroupIcon,
  StethoscopeIcon,
  LogOutIcon,
  UserIcon,
} from '../components/common/Icons';

export default function WorkspaceLayout({ role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const currentRole = role || user?.role || 'PATIENT';

  // Navigation items per role
  const navItems = {
    PATIENT: [
      { to: '/patient/book', label: 'Đặt lịch hẹn', icon: CalendarIcon },
      { to: '/patient/appointments', label: 'Quản lý lịch hẹn', icon: ClockIcon },
    ],
    RECEPTIONIST: [
      { to: '/reception/walk-in', label: 'Tạo hẹn khám walk-in', icon: UserPlusIcon },
      { to: '/reception/appointments', label: 'Quản lý lịch hẹn', icon: CalendarCheckIcon },
      { to: '/reception/patients', label: 'Quản lý bệnh nhân', icon: UserGroupIcon },
    ],
    DOCTOR: [
      { to: '/doctor', label: 'Bàn làm việc Bác sĩ', icon: StethoscopeIcon },
    ],
    ADMIN: [
      { to: '/reception/appointments', label: 'Quản lý lịch hẹn', icon: CalendarCheckIcon },
      { to: '/reception/patients', label: 'Quản lý bệnh nhân', icon: UserGroupIcon },
    ],
  };

  const currentNav = navItems[currentRole] || navItems.PATIENT;

  const roleLabelMap = {
    PATIENT: 'Bệnh nhân',
    RECEPTIONIST: 'Lễ tân tiếp đón',
    DOCTOR: 'Bác sĩ chuyên khoa',
    ADMIN: 'Quản trị viên',
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans antialiased">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
              <HospitalIcon className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                Bệnh viện Đa khoa Quốc tế
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {roleLabelMap[currentRole] || currentRole} Portal
              </span>
            </div>
          </Link>
        </div>

        {/* User Profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800">
                {user?.fullName || user?.username || 'Người dùng'}
              </span>
              <span className="text-xs text-sky-600 font-medium">
                {roleLabelMap[user?.role] || user?.role}
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-200"></div>

          <button
            onClick={handleLogout}
            title="Đăng xuất"
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
          >
            <LogOutIcon className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex">
        {/* Left Sidebar */}
        <aside className="w-64 bg-white border-r border-slate-200 p-4 shrink-0 flex flex-col justify-between hidden md:flex">
          <div className="space-y-1">
            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chức năng chính
            </div>
            {currentNav.map((item) => {
              const IconComp = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                        : 'text-slate-600 hover:text-sky-600 hover:bg-sky-50/70'
                    }`
                  }
                >
                  <IconComp className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          {/* Quick Support Link */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
              <div className="font-bold text-slate-800 mb-0.5">Tổng đài hỗ trợ 24/7</div>
              <div>Hotline: <strong className="text-sky-600">1900 6868</strong></div>
            </div>
          </div>
        </aside>

        {/* Page Outlet */}
        <main className="flex-1 p-6 md:p-8 min-h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
