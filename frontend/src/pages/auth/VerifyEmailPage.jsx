import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AuthPageShell from '../../components/auth/AuthPageShell.jsx';
import Button from '../../components/ui/Button.jsx';
import Field from '../../components/ui/Field.jsx';
import Icon from '../../components/Icon.jsx';
import {
  resendRegistrationOtp,
  verifyRegistrationOtp,
} from '../../services/registrationService.js';
import {
  forgetRegistration,
  readRegistration,
  rememberRegistration,
} from '../../utils/registration.js';

function timestamp(value) {
  return Date.parse(value || '') || 0;
}

function registrationContext(state) {
  const stored = readRegistration();
  if (state?.email && state.email !== stored.email) return state;
  return { ...stored, ...state };
}

export default function VerifyEmailPage() {
  const location = useLocation();
  const [registration, setRegistration] = useState(() =>
    registrationContext(location.state),
  );
  const [email, setEmail] = useState(() => registration.email || '');
  const [enterEmail, setEnterEmail] = useState(() => !email);
  const [otp, setOtp] = useState('');
  const [now, setNow] = useState(Date.now);
  const [busy, setBusy] = useState('');
  const [failure, setFailure] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [verified, setVerified] = useState(null);
  const submitting = useRef(false);
  const resendIn = Math.max(
    0,
    Math.ceil((timestamp(registration.resendAvailableAt) - now) / 1000),
  );
  const expiresAt = timestamp(registration.otpExpiresAt);
  const expiresIn = Math.max(0, Math.ceil((expiresAt - now) / 1000));
  const expired = !!expiresAt && !expiresIn;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function resend(event) {
    event?.preventDefault();
    if (submitting.current || resendIn > 0) return;
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFieldErrors({ email: 'Vui lòng nhập địa chỉ email hợp lệ.' });
      return;
    }
    submitting.current = true;
    setBusy('resend');
    setFailure(null);
    setFieldErrors({});
    setNotice('');
    try {
      const result = await resendRegistrationOtp(cleanEmail);
      const next = {
        ...result,
        email: result.email || cleanEmail,
        username: result.username || registration.username,
      };
      rememberRegistration(next);
      setRegistration(next);
      setEmail(next.email);
      setOtp('');
      setEnterEmail(false);
      setNow(Date.now());
      setNotice(
        'Đã gửi mã xác thực. Vui lòng kiểm tra hộp thư đến và thư rác.',
      );
    } catch (error) {
      setFailure(error);
      setFieldErrors(error.fieldErrors || {});
      if (error.status === 429) {
        const next = {
          ...registration,
          email: cleanEmail,
          resendAvailableAt: new Date(Date.now() + 60000).toISOString(),
        };
        setRegistration(next);
        rememberRegistration(next);
      }
    } finally {
      submitting.current = false;
      setBusy('');
    }
  }

  async function verify(event) {
    event.preventDefault();
    if (submitting.current) return;
    if (!/^\d{6}$/.test(otp)) {
      setFieldErrors({ otp: 'Vui lòng nhập đủ 6 chữ số của mã xác thực.' });
      return;
    }
    submitting.current = true;
    setBusy('verify');
    setFailure(null);
    setFieldErrors({});
    setNotice('');
    try {
      const result = await verifyRegistrationOtp(email.trim(), otp);
      forgetRegistration();
      setVerified(result);
      setOtp('');
    } catch (error) {
      setFailure(error);
      setFieldErrors(error.fieldErrors || {});
    } finally {
      submitting.current = false;
      setBusy('');
    }
  }

  function changeEmail() {
    setEnterEmail(true);
    setRegistration({});
    forgetRegistration();
    setOtp('');
    setFailure(null);
    setFieldErrors({});
    setNotice('');
  }

  return (
    <AuthPageShell
      title={verified ? 'Xác thực thành công' : 'Xác thực email'}
      description={
        verified
          ? 'Tài khoản của bạn đã sẵn sàng.'
          : 'Nhập mã gồm 6 chữ số được gửi đến email của bạn để hoàn tất đăng ký.'
      }
      step={2}
    >
      {verified ? (
        <div className="auth-success">
          <span className="auth-success__icon">
            <Icon name="check" size={29} />
          </span>
          <p role="status">
            Email đã được xác thực. Bạn có thể đăng nhập vào SWD Care.
          </p>
          <Link
            className="ui-button ui-button--primary"
            to="/login"
            state={{
              verified: true,
              username: verified.username || registration.username || email,
            }}
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : (
        <div className="auth-form">
          {failure && (
            <div className="auth-message auth-message--error" role="alert">
              {failure.message}
            </div>
          )}
          {notice && (
            <div className="auth-message auth-message--success" role="status">
              {notice}
            </div>
          )}
          {enterEmail ? (
            <form onSubmit={resend} noValidate className="auth-form">
              <p className="auth-description">
                Nhập email đã dùng để đăng ký tài khoản chưa xác thực.
              </p>
              <Field label="Email đăng ký" required error={fieldErrors.email}>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  disabled={!!busy}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setFieldErrors({});
                    setFailure(null);
                  }}
                  maxLength={254}
                  required
                />
              </Field>
              <Button
                type="submit"
                loading={busy === 'resend'}
                disabled={!!busy || resendIn > 0}
              >
                Gửi mã xác thực
              </Button>
              {resendIn > 0 && (
                <p className="auth-countdown" role="status">
                  Bạn có thể gửi lại mã sau {resendIn} giây.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={verify} noValidate className="auth-form">
              <div className="auth-email">
                <Icon name="mail" size={19} />
                <span>
                  <small>Email đăng ký</small>
                  <strong>{email}</strong>
                </span>
              </div>
              {fieldErrors.email && (
                <p className="ui-field__error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
              <Field
                label="Mã xác thực"
                required
                error={fieldErrors.otp}
                hint="Nhập hoặc dán mã gồm 6 chữ số từ email."
              >
                <input
                  className="auth-otp"
                  type="text"
                  name="otp"
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  disabled={!!busy}
                  onChange={(event) => {
                    setOtp(event.target.value.replace(/\D/g, '').slice(0, 6));
                    setFieldErrors({});
                    setFailure(null);
                  }}
                  onPaste={(event) => {
                    event.preventDefault();
                    setOtp(
                      event.clipboardData
                        .getData('text')
                        .replace(/\D/g, '')
                        .slice(0, 6),
                    );
                    setFieldErrors({});
                    setFailure(null);
                  }}
                  required
                />
              </Field>
              <p
                className={`auth-countdown${expired ? ' auth-countdown--expired' : ''}`}
                aria-live={expired ? 'polite' : 'off'}
              >
                {expired
                  ? 'Mã đã hết hạn. Vui lòng gửi lại mã xác thực.'
                  : expiresAt
                    ? `Mã còn hiệu lực ${Math.floor(expiresIn / 60)} phút ${String(expiresIn % 60).padStart(2, '0')} giây.`
                    : 'Mã xác thực có hiệu lực trong 5 phút.'}
              </p>
              <Button
                type="submit"
                loading={busy === 'verify'}
                disabled={!!busy || expired}
              >
                Xác thực email
              </Button>
              <Button
                variant="secondary"
                onClick={resend}
                loading={busy === 'resend'}
                disabled={!!busy || resendIn > 0}
              >
                {resendIn > 0
                  ? `Gửi lại mã sau ${resendIn} giây`
                  : 'Gửi lại mã xác thực'}
              </Button>
              <button
                type="button"
                className="auth-text-button"
                disabled={!!busy}
                onClick={changeEmail}
              >
                Dùng email khác
              </button>
            </form>
          )}
          <p className="auth-form__links">
            <Link
              to="/register"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Quay lại đăng ký
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              to="/login"
              onClick={(event) => {
                if (busy) event.preventDefault();
              }}
            >
              Đăng nhập
            </Link>
          </p>
        </div>
      )}
    </AuthPageShell>
  );
}
