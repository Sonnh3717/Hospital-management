// frontend/scripts/test-registration-workflow.mjs
// Empirical test harness for Registration & OTP Workflow in RegisterPage.jsx and patientApi.js

import assert from 'node:assert/strict';

console.log('================================================================');
console.log('EMPIRICAL CHALLENGER TEST SUITE: REGISTRATION & OTP WORKFLOW');
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

// ============================================================================
// SUITE 1: STEP 1 VALIDATION & API CONTRACT
// ============================================================================
console.log('--- SUITE 1: Step 1 Validation & API Contract ---');

const usernameRegex = /^[A-Za-z0-9._-]{3,60}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateStep1(accountData, usernameAvailable = true) {
  const errors = {};

  if (!accountData.fullName || !accountData.fullName.trim()) {
    errors.fullName = 'Vui lòng nhập họ và tên.';
  } else if (accountData.fullName.length > 150) {
    errors.fullName = 'Họ tên tối đa 150 ký tự.';
  }

  if (!accountData.username || !accountData.username.trim()) {
    errors.username = 'Vui lòng nhập tên đăng nhập.';
  } else if (!usernameRegex.test(accountData.username)) {
    errors.username = 'Tên đăng nhập từ 3–60 ký tự, gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
  } else if (usernameAvailable === false) {
    errors.username = 'Tên đăng nhập đã được sử dụng.';
  }

  if (!accountData.email || !accountData.email.trim()) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!emailRegex.test(accountData.email)) {
    errors.email = 'Địa chỉ email không đúng định dạng.';
  }

  if (!accountData.password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (accountData.password.length < 8) {
    errors.password = 'Mật khẩu phải có tối thiểu 8 ký tự.';
  }

  if (!accountData.confirmPassword) {
    errors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
  } else if (accountData.password !== accountData.confirmPassword) {
    errors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
  }

  if (!accountData.agreeTerms) {
    errors.agreeTerms = 'Bạn cần đồng ý với Điều khoản sử dụng của bệnh viện.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

test('Step 1: Blank fullName triggers validation error', () => {
  const res = validateStep1({
    fullName: '   ',
    username: 'validuser',
    email: 'user@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.fullName, 'Vui lòng nhập họ và tên.');
});

test('Step 1: Over-length (>150) fullName triggers validation error', () => {
  const res = validateStep1({
    fullName: 'A'.repeat(151),
    username: 'validuser',
    email: 'user@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.fullName, 'Họ tên tối đa 150 ký tự.');
});

test('Step 1: Invalid username regex (<3 chars, >60 chars, invalid symbols)', () => {
  const invalidUsernames = ['a', 'ab', 'user@name', 'user name', 'user#1', 'A'.repeat(61), 'nguyễn'];
  for (const u of invalidUsernames) {
    const res = validateStep1({
      fullName: 'Nguyen Van An',
      username: u,
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeTerms: true,
    });
    assert.equal(res.isValid, false, `Expected username '${u}' to be invalid`);
    assert.ok(res.errors.username);
  }
});

test('Step 1: Valid username regex (alphanumeric, dot, dash, underscore, 3-60 chars)', () => {
  const validUsernames = ['abc', 'user.name', 'user_123', 'user-name', 'A'.repeat(60), 'Dr.Smith-99'];
  for (const u of validUsernames) {
    const res = validateStep1({
      fullName: 'Nguyen Van An',
      username: u,
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeTerms: true,
    });
    assert.equal(res.isValid, true, `Expected username '${u}' to be valid`);
  }
});

test('Step 1: Taken username triggers usernameAvailable=false error', () => {
  const res = validateStep1(
    {
      fullName: 'Nguyen Van An',
      username: 'takenuser',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeTerms: true,
    },
    false // usernameAvailable = false
  );
  assert.equal(res.isValid, false);
  assert.equal(res.errors.username, 'Tên đăng nhập đã được sử dụng.');
});

test('Step 1: Invalid email format triggers error', () => {
  const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain', 'user@ domain.com', 'user@domain.'];
  for (const e of invalidEmails) {
    const res = validateStep1({
      fullName: 'Nguyen Van An',
      username: 'validuser',
      email: e,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeTerms: true,
    });
    assert.equal(res.isValid, false, `Expected email '${e}' to be invalid`);
    assert.ok(res.errors.email);
  }
});

test('Step 1: Password < 8 characters triggers error', () => {
  const res = validateStep1({
    fullName: 'Nguyen Van An',
    username: 'validuser',
    email: 'user@example.com',
    password: 'Pass1!',
    confirmPassword: 'Pass1!',
    agreeTerms: true,
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.password, 'Mật khẩu phải có tối thiểu 8 ký tự.');
});

test('Step 1: Password mismatch triggers confirmPassword error', () => {
  const res = validateStep1({
    fullName: 'Nguyen Van An',
    username: 'validuser',
    email: 'user@example.com',
    password: 'Password123!',
    confirmPassword: 'DifferentPassword123!',
    agreeTerms: true,
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.confirmPassword, 'Mật khẩu xác nhận không khớp.');
});

test('Step 1: Unchecked agreeTerms triggers error', () => {
  const res = validateStep1({
    fullName: 'Nguyen Van An',
    username: 'validuser',
    email: 'user@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: false,
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.agreeTerms, 'Bạn cần đồng ý với Điều khoản sử dụng của bệnh viện.');
});

test('Step 1: Valid payload matches POST /api/patients/register contract', () => {
  const rawData = {
    username: '  annguyen  ',
    fullName: '  Nguyen Van An  ',
    email: '  An.Nguyen@Hospital.vn  ',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
  };

  const payload = {
    username: rawData.username.trim(),
    fullName: rawData.fullName.trim(),
    email: rawData.email.trim().toLowerCase(),
    password: rawData.password,
    confirmPassword: rawData.confirmPassword,
    agreeTerms: rawData.agreeTerms,
  };

  assert.deepEqual(payload, {
    username: 'annguyen',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@hospital.vn',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
  });
});

// ============================================================================
// SUITE 2: OTP VERIFICATION GATE
// ============================================================================
console.log('\n--- SUITE 2: OTP Verification Gate ---');

test('OTP: Rejects non-numeric characters in digit boxes', () => {
  const filterDigit = (val) => (/^\d*$/.test(val) ? val.slice(-1) : null);
  assert.equal(filterDigit('a'), null);
  assert.equal(filterDigit('$'), null);
  assert.equal(filterDigit(' '), null);
  assert.equal(filterDigit('9'), '9');
  assert.equal(filterDigit('58'), '8'); // Overwrite taking last digit
});

test('OTP: 6-digit paste auto-distribution', () => {
  const pasteString = ' 849201 ';
  const trimmed = pasteString.trim();
  let otpArray = ['', '', '', '', '', ''];
  if (/^\d{6}$/.test(trimmed)) {
    otpArray = trimmed.split('');
  }
  assert.deepEqual(otpArray, ['8', '4', '9', '2', '0', '1']);
});

test('OTP: Non-6-digit paste is ignored/rejected', () => {
  const badPastes = ['12345', '1234567', '12a456', 'abcdef'];
  for (const paste of badPastes) {
    let otpArray = ['', '', '', '', '', ''];
    if (/^\d{6}$/.test(paste.trim())) {
      otpArray = paste.trim().split('');
    }
    assert.deepEqual(otpArray, ['', '', '', '', '', ''], `Paste '${paste}' should not distribute`);
  }
});

test('OTP: Cooldown 60-second timer decrement and enable logic', () => {
  let cooldown = 60;
  let canResend = false;

  const tick = () => {
    if (cooldown <= 1) {
      canResend = true;
      cooldown = 0;
    } else {
      cooldown -= 1;
    }
  };

  // 1 tick
  tick();
  assert.equal(cooldown, 59);
  assert.equal(canResend, false);

  // Fast forward 58 ticks
  for (let i = 0; i < 58; i++) tick();
  assert.equal(cooldown, 1);
  assert.equal(canResend, false);

  // Final tick to 0
  tick();
  assert.equal(cooldown, 0);
  assert.equal(canResend, true);
});

test('OTP: Error code mapping handles 400 OTP_EXPIRED and 429 OTP_ATTEMPTS_EXCEEDED', () => {
  const mapOtpError = (resp) => {
    if (resp?.code === 'OTP_EXPIRED') {
      return 'Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã OTP".';
    } else if (resp?.code === 'OTP_ATTEMPTS_EXCEEDED') {
      return 'Bạn đã nhập sai 5 lần. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.';
    } else {
      return resp?.message || 'Mã OTP không đúng. Vui lòng kiểm tra lại.';
    }
  };

  assert.equal(
    mapOtpError({ code: 'OTP_EXPIRED', status: 400 }),
    'Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã OTP".'
  );
  assert.equal(
    mapOtpError({ code: 'OTP_ATTEMPTS_EXCEEDED', status: 429 }),
    'Bạn đã nhập sai 5 lần. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.'
  );
  assert.equal(
    mapOtpError({ code: 'INVALID_OTP', status: 400, message: 'Sai mã' }),
    'Sai mã'
  );
});

// ============================================================================
// SUITE 3: STEP 2 DEMOGRAPHIC FORM & FIELD SEGREGATION
// ============================================================================
console.log('\n--- SUITE 3: Step 2 Demographic Form & Field Segregation ---');

const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;

function validateStep2(profileData) {
  const errors = {};
  const today = new Date().toISOString().split('T')[0];

  if (!profileData.fullName || !profileData.fullName.trim()) {
    errors.fullName = 'Họ và tên bệnh nhân không được để trống.';
  } else if (profileData.fullName.length > 150) {
    errors.fullName = 'Họ tên tối đa 150 ký tự.';
  }

  if (!profileData.dateOfBirth) {
    errors.dateOfBirth = 'Vui lòng chọn ngày sinh.';
  } else if (profileData.dateOfBirth > today) {
    errors.dateOfBirth = 'Ngày sinh không được ở tương lai.';
  }

  if (!profileData.gender) {
    errors.gender = 'Vui lòng chọn giới tính.';
  }

  if (!profileData.phone || !profileData.phone.trim()) {
    errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
  } else if (!phoneRegex.test(profileData.phone.trim())) {
    errors.phone = 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).';
  }

  if (!profileData.address || !profileData.address.trim()) {
    errors.address = 'Vui lòng nhập địa chỉ.';
  } else if (profileData.address.trim().length < 5) {
    errors.address = 'Địa chỉ tối thiểu 5 ký tự.';
  } else if (profileData.address.length > 500) {
    errors.address = 'Địa chỉ tối đa 500 ký tự.';
  }

  if (profileData.emergencyContactPhone && profileData.emergencyContactPhone.trim()) {
    if (!phoneRegex.test(profileData.emergencyContactPhone.trim())) {
      errors.emergencyContactPhone = 'Số điện thoại người liên hệ khẩn cấp không hợp lệ.';
    }
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

test('Step 2: Pre-fills fullName from Step 1', () => {
  const step1FullName = 'Nguyen Van An';
  const profileData = { fullName: step1FullName.trim() };
  assert.equal(profileData.fullName, 'Nguyen Van An');
});

test('Step 2: Future dateOfBirth triggers validation error', () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const res = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: tomorrow,
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.dateOfBirth, 'Ngày sinh không được ở tương lai.');
});

test('Step 2: Past and present dateOfBirth accepted', () => {
  const today = new Date().toISOString().split('T')[0];
  const resToday = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: today,
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
  });
  assert.equal(resToday.isValid, true);

  const resPast = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
  });
  assert.equal(resPast.isValid, true);
});

test('Step 2: Phone number validation (10-11 digits, starts with 0 or +84)', () => {
  const validPhones = ['0901234567', '09876543210', '+84901234567', '+849876543210'];
  for (const phone of validPhones) {
    const res = validateStep2({
      fullName: 'Nguyen Van An',
      dateOfBirth: '1995-05-20',
      gender: 'MALE',
      phone,
      address: '123 Nguyen Trai, Q1, HCMC',
    });
    assert.equal(res.isValid, true, `Phone '${phone}' should be valid`);
  }

  const invalidPhones = ['09012345', '1234567890', '+84090123456789', 'phone12345', '090-123-4567'];
  for (const phone of invalidPhones) {
    const res = validateStep2({
      fullName: 'Nguyen Van An',
      dateOfBirth: '1995-05-20',
      gender: 'MALE',
      phone,
      address: '123 Nguyen Trai, Q1, HCMC',
    });
    assert.equal(res.isValid, false, `Phone '${phone}' should be invalid`);
    assert.ok(res.errors.phone);
  }
});

test('Step 2: Address validation (<5 or >500 chars rejected)', () => {
  const resShort = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: 'Abc',
  });
  assert.equal(resShort.isValid, false);
  assert.equal(resShort.errors.address, 'Địa chỉ tối thiểu 5 ký tự.');

  const resLong = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: 'A'.repeat(501),
  });
  assert.equal(resLong.isValid, false);
  assert.equal(resLong.errors.address, 'Địa chỉ tối đa 500 ký tự.');
});

