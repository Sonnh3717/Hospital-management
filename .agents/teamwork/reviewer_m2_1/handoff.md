# Review & Adversarial Quality Report — Milestone 2 Frontend Implementation

**Reviewer Agent**: `reviewer_m2_1` (Frontend Code & Build Reviewer)  
**Parent Agent**: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`  
**Working Directory**: `.agents/teamwork/reviewer_m2_1`  
**Target Milestone**: Milestone 2 (Frontend Foundation, Landing Page R1, 2-Step OTP Registration R2, Multi-Role Login R3)  
**Date**: 2026-11-02  
**Final Verdict**: **APPROVE**

---

## 1. Observation

Direct code and execution observations across the inspected codebase:

1. **Build & Lint Execution Verification**:
   - `npm --prefix frontend run build`: Exited with code 0 (`✓ 97 modules transformed. ✓ built in 2.32s`). Generated `dist/index.html` (0.73 kB), `dist/assets/index-*.css` (39.48 kB), and `dist/assets/index-*.js` (297.21 kB).
   - `npm --prefix frontend run lint`: Exited with code 0 (`eslint .` reported 0 errors, 0 warnings).

2. **Vite Configuration & Windows OneDrive Protection (`frontend/vite.config.js`)**:
   - Lines 6–9: `resolve: { preserveSymlinks: true }` correctly configured, preventing Windows OneDrive NTFS reparse point `EPERM: operation not permitted, realpath` crashes.
   - Lines 10–19: `server.proxy['/api']` directs requests to `http://localhost:8081` (`changeOrigin: true`, `secure: false`), accurately matching Spring Boot's port defined in `backend/swd/src/main/resources/application.properties` (`server.port=${SERVER_PORT:8081}`).

3. **Zero-Dependency SVG Icon Suite (`frontend/src/components/common/Icons.jsx`)**:
   - Verified 26 pure React SVG icon components (`HospitalIcon`, `HeartbeatIcon`, `StethoscopeIcon`, `ShieldCheckIcon`, `CalendarIcon`, `ClockIcon`, `UserIcon`, `UserGroupIcon`, `PhoneIcon`, `MailIcon`, `MapPinIcon`, `EyeIcon`, `EyeOffIcon`, `ArrowRightIcon`, `ChevronRightIcon`, `CheckCircleIcon`, `AlertCircleIcon`, `MenuIcon`, `XIcon`, `LogOutIcon`, `SparklesIcon`, `UserPlusIcon`, `CalendarCheckIcon`, `ClipboardListIcon`, `ActivityIcon`, `HomeIcon`).
   - Verified that no external icon packages (such as `lucide-react`) are imported or required in `package.json`.

4. **API Interceptors & Error Safeguards (`frontend/src/services/api.js`)**:
   - Request Interceptor (lines 14–23): Attaches `Authorization: Bearer <token>` from `localStorage`.
   - Response Interceptor (lines 26–39): Handles HTTP 401 Unauthorized responses. Specifically guards against infinite loops by verifying `currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/'` before clearing tokens and redirecting to `/login?session_expired=true`.
   - `authApi.login`: Normalizes `username` / `email` into the `username` field expected by Spring Boot `LoginRequest`.

5. **Authentication Context & Role Isolation (`frontend/src/context/AuthContext.jsx` & `ProtectedRoute.jsx`)**:
   - `AuthContext`: Hydrates user state from `localStorage`, validates active sessions on mount via `GET /api/auth/me`, synchronizes session state with `UserInfoResponse` DTO (`id`, `accountId`, `username`, `fullName`, `role`, `staffId`, `patientId`), and provides role helpers (`isPatient`, `isReceptionist`, `isDoctor`, `isAdmin`).
   - `ProtectedRoute`: Renders a loading state during session hydration, redirects unauthenticated requests to `/login` preserving the attempted path in `state.from`, and redirects unauthorized roles to their designated dashboard via `getRoleDashboardPath(user.role)`.

6. **Landing Page R1 (`frontend/src/pages/HomePage.jsx`)**:
   - Sticky topbar prominently featuring hospital brand identity, navigation links, and "Đăng nhập" / "Đăng ký" buttons.
   - Hero section with headline *"Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu"*, dual CTAs, consultation hero image (`/images/consultation-hero.png`), and floating badges ("4.9 / 5.0" rating and "24/7 Cấp cứu & Tiếp đón").
   - 4 stats cards, 6 specialty department cards, 4-step workflow, and comprehensive hospital footer with emergency hotline (1900 6868), BYT license, and operating hours.

7. **Multi-Role Login R3 (`frontend/src/pages/auth/LoginPage.jsx`)**:
   - Single dual-credential input labeled *"Email hoặc Tên đăng nhập"*, mapped to backend `username` payload. Traced against backend `UserAccountRepository.findForLogin`, which queries `findByUsername(login).or(() -> findByLoginEmail(login))`.
   - Password field with interactive show/hide toggle.
   - "Quên mật khẩu" anchor (`href="#"`) opening a modal providing patient guidance and hotline 1900 6868.
   - Quick demo chips for Patient (`patient`), Receptionist (`receptionist`), and Doctor (`doctor`) with `Password123!`.
   - Distinct error alerts for 401 (invalid credentials) and 403 (inactive account).
   - Role-based automatic redirect on successful authentication.

