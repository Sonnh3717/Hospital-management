import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import useAuth from '../../hooks/useAuth.js';
import WorkspaceLayout from '../../layouts/WorkspaceLayout.jsx';
import LoginDialog from './LoginDialog.jsx';
import Button from '../ui/Button.jsx';
import EmptyState from '../ui/EmptyState.jsx';

export default function ProtectedWorkspace({ role, allowedRoles }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [signInOpen, setSignInOpen] = useState(true);

  if (loading)
    return (
      <div className="clinical-gate" role="status">
        Đang kiểm tra phiên đăng nhập…
      </div>
    );

  if (!user)
    return (
      <div className="clinical-gate">
        <EmptyState
          title="Vui lòng đăng nhập"
          description="Màn hình này dành cho người dùng được phân quyền trong hệ thống."
        >
          <Button onClick={() => setSignInOpen(true)}>Đăng nhập</Button>
          <Link to="/">Về trang chủ</Link>
        </EmptyState>
        <LoginDialog
          open={signInOpen}
          onClose={() => setSignInOpen(false)}
          redirect={false}
        />
      </div>
    );

  const roles = allowedRoles || (role ? [role] : []);
  const hasAccess = roles.length === 0 || roles.includes(user.role);

  if (!hasAccess)
    return (
      <div className="clinical-gate">
        <EmptyState
          title="Bạn không có quyền truy cập"
          description="Tài khoản hiện tại không có vai trò phù hợp với màn hình này."
        >
          <Link to="/">Về trang chủ</Link>
        </EmptyState>
      </div>
    );

  return (
    <WorkspaceLayout
      user={user}
      onLogout={() => navigate('/', { state: { logoutRequested: true } })}
    >
      <Outlet />
    </WorkspaceLayout>
  );
}
