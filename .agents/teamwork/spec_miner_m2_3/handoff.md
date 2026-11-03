# Handoff Report: 2-Step Patient Registration Workflow Specification (R2)

**Agent**: `spec_miner_m2_3`  
**Role**: Patient Registration Specification Miner (Milestone 2)  
**Parent Conversation ID**: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`  
**Target File**: `src/pages/auth/RegisterPage.jsx` & `src/services/patientApi.js`  
**Date**: 2026-11-02  

---

## 1. Observation

Direct observations from the authoritative codebase:

1. **Patient Registration Controller & Endpoints**:
   - Location: `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
   - Line 15: Controller base mapping is `@RequestMapping("/api/patients")`.
   - Line 23-26: `@PostMapping("/register")` takes `@Valid @RequestBody RegistrationCommands.Register input` and returns `OtpView`. (Note: Endpoint path is `/api/patients/register`, NOT `/api/auth/register`).
   - Line 28-31: `@PostMapping("/send-otp")` takes `@Valid @RequestBody RegistrationCommands.SendOtp input` and returns `OtpView`. (Note: Endpoint path is `/api/patients/send-otp`, NOT `/api/patients/resend-otp`).
   - Line 33-36: `@PostMapping("/verify-otp")` takes `@Valid @RequestBody RegistrationCommands.VerifyOtp input` and returns `VerifiedView`.
   - Line 38-42: `@PostMapping("/complete-profile")` takes `@Valid @RequestBody RegistrationCommands.CompleteProfile input` and returns `ApiResponse<CompletedProfileView>`.
   - Line 44-47: `@GetMapping("/check-username")` takes `@RequestParam(required = false) String username` and returns `boolean`.

2. **Security Whitelist Permissions**:
   - Location: `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`
   - Lines 54-57:
     ```java
     .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
     .requestMatchers("/api/public/**").permitAll()
     .requestMatchers(HttpMethod.POST, "/api/patients/register", "/api/patients/send-otp", "/api/patients/verify-otp", "/api/patients/complete-profile").permitAll()
     .requestMatchers(HttpMethod.GET, "/api/patients/check-username").permitAll()
     ```
   - Notice: `/api/auth/register` and `/api/patients/resend-otp` are **NOT** permitted in `SecurityConfig.java` and do not exist on the backend. Calling them returns `401 Unauthorized` or `404 Not Found`.

3. **Request DTOs & Validation Constraints**:
   - Location: `backend/swd/src/main/java/com/example/swd/dto/request/RegistrationCommands.java`
   - `RegistrationCommands.Register`:
     - `username`: `@NotBlank`, `@Pattern(regexp = "[A-Za-z0-9._-]{3,60}")`
     - `fullName`: `@NotBlank`, `@Size(max = 150)` (Required by backend in Step 1!)
     - `email`: `@NotBlank`, `@Email`, `@Size(max = 254)`
     - `password`: `@NotBlank`, length >= 8 chars, max 72 UTF-8 bytes
     - `confirmPassword`: `@NotBlank`, must match `password`
     - `agreeTerms`: `@NotNull`, `@AssertTrue` (Checkbox must be checked!)
   - `RegistrationCommands.SendOtp`:
     - `email`: `@NotBlank`, `@Email`, `@Size(max = 254)`
   - `RegistrationCommands.VerifyOtp`:
     - `email`: `@NotBlank`, `@Email`, `@Size(max = 254)`
     - `otp`: `@NotBlank`, service checks format `[0-9]{6}` (6 digits)
   - `RegistrationCommands.CompleteProfile`:
     - `email`: `@NotBlank`, `@Email`, `@Size(max = 254)`
     - `fullName`: `@NotBlank`, `@Size(max = 150)` (Required patient personal info)
     - `dateOfBirth`: `@NotNull`, `@PastOrPresent` (`LocalDate`, past or today only)
     - `gender`: `@NotNull`, `Gender` enum (`MALE`, `FEMALE`, `OTHER`, `UNSPECIFIED`)
     - `phone`: `@NotBlank`, `@Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$")`, max 25 chars
     - `address`: `@NotBlank`, max 500 chars
     - `emergencyContactName`: Optional (nullable/blank), max 150 chars
     - `emergencyContactPhone`: Optional (nullable/blank), `@Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$")`, max 25 chars