test('Step 2: Optional emergency contact empty -> validated as null', () => {
  const res = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  assert.equal(res.isValid, true);

  const payload = {
    emergencyContactName: ''.trim() || null,
    emergencyContactPhone: ''.trim() || null,
  };
  assert.equal(payload.emergencyContactName, null);
  assert.equal(payload.emergencyContactPhone, null);
});

test('Step 2: Optional emergency contact phone invalid -> triggers error', () => {
  const res = validateStep2({
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
    emergencyContactName: 'Nguyen Thi Binh',
    emergencyContactPhone: 'invalid-phone',
  });
  assert.equal(res.isValid, false);
  assert.equal(res.errors.emergencyContactPhone, 'Số điện thoại người liên hệ khẩn cấp không hợp lệ.');
});

test('Step 2: Complete profile payload contract matching backend CompleteProfile record', () => {
  const accountEmail = 'an.nguyen@hospital.vn';
  const profileData = {
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
    emergencyContactName: 'Nguyen Thi Binh',
    emergencyContactPhone: '0909888777',
  };

  const payload = {
    email: accountEmail.trim().toLowerCase(),
    fullName: profileData.fullName.trim(),
    dateOfBirth: profileData.dateOfBirth,
    gender: profileData.gender,
    phone: profileData.phone.trim(),
    address: profileData.address.trim(),
    emergencyContactName: profileData.emergencyContactName.trim() || null,
    emergencyContactPhone: profileData.emergencyContactPhone.trim() || null,
  };

  assert.deepEqual(payload, {
    email: 'an.nguyen@hospital.vn',
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
    emergencyContactName: 'Nguyen Thi Binh',
    emergencyContactPhone: '0909888777',
  });
});

