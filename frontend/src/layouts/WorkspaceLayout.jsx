import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Button from '../components/ui/Button.jsx';
import '../styles/workspace.css';

const roles = {
  RECEPTIONIST: { label: 'Lễ tân', section: 'Tiếp nhận người bệnh', href: '/reception/appointments', nav: 'Lịch hẹn tiếp nhận', icon: 'calendar' },
  DOCTOR: { label: 'Bác sĩ', section: 'Khám và điều trị', href: '/doctor/patients', nav: 'Người bệnh được phân công', icon: 'stethoscope' },
  MEDICAL_SERVICE_STAFF: { label: 'Nhân viên dịch vụ y tế', section: 'Thực hiện dịch vụ', href: '/services/queue', nav: 'Hàng đợi dịch vụ', icon: 'clock' },
};

export default function WorkspaceLayout({ user, onLogout, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const role = roles[user?.role];
  const fullName = user?.fullName?.trim() || 'Nhân viên';
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
          <span>SWD <strong>Care</strong><small>CHĂM SÓC SỨC KHỎE</small></span>
        </Link>
        <div className="workspace-header__title"><span>Không gian làm việc</span><small>{role?.section || 'Dành cho nhân viên'}</small></div>
        <div className="workspace-account">
          <span className="workspace-avatar" aria-hidden="true">{initials}</span>
          <span className="workspace-account__identity"><strong>{fullName}</strong><small>{role?.label || 'Nhân viên'}</small></span>
          {onLogout && <Button variant="ghost" className="workspace-logout" onClick={onLogout}><Icon name="arrow-left" size={16} /> Đăng xuất</Button>}
        </div>
        <button className="workspace-menu-toggle" type="button" aria-controls="workspace-sidebar" aria-expanded={menuOpen} aria-label={menuOpen ? 'Đóng điều hướng' : 'Mở điều hướng'} onClick={() => setMenuOpen((previous) => !previous)}><Icon name={menuOpen ? 'close' : 'menu'} size={23} /></button>
      </header>

      <aside id="workspace-sidebar" className={`workspace-sidebar${menuOpen ? ' workspace-sidebar--open' : ''}`}>
        <div className="workspace-sidebar__section">{role?.section || 'Điều hướng'}</div>
        <nav aria-label="Điều hướng công việc">
          {role && <NavLink to={role.href} className={({ isActive }) => `workspace-nav-link${isActive ? ' is-active' : ''}`} onClick={() => setMenuOpen(false)}><Icon name={role.icon} size={20} /><span>{role.nav}</span></NavLink>}
          <Link to="/" className="workspace-nav-link workspace-nav-link--home" onClick={() => setMenuOpen(false)}><Icon name="arrow-left" size={19} /><span>Về trang chủ</span></Link>
        </nav>
        <div className="workspace-sidebar__note"><Icon name="shield" size={19} /><p>Sử dụng thông tin người bệnh đúng mục đích chăm sóc và điều trị.</p></div>
        {onLogout && <Button variant="ghost" className="workspace-sidebar__logout" onClick={onLogout}>Đăng xuất</Button>}
        <div className="workspace-sidebar__footer">SWD Care<span>{role?.label || 'Không gian nhân viên'}</span></div>
      </aside>

      <main id="workspace-main" className="workspace-main" tabIndex={-1}>
        <div className="workspace-content">{children ?? <Outlet />}</div>
      </main>
    </div>
  );
}
