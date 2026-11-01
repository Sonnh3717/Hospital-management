import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';

const destinations = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/manager/dashboard',
  RECEPTIONIST: '/reception/appointments',
  DOCTOR: '/doctor/patients',
  MEDICAL_SERVICE_STAFF: '/services/queue',
  PATIENT: '/patient/dashboard',
};

export default function LoginDialog({ open, onClose, redirect = true }) {
  const { login, sessionError } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const user = await login(credentials);
      setCredentials({ username: '', password: '' });
      onClose?.();
      if (redirect) navigate(destinations[user.role] || '/');
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Đăng nhập Bệnh viện Da liễu" busy={busy}>
      <form onSubmit={submit} className="clinical-stack">
        <p className="clinical-muted">
          Đăng nhập bằng tài khoản (Người bệnh hoặc Nhân viên y tế) để tiếp tục.
        </p>
        {sessionError && !error && (
          <div className="clinical-alert clinical-alert--warning" role="alert">
            {sessionError}
          </div>
        )}
        {error && (
          <div className="clinical-alert clinical-alert--error" role="alert">
            {error.message || 'Tên đăng nhập hoặc mật khẩu không chính xác'}
          </div>
        )}
        <Field label="Tên đăng nhập hoặc Email" required>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={credentials.username}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, username: e.target.value }))
            }
            required
            autoFocus
          />
        </Field>
        <Field label="Mật khẩu" required>
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={(e) =>
              setCredentials((prev) => ({ ...prev, password: e.target.value }))
            }
            required
          />
        </Field>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Đang xác thực…' : 'Đăng nhập'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
