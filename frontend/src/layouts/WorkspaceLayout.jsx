import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import '../styles/workspace.css';

const roleConfigs = {
  ADMIN: {
    label: 'Quản trị viên',
    section: 'Quản trị hệ thống',
    dashboard: '/admin/dashboard',
    navItems: [
      { href: '/admin/dashboard', label: 'Tổng quan hệ thống', icon: 'globe' },
      { href: '/admin/users', label: 'Quản lý tài khoản', icon: 'user' },
      { href: '/admin/services', label: 'Danh mục dịch vụ y tế', icon: 'cross' },
      { href: '/admin/rules', label: 'Quy định đặt lịch', icon: 'shield' },
    ],
  },
  MANAGER: {
    label: 'Quản lý bệnh viện',
    section: 'Điều phối & Báo cáo',
    dashboard: '/manager/dashboard',
    navItems: [
      { href: '/manager/dashboard', label: 'Bảng điều khiển quản lý', icon: 'globe' },
      { href: '/manager/schedules', label: 'Phân ca & Lịch làm việc', icon: 'calendar' },
      { href: '/manager/schedule-requests', label: 'Yêu cầu đổi ca', icon: 'clock' },
      { href: '/manager/reports', label: 'Báo cáo & Thống kê No-show', icon: 'info' },
    ],
  },
  RECEPTIONIST: {
    label: 'Lễ tân / Tiếp đón',
    section: 'Tiếp nhận người bệnh',
    dashboard: '/reception/appointments',
    navItems: [
      { href: '/reception/appointments', label: 'Quản lý & Tiếp đón lịch hẹn', icon: 'calendar' },
      { href: '/reception/walk-in', label: 'Đăng ký khám vãng lai (Walk-in)', icon: 'user' },
      { href: '/reception/patients', label: 'Hồ sơ người bệnh', icon: 'info' },
    ],
  },
  DOCTOR: {
    label: 'Bác sĩ chuyên khoa',
    section: 'Khám & Điều trị da liễu',
    dashboard: '/doctor/patients',
    navItems: [
      { href: '/doctor/patients', label: 'Người bệnh được phân công', icon: 'stethoscope' },
      { href: '/doctor/schedule', label: 'Lịch khám cá nhân', icon: 'calendar' },
      { href: '/doctor/history', label: 'Lịch sử ca khám đã hoàn tất', icon: 'clock' },
    ],
  },
  MEDICAL_SERVICE_STAFF: {
    label: 'Nhân viên dịch vụ y tế',
    section: 'Thực hiện cận lâm sàng',
    dashboard: '/services/queue',
    navItems: [
      { href: '/services/queue', label: 'Hàng đợi thực hiện dịch vụ', icon: 'clock' },
      { href: '/services/completed', label: 'Kết quả dịch vụ đã trả', icon: 'check' },
    ],
  },
  PATIENT: {
    label: 'Người bệnh',
    section: 'Cổng thông tin người bệnh',
    dashboard: '/patient/dashboard',
    navItems: [
      { href: '/patient/dashboard', label: 'Lịch hẹn của tôi', icon: 'calendar' },
      { href: '/patient/booking', label: 'Đặt lịch khám mới', icon: 'cross' },
      { href: '/patient/medical-history', label: 'Lịch sử khám & Đơn thuốc', icon: 'stethoscope' },
      { href: '/patient/profile', label: 'Hồ sơ cá nhân', icon: 'user' },
    ],
  },
};

export default function WorkspaceLayout({ user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const config = roleConfigs[user?.role] || {
    label: 'Nhân viên',
    section: 'Không gian làm việc',
    dashboard: '/',
    navItems: [],
  };

  const fullName = user?.fullName?.trim() || user?.username || 'Người dùng';
  const initials = fullName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase();

  function closeMenu(event) {
    if (event.key === 'Escape') setMenuOpen(false);
  }

  return (
    <div className="workspace-shell" onKeyDown={closeMenu}>
      <a className="workspace-skip-link" href="#workspace-main">Chuyển đến nội dung chính</a>
      <header className="workspace-header">
        <Link className="workspace-brand" to="/" aria-label="SWD Care — Trang chủ">
          <span className="workspace-brand__mark"><Icon name="cross" size={27} /></span>
          <span>SWD <strong>Care</strong><small>BỆNH VIỆN DA LIỄU</small></span>
        </Link>
        <div className="workspace-header__title">
          <span>Không gian làm việc</span>
          <small>{config.section}</small>
        </div>
        <div className="workspace-account">
          <span className="workspace-avatar" aria-hidden="true">{initials}</span>
          <span className="workspace-account__identity">
            <strong>{fullName}</strong>
            <small>{config.label}</small>
          </span>
          {onLogout && (
            <Button variant="ghost" className="workspace-logout" onClick={onLogout}>
              <Icon name="arrow-left" size={16} /> Đăng xuất
            </Button>
          )}
        </div>
        <button
          className="workspace-menu-toggle"
          type="button"
          aria-controls="workspace-sidebar"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'}
          onClick={() => setMenuOpen((previous) => !previous)}
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={23} />
        </button>
      </header>

      <aside id="workspace-sidebar" className={`workspace-sidebar${menuOpen ? ' workspace-sidebar--open' : ''}`}>
        <div className="workspace-sidebar__section">{config.section}</div>
        <nav aria-label="Điều hướng công việc">
          {config.navItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => `workspace-nav-link${isActive ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <Link to="/" className="workspace-nav-link workspace-nav-link--home" onClick={() => setMenuOpen(false)}>
            <Icon name="arrow-left" size={19} />
            <span>Về trang chủ</span>
          </Link>
        </nav>
        <div className="workspace-sidebar__note">
          <Icon name="shield" size={19} />
          <p>Tuân thủ bảo mật thông tin hồ sơ bệnh án và dữ liệu y tế của người bệnh.</p>
        </div>
        {onLogout && (
          <Button variant="ghost" className="workspace-sidebar__logout" onClick={onLogout}>
            Đăng xuất
          </Button>
        )}
        <div className="workspace-sidebar__footer">
          SWD Care <span>{config.label}</span>
        </div>
      </aside>

      <main id="workspace-main" className="workspace-main" tabIndex={-1}>
        <div className="workspace-content">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