4. **Service Rules, Timing & State Transitions**:
   - Location: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`
   - Constant `OTP_MINUTES = 5`: OTP expires in 5 minutes (`expiresAt = now + 5 min`).
   - Constant `RESEND_SECONDS = 60`: Cooldown between OTP sends is 60 seconds.
   - Constant `MAX_ATTEMPTS = 5`: Maximum consecutive wrong OTP submissions allowed.
   - Initial Account Status: `ActiveStatus.INACTIVE`, Role: `Role.RoleCode.PATIENT`.
   - On OTP verification success:
     - Sets `account.setStatus(ActiveStatus.ACTIVE)`.
     - Sets `verification.setVerifiedAt(now)`.
   - On Profile completion:
     - Checks if profile already has `dateOfBirth != null` -> throws 409 `PROFILE_ALREADY_COMPLETED`.
     - Checks if `verification.getVerifiedAt() == null` -> throws 400 `OTP_NOT_VERIFIED`.
     - Updates `Patient` demographic record.
     - Deletes `RegistrationVerification` record.
     - Returns `CompletedProfileView(patientId, patientCode, fullName)`.

5. **Error Formats**:
   - Location: `backend/swd/src/main/java/com/example/swd/exception/GlobalExceptionHandler.java`
   - Returns unified `ErrorView`:
     ```json
     {
       "code": "STRING_ERROR_CODE",
       "message": "Human-readable message in Vietnamese",
       "fieldErrors": { "field": "error explanation" },
       "blockers": []
     }
     ```

6. **Frontend Dependencies**:
   - Location: `frontend/package.json`
   - Contains: `react` (18.2.0), `react-dom` (18.2.0), `react-router-dom` (6.30.0), `axios` (1.7.9), `tailwindcss` (3.4.14), `vite` (7.2.4).
   - Does **not** include `lucide-react`. UI icons must be provided via inline SVG to avoid missing dependency runtime errors.

---

## 2. Logic Chain

1. **Routing and Endpoint Alignment**:
   - Step 1 initiates registration by calling the backend.
   - While the initial prompt described `POST /api/auth/register` and `POST /api/patients/resend-otp`, the authoritative backend implementation in `PatientController.java` and `SecurityConfig.java` defines `POST /api/patients/register` and `POST /api/patients/send-otp`.
   - If the frontend were to call `/api/auth/register` or `/api/patients/resend-otp`, Spring Security would reject them with HTTP 401 Unauthorized because neither endpoint is permitted or mapped.
   - Therefore, the client API adapter `src/services/patientApi.js` must map:
     - `register(data)` -> `POST /api/patients/register`
     - `resendOtp(email)` -> `POST /api/patients/send-otp`
     - `verifyOtp(data)` -> `POST /api/patients/verify-otp`
     - `completeProfile(data)` -> `POST /api/patients/complete-profile`
     - `checkUsername(username)` -> `GET /api/patients/check-username?username=...`

2. **Step 1 Field Ingestion vs Step 2 Demographics**:
   - Backend `RegistrationCommands.Register` requires `fullName` and `agreeTerms`.
   - By gathering `fullName`, `username`, `email`, `password`, `confirmPassword`, and `agreeTerms` in Step 1:
     - Step 1 API call succeeds without failing backend validation.
     - Step 2 automatically pre-populates `fullName` from Step 1, giving the patient an effortless transition where they review their name and fill in remaining demographic fields (`dateOfBirth`, `gender`, `phone`, `address`, and optional emergency contact).
     - The email field in Step 2 is displayed as read-only / disabled (`contactEmail = email`) since it has already been verified via SMTP OTP.

3. **OTP Gate & Timer Logic**:
   - Upon successful Step 1 submission, backend generates a 6-digit numeric OTP, sends it via SMTP, and returns `otpExpiresAt` (5 min from now) and `resendAvailableAt` (60s from now).
   - The UI enters the OTP Verification state:
     - Shows 6 distinct numeric input boxes with auto-focus, paste auto-distribution, and backspace auto-navigation.
     - Shows a 60-second countdown timer for the "Gửi lại mã OTP" button (`resendAvailableAt`).
     - Shows an expiration notice ("Mã có hiệu lực trong 5 phút").
     - On clicking "Gửi lại mã OTP", calls `POST /api/patients/send-otp`, resets the 60s cooldown timer, and refreshes the OTP input boxes.
     - On submitting OTP, calls `POST /api/patients/verify-otp`.
     - If OTP is wrong (400 `INVALID_OTP`), increments error feedback; if 5 consecutive errors occur, handles 429 `OTP_ATTEMPTS_EXCEEDED` by prompting user to click Resend.
     - On successful verification, the account becomes `ACTIVE`, and the UI automatically transitions to Step 2.

4. **Step 2 Patient Demographics Ingestion**:
   - Distinct visual separation per R2:
     - **Personal Demographic Fields (REQUIRED)**:
       - `fullName`: text, required, pre-filled, editable.
       - `dateOfBirth`: date picker, required, past date only (`max={today}`).
       - `gender`: radio group or select (`MALE`, `FEMALE`, `OTHER`), required.
       - `phone`: text, required, regex `^(0|\+84)[0-9]{9,10}$`.
       - `address`: text, required, min 5 chars, max 500 chars.
       - `contactEmail`: read-only, pre-filled with verified email.
     - **Guardian / Emergency Contact Fields (OPTIONAL)**:
       - Marked clearly with an "Không bắt buộc / Tùy chọn" badge.
       - `emergencyContactName`: text, optional.
       - `emergencyContactPhone`: text, optional, validated with phone regex if provided.
   - On submit, calls `POST /api/patients/complete-profile`.
   - On 200 OK:
     - Displays Success confirmation banner/modal displaying the generated `patientCode` (e.g., `PT-DEMO...`).
     - Provides button "Đến trang Đăng nhập" which navigates to `/login` with `state: { prefilledLogin: email, successMessage: '...' }`.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth / Register | Username Availability Check | Real-time / debounce check for available usernames | `GET /api/patients/check-username?username=...` | `boolean` (`true`/`false`) | 400 `VALIDATION_ERROR` if format != `[A-Za-z0-9._-]{3,60}` | `PatientController.java:44` |
| 2 | Auth / Register | Step 1 Account Registration | Creates inactive user account, patient shell, issues 6-digit OTP via SMTP | `POST /api/patients/register` with `{ username, fullName, email, password, confirmPassword, agreeTerms }` | HTTP 200 `OtpView`: `{ message, username, email, otpExpiresAt, resendAvailableAt }` | 409 `USERNAME_IN_USE`, 409 `EMAIL_IN_USE`, 400 `VALIDATION_ERROR`, 503 `REGISTRATION_UNAVAILABLE` | `PatientRegistrationServiceImpl.java:63` |
| 3 | Auth / Register | Real SMTP OTP Dispatch | Generates 6-digit OTP code, BCrypt-hashes it into `registration_verifications`, and sends email | Triggered by register or send-otp | OTP delivered to user's real email | 503 `SMTP_UNAVAILABLE` rolls back registration records | `PatientRegistrationServiceImpl.java:97` |
| 4 | Auth / Register | Resend OTP with Throttling | Resends new 6-digit OTP if cooldown has passed | `POST /api/patients/send-otp` with `{ email }` | HTTP 200 `OtpView` with refreshed `otpExpiresAt` & `resendAvailableAt` | 429 `OTP_RESEND_TOO_SOON` if < 60s, 400 `REGISTRATION_NOT_PENDING` | `PatientRegistrationServiceImpl.java:101` |
| 5 | Auth / Register | OTP Verification Gate | Strictly validates OTP against BCrypt hash, checks 5m expiry and 5 attempt limits, activates account on success | `POST /api/patients/verify-otp` with `{ email, otp }` | HTTP 200 `VerifiedView`: `{ message, username, email }` | 400 `INVALID_OTP`, 400 `OTP_EXPIRED`, 429 `OTP_ATTEMPTS_EXCEEDED`, 400 `REGISTRATION_NOT_PENDING` | `PatientRegistrationServiceImpl.java:119` |
| 6 | Auth / Register | Step 2 Profile Completion | Ingests required patient demographic data and optional emergency contact, deletes verification token | `POST /api/patients/complete-profile` with `{ email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }` | HTTP 200 `ApiResponse<CompletedProfileView>` with `patientId`, `patientCode`, `fullName` | 400 `OTP_NOT_VERIFIED`, 409 `PROFILE_ALREADY_COMPLETED`, 400 `VALIDATION_ERROR` | `PatientRegistrationServiceImpl.java:149` |
| 7 | Auth / Register | Post-Registration Redirect | Modal/card showing patient code and redirecting to login with pre-filled email | User click or 5s auto-redirect | Navigation to `/login` | N/A | `PROJECT.md` & `ORIGINAL_REQUEST.md` |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Username Uniqueness | Taken username (e.g. `patient` or `doctor`) | HTTP 409 Conflict with code `USERNAME_IN_USE`: "Tên đăng nhập đã được sử dụng." Field error highlighted on `username`. |
| 2 | Email Uniqueness | Taken email (e.g. `patient@hospital.vn`) | HTTP 409 Conflict with code `EMAIL_IN_USE`: "Email đã được sử dụng. Nếu chưa xác thực, hãy gửi lại mã OTP." |
| 3 | Password Validation | Password < 8 characters or > 72 bytes UTF-8 | HTTP 400 Bad Request with code `VALIDATION_ERROR` on `password`. |
| 4 | Password Mismatch | `password != confirmPassword` | HTTP 400 Bad Request with code `VALIDATION_ERROR`: "Mật khẩu xác nhận không khớp." |
| 5 | Terms Agreement | `agreeTerms = false` | HTTP 400 Bad Request with code `VALIDATION_ERROR`: "Vui lòng đồng ý với điều khoản sử dụng." |
| 6 | OTP Format | Non-numeric or != 6 digits (e.g. `12345` or `abcdef`) | Client prevents submit; backend rejects with 400 `INVALID_OTP`: "Mã OTP gồm 6 chữ số." without querying database. |
| 7 | Wrong OTP Input | Incorrect 6-digit OTP (1 to 4 attempts) | HTTP 400 Bad Request with code `INVALID_OTP`: "Mã OTP không đúng. Vui lòng kiểm tra lại." `failedAttempts` incremented in DB. |
| 8 | Failed Attempts Exceeded | 5 consecutive wrong OTP submissions | HTTP 429 Too Many Requests with code `OTP_ATTEMPTS_EXCEEDED`: "Bạn đã nhập sai mã 5 lần. Vui lòng gửi lại mã OTP." Even correct OTP is blocked until resend. |
| 9 | Expired OTP | Submitting OTP after 5 minutes | HTTP 400 Bad Request with code `OTP_EXPIRED`: "Mã OTP đã hết hạn. Vui lòng gửi lại mã." |
| 10 | Resend Too Soon | Clicking Resend before 60 seconds expire | HTTP 429 Too Many Requests with code `OTP_RESEND_TOO_SOON`: "Vui lòng chờ X giây trước khi gửi lại mã OTP." Client disables button during countdown. |
| 11 | Resend Reset | Resending OTP after 60s cooldown | Generates new OTP, resets `failedAttempts` back to 0, extends `expiresAt` by 5 minutes. |
| 12 | Idempotent Verification Retry | Submitting same valid OTP again while still within 5 minutes | HTTP 200 OK returning `VerifiedView`. |
| 13 | Step 2 Profile Already Completed | Submitting profile completion when patient already has `dateOfBirth != null` | HTTP 409 Conflict with code `PROFILE_ALREADY_COMPLETED`: "Hồ sơ bệnh nhân đã được hoàn tất trước đó." |
| 14 | Step 2 Without OTP Verification | Submitting profile completion when email is not verified | HTTP 400 Bad Request with code `OTP_NOT_VERIFIED`: "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ." |
| 15 | Date of Birth in Future | `dateOfBirth > today` | Client `<input max={today}>` blocks future date; backend `@PastOrPresent` rejects with 400 `VALIDATION_ERROR`: "Ngày sinh không được ở tương lai." |
| 16 | Phone Validation | Phone not matching `^(0|\+84)[0-9]{9,10}$` | Client blocks submit; backend rejects with 400 `VALIDATION_ERROR`: "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84)." |
| 17 | Emergency Phone (Optional) | `emergencyContactPhone` provided but invalid format | HTTP 400 Bad Request: "Số điện thoại người liên hệ khẩn cấp không hợp lệ." If left blank or empty, validation passes. |
| 18 | Step 1 Form Edit After OTP Sent | User realizes email was mistyped | UI provides button "Chỉnh sửa email / thông tin tài khoản" to switch back from OTP sub-step to Account form. |

---

## 5. Architectural Blueprint for `RegisterPage.jsx`

### 5.1 Component State Machine

```
               [ User fills Step 1 Account Form ]
                               |
              (Clicks "Tiếp tục & Gửi mã OTP")
                               |
              [ POST /api/patients/register ]
                    /                    \
             (Failure 400/409)     (Success 200 OK)
                   /                        \
      [ Show Field Errors ]         [ Transition to OTP Modal/Sub-step ]
                                    [ Start 60s Resend Timer ]
                                    [ Start 5m Expiry Timer ]
                                             |
                                 (User enters 6-digit OTP)
                                             |
                                 [ POST /api/patients/verify-otp ]
                                      /              \
                               (Failure 400/429)  (Success 200 OK)
                                     /                  \
                        [ Show OTP Error / Attempts ]  [ Account ACTIVE in DB ]
                                                       [ Transition to Step 2 ]
                                                                 |
                                              [ User fills Step 2 Demographics Form ]
                                              (Required patient info vs Optional guardian info)
                                                                 |
                                                    (Clicks "Hoàn tất đăng ký")
                                                                 |
                                              [ POST /api/patients/complete-profile ]
                                                    /                  \
                                             (Failure 400/409)      (Success 200 OK)
                                                   /                      \
                                        [ Show Field Errors ]    [ Display Success Card with ]
                                                                 [ Patient Code (PT-...) ]
                                                                 [ Countdown / Redirect to /login ]
