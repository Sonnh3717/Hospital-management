# Forensic Integrity Audit Report — Milestone 2 (auditor_m2)

**Auditor Agent**: `auditor_m2` (Forensic Integrity Auditor)  
**Parent Agent**: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`  
**Working Directory**: `.agents/teamwork/auditor_m2`  
**Target Milestone**: Milestone 2 (Frontend Foundation, Landing Page R1, 2-Step OTP Registration R2, Multi-Role Login R3)  
**Integrity Mode**: `development` (per `ORIGINAL_REQUEST.md`)  
**Date**: 2026-11-02  
**Final Verdict**: **CLEAN**

---

## Forensic Audit Report

**Work Product**: Milestone 2 Frontend Implementation (`frontend/src/`)  
**Profile**: General Project  
**Verdict**: **CLEAN**

### Phase Results
- **Hardcoded Test Results / Fake Tokens**: **PASS** — Zero mock tokens (e.g. `mock-jwt-token`), zero dummy bypasses, zero static mock responses.
- **Facade Detection**: **PASS** — All API client methods (`api.js`, `patientApi.js`) invoke genuine Axios HTTP requests targeting backend endpoints (`/api/auth/login`, `/api/auth/me`, `/api/patients/register`, `/api/patients/send-otp`, `/api/patients/verify-otp`, `/api/patients/complete-profile`).
- **Pre-populated Artifact Detection**: **PASS** — No fake test logs, pre-fabricated attestation outputs, or dummy result files.
- **2-Step Registration & OTP Verification Authenticity**: **PASS** — Step 1 dispatches to `POST /api/patients/register`; OTP verification strictly invokes `POST /api/patients/verify-otp` with the 6-digit code. No client-side auto-verification or hardcoded constants (e.g. `123456`) exist. Step 2 strictly requires OTP completion and submits full demographic data to `POST /api/patients/complete-profile`.
- **Multi-Role Authentication Authenticity**: **PASS** — `LoginPage.jsx` submits input credentials to `POST /api/auth/login`, stores real returned token and user role in `localStorage`, and routes via server-authenticated `user.role` through `ProtectedRoute.jsx`.
- **Static Analysis & Build Verification**: **PASS** — `npm --prefix frontend run lint` exited 0 (0 problems); `npm --prefix frontend run build` exited 0 (97 modules transformed in 2.15s).

---

## 1. Observation

### 1.1 Source Code Anti-Cheat Scanning
Searches across `frontend/src/` for cheating heuristics yielded zero suspicious patterns:
- Grep `mock`: 0 results
- Grep `fake`: 0 results
- Grep `dummy`: 0 results
- Grep `bypass`: 0 results
- Grep `TODO`: 0 results
- Grep `123456`: 1 result in `RegisterPage.jsx:902` which is an input placeholder example: `placeholder="Ví dụ: 0901234567"`.

### 1.2 Authenticity of API Integration (`frontend/src/services/api.js` & `patientApi.js`)
- `frontend/src/services/api.js`:
  - Lines 5-11: Configures Axios instance with `baseURL: import.meta.env.VITE_API_URL || '/api'`, `timeout: 15000`.
  - Lines 14-23: Request interceptor dynamically injects `Authorization: Bearer ${localStorage.getItem('token')}`.
  - Lines 25-39: Response interceptor intercepts 401 Unauthorized, purges stored tokens, and redirects unauthenticated users to `/login?session_expired=true` while exempting public paths (`/login`, `/register`, `/`).
  - Lines 44-62: `authApi.login` dispatches `POST /auth/login` with `{ username, password }`. `getMe` dispatches `GET /auth/me`. `logout` dispatches `POST /auth/logout`.
  - Lines 65-96: `patientApi` methods dispatch genuine Axios HTTP requests:
    - `checkUsername`: `GET /patients/check-username?username=...`
    - `register`: `POST /patients/register` with `{ username, fullName, email, password, confirmPassword, agreeTerms: true }`
    - `sendOtp`: `POST /patients/send-otp` with `{ email }`
    - `verifyOtp`: `POST /patients/verify-otp` with `{ email, otp }`
    - `completeProfile`: `POST /patients/complete-profile` with `{ email, fullName, dateOfBirth, gender, phone, address, emergencyContactName, emergencyContactPhone }`
- `frontend/src/services/patientApi.js`: Lines 1-50 implement identical genuine typed delegate methods to `api.js`.

### 1.3 2-Step Registration & OTP Gate (`frontend/src/pages/auth/RegisterPage.jsx`)
- Step 1 (Lines 171-212): `handleStep1Submit` executes client-side regex validations, then calls `await patientApi.register(...)`. Only upon HTTP 200 response does it transition `currentStep = '1_otp'`.
- OTP Input & Gate (Lines 214-292):
  - Renders 6 discrete digit inputs with forward/backspace keyboard navigation, numeric-only validation, and 6-digit clipboard paste auto-distribution.
  - Implements 60-second cooldown timer for `patientApi.resendOtp(...)`.
  - Lines 266-292: `handleVerifyOtp` assembles 6 digits and invokes `await patientApi.verifyOtp(accountData.email.trim().toLowerCase(), otpCode)`.
  - Transition to `currentStep = 2` occurs **strictly** inside the `try` block after the backend API returns success. Any HTTP error (e.g., `OTP_EXPIRED`, `OTP_ATTEMPTS_EXCEEDED`, 400 Bad Request) throws and sets `otpError`, keeping the user on Step 1 OTP.
- Step 2 Demographics Form (Lines 807-1025):
  - Segregates required patient personal fields (`fullName` pre-filled, `dateOfBirth` past/present only, `gender`, `phone`, `address`) from optional emergency contact fields (`emergencyContactName`, `emergencyContactPhone`).
  - Renders email as read-only verified field (`accountData.email`).
  - Lines 350-384: `handleStep2Submit` submits full demographic payload to `await patientApi.completeProfile(...)` (matching Spring Boot's `RegistrationCommands.CompleteProfile` record).
  - Only upon successful response does it transition to Step 3 (`currentStep = 3`), displaying the server-generated `patientCode` (e.g. `PT-...`) and triggering a 5-second countdown redirect to `/login`.

### 1.4 Multi-Role Authentication & Route Protection (`LoginPage.jsx`, `AuthContext.jsx`, `ProtectedRoute.jsx`)
- `frontend/src/context/AuthContext.jsx`:
  - Lines 20-50: `verifySession` on initial mount calls `GET /api/auth/me`. If invalid/expired, clears local storage and resets state.
  - Lines 52-63: `login(credentials)` calls `authApi.login(credentials)` and stores `data.token` and `data.user` as returned by backend.
  - Lines 79-102: Provides genuine role state (`user?.role`), `isPatient`, `isReceptionist`, `isDoctor`, `isAdmin`.
- `frontend/src/pages/auth/LoginPage.jsx`:
  - Lines 40-94: `handleSubmit` calls `const user = await login({ username: identifier, password: password })`.
  - Lines 65-79: Dynamically routes based on authenticated role returned by server:
    - `user?.role === 'PATIENT'` -> `/patient`
    - `user?.role === 'RECEPTIONIST'` -> `/reception`
    - `user?.role === 'DOCTOR'` -> `/doctor`
    - `user?.role === 'ADMIN'` -> `/reception`
  - Lines 182-192: Displays "Quên mật khẩu?" link with `href="#"` that triggers informational modal providing hospital hotline 1900 6868 and front desk instructions.
- `frontend/src/components/ProtectedRoute.jsx`:
  - Lines 9-18: Displays loading spinner during session verification.
  - Lines 20-22: Redirects unauthenticated visits to `/login`.
  - Lines 24-28: Redirects authenticated users attempting to access unauthorized roles back to their designated role dashboard.

### 1.5 Independent Command Execution Proofs
1. **Frontend ESLint Check**:
   ```powershell
   npm --prefix frontend run lint
   ```
   *Output*:
   ```
   > swd-frontend@0.0.1 lint
   > eslint .
   (Exit code 0, 0 problems reported)
   ```

2. **Frontend Production Build**:
   ```powershell
   npm --prefix frontend run build
   ```
   *Output*:
   ```
   > swd-frontend@0.0.1 build
   > vite build
   ✓ 97 modules transformed.
   dist/index.html                   0.73 kB │ gzip:  0.46 kB
   dist/assets/index-be_MfO7x.css   39.48 kB │ gzip:  6.79 kB
   dist/assets/index-Dg-rY8EH.js   297.21 kB │ gzip: 86.75 kB
   ✓ built in 2.15s
   (Exit code 0)
   ```

3. **Empirical Challenger Test Suite**:
   ```powershell
   node frontend/scripts/test-registration-workflow.mjs
   ```
   *Output*:
   ```
   ================================================================
   TEST SUMMARY: Total=30, Passed=30, Failed=0
   ================================================================
   (Exit code 0)
   ```

4. **Backend Registration Contract Tests**:
   - `com.example.swd.controller.patient.PatientControllerTest`: 4 tests run, 0 failures, 0 errors.
   - `com.example.swd.service.PatientRegistrationServiceTest`: 21 tests run, 0 failures, 0 errors.

---

## 2. Logic Chain

1. **Premise 1 — Absence of Cheating Patterns**:
   The static analysis across all files under `frontend/src/` established that no mock tokens, hardcoded constants, or simulated backend successes exist.

2. **Premise 2 — Complete API Contract Alignment**:
   Every frontend API client call (`authApi`, `patientApi`) directly corresponds to a real, tested Spring Boot REST endpoint with identical payloads, query params, and response DTO schemas:
   - `POST /api/auth/login` <-> `LoginRequest` / `LoginResponse`
   - `GET /api/auth/me` <-> `UserInfoResponse`
   - `GET /api/patients/check-username` <-> `PatientController.checkUsername`
   - `POST /api/patients/register` <-> `RegistrationCommands.Register`
   - `POST /api/patients/send-otp` <-> `RegistrationCommands.SendOtp`
   - `POST /api/patients/verify-otp` <-> `RegistrationCommands.VerifyOtp`
   - `POST /api/patients/complete-profile` <-> `RegistrationCommands.CompleteProfile`

3. **Premise 3 — Authentic State Transitions & Validation Gates**:
   The 2-step registration cannot transition from Step 1 to Step 2 without an explicit HTTP 200 response from `POST /api/patients/verify-otp`. No client-side bypass or constant OTP shortcut exists. Step 2 requires valid demographic inputs matching database constraints before submitting to `POST /api/patients/complete-profile`.

4. **Premise 4 — Authentic Multi-Role Authentication**:
   `LoginPage.jsx` submits user credentials to `/api/auth/login` and routes users based on the genuine `role` field parsed from the backend response. Route guards (`ProtectedRoute`) verify this session token against `/api/auth/me` upon load and deny access to unauthorized role views.

5. **Conclusion**:
   Because all forensic checks passed with empirical evidence, the work product is authentic, correctly implemented, and compliant with all Milestone 2 requirements.

---

## 3. Caveats

1. **SMTP Gateway Availability**: In local development without internet connectivity or valid Google SMTP credentials, email delivery depends on the configured SMTP relay. However, OTP codes are reliably verified directly via the backend database table `registration_verifications`.
2. **Milestone 3 Portal Pages**: Minimalist routing placeholder pages were created for `/patient/book`, `/patient/appointments`, `/reception/walk-in`, `/reception/appointments`, `/reception/patients`, and `/doctor` to allow end-to-end routing from `LoginPage` and `ProtectedRoute`. These placeholders are scheduled for full feature expansion in Milestone 3.

---

## 4. Conclusion

**Verdict**: **CLEAN**

The Milestone 2 frontend implementation (`frontend/src/`) contains **NO integrity violations**, **NO facades**, **NO mock tokens**, and **NO bypassed validation gates**. The implementation is 100% authentic, cleanly structured, passes all linting and build checks, and adheres strictly to the backend contracts and acceptance criteria defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

---

## 5. Verification Method

To independently verify this forensic report, execute the following commands in the project workspace:

```powershell
# 1. Verify ESLint static analysis
npm --prefix frontend run lint

# 2. Verify Vite production build
npm --prefix frontend run build

# 3. Verify Empirical Challenger Test Suite (30 unit & contract tests)
node frontend/scripts/test-registration-workflow.mjs

# 4. Check for prohibited patterns (must return 0 results)
rg -i "mock|fake|dummy|bypass" frontend/src

# 5. Invalidation condition:
# Any test failure, lint failure, or hardcoded mock token discovered in frontend/src/ invalidates this report.
```
