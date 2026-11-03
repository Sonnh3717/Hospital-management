# Handoff Report — Registration & OTP Workflow Challenger (challenger_m2_1)

**Agent**: `challenger_m2_1` (Milestone 2 Registration & OTP Workflow Challenger)  
**Parent Agent**: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`  
**Working Directory**: `.agents/teamwork/challenger_m2_1`  
**Verdict**: **APPROVE**  
**Date**: 2026-11-02  

---

## 1. Observation

### 1.1 Source Files Inspected
- `frontend/src/pages/auth/RegisterPage.jsx` (Lines 1–1081): 2-Step interactive registration stepper, real-time debounced username check, 6-digit OTP verification gate, demographic profile form, and completion screen.
- `frontend/src/services/patientApi.js` (Lines 1–50): Axios API methods for `checkUsername`, `register`, `sendOtp`, `resendOtp`, `verifyOtp`, and `completeProfile`.
- `frontend/src/services/api.js` (Lines 1–191): Axios base instance configuration (`baseURL: '/api'`) and request/response interceptors.
- `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java` (Lines 1–49): Spring Boot endpoint definitions.
- `backend/swd/src/main/java/com/example/swd/dto/request/RegistrationCommands.java` (Lines 1–79): Java DTO validation annotations for `Register`, `SendOtp`, `VerifyOtp`, and `CompleteProfile`.
- `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java` (Lines 1–277): Business logic, throttling, and exception handling for registration and verification.

### 1.2 Step 1 Validation & API Contract Observations
- **Full Name**: `RegisterPage.jsx` lines 131–135 enforce non-blank and max length 150 (`if (!accountData.fullName.trim()) ... else if (accountData.fullName.length > 150)`). Aligns with backend `@NotBlank @Size(max = 150)`.
- **Username**: `RegisterPage.jsx` lines 137–143 enforce non-blank and regex `/^[A-Za-z0-9._-]{3,60}$/`, plus `usernameAvailable === false` check. Aligns with backend `@Pattern(regexp = "[A-Za-z0-9._-]{3,60}")`.
- **Username Availability Debounce**: `RegisterPage.jsx` lines 91–111 implement a 400ms debounce using `setTimeout` and `clearTimeout`. It queries `patientApi.checkUsername(rawUsername)` (`GET /api/patients/check-username?username=...`), displays a spinner during lookup, a green checkmark when available, and a red alert icon when taken.
- **Email**: `RegisterPage.jsx` lines 145–149 enforce non-blank and regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`. Aligns with backend `@Email @Size(max = 254)` and service normalization.
- **Password**: `RegisterPage.jsx` lines 151–155 enforce minimum length 8. Aligns with backend requirement (`length >= 8`).
- **Confirm Password**: `RegisterPage.jsx` lines 157–161 enforce exact equality with `password`.
- **Terms Checkbox**: `RegisterPage.jsx` lines 163–165 enforce `agreeTerms === true`.
- **Step 1 Payload**: `RegisterPage.jsx` lines 179–186 dispatches `patientApi.register({ username, fullName, email: email.toLowerCase(), password, confirmPassword, agreeTerms: true })` targeting `POST /api/patients/register`.

### 1.3 OTP Verification Gate Observations
- **Numeric 6-box input**: `RegisterPage.jsx` lines 215–226 enforce digits only (`if (!/^\d*$/.test(value)) return;`), take the last character (`value.slice(-1)`), and automatically advance focus to `index + 1`.
- **Backspace Navigation**: `RegisterPage.jsx` lines 228–232 focus `index - 1` when backspace is pressed on an empty box.
- **Paste Auto-Distribution**: `RegisterPage.jsx` lines 234–242 check `/^\d{6}$/`, split the 6 digits across the 6 boxes, and advance focus to box 5. Non-6-digit pastes are safely ignored.
- **60-Second Cooldown Timer**: `RegisterPage.jsx` lines 53–71 decrement `resendCooldown` from 60 to 0 each second. While active, the UI displays `Gửi lại mã sau (MM:SS)`. At 0, `canResend` activates and the "Gửi lại mã OTP" button is enabled.
- **Resend Action**: `RegisterPage.jsx` lines 245–263 call `patientApi.resendOtp(email)` (`POST /api/patients/send-otp`), resets cooldown to 60s, clears OTP boxes, and focuses box 0.
- **Verify Action**: `RegisterPage.jsx` lines 266–292 submit `patientApi.verifyOtp(email, otpCode)` (`POST /api/patients/verify-otp`).
- **Error Code Mapping**:
  - `resp?.code === 'OTP_EXPIRED'` displays: *"Mã OTP đã hết hạn. Vui lòng nhấn 'Gửi lại mã OTP'."*
  - `resp?.code === 'OTP_ATTEMPTS_EXCEEDED'` displays: *"Bạn đã nhập sai 5 lần. Vui lòng nhấn 'Gửi lại mã OTP' để nhận mã mới."*
  - General invalid OTP displays: `resp?.message || 'Mã OTP không đúng. Vui lòng kiểm tra lại.'`

