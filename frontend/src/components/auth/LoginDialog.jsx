import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';

const destinations = {
  RECEPTIONIST: '/reception/appointments',
  DOCTOR: '/doctor/patients',
  MEDICAL_SERVICE_STAFF: '/services/queue',
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
    <Modal open={open} onClose={onClose} title="Đăng nhập SWD Care" busy={busy}>
      <form onSubmit={submit} className="clinical-stack">
        <p className="clinical-muted">
          Đăng nhập bằng tài khoản được cấp để truy cập công việc theo vai trò
          của bạn.
        </p>
        {(error || sessionError) && (
          <div className="clinical-alert clinical-alert--error" role="alert">
            {error?.message || sessionError}
          </div>
        )}
        <Field
          label="Tên đăng nhập hoặc email"
          required
          error={error?.fieldErrors?.username}
        >
          <input
            autoComplete="username"
            value={credentials.username}
            onChange={(event) =>
              setCredentials({ ...credentials, username: event.target.value })
            }
            maxLength={254}
            required
          />
        </Field>
        <Field label="Mật khẩu" required error={error?.fieldErrors?.password}>
          <input
            type="password"
            autoComplete="current-password"
            value={credentials.password}
            onChange={(event) =>
              setCredentials({ ...credentials, password: event.target.value })
            }
            maxLength={128}
            required
          />
        </Field>
        <Button type="submit" loading={busy}>
          Đăng nhập
        </Button>
      </form>
    </Modal>
  );
}