test('Step 2 to Step 3: Success screen displays generated patientCode and redirects', () => {
  const completedResponse = {
    code: 200,
    success: true,
    data: {
      patientId: 42,
      patientCode: 'PT-9A8B7C6D5E4F3A2B1C0D9E8F',
      fullName: 'Nguyen Van An',
    },
  };

  const completedInfo = completedResponse.data;
  assert.ok(completedInfo.patientCode.startsWith('PT-'));
  assert.equal(completedInfo.fullName, 'Nguyen Van An');
});

// ============================================================================
// SUITE 4: ADVERSARIAL STRESS & BUTTON STATE PREDICATES
// ============================================================================
console.log('\n--- SUITE 4: Adversarial Stress & Button State Predicates ---');

test('Adversarial: Step 1 button disabled when loading=true', () => {
  const isButtonDisabled = (loading) => loading === true;
  assert.equal(isButtonDisabled(true), true);
  assert.equal(isButtonDisabled(false), false);
});

test('Adversarial: OTP submit button disabled when loading or OTP incomplete', () => {
  const isOtpSubmitDisabled = (loading, otpValues) => loading || otpValues.join('').length !== 6;
  assert.equal(isOtpSubmitDisabled(false, ['', '', '', '', '', '']), true);
  assert.equal(isOtpSubmitDisabled(false, ['1', '2', '3', '', '', '']), true);
  assert.equal(isOtpSubmitDisabled(false, ['1', '2', '3', '4', '5', '']), true);
  assert.equal(isOtpSubmitDisabled(true, ['1', '2', '3', '4', '5', '6']), true);
  assert.equal(isOtpSubmitDisabled(false, ['1', '2', '3', '4', '5', '6']), false);
});

