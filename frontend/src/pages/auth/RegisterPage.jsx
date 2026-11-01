import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth.js';
import AuthPageShell from '../../components/auth/AuthPageShell.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import {
  checkUsername,
  registerPatient,
} from '../../services/registrationService.js';
import {
  readRegistration,
  registrationErrors,
  rememberRegistration,
} from '../../utils/registration.js';

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState(() => {
    const pending = readRegistration();
    return {
      username: pending.username || '',
      fullName: '',
      email: pending.email || '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    };
  });
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState(null);
  const [busy, setBusy] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState({
    username: '',
    status: '',
  });
  const submitting = useRef(false);
  const username = values.username.trim();
  const availability =
    usernameCheck.username === username ? usernameCheck.status : '';

  useEffect(() => {
    if (!/^[A-Za-z0-9._-]{3,60}$/.test(username)) return;
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setUsernameCheck({ username, status: 'checking' });
      try {
        const available = await checkUsername(username, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          setUsernameCheck({
            username,
            status: available ? 'available' : 'unavailable',
          });
      } catch {
        if (!controller.signal.aborted)
          setUsernameCheck({ username, status: 'unknown' });
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [username]);

  function change(event) {
    const { name, value, checked, type } = event.target;
    setValues((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((previous) => ({ ...previous, [name]: '' }));
    setFailure(null);
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const invalid = registrationErrors(values);
    if (availability === 'unavailable')
      invalid.username = 'Tên đăng nhập đã được sử dụng.';
    setErrors(invalid);
    setFailure(null);
    if (Object.keys(invalid).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const result = await registerPatient({
        ...values,
        username,
        fullName: values.fullName.trim(),
        email: values.email.trim(),
      });
      const registration = {
        ...result,
        email: result.email || values.email.trim(),
        username: result.username || username,
      };
      rememberRegistration(registration);
      navigate('/verify', { state: registration });
    } catch (error) {
      setFailure(error);
      setErrors(error.fieldErrors || {});
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <AuthPageShell
      title="Đăng ký tài khoản"
      description="Nhập thông tin của bạn. Mã xác thực sẽ được gửi đến email đăng ký."
      step={1}
    >
      {user ? (
        <div className="auth-form">
          <p>Bạn đang đăng nhập với tài khoản {user.fullName}.</p>
          <Link to="/">Về trang chủ</Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={submit} noValidate>
          {failure && (
            <div className="auth-message auth-message--error" role="alert">
              {failure.message}
              {failure.code === 'EMAIL_IN_USE' && (
                <p>
                  Nếu tài khoản chưa được xác thực,{' '}
                  <Link to="/verify" state={{ email: values.email.trim() }}>
                    tiếp tục xác thực email
                  </Link>
                  .
                </p>
              )}
            </div>
          )}
          <Field
            label="Tên đăng nhập"
            required
            error={
              errors.username ||
              (availability === 'unavailable'
                ? 'Tên đăng nhập đã được sử dụng.'
                : '')
            }
            hint="3–60 ký tự; dùng chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang."
          >
            <input
              name="username"
              autoComplete="username"
              value={values.username}
              onChange={change}
              disabled={busy}
              maxLength={60}
              required
            />
          </Field>
          {availability && (
            <p
              className={`auth-availability auth-availability--${availability}`}
              aria-live="polite"
            >
              {availability === 'checking'
                ? 'Đang kiểm tra tên đăng nhập…'
                : availability === 'available'
                  ? 'Tên đăng nhập có thể sử dụng.'
                  : availability === 'unknown'
                    ? 'Chưa kiểm tra được tên đăng nhập. Bạn vẫn có thể gửi đăng ký.'
                    : 'Vui lòng chọn một tên đăng nhập khác.'}
            </p>
          )}
          <Field label="Họ và tên" required error={errors.fullName}>
            <input
              name="fullName"
              autoComplete="name"
              value={values.fullName}
              onChange={change}
              disabled={busy}
              maxLength={150}
              required
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={change}
              disabled={busy}
              maxLength={254}
              required
            />
          </Field>
          <Field
            label="Mật khẩu"
            required
            error={errors.password}
            hint="Ít nhất 8 ký tự. Không chia sẻ mật khẩu với người khác."
          >
            <input
              type="password"
              name="password"
              autoComplete="new-password"
              value={values.password}
              onChange={change}
              disabled={busy}
              maxLength={72}
              required
            />
          </Field>
          <Field
            label="Xác nhận mật khẩu"
            required
            error={errors.confirmPassword}
          >
            <input
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={change}
              disabled={busy}
              maxLength={72}
              required
            />
          </Field>
          <div className="auth-consent">
            <label>
              <input
                type="checkbox"
                name="agreeTerms"
                checked={values.agreeTerms}
                onChange={change}
                disabled={busy}
                aria-invalid={errors.agreeTerms ? true : undefined}
                aria-describedby="registration-consent-hint"
              />{' '}
              Tôi đồng ý tạo tài khoản và cho phép SWD Care sử dụng thông tin đã
              cung cấp để quản lý tài khoản, gửi mã xác thực email.
            </label>
            <span
              id="registration-consent-hint"
              className={
                errors.agreeTerms ? 'ui-field__error' : 'ui-field__hint'
              }
              role={errors.agreeTerms ? 'alert' : undefined}
            >
              {errors.agreeTerms || 'Bạn đang đăng ký tài khoản người bệnh.'}
            </span>
          </div>
          <Button
            type="submit"
            loading={busy}
            disabled={availability === 'checking'}
          >
            Đăng ký
          </Button>
          <p className="auth-form__links">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Đăng nhập
            </Link>
          </p>
          <p className="auth-form__links">
            <Link
              to="/verify"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Xác thực email đã đăng ký
            </Link>
          </p>
        </form>
      )}
    </AuthPageShell>
  );
}
