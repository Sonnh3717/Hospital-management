import { Link, Navigate, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import AuthPageShell from '../../components/auth/AuthPageShell.jsx';
import LoginForm from '../../components/auth/LoginForm.jsx';
import { authDestination } from '../../utils/registration.js';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to={authDestination(user.role)} replace />;
  return (
    <AuthPageShell
      title="Đăng nhập SWD Care"
      description="Đăng nhập bằng tài khoản người bệnh hoặc tài khoản nhân viên được cấp."
      step={3}
    >
      {loading ? (
        <p role="status">Đang kiểm tra phiên đăng nhập…</p>
      ) : (
        <LoginForm
          key={location.state?.username || 'login'}
          initialUsername={location.state?.username || ''}
          notice={
            location.state?.verified
              ? 'Email đã được xác thực. Bạn có thể đăng nhập bằng tài khoản vừa tạo.'
              : ''
          }
        />
      )}
      <p className="auth-form__links">
        <Link to="/">Về trang chủ</Link>
      </p>
    </AuthPageShell>
  );
}
