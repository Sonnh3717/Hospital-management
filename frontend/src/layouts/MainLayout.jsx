import { useEffect, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import useAuth from '../hooks/useAuth.js';
import LoginDialog from '../components/auth/LoginDialog.jsx';
import '../styles/layout.css';

const navigation = [
  { href: '#gioi-thieu', label: 'Giới thiệu' },
  { href: '#dat-lich', label: 'Đặt lịch khám' },
  { href: '#bac-si', label: 'Tìm bác sĩ' },
  { href: '#chuyen-khoa', label: 'Chuyên khoa' },
  { href: '#lien-he', label: 'Liên hệ' },
];

function Brand({ footer = false }) {
  return (
    <a
      className={`site-brand${footer ? ' site-brand--footer' : ''}`}
      href="#gioi-thieu"
      aria-label="SWD Care — Trang chủ"
    >
      <span className="site-brand__mark" aria-hidden="true">
        <Icon name="cross" size={29} />
      </span>
      <span className="site-brand__text">
        <span className="site-brand__name">
          SWD <span>Care</span>
        </span>
        <span className="site-brand__tagline">HỆ THỐNG CHĂM SÓC SỨC KHỎE</span>
      </span>
    </a>
  );
}

export default function MainLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const loggingOut = useRef(false);
  const destinations = {
    RECEPTIONIST: '/reception/appointments',
    DOCTOR: '/doctor/patients',
    MEDICAL_SERVICE_STAFF: '/services/queue',
  };

  useEffect(() => {
    if (!location.state?.logoutRequested || loggingOut.current) return;
    loggingOut.current = true;
    logout()
      .catch((error) => setLogoutError(error.message))
      .finally(() => {
        loggingOut.current = false;
        navigate('/', { replace: true, state: null });
      });
  }, [location.state, logout, navigate]);

  return (
    <>
      <a className="site-skip-link" href="#main-content">
        Chuyển đến nội dung chính
      </a>
      <header className="site-header">
        <div className="site-utility">
          <div className="layout-container site-utility__inner">
            <span>Chăm sóc tận tâm. Đồng hành cùng bạn.</span>
            <div className="site-utility__links">
              <a href="#bac-si">Tìm bác sĩ</a>
              <span aria-hidden="true" />
              <a href="#lien-he">Hỗ trợ khách hàng</a>
            </div>
          </div>
        </div>
        <div className="layout-container site-header__main">
          <Brand />
          <div className="site-header__assurance">
            <Icon name="shield" size={26} />
            <span>
              Vì một cuộc sống <strong>khỏe mạnh hơn</strong>
            </span>
          </div>
          <div className="site-header__actions">
            <span className="site-language" aria-label="Ngôn ngữ: Tiếng Việt">
              <Icon name="globe" size={17} /> VI
            </span>
            <span className="site-header__divider" aria-hidden="true" />
            {user && destinations[user.role] && (
              <Link className="site-login" to={destinations[user.role]}>
                Vào không gian làm việc
              </Link>
            )}
            <button
              className="site-login"
              type="button"
              disabled={loading}
              onClick={() =>
                user
                  ? navigate('/', { state: { logoutRequested: true } })
                  : setLoginOpen(true)
              }
            >
              <Icon name="user" size={18} /> {user ? 'Đăng xuất' : 'Đăng nhập'}
            </button>
            <button
              className="site-menu-toggle"
              type="button"
              aria-expanded={menuOpen}
              aria-controls="primary-navigation"
              aria-label={
                menuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'
              }
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
            </button>
          </div>
        </div>
        <nav
          id="primary-navigation"
          className={`site-nav${menuOpen ? ' site-nav--open' : ''}`}
          aria-label="Điều hướng chính"
        >
          <div className="layout-container site-nav__inner">
            {navigation.map(({ href, label }) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a
              className="site-nav__appointment"
              href="#dat-lich"
              onClick={() => setMenuOpen(false)}
            >
              <Icon name="calendar" size={18} /> Đặt lịch ngay{' '}
              <Icon name="arrow-right" size={17} />
            </a>
          </div>
        </nav>
      </header>
      {logoutError && (
        <div className="clinical-alert clinical-alert--error" role="alert">
          {logoutError}
        </div>
      )}
      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      <main id="main-content" className="site-main" tabIndex={-1}>
        <Outlet />
      </main>

      <footer id="lien-he" className="site-footer">
        <div className="layout-container site-footer__main">
          <div className="site-footer__brand">
            <Brand footer />
            <p>
              Kết nối bạn với dịch vụ chăm sóc sức khỏe. Chủ động đặt lịch, an
              tâm thăm khám.
            </p>
            <span className="site-footer__care">
              <Icon name="heart" size={16} /> Sức khỏe của bạn là ưu tiên của
              chúng tôi.
            </span>
          </div>
          <div className="site-footer__column">
            <h2>Khám phá SWD Care</h2>
            <a href="#gioi-thieu">Về chúng tôi</a>
            <a href="#chuyen-khoa">Các chuyên khoa</a>
            <a href="#bac-si">Đội ngũ bác sĩ</a>
          </div>
          <div className="site-footer__column">
            <h2>Dành cho người bệnh</h2>
            <a href="#dat-lich">Đặt lịch khám</a>
            <a href="#lien-he">Thông tin liên hệ</a>
            <p>Hãy chuẩn bị thông tin cá nhân trước khi đặt lịch khám.</p>
          </div>
          <div className="site-footer__column site-footer__contact">
            <h2>Liên hệ & hỗ trợ</h2>
            <p>
              <Icon name="phone" size={17} />
              <span>Hotline: đang cập nhật</span>
            </p>
            <p>
              <Icon name="mail" size={17} />
              <span>Email: đang cập nhật</span>
            </p>
            <p>
              <Icon name="map-pin" size={17} />
              <span>Địa chỉ: đang cập nhật</span>
            </p>
          </div>
        </div>
        <div className="site-footer__bottom">
          <div className="layout-container site-footer__bottom-inner">
            <span>
              © {new Date().getFullYear()} SWD Care. Bảo lưu mọi quyền.
            </span>
            <span>Chăm sóc hôm nay, khỏe mạnh ngày mai.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
