import Icon from '../Icon.jsx';
import '../../styles/auth.css';

export default function AuthPageShell({ title, description, step, children }) {
  return (
    <section className="auth-section" aria-labelledby="auth-page-title">
      <div className="auth-shell">
        <aside className="auth-introduction">
          <span className="auth-introduction__icon">
            <Icon name="shield" size={30} />
          </span>
          <span className="auth-eyebrow">TÀI KHOẢN SWD CARE</span>
          <h2>
            Chăm sóc sức khỏe,
            <br />
            bắt đầu từ bạn.
          </h2>
          <p>Tạo tài khoản người bệnh để kết nối với SWD Care.</p>
          <ol className="auth-steps">
            {['Tạo tài khoản', 'Xác thực email', 'Đăng nhập'].map(
              (label, index) => (
                <li
                  key={label}
                  className={step === index + 1 ? 'is-current' : ''}
                  aria-current={step === index + 1 ? 'step' : undefined}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {label}
                </li>
              ),
            )}
          </ol>
          <div className="auth-introduction__note">
            <Icon name="heart" size={17} /> Đồng hành cùng sức khỏe của bạn.
          </div>
        </aside>
        <div className="auth-content">
          <h1 id="auth-page-title">{title}</h1>
          <p className="auth-description">{description}</p>
          {children}
        </div>
      </div>
    </section>
  );
}
