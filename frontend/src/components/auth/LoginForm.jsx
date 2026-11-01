import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import Button from '../ui/Button.jsx';
import Field from '../ui/Field.jsx';
import { authDestination } from '../../utils/registration.js';

export default function LoginForm({
  onSuccess,
  onBusyChange,
  redirect = true,
  initialUsername = '',
  notice = '',
}) {
  const { login, sessionError } = useAuth();
  const navigate = useNavigate();
  const [credentials, setCredentials] = useState({
    username: initialUsername,
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
    onBusyChange?.(true);
    setError(null);
    try {
      const user = await login(credentials);
      setCredentials({ username: '', password: '' });
      onSuccess?.();
      if (redirect) navigate(authDestination(user.role), { replace: true });
    } catch (failure) {
      setError(failure);
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusyChange?.(false);
    }
  }

  return (
    <form onSubmit={submit} className="clinical-stack auth-form">
      {notice && (
        <div className="auth-message auth-message--success" role="status">
          {notice}
        </div>
      )}
      {(error || sessionError) && (
        <div className="clinical-alert clinical-alert--error" role="alert">
          {error?.message || sessionError}
          {error?.code === 'EMAIL_NOT_VERIFIED' && (
            <p>
              <Link
                to="/verify"
                state={
                  credentials.username.includes('@')
                    ? { email: credentials.username.trim() }
                    : null
                }
                onClick={() => onSuccess?.()}
              >
                Xác thực email để đăng nhập
              </Link>
            </p>
          )}
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
          disabled={busy}
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
          disabled={busy}
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
      <p className="auth-form__links">
        Chưa có tài khoản?{' '}
        <Link
          to="/register"
          onClick={(event) => {
            if (busy) event.preventDefault();
            else onSuccess?.();
          }}
          aria-disabled={busy || undefined}
        >
          Đăng ký
        </Link>
      </p>
      <p className="auth-form__links">
        <Link
          to="/verify"
          onClick={(event) => {
            if (busy) event.preventDefault();
            else onSuccess?.();
          }}
          aria-disabled={busy || undefined}
        >
          Xác thực email đã đăng ký
        </Link>
      </p>
    </form>
  );
}
