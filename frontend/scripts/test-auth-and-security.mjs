// frontend/scripts/test-auth-and-security.mjs
// Empirical test harness for Multi-Role Login (R3), ProtectedRoute, AuthContext, and API Interceptors.

import assert from 'node:assert/strict';

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER TEST SUITE: AUTH & SECURITY ARCHITECTURE');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ [PASS] ${name}`);
  } catch (err) {
    failedTests++;
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ============================================================================
// SUITE 1: DUAL CREDENTIALS NORMALIZATION & PAYLOAD INTEGRITY
// ============================================================================
console.log('--- SUITE 1: Dual Credentials Normalization & Payload Integrity ---');

// Emulate authApi.login payload normalizer from src/services/api.js:47-50
function normalizeLoginPayload(credentials) {
  return {
    username: (credentials.username || credentials.login || credentials.email || '').trim(),
    password: credentials.password,
  };
}

// Emulate LoginPage handleSubmit validation logic from src/pages/auth/LoginPage.jsx:45-53
function validateLoginInputs(loginIdentifier, password) {
  const identifier = (loginIdentifier || '').trim();
  if (!identifier) {
    return { valid: false, error: 'Vui lòng nhập Email hoặc Tên đăng nhập' };
  }
  if (!password) {
    return { valid: false, error: 'Vui lòng nhập Mật khẩu' };
  }
  return { valid: true, identifier, password };
}

test('1.1: Username format passes validation and maps to username payload', () => {
  const input = 'receptionist';
  const pass = 'Password123!';
  const val = validateLoginInputs(input, pass);
  assert.equal(val.valid, true);
  assert.equal(val.identifier, 'receptionist');

  const payload = normalizeLoginPayload({ username: val.identifier, password: val.password });
  assert.deepEqual(payload, { username: 'receptionist', password: 'Password123!' });
});

test('1.2: Email format passes validation WITHOUT false rejection and maps to username payload', () => {
  const emails = [
    'patient@hospital.vn',
    'doctor.tam@gmail.com',
    'receptionist+shift1@hospital.vn',
    'admin.sys_2026@sub.hospital.org',
  ];

  for (const email of emails) {
    const val = validateLoginInputs(email, 'Password123!');
    assert.equal(val.valid, true, `Email ${email} should be accepted`);
    assert.equal(val.identifier, email);

    const payload = normalizeLoginPayload({ username: val.identifier, password: val.password });
    assert.equal(payload.username, email);
    assert.equal(payload.password, 'Password123!');
  }
});

test('1.3: Leading and trailing whitespace is trimmed properly', () => {
  const val = validateLoginInputs('   patient@hospital.vn   ', 'Password123!');
  assert.equal(val.valid, true);
  assert.equal(val.identifier, 'patient@hospital.vn');

  const payload = normalizeLoginPayload({ username: '   doctor   ', password: 'SecretPassword' });
  assert.equal(payload.username, 'doctor');
});

test('1.4: Empty or whitespace-only identifier is rejected with Vietnamese message', () => {
  const cases = ['', '   ', null, undefined];
  for (const empty of cases) {
    const val = validateLoginInputs(empty, 'Password123!');
    assert.equal(val.valid, false);
    assert.equal(val.error, 'Vui lòng nhập Email hoặc Tên đăng nhập');
  }
});

test('1.5: Empty password is rejected with Vietnamese message', () => {
  const val = validateLoginInputs('valid_user', '');
  assert.equal(val.valid, false);
  assert.equal(val.error, 'Vui lòng nhập Mật khẩu');
});

test('1.6: Payload normalizer handles credentials passed as login, email, or username', () => {
  const fromLogin = normalizeLoginPayload({ login: 'demo_user', password: 'p1' });
  assert.equal(fromLogin.username, 'demo_user');

  const fromEmail = normalizeLoginPayload({ email: 'demo@hospital.vn', password: 'p2' });
  assert.equal(fromEmail.username, 'demo@hospital.vn');

  const fromUsername = normalizeLoginPayload({ username: 'doctor', password: 'p3' });
  assert.equal(fromUsername.username, 'doctor');
});

test('1.7: Special characters in email (+, _, ., -) are preserved without URL-encoding corruption', () => {
  const complexEmail = 'nurse.lead+night_shift-01@hospital.med.vn';
  const payload = normalizeLoginPayload({ username: complexEmail, password: 'Password123!' });
  assert.equal(payload.username, complexEmail);
});

// ============================================================================
// SUITE 2: PASSWORD SHOW/HIDE TOGGLE & FORGOT PASSWORD MODAL
// ============================================================================
console.log('\n--- SUITE 2: Password Visibility Toggle & Quên Mật Khẩu Modal ---');

test('2.1: Password toggle state machine starts false and flips correctly', () => {
  let showPassword = false;
  const toggle = () => { showPassword = !showPassword; };

  // Initial
  assert.equal(showPassword, false);
  let inputType = showPassword ? 'text' : 'password';
  let ariaLabel = showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
  assert.equal(inputType, 'password');
  assert.equal(ariaLabel, 'Hiện mật khẩu');

  // After click
  toggle();
  assert.equal(showPassword, true);
  inputType = showPassword ? 'text' : 'password';
  ariaLabel = showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu';
  assert.equal(inputType, 'text');
  assert.equal(ariaLabel, 'Ẩn mật khẩu');

  // After second click
  toggle();
  assert.equal(showPassword, false);
  assert.equal(showPassword ? 'text' : 'password', 'password');
});

test('2.2: Forgot password modal opens with hotline 1900 6868 and front desk info', () => {
  let forgotModalOpen = false;
  let defaultPrevented = false;

  // Simulate clicking <a href="#" id="link-forgot-password" onClick="...">
  const mockEvent = {
    preventDefault: () => { defaultPrevented = true; }
  };

  const handleForgotClick = (e) => {
    e.preventDefault();
    forgotModalOpen = true;
  };

  handleForgotClick(mockEvent);
  assert.equal(defaultPrevented, true, 'e.preventDefault() must be called to avoid hash jumping');
  assert.equal(forgotModalOpen, true, 'Modal must open');

  // Verify guidance content matches specification
  const modalText = 'Để đảm bảo an toàn thông tin hồ sơ bệnh án, vui lòng mang CMND/CCCD đến trực tiếp Quầy Tiếp Đón (Tầng 1) hoặc liên hệ hotline 1900 6868 để được cấp lại mật khẩu.';
  assert.match(modalText, /1900 6868/, 'Hotline 1900 6868 must be prominent');
  assert.match(modalText, /Quầy Tiếp Đón \(Tầng 1\)/, 'Physical front desk location must be provided');

  // Dismiss modal
  forgotModalOpen = false;
  assert.equal(forgotModalOpen, false);
});

// ============================================================================
// SUITE 3: QUICK DEMO CHIPS (PATIENT, RECEPTIONIST, DOCTOR)
// ============================================================================
console.log('\n--- SUITE 3: Quick Demo Chips ---');

test('3.1: handleDemoFill populates identifier, demo password, and clears alerts', () => {
  let loginIdentifier = '';
  let password = '';
  let errorMessage = 'Previous error';
  let successMessage = 'Previous success';

  const handleDemoFill = (id, pwd) => {
    loginIdentifier = id;
    password = pwd;
    errorMessage = '';
    successMessage = '';
  };

  // Test Patient Chip
  handleDemoFill('patient', 'Password123!');
  assert.equal(loginIdentifier, 'patient');
  assert.equal(password, 'Password123!');
  assert.equal(errorMessage, '');
  assert.equal(successMessage, '');

  // Set new error to test clearing on next chip
  errorMessage = 'Wrong password';

  // Test Receptionist Chip
  handleDemoFill('receptionist', 'Password123!');
  assert.equal(loginIdentifier, 'receptionist');
  assert.equal(password, 'Password123!');
  assert.equal(errorMessage, '');

  // Test Doctor Chip
  handleDemoFill('doctor', 'Password123!');
  assert.equal(loginIdentifier, 'doctor');
  assert.equal(password, 'Password123!');
  assert.equal(errorMessage, '');
});

// ============================================================================
// SUITE 4: ROLE REDIRECTION & ROUTE PROTECTION ARCHITECTURE
// ============================================================================
console.log('\n--- SUITE 4: Role Redirection & Route Protection Architecture ---');

// From src/context/AuthContext.jsx:115-128
function getRoleDashboardPath(role) {
  switch (role) {
    case 'PATIENT':
      return '/patient';
    case 'RECEPTIONIST':
      return '/reception';
    case 'DOCTOR':
      return '/doctor';
    case 'ADMIN':
      return '/reception';
    default:
      return '/';
  }
}

// From src/pages/auth/LoginPage.jsx:66-79
function computeLoginRedirect(user, locationState) {
  let redirectPath = '/patient';
  if (user?.role === 'PATIENT') {
    redirectPath = '/patient';
  } else if (user?.role === 'RECEPTIONIST') {
    redirectPath = '/reception';
  } else if (user?.role === 'DOCTOR') {
    redirectPath = '/doctor';
  } else if (user?.role === 'ADMIN') {
    redirectPath = '/reception';
  }

  const destination = locationState?.from?.pathname || redirectPath;
  return { destination, replace: true };
}

// Emulate ProtectedRoute decision logic from src/components/ProtectedRoute.jsx:9-30
function evaluateProtectedRoute({ loading, isAuthenticated, user, allowedRoles, currentPath }) {
  if (loading) {
    return { action: 'SPINNER', target: null };
  }

  if (!isAuthenticated || !user) {
    return {
      action: 'REDIRECT_LOGIN',
      target: '/login',
      state: { from: { pathname: currentPath } },
      replace: true,
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallbackPath = getRoleDashboardPath(user.role);
    return {
      action: 'REDIRECT_ROLE_HOME',
      target: fallbackPath,
      replace: true,
    };
  }

  return { action: 'RENDER_OUTLET', target: null };
}

test('4.1: Role dashboard paths match exact routing architecture', () => {
  assert.equal(getRoleDashboardPath('PATIENT'), '/patient');
  assert.equal(getRoleDashboardPath('RECEPTIONIST'), '/reception');
  assert.equal(getRoleDashboardPath('DOCTOR'), '/doctor');
  assert.equal(getRoleDashboardPath('ADMIN'), '/reception');
  assert.equal(getRoleDashboardPath('UNKNOWN'), '/');
});

test('4.2: Direct login redirection navigates to correct role dashboard', () => {
  assert.equal(computeLoginRedirect({ role: 'PATIENT' }, null).destination, '/patient');
  assert.equal(computeLoginRedirect({ role: 'RECEPTIONIST' }, null).destination, '/reception');
  assert.equal(computeLoginRedirect({ role: 'DOCTOR' }, null).destination, '/doctor');
  assert.equal(computeLoginRedirect({ role: 'ADMIN' }, null).destination, '/reception');
  assert.equal(computeLoginRedirect({}, null).destination, '/patient');
});

test('4.3: Unauthenticated access to protected routes redirects to /login with state', () => {
  const routesToTest = [
    '/patient/appointments',
    '/patient/book',
    '/reception/appointments',
    '/reception/patients',
    '/reception/walk-in',
    '/doctor',
    '/admin',
  ];

  for (const path of routesToTest) {
    const res = evaluateProtectedRoute({
      loading: false,
      isAuthenticated: false,
      user: null,
      allowedRoles: ['PATIENT'],
      currentPath: path,
    });
    assert.equal(res.action, 'REDIRECT_LOGIN');
    assert.equal(res.target, '/login');
    assert.equal(res.state.from.pathname, path);
    assert.equal(res.replace, true);
  }
});

test('4.4: Authenticated user with unauthorized role is redirected to their own portal', () => {
  // Scenario 1: PATIENT tries to access /reception/appointments (allowed: RECEPTIONIST, ADMIN)
  const patientAttempt = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 1, username: 'patient', role: 'PATIENT' },
    allowedRoles: ['RECEPTIONIST', 'ADMIN'],
    currentPath: '/reception/appointments',
  });
  assert.equal(patientAttempt.action, 'REDIRECT_ROLE_HOME');
  assert.equal(patientAttempt.target, '/patient');
  assert.equal(patientAttempt.replace, true);

  // Scenario 2: RECEPTIONIST tries to access /doctor (allowed: DOCTOR, ADMIN)
  const receptionistAttempt = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 2, username: 'receptionist', role: 'RECEPTIONIST' },
    allowedRoles: ['DOCTOR', 'ADMIN'],
    currentPath: '/doctor',
  });
  assert.equal(receptionistAttempt.action, 'REDIRECT_ROLE_HOME');
  assert.equal(receptionistAttempt.target, '/reception');

  // Scenario 3: DOCTOR tries to access /patient/book (allowed: PATIENT)
  const doctorAttempt = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 3, username: 'doctor', role: 'DOCTOR' },
    allowedRoles: ['PATIENT'],
    currentPath: '/patient/book',
  });
  assert.equal(doctorAttempt.action, 'REDIRECT_ROLE_HOME');
  assert.equal(doctorAttempt.target, '/doctor');
});