### 1.4 Step 2 Demographic Form & Field Segregation Observations
- **Pre-filled Full Name**: `RegisterPage.jsx` line 196 pre-fills `fullName` into `profileData` upon Step 1 success.
- **Date of Birth**: `RegisterPage.jsx` lines 315–319 validate `dateOfBirth` presence and enforce `dateOfBirth <= today` (`errors.dateOfBirth = 'Ngày sinh không được ở tương lai.'`). Input tag specifies `max={today}`.
- **Gender**: `RegisterPage.jsx` line 880 provides options `MALE`, `FEMALE`, `OTHER`, matching backend `Gender` enum.
- **Phone**: `RegisterPage.jsx` lines 325–329 validate against `/^(0|\+84)[0-9]{9,10}$/` (10–11 digits starting with 0 or +84).
- **Address**: `RegisterPage.jsx` lines 331–337 validate length between 5 and 500 characters.
- **Email Read-Only**: `RegisterPage.jsx` lines 918–927 display the verified email with `disabled` and `cursor-not-allowed`.
- **Optional Emergency Contact**: `RegisterPage.jsx` lines 339–343 validate `emergencyContactPhone` only if provided, and lines 364–365 convert blank strings to `null` (`trim() || null`).
- **Step 2 Payload**: Dispatches `POST /api/patients/complete-profile` with `{ email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }`.
- **Field Segregation**: Step 1 contains zero demographic fields; Step 2 contains zero credential fields (`password`, `confirmPassword`, `username` are omitted).
- **Success Screen & Redirect**: `RegisterPage.jsx` lines 1030–1075 display the generated `patientCode` (`PT-...`), provide an immediate login button, and run an automatic 5-second countdown timer redirecting to `/login` with pre-filled email.

### 1.5 Execution Commands & Results
1. `npm --prefix frontend run build`:
   - Output: `✓ 97 modules transformed. ✓ built in 2.21s`, exit code `0`.
2. `npm --prefix frontend run lint`:
   - Output: `0 problems reported`, exit code `0`.
3. `node frontend/scripts/test-registration-workflow.mjs`:
   - Output: `TEST SUMMARY: Total=30, Passed=30, Failed=0`, exit code `0`.

---

## 2. Logic Chain

1. **Step 1 Contract Conformance**:
   - Backend `PatientController.register` requires `username` (`[A-Za-z0-9._-]{3,60}`), `fullName` (max 150), `email`, `password` (>= 8 chars), `confirmPassword`, and `agreeTerms: true`.
   - `RegisterPage.jsx`'s `validateStep1()` applies identical boundary rules before dispatching.
   - The real-time debounced check (`patientApi.checkUsername`) issues `GET /api/patients/check-username?username=...` with a 400ms delay, preventing unnecessary server load while providing immediate user feedback.
   - Therefore, Step 1 satisfies all functional and API contract requirements.

2. **OTP Gate Robustness & Security**:
   - The 6-box input enforces numeric digits exclusively (`/^\d*$/`), supporting seamless typing navigation and backspace recovery.
   - The paste handler requires strictly 6 digits (`/^\d{6}$/`), distributing characters across all 6 slots and focusing the final slot.
   - The 60-second cooldown timer enforces the throttling contract matching backend `RESEND_SECONDS = 60`, preventing OTP resend flooding.
   - The verify submission checks `otpCode.length === 6` and accurately maps HTTP 400 (`OTP_EXPIRED`), HTTP 429 (`OTP_ATTEMPTS_EXCEEDED`), and `INVALID_OTP` to actionable Vietnamese alert messages.
   - Therefore, the OTP gate is robust, secure, and user-friendly.

3. **Demographic Form & Strict Field Segregation**:
   - Sensitive credentials (`password`, `confirmPassword`) are captured and finalized in Step 1 and never exposed or sent in Step 2.
   - Demographic fields (`dateOfBirth`, `gender`, `phone`, `address`) are collected only in Step 2, matching backend `CompleteProfile` requirements.
   - Pre-filling `fullName` and locking `email` as read-only creates a cohesive 2-step onboarding experience.
   - Optional fields (`emergencyContactName`, `emergencyContactPhone`) correctly allow null/blank values and are validated only when populated.
   - Step 3 displays the generated `patientCode` and reliably redirects to `/login` with pre-filled credentials.

---

## 3. Caveats

1. **SMTP Delivery**: In local dev environments without valid SMTP credentials, real emails will not be dispatched; OTPs can be read directly from database table `registration_verifications`.
2. **Username In-Flight State**: If a user types a valid username, waits 400ms for debouncing to start, and immediately resumes typing while the HTTP request is in-flight, a stale response could briefly set `usernameAvailable`. However, backend `POST /api/patients/register` performs the definitive conflict check (`USERNAME_IN_USE`), ensuring total database consistency.

---

## 4. Conclusion & Verdict

**Verdict**: **APPROVE**

The 2-Step Registration & OTP workflow implemented in `frontend/src/pages/auth/RegisterPage.jsx` and `frontend/src/services/patientApi.js` is thoroughly verified, compliant with all backend Spring Boot contracts, robust against edge cases, and compiles with zero errors or warnings.

---

## 5. Verification Method

To independently verify this evaluation, execute the following commands from the project root:

```powershell
# 1. Verify clean frontend build
npm --prefix frontend run build

# 2. Verify ESLint compliance
npm --prefix frontend run lint

# 3. Execute empirical stress test harness (30 test cases)
node frontend/scripts/test-registration-workflow.mjs
```

### Invalidation Conditions
- Any failure in `npm run build` or `npm run lint`.
- Any regression causing `test-registration-workflow.mjs` to fail.
- Desynchronization of payload keys between `patientApi.js` and `RegistrationCommands.java`.