8. **2-Step OTP Registration R2 (`frontend/src/pages/auth/RegisterPage.jsx`)**:
   - Real-time debounced username check calling `GET /api/patients/check-username`.
   - Step 1 collects `username`, `fullName`, `email`, `password`, `confirmPassword`, and `agreeTerms`, submitting to `POST /api/patients/register`.
   - OTP Gate: 6 individual digit inputs with auto-focus navigation, backspace handling, paste distribution, 60s cooldown timer, and verification via `POST /api/patients/verify-otp`.
   - Step 2 clearly partitions fields into:
     - **Required personal demographics**: `fullName` (pre-filled), `dateOfBirth` (past/present validated), `gender` (`MALE`/`FEMALE`/`OTHER`), `phone` (regex validated), `address` (min 5 chars), `email` (read-only pre-filled).
     - **Optional guardian/emergency contact**: `emergencyContactName`, `emergencyContactPhone` (regex validated only if provided, nullified if blank).
   - Submits to `POST /api/patients/complete-profile`.
   - Displays Step 3 success screen with generated `patientCode` and 5-second countdown redirect to `/login` with pre-filled email.

---

## 2. Logic Chain

1. **Reparse Point & Bundle Integrity**:
   - Windows OneDrive environments trigger `EPERM: operation not permitted, realpath` when Rollup resolves canonical paths across NTFS virtual placeholders.
   - By declaring `resolve: { preserveSymlinks: true }` in `vite.config.js`, Vite skips raw realpath resolution. Independent execution of `vite build` generated the production bundle in 2.32s with 0 errors.

2. **Zero-Dependency SVG Icon Architecture**:
   - Because `lucide-react` is absent from dependencies, importing it would cause module resolution errors in CI/CD and clean environments.
   - Implementing native React SVG components in `Icons.jsx` guarantees zero external bundle friction, 0 lint warnings, and high rendering performance.

3. **Backend Contract Synchronization**:
   - Multi-role login: Spring Boot's `LoginRequest` expects `{ username, password }`. Backend `UserAccountRepository.findForLogin` searches both username and login email. Mapping the frontend dual-credential input to `username` satisfies both username and email logins seamlessly.
   - 2-Step Registration: `POST /api/patients/register` initiates account creation in `PENDING` status and dispatches an OTP. `POST /api/patients/verify-otp` validates the OTP and activates the account to `ACTIVE`. `POST /api/patients/complete-profile` enforces that the account is active before creating the patient record. This prevents users from bypassing OTP verification.
   - Demographic partitioning: The frontend enforces `@NotBlank` fields (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`) on the patient's own information while keeping emergency contacts optional, matching `RegistrationCommands.CompleteProfile`.

4. **Integrity and Facade Verification**:
   - Inspected source code for hardcoded mock returns, fake API responses, or dummy facades.
   - Every user action dispatches real HTTP requests via Axios to backend controllers (`/api/auth/login`, `/api/auth/me`, `/api/patients/*`).
   - No mock flags or shortcuts were detected.

---

## 3. Caveats

1. **Local SMTP Delivery**: Real email dispatch depends on active SMTP configuration (`spring.mail.*`) in Spring Boot. In offline test environments without internet or valid SMTP credentials, OTP codes are logged to backend debug output or stored in the database table `registration_verifications`.
2. **Milestone 3 Portals**: The role portal routes (`/patient/*`, `/reception/*`, `/doctor`) contain foundational layouts, sidebars, and placeholders, ready for full functional feature expansion in Milestone 3.

---

## 4. Conclusion

**Verdict: APPROVE**

The Milestone 2 Frontend implementation fully satisfies all requirements specified in `ORIGINAL_REQUEST.md` (§R1, §R2, §R3) and the architectural constraints in `PROJECT.md`:
- R1 Landing Page has complete aesthetic sections, topbar navigation, and CTA routing.
- R2 2-Step OTP Registration has strict OTP gatekeeping, debounced username checking, 6-digit input navigation, required vs. optional patient fields, and automatic redirect.
- R3 Multi-Role Login supports dual credentials, show/hide password, "Quên mật khẩu" modal, and automatic role redirection.
- Zero build errors (`vite build` completed in 2.32s).
- Zero lint errors (`eslint` passed with 0 warnings/errors).
- Zero integrity violations.

---

## 5. Verification Method

### 5.1 Independent Commands Executed & Outputs
```powershell
# 1. Build Verification
cd frontend
npm run build
# Result: Exit code 0, 97 modules transformed, built in 2.32s

# 2. Lint Verification
cd frontend
npm run lint
# Result: Exit code 0, 0 errors, 0 warnings reported
```

### 5.2 Verification Checklist
| Item | Verification Step | Status |
|------|-------------------|--------|
| Vite Config | `resolve.preserveSymlinks: true` and proxy to port 8081 | PASS |
| Icons | `frontend/src/components/common/Icons.jsx` zero external deps | PASS |
| Interceptors | Bearer token injection and guarded 401 session expiration | PASS |
| AuthContext | User state hydration and session verification via `GET /api/auth/me` | PASS |
| R1 Landing Page | Sticky topbar, hero section, stats cards, departments, workflow, footer | PASS |
| R3 Multi-Role Login | Dual credentials (username/email), forgot password modal, role redirect | PASS |
| R2 Registration | Step 1 account validation, 6-box OTP input, Step 2 required/optional fields, success redirect | PASS |
| Route Guard | `ProtectedRoute` restricts unauthorized roles and unauthenticated visits | PASS |