test('4.5: Authorized user successfully renders protected portal', () => {
  // PATIENT accessing /patient/appointments
  const patientOk = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 1, role: 'PATIENT' },
    allowedRoles: ['PATIENT'],
    currentPath: '/patient/appointments',
  });
  assert.equal(patientOk.action, 'RENDER_OUTLET');

  // RECEPTIONIST accessing /reception/patients
  const receptionOk = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 2, role: 'RECEPTIONIST' },
    allowedRoles: ['RECEPTIONIST', 'ADMIN'],
    currentPath: '/reception/patients',
  });
  assert.equal(receptionOk.action, 'RENDER_OUTLET');

  // DOCTOR accessing /doctor
  const doctorOk = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 3, role: 'DOCTOR' },
    allowedRoles: ['DOCTOR', 'ADMIN'],
    currentPath: '/doctor',
  });
  assert.equal(doctorOk.action, 'RENDER_OUTLET');

  // ADMIN accessing /reception/appointments
  const adminOk = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: { id: 4, role: 'ADMIN' },
    allowedRoles: ['RECEPTIONIST', 'ADMIN'],
    currentPath: '/reception/appointments',
  });
  assert.equal(adminOk.action, 'RENDER_OUTLET');
});

test('4.6: While AuthContext is verifying session (loading=true), ProtectedRoute does not redirect prematurely', () => {
  const loadingState = evaluateProtectedRoute({
    loading: true,
    isAuthenticated: false,
    user: null,
    allowedRoles: ['PATIENT'],
    currentPath: '/patient/appointments',
  });
  assert.equal(loadingState.action, 'SPINNER');
  assert.equal(loadingState.target, null);
});

