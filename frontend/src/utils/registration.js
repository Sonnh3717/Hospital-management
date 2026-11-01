const storageKey = 'swd.registration';

export function readRegistration() {
  try {
    return JSON.parse(sessionStorage.getItem(storageKey) || 'null') || {};
  } catch {
    return {};
  }
}

export function rememberRegistration(values) {
  const { email, username, otpExpiresAt, resendAvailableAt } = values;
  try {
    sessionStorage.setItem(
      storageKey,
      JSON.stringify({ email, username, otpExpiresAt, resendAvailableAt }),
    );
  } catch {
    // Route state still keeps the verification page usable in this visit.
  }
}

export function forgetRegistration() {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // Verification remains usable if browser storage is unavailable.
  }
}

export function registrationErrors(values) {
  const errors = {};
  if (!/^[A-Za-z0-9._-]{3,60}$/.test(values.username.trim())) {
    errors.username =
      'Tên đăng nhập gồm 3–60 ký tự: chữ không dấu, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  }
  if (!values.fullName.trim()) errors.fullName = 'Vui lòng nhập họ và tên.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Vui lòng nhập địa chỉ email hợp lệ.';
  }
  if (values.password.length < 8) {
    errors.password = 'Mật khẩu cần ít nhất 8 ký tự.';
  } else if (new TextEncoder().encode(values.password).length > 72) {
    errors.password =
      'Mật khẩu quá dài. Vui lòng dùng tối đa 72 ký tự không dấu hoặc giảm số ký tự có dấu.';
  }
  if (!values.confirmPassword || values.confirmPassword !== values.password) {
    errors.confirmPassword = 'Mật khẩu xác nhận chưa khớp.';
  }
  if (!values.agreeTerms)
    errors.agreeTerms = 'Vui lòng đồng ý trước khi đăng ký.';
  return errors;
}

export function authDestination(role) {
  return (
    {
      RECEPTIONIST: '/reception/appointments',
      DOCTOR: '/doctor/patients',
      MEDICAL_SERVICE_STAFF: '/services/queue',
    }[role] || '/'
  );
}