```

### 5.2 API Service Client Specification (`src/services/patientApi.js`)

```javascript
import api from './api'; // Base Axios instance configured with baseURL /api

export const patientApi = {
  // Check if username is available (returns boolean true/false)
  checkUsername: async (username) => {
    const res = await api.get('/patients/check-username', { params: { username } });
    return res.data;
  },

  // Step 1: Register account & trigger real SMTP OTP dispatch
  register: async (payload) => {
    // payload: { username, fullName, email, password, confirmPassword, agreeTerms: true }
    const res = await api.post('/patients/register', payload);
    return res.data; // OtpView: { message, username, email, otpExpiresAt, resendAvailableAt }
  },

  // Resend OTP (calls /api/patients/send-otp)
  resendOtp: async (email) => {
    const res = await api.post('/patients/send-otp', { email });
    return res.data; // OtpView: { message, username, email, otpExpiresAt, resendAvailableAt }
  },

  // Verify 6-digit OTP
  verifyOtp: async (email, otp) => {
    const res = await api.post('/patients/verify-otp', { email, otp });
    return res.data; // VerifiedView: { message, username, email }
  },

  // Step 2: Complete patient demographic profile
  completeProfile: async (payload) => {
    // payload: { email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }
    const res = await api.post('/patients/complete-profile', payload);
    return res.data; // ApiResponse<CompletedProfileView>: { code: 200, success: true, data: { patientId, patientCode, fullName } }
  }
};
```

---

### 5.3 Complete UI Specification for `src/pages/auth/RegisterPage.jsx`

Here is the production-ready reference implementation adhering strictly to all requirements:
- Modern medical aesthetics with Tailwind CSS (`blue-600` primary, slate neutrals, emerald success).
- Zero external icon dependencies (built-in clean inline SVGs).
- 2-Step interactive Stepper (Step 1: Tài khoản & Xác thực OTP -> Step 2: Hồ sơ bệnh nhân).
- 6 individual OTP input boxes with auto-focus, paste auto-distribution, and backspace handling.
- Real-time 60-second cooldown timer for "Gửi lại mã OTP".
- Comprehensive field validation with Vietnamese messages matching backend contracts.
- Required vs Optional visual badges for patient personal data vs guardian contact.
- Success confirmation banner with generated `patientCode` and redirect to `/login`.

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientApi } from '../../services/patientApi';

export default function RegisterPage() {
  const navigate = useNavigate();

  // Wizard state: 1 = Step 1 Account Form, '1_otp' = Step 1 OTP Verification, 2 = Step 2 Demographics Form, 3 = Complete
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Step 1: Account Form Data
  const [accountData, setAccountData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [accountErrors, setAccountErrors] = useState({});
  const [usernameAvailable, setUsernameAvailable] = useState(null); // null, true, false
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // OTP Verification State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState('');

  // Step 2: Patient Demographic Data
  const [profileData, setProfileData] = useState({
    fullName: '',
    dateOfBirth: '',
    gender: 'MALE',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  const [profileErrors, setProfileErrors] = useState({});

  // Success result
  const [completedInfo, setCompletedInfo] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // Cooldown timer for OTP Resend
  useEffect(() => {
    let timer;
    if (currentStep === '1_otp' && resendCooldown > 0) {
      setCanResend(false);
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (resendCooldown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [currentStep, resendCooldown]);

  // Auto redirect countdown on Step 3
  useEffect(() => {
    let timer;
    if (currentStep === 3 && redirectCountdown > 0) {
      timer = setInterval(() => {
        setRedirectCountdown((prev) => prev - 1);
      }, 1000);
    } else if (currentStep === 3 && redirectCountdown === 0) {
      navigate('/login', {
        state: {
          prefilledLogin: accountData.email,
          successMessage: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.'
        }
      });
    }
    return () => clearInterval(timer);
  }, [currentStep, redirectCountdown, navigate, accountData.email]);

  // Debounced Username availability check
  useEffect(() => {
    const rawUsername = accountData.username.trim();
    if (!rawUsername || !/^[A-Za-z0-9._-]{3,60}$/.test(rawUsername)) {
      setUsernameAvailable(null);
      return;
    }
    const handler = setTimeout(async () => {
      setIsCheckingUsername(true);
      try {
        const available = await patientApi.checkUsername(rawUsername);
        setUsernameAvailable(available);
      } catch {
        setUsernameAvailable(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [accountData.username]);

  // Handle Step 1 Input Change
  const handleAccountChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAccountData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (accountErrors[name]) {
      setAccountErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validate Step 1 Form
  const validateStep1 = () => {
    const errors = {};
    const usernameRegex = /^[A-Za-z0-9._-]{3,60}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!accountData.fullName.trim()) {
      errors.fullName = 'Vui lòng nhập họ và tên.';
    } else if (accountData.fullName.length > 150) {
      errors.fullName = 'Họ tên tối đa 150 ký tự.';
    }

    if (!accountData.username.trim()) {
      errors.username = 'Vui lòng nhập tên đăng nhập.';
    } else if (!usernameRegex.test(accountData.username)) {
      errors.username = 'Tên đăng nhập từ 3–60 ký tự, gồm chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.';
    } else if (usernameAvailable === false) {
      errors.username = 'Tên đăng nhập đã được sử dụng.';
    }

    if (!accountData.email.trim()) {
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

    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Step 1: Register Account & Dispatch OTP
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateStep1()) return;

    setLoading(true);
    try {
      const res = await patientApi.register({
        username: accountData.username.trim(),
        fullName: accountData.fullName.trim(),
        email: accountData.email.trim().toLowerCase(),
        password: accountData.password,
        confirmPassword: accountData.confirmPassword,
        agreeTerms: accountData.agreeTerms
      });

      setOtpExpiresAt(res.otpExpiresAt || '');
      setResendCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setCurrentStep('1_otp');
      setGlobalSuccess(`Mã xác thực 6 chữ số đã được gửi tới ${accountData.email}`);
      // Pre-fill full name into Step 2
      setProfileData((prev) => ({
        ...prev,
        fullName: accountData.fullName.trim()
      }));
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'USERNAME_IN_USE') {
        setAccountErrors((prev) => ({ ...prev, username: 'Tên đăng nhập đã được sử dụng.' }));
      } else if (resp?.code === 'EMAIL_IN_USE') {
        setAccountErrors((prev) => ({ ...prev, email: 'Email đã được sử dụng. Nếu bạn chưa hoàn tất, hãy gửi lại mã OTP.' }));
      } else if (resp?.fieldErrors) {
        setAccountErrors(resp.fieldErrors);
      } else {
        setGlobalError(resp?.message || 'Không thể gửi mã xác thực. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP Input Handlers (6-box navigation & paste)
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(-1);
    setOtpValues(newOtp);
    setOtpError('');

    // Focus next box
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpValues(digits);
      otpInputRefs.current[5]?.focus();
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setOtpError('');
    setGlobalError('');
    try {
      await patientApi.resendOtp(accountData.email.trim().toLowerCase());
      setResendCooldown(60);
      setCanResend(false);
      setOtpValues(['', '', '', '', '', '']);
      setGlobalSuccess('Mã OTP mới đã được gửi tới email của bạn.');
      otpInputRefs.current[0]?.focus();
    } catch (err) {
      const resp = err.response?.data;
      setOtpError(resp?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP Action
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const otpCode = otpValues.join('');
    if (otpCode.length !== 6) {
      setOtpError('Vui lòng nhập đủ 6 chữ số mã OTP.');
      return;
    }

    setLoading(true);
    setOtpError('');
    try {
      await patientApi.verifyOtp(accountData.email.trim().toLowerCase(), otpCode);
      setGlobalSuccess('Xác thực OTP thành công! Vui lòng hoàn tất hồ sơ bệnh nhân.');
      setCurrentStep(2);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'OTP_EXPIRED') {
        setOtpError('Mã OTP đã hết hạn. Vui lòng nhấn "Gửi lại mã OTP".');
      } else if (resp?.code === 'OTP_ATTEMPTS_EXCEEDED') {
        setOtpError('Bạn đã nhập sai 5 lần. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.');
      } else {
        setOtpError(resp?.message || 'Mã OTP không đúng. Vui lòng kiểm tra lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Input Handlers
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Step 2 Form Validation
  const validateStep2 = () => {
    const errors = {};
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    const today = new Date().toISOString().split('T')[0];

    if (!profileData.fullName.trim()) {
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

    if (!profileData.phone.trim()) {
      errors.phone = 'Vui lòng nhập số điện thoại liên hệ.';
    } else if (!phoneRegex.test(profileData.phone.trim())) {
      errors.phone = 'Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).';
    }

    if (!profileData.address.trim()) {
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

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Step 2: Complete Profile
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validateStep2()) return;

    setLoading(true);
    try {
      const res = await patientApi.completeProfile({
        email: accountData.email.trim().toLowerCase(),
        fullName: profileData.fullName.trim(),
        dateOfBirth: profileData.dateOfBirth,
        gender: profileData.gender,
        phone: profileData.phone.trim(),
        address: profileData.address.trim(),
        emergencyContactName: profileData.emergencyContactName.trim() || null,
        emergencyContactPhone: profileData.emergencyContactPhone.trim() || null
      });

      setCompletedInfo(res.data);
      setCurrentStep(3);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'PROFILE_ALREADY_COMPLETED') {
        setGlobalError('Hồ sơ bệnh nhân đã được hoàn tất trước đó.');
      } else if (resp?.code === 'OTP_NOT_VERIFIED') {
        setGlobalError('Email chưa được xác thực OTP. Vui lòng quay lại xác thực.');
      } else if (resp?.fieldErrors) {
        setProfileErrors(resp.fieldErrors);
      } else {
        setGlobalError(resp?.message || 'Không thể hoàn tất hồ sơ. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Hospital Branding Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3 group">
            <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:bg-blue-700 transition">
              {/* Medical Cross SVG */}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-800 tracking-tight">Bệnh viện Đa khoa Quốc tế</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Đăng ký tài khoản bệnh nhân</h1>
          <p className="text-slate-600 text-sm mt-1">Đăng ký nhanh chóng trong 2 bước với xác thực email an toàn</p>
        </div>

        {/* 2-Step Progress Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: currentStep === 1 || currentStep === '1_otp' ? '50%' : '100%'
                }}
              />
            </div>

            {/* Step 1 Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  currentStep === 2 || currentStep === 3
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                    : 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                }`}
              >
                {currentStep === 2 || currentStep === 3 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '1'
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 mt-2">Tài khoản & Xác thực OTP</span>
            </div>

            {/* Step 2 Node */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
                  currentStep === 3
                    ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-100'
                    : currentStep === 2
                    ? 'bg-blue-600 text-white shadow-md ring-4 ring-blue-100'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                {currentStep === 3 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  '2'
                )}
              </div>
              <span className="text-xs font-medium text-slate-700 mt-2">Hồ sơ bệnh nhân</span>
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        {globalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>{globalError}</div>
          </div>
        )}

        {globalSuccess && currentStep !== 3 && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>{globalSuccess}</div>
          </div>
        )}

        {/* MAIN CARD */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          {/* ========================================================================= */}
          {/* STEP 1A: ACCOUNT REGISTRATION FORM                                        */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <form onSubmit={handleStep1Submit} className="p-6 sm:p-8 space-y-5">
              <div className="border-b border-slate-100 pb-4 mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Bước 1: Thiết lập thông tin tài khoản</h2>
                <p className="text-xs text-slate-500 mt-1">Thông tin đăng nhập dùng để truy cập hệ thống và đặt lịch khám.</p>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={accountData.fullName}
                  onChange={handleAccountChange}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                    accountErrors.fullName
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {accountErrors.fullName && <p className="text-xs text-red-600 mt-1">{accountErrors.fullName}</p>}
              </div>

              {/* Username with Availability Indicator */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="username"
                    value={accountData.username}
                    onChange={handleAccountChange}
                    placeholder="3–60 ký tự, ví dụ: nguyenvanan"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.username
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : usernameAvailable === true
                        ? 'border-emerald-400 focus:ring-emerald-400'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
                    {isCheckingUsername && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {!isCheckingUsername && usernameAvailable === true && (
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {!isCheckingUsername && usernameAvailable === false && (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
                {accountErrors.username ? (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.username}</p>
                ) : usernameAvailable === true ? (
                  <p className="text-xs text-emerald-600 mt-1">Tên đăng nhập khả dụng.</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Gồm chữ cái, chữ số, dấu chấm, gạch dưới hoặc gạch ngang.</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Địa chỉ Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountChange}
                  placeholder="an.nguyen@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                    accountErrors.email
                      ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                      : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                  }`}
                />
                {accountErrors.email ? (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.email}</p>
                ) : (
                  <p className="text-xs text-slate-500 mt-1">Mã xác thực OTP sẽ được gửi tới email này qua SMTP.</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={accountData.password}
                    onChange={handleAccountChange}
                    placeholder="Tối thiểu 8 ký tự"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.password
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {accountErrors.password && <p className="text-xs text-red-600 mt-1">{accountErrors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Xác nhận mật khẩu <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={accountData.confirmPassword}
                    onChange={handleAccountChange}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      accountErrors.confirmPassword
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {accountErrors.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.confirmPassword}</p>
                )}
              </div>

              {/* Agree to terms */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={accountData.agreeTerms}
                    onChange={handleAccountChange}
                    className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-600 leading-snug">
                    Tôi đồng ý với{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Điều khoản sử dụng
                    </a>{' '}
                    và{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Chính sách bảo mật
                    </a>{' '}
                    của Bệnh viện Đa khoa Quốc tế.
                  </span>
                </label>
                {accountErrors.agreeTerms && (
                  <p className="text-xs text-red-600 mt-1">{accountErrors.agreeTerms}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xử lý & gửi mã OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Tiếp tục & Nhận mã OTP qua Email</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Đã có tài khoản?{' '}
                  <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                    Đăng nhập tại đây
                  </Link>
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 1B: OTP VERIFICATION MODAL / SUB-STEP                                 */}
          {/* ========================================================================= */}
          {currentStep === '1_otp' && (
            <form onSubmit={handleVerifyOtp} className="p-6 sm:p-8 space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-slate-800">Xác thực mã OTP qua Email</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Mã xác thực gồm 6 chữ số đã được gửi đến: <br />
                  <span className="font-semibold text-slate-900">{accountData.email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                >
                  Đổi email hoặc sửa thông tin
                </button>
              </div>

              {/* 6 Individual OTP Boxes */}
              <div>
                <label className="block text-center text-xs font-medium text-slate-700 mb-3">
                  Nhập mã 6 chữ số
                </label>
                <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                  {otpValues.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border text-slate-800 focus:outline-none focus:ring-2 transition ${
                        otpError
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/20'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                  ))}
                </div>
                {otpError && <p className="text-xs text-red-600 text-center mt-2.5 font-medium">{otpError}</p>}
                <p className="text-[11px] text-slate-400 text-center mt-2">Mã xác thực có hiệu lực trong vòng 5 phút</p>
              </div>

              {/* Verify Button */}
              <div>
                <button
                  type="submit"
                  disabled={loading || otpValues.join('').length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực OTP...</span>
                    </>
                  ) : (
                    <span>Xác thực OTP & Chuyển sang Bước 2</span>
                  )}
                </button>
              </div>

              {/* Resend Cooldown Section */}
              <div className="text-center pt-1 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Chưa nhận được mã?{' '}
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-blue-600 font-semibold hover:underline disabled:opacity-50"
                    >
                      Gửi lại mã OTP
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium">
                      Gửi lại mã sau ({String(Math.floor(resendCooldown / 60)).padStart(2, '0')}:
                      {String(resendCooldown % 60).padStart(2, '0')})
                    </span>
                  )}
                </p>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: PATIENT DEMOGRAPHICS FORM                                          */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <form onSubmit={handleStep2Submit} className="p-6 sm:p-8 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-emerald-600 text-xs font-semibold uppercase tracking-wider mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Tài khoản đã kích hoạt ({accountData.email})
                </div>
                <h2 className="text-lg font-bold text-slate-800">Bước 2: Hoàn tất hồ sơ bệnh nhân</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Vui lòng điền thông tin để phục vụ lập hồ sơ y tế và tiếp đón khám bệnh.
                </p>
              </div>

              {/* SECTION 1: REQUIRED PERSONAL DEMOGRAPHICS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <span>1. Thông tin cá nhân của bạn</span>
                  </h3>
                  <span className="text-xs font-medium text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                    * Bắt buộc
                  </span>
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Họ và tên bệnh nhân <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleProfileChange}
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.fullName
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.fullName && <p className="text-xs text-red-600 mt-1">{profileErrors.fullName}</p>}
                </div>

                {/* Ngày sinh & Giới tính in 2 columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Ngày sinh */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      max={new Date().toISOString().split('T')[0]}
                      value={profileData.dateOfBirth}
                      onChange={handleProfileChange}
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                        profileErrors.dateOfBirth
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {profileErrors.dateOfBirth && (
                      <p className="text-xs text-red-600 mt-1">{profileErrors.dateOfBirth}</p>
                    )}
                  </div>

                  {/* Giới tính */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={profileData.gender}
                      onChange={handleProfileChange}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </select>
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleProfileChange}
                    placeholder="Ví dụ: 0901234567"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.phone
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.phone ? (
                    <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">10–11 số, bắt đầu bằng 0 hoặc +84</p>
                  )}
                </div>

                {/* Email (Read-only from Step 1) */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email liên hệ (Đã xác thực OTP)
                  </label>
                  <input
                    type="email"
                    value={accountData.email}
                    disabled
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>

                {/* Địa chỉ */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Địa chỉ liên hệ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    name="address"
                    value={profileData.address}
                    onChange={handleProfileChange}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                      profileErrors.address
                        ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                        : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  />
                  {profileErrors.address && <p className="text-xs text-red-600 mt-1">{profileErrors.address}</p>}
                </div>
              </div>

              {/* SECTION 2: OPTIONAL GUARDIAN / EMERGENCY CONTACT */}
              <div className="pt-3 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">
                    2. Người liên hệ khẩn cấp / Người giám hộ
                  </h3>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Tùy chọn
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Thông tin người thân để bệnh viện liên lạc khi cần thiết (không bắt buộc).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Emergency Contact Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Họ tên người liên hệ khẩn cấp
                    </label>
                    <input
                      type="text"
                      name="emergencyContactName"
                      value={profileData.emergencyContactName}
                      onChange={handleProfileChange}
                      placeholder="Ví dụ: Nguyễn Thị Bình"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Emergency Contact Phone */}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Số điện thoại người liên hệ
                    </label>
                    <input
                      type="tel"
                      name="emergencyContactPhone"
                      value={profileData.emergencyContactPhone}
                      onChange={handleProfileChange}
                      placeholder="Ví dụ: 0909888777"
                      className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                        profileErrors.emergencyContactPhone
                          ? 'border-red-300 focus:ring-red-400 bg-red-50/30'
                          : 'border-slate-300 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    />
                    {profileErrors.emergencyContactPhone && (
                      <p className="text-xs text-red-600 mt-1">{profileErrors.emergencyContactPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Profile Button */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang lưu hồ sơ bệnh nhân...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Hoàn tất đăng ký</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: SUCCESS & REDIRECT SCREEN                                         */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="p-8 sm:p-10 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">Đăng ký thành công!</h2>
                <p className="text-slate-600 text-sm mt-1">
                  Chúc mừng bệnh nhân <span className="font-semibold text-slate-900">{completedInfo?.fullName}</span>. Hồ sơ y tế của bạn đã được khởi tạo thành công trên hệ thống.
                </p>
              </div>

              {/* Patient Code Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto">
                <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Mã bệnh nhân của bạn</div>
                <div className="text-xl font-mono font-bold text-blue-700 mt-1 select-all">
                  {completedInfo?.patientCode || 'PT-REGISTERED'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Vui lòng lưu lại mã này hoặc xuất trình số điện thoại khi đến quầy tiếp đón.
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() =>
                    navigate('/login', {
                      state: {
                        prefilledLogin: accountData.email,
                        successMessage: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.'
                      }
                    })
                  }
                  className="w-full max-w-md mx-auto py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <span>Đăng nhập ngay</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <p className="text-xs text-slate-400 mt-3">
                  Tự động chuyển hướng sau <span className="font-semibold text-slate-700">{redirectCountdown}s</span>...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. Caveats

1. **Backend Route Naming**:
   - The user dispatch referenced `POST /api/auth/register` and `POST /api/patients/resend-otp`.
   - As documented in Observation #1 & #2, the actual backend Spring Boot controller paths are `POST /api/patients/register` and `POST /api/patients/send-otp`.
   - The frontend implementation must use the verified backend paths to prevent HTTP 401 / 404 failures.
2. **Step 1 Full Name Ingestion**:
   - Backend `RegistrationCommands.Register` enforces `@NotBlank fullName`.
   - Collecting `fullName` in Step 1 ensures the Step 1 API call satisfies validation, and then allows Step 2 to pre-fill it seamlessly.
3. **No External Icon Library Installed**:
   - `lucide-react` is not present in `frontend/package.json`.
   - The provided design exclusively uses inline responsive SVG icons that require zero new `npm` packages.

---

## 7. Conclusion

The specification for the 2-Step Patient Registration Workflow (R2) has been fully probed, analyzed, and mapped to the authoritative Spring Boot backend:
1. **Step 1 Account Setup & Real SMTP OTP Gate**: Gathers `username`, `fullName`, `email`, `password`, `confirmPassword`, `agreeTerms`. Calls `POST /api/patients/register`. Enforces a strict 6-digit OTP verification gate calling `POST /api/patients/verify-otp` with real 60-second cooldown (`POST /api/patients/send-otp`), 5-minute expiry, and 5-attempt brute-force protection.
2. **Step 2 Patient Demographics Form**: Aligns with database table `patients`, enforcing required personal demographics (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`, verified `email`) while keeping guardian demographics (`emergencyContactName`, `emergencyContactPhone`) optional. Calls `POST /api/patients/complete-profile`.
3. **Completion**: Displays the assigned `patientCode` (`PT-...`) and redirects to `/login` with pre-filled credentials.

---

## 8. Verification Method

To independently verify the specification and backend behavior:

1. **Verify Backend Tests for Registration**:
   ```powershell
   cd backend/swd
   ./mvnw.cmd test -Dtest=PatientControllerTest,PatientRegistrationServiceTest
   ```
   *Expected Result*: All tests pass, proving endpoint URLs, DTO validations, OTP verification, cooldowns, and profile completion constraints.

2. **Verify Endpoint Accessibility via cURL / PowerShell**:
   - Check username availability:
     ```powershell
     curl -i http://localhost:8080/api/patients/check-username?username=testpatient123
     ```
     *Expected Result*: HTTP 200 OK with `true` or `false`.
   - Verify unverified complete-profile is rejected:
     ```powershell
     curl -i -X POST http://localhost:8080/api/patients/complete-profile `
       -H "Content-Type: application/json" `
       -d '{"email":"unverified@test.com","fullName":"Test","dateOfBirth":"1995-01-01","gender":"MALE","phone":"0901234567","address":"Hanoi"}'
     ```
     *Expected Result*: HTTP 400 Bad Request (`REGISTRATION_NOT_PENDING` or `OTP_NOT_VERIFIED`).