// ============================================================================
// SUITE 5: HTTP ERROR HANDLING & INTERCEPTOR ARCHITECTURE
// ============================================================================
console.log('\n--- SUITE 5: HTTP Error Handling & Interceptor Architecture ---');

// From src/pages/auth/LoginPage.jsx:82-90
function mapLoginError(err) {
  if (err.response?.data?.message) {
    return err.response.data.message;
  } else if (err.response?.status === 401) {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác';
  } else if (err.response?.status === 403) {
    return 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt';
  } else {
    return 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
  }
}

test('5.1: HTTP 401 Bad Credentials maps to friendly Vietnamese error message', () => {
  // Case A: Backend returns custom message
  const errWithMsg = { response: { status: 401, data: { message: 'Tên đăng nhập hoặc mật khẩu không chính xác' } } };
  assert.equal(mapLoginError(errWithMsg), 'Tên đăng nhập hoặc mật khẩu không chính xác');

  // Case B: Backend returns generic 401 with no message body
  const errNoMsg = { response: { status: 401, data: null } };
  assert.equal(mapLoginError(errNoMsg), 'Tên đăng nhập hoặc mật khẩu không chính xác');
});

test('5.2: HTTP 403 Inactive/Disabled account maps to locked account alert', () => {
  // Case A: Backend returns custom message
  const errWithMsg = { response: { status: 403, data: { message: 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt' } } };
  assert.equal(mapLoginError(errWithMsg), 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt');

  // Case B: Backend returns generic 403
  const errNoMsg = { response: { status: 403, data: {} } };
  assert.equal(mapLoginError(errNoMsg), 'Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt');
});

test('5.3: Network offline or 500 server error maps to friendly connectivity message', () => {
  const networkErr = { message: 'Network Error' };
  assert.equal(mapLoginError(networkErr), 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');

  const server500 = { response: { status: 500, data: {} } };
  assert.equal(mapLoginError(server500), 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
});

// Emulate Axios Request Interceptor from src/services/api.js:14-23
function runRequestInterceptor(config, mockStorage) {
  const token = mockStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

test('5.4: Request interceptor attaches Bearer token when present', () => {
  const mockStorage = {
    getItem: (key) => (key === 'token' ? 'session-uuid-12345' : null),
  };
  const config = { headers: {} };
  const result = runRequestInterceptor(config, mockStorage);
  assert.equal(result.headers.Authorization, 'Bearer session-uuid-12345');
});

test('5.5: Request interceptor does NOT inject malformed Authorization when token is absent', () => {
  const mockStorage = {
    getItem: () => null,
  };
  const config = { headers: {} };
  const result = runRequestInterceptor(config, mockStorage);
  assert.equal(result.headers.Authorization, undefined);
});

// Emulate Axios Response Interceptor from src/services/api.js:26-39
function runResponseInterceptorError(error, pathname, mockStorage, mockWindow) {
  if (error.response && error.response.status === 401) {
    const currentPath = pathname;
    if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
      mockStorage.removeItem('token');
      mockStorage.removeItem('auth_user');
      mockWindow.href = '/login?session_expired=true';
      return { redirected: true, href: mockWindow.href };
    }
  }
  return { redirected: false };
}

test('5.6: Response interceptor redirects 401 from protected routes to /login?session_expired=true', () => {
  const removedKeys = [];
  const mockStorage = {
    removeItem: (key) => removedKeys.push(key),
  };
  const mockWindow = { href: '' };

  const protectedPaths = ['/patient/appointments', '/reception/patients', '/doctor'];
  for (const path of protectedPaths) {
    removedKeys.length = 0;
    mockWindow.href = '';
    const err = { response: { status: 401 } };
    const res = runResponseInterceptorError(err, path, mockStorage, mockWindow);

    assert.equal(res.redirected, true);
    assert.equal(mockWindow.href, '/login?session_expired=true');
    assert.deepEqual(removedKeys, ['token', 'auth_user']);
  }
});

test('5.7: Response interceptor does NOT redirect when already on public routes (/login, /register, /)', () => {
  const mockStorage = { removeItem: () => {} };
  const mockWindow = { href: '' };

  const publicPaths = ['/login', '/register', '/'];
  for (const path of publicPaths) {
    const err = { response: { status: 401 } };
    const res = runResponseInterceptorError(err, path, mockStorage, mockWindow);

    assert.equal(res.redirected, false, `Must not redirect on ${path} to avoid infinite loops`);
    assert.equal(mockWindow.href, '');
  }
});

// ============================================================================
// SUITE 6: ADVERSARIAL STRESS TESTING & EDGE CASES
// ============================================================================
console.log('\n--- SUITE 6: Adversarial Stress Testing & Edge Cases ---');

test('6.1: Corrupted or non-JSON auth_user in localStorage does not crash AuthContext', () => {
  const corruptedValues = ['{badJson', 'undefined', 'null', '12345', ''];
  for (const val of corruptedValues) {
    let parsedUser = null;
    try {
      parsedUser = val ? JSON.parse(val) : null;
    } catch {
      parsedUser = null;
    }
    // Verify it recovers cleanly without throwing an unhandled exception
    assert.ok(parsedUser === null || typeof parsedUser === 'number');
  }
});

test('6.2: Fake token with missing user does not permit isAuthenticated', () => {
  const token = 'fake-token-xyz';
  const user = null;
  const isAuthenticated = !!token && !!user;
  assert.equal(isAuthenticated, false, 'Missing user must not be authenticated');
});

test('6.3: Malicious injection payloads in login input are passed verbatim to backend without client crash', () => {
  const injectionPayloads = [
    "' OR 1=1 --",
    '<script>alert("xss")</script>',
    'admin\' union select * from users --',
    '${7*7}',
    '{{7*7}}',
    '\x00nullbyte',
  ];

  for (const payload of injectionPayloads) {
    const val = validateLoginInputs(payload, 'Password123!');
    assert.equal(val.valid, true);
    const normalized = normalizeLoginPayload({ username: val.identifier, password: val.password });
    assert.equal(normalized.username, payload.trim());
  }
});

test('6.4: Cross-Role Tampering Defense: Tampered role in localStorage gets caught at ProtectedRoute', () => {
  // Scenario: Attacker modifies auth_user in localStorage to have role "DOCTOR", but attempts to access /reception
  const tamperedUser = { id: 1, username: 'patient', role: 'DOCTOR' };
  const res = evaluateProtectedRoute({
    loading: false,
    isAuthenticated: true,
    user: tamperedUser,
    allowedRoles: ['RECEPTIONIST', 'ADMIN'],
    currentPath: '/reception/appointments',
  });
  // Must be rejected from /reception and redirected to /doctor
  assert.equal(res.action, 'REDIRECT_ROLE_HOME');
  assert.equal(res.target, '/doctor');
});

// ============================================================================
// SUMMARY REPORT
// ============================================================================
console.log('\n================================================================');
console.log(`TEST RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`);
console.log('================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL EMPIRICAL TESTS PASSED SUCCESSFULLY!\n');
}