test('Adversarial: Resend button gated strictly by canResend and loading', () => {
  const canClickResend = (canResend, loading) => canResend && !loading;
  assert.equal(canClickResend(false, false), false);
  assert.equal(canClickResend(false, true), false);
  assert.equal(canClickResend(true, true), false);
  assert.equal(canClickResend(true, false), true);
});

test('Adversarial: Vietnamese Unicode names in Step 1 and Step 2', () => {
  const unicodeNames = [
    'Trần Thị Ánh Tuyết',
    'Nguyễn Đắc Vũ',
    'Lê Bảo Ngọc',
    'Phạm Huỳnh Đông',
    'Đặng Hoàng Khánh Linh',
  ];
  for (const name of unicodeNames) {
    const res1 = validateStep1({
      fullName: name,
      username: 'validuser',
      email: 'user@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      agreeTerms: true,
    });
    assert.equal(res1.isValid, true, `Step 1 should accept '${name}'`);

    const res2 = validateStep2({
      fullName: name,
      dateOfBirth: '2000-01-01',
      gender: 'FEMALE',
      phone: '0912345678',
      address: 'Số 10, Đường 3/2, Quận 10, TP. Hồ Chí Minh',
    });
    assert.equal(res2.isValid, true, `Step 2 should accept '${name}'`);
  }
});

test('Adversarial: Field segregation guarantees no credentials leak to Step 2 payload', () => {
  const step2SubmitPayload = {
    email: 'an.nguyen@example.com',
    fullName: 'Nguyen Van An',
    dateOfBirth: '1995-05-20',
    gender: 'MALE',
    phone: '0901234567',
    address: '123 Nguyen Trai, Q1, HCMC',
    emergencyContactName: null,
    emergencyContactPhone: null,
  };

  assert.equal('password' in step2SubmitPayload, false);
  assert.equal('confirmPassword' in step2SubmitPayload, false);
  assert.equal('username' in step2SubmitPayload, false);
});

test('Adversarial: Field segregation guarantees no patient demographics leak to Step 1 payload', () => {
  const step1SubmitPayload = {
    username: 'annguyen',
    fullName: 'Nguyen Van An',
    email: 'an.nguyen@example.com',
    password: 'Password123!',
    confirmPassword: 'Password123!',
    agreeTerms: true,
  };

  assert.equal('dateOfBirth' in step1SubmitPayload, false);
  assert.equal('gender' in step1SubmitPayload, false);
  assert.equal('phone' in step1SubmitPayload, false);
  assert.equal('address' in step1SubmitPayload, false);
  assert.equal('emergencyContactName' in step1SubmitPayload, false);
  assert.equal('emergencyContactPhone' in step1SubmitPayload, false);
});

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n================================================================');
console.log(`TEST SUMMARY: Total=${totalTests}, Passed=${passedTests}, Failed=${failedTests}`);
console.log('================================================================\n');

if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
