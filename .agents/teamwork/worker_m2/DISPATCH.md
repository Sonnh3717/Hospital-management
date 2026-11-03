## 2026-11-02T18:58:15Z
You are worker_m2 (Frontend Implementation Worker for Milestone 2).
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m2
Parent Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Context & Reference Documents (READ THESE FIRST):
1. ORIGINAL_REQUEST.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master PROJECT.md: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
3. Explorer Reports with exact blueprints & code:
   - c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_1\handoff.md (Frontend architecture, Vite symlink fix, Tailwind, Axios client, AuthContext, ProtectedRoute, App routing)
   - c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m2_2\handoff.md (Icons.jsx, HomePage.jsx Landing Page R1, LoginPage.jsx Multi-Role Login R3)
   - c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m2_3\handoff.md (RegisterPage.jsx 2-Step OTP Registration R2, patientApi.js)

Assigned Write Ownership:
You have exclusive write ownership of:
- frontend/vite.config.js
- frontend/src/index.css
- frontend/src/main.jsx
- frontend/src/components/common/Icons.jsx
- frontend/src/services/api.js
- frontend/src/services/patientApi.js
- frontend/src/api/client.js
- frontend/src/context/AuthContext.jsx
- frontend/src/components/ProtectedRoute.jsx
- frontend/src/layouts/MainLayout.jsx
- frontend/src/layouts/WorkspaceLayout.jsx
- frontend/src/pages/HomePage.jsx
- frontend/src/pages/auth/LoginPage.jsx
- frontend/src/pages/auth/RegisterPage.jsx
- frontend/src/App.jsx
- Minimal placeholder pages for routing stability:
  - frontend/src/pages/patient/PatientAppointmentsPage.jsx
  - frontend/src/pages/patient/PatientBookingPage.jsx
  - frontend/src/pages/reception/ReceptionAppointmentsPage.jsx
  - frontend/src/pages/reception/ReceptionPatientsPage.jsx
  - frontend/src/pages/reception/ReceptionWalkInPage.jsx
  - frontend/src/pages/doctor/DoctorDashboardPage.jsx
- Your working directory: .agents/teamwork/worker_m2/

Tasks to Implement:
1. Tooling & Architecture:
   - Update frontend/vite.config.js to include `resolve: { preserveSymlinks: true }` and `/api` proxy targeting `http://localhost:8081`.
   - Create frontend/src/index.css with `@tailwind base; @tailwind components; @tailwind utilities;`.
   - Update frontend/src/main.jsx with clean imports (import StrictMode from 'react' and import './index.css').
   - Create frontend/src/components/common/Icons.jsx with the full zero-dependency SVG icon suite from explorer_m2_2.
   - Create frontend/src/services/api.js and frontend/src/services/patientApi.js with typed endpoints, Bearer token request interceptor, and 401 response interceptor.
   - Create frontend/src/context/AuthContext.jsx with session persistence, role helpers, and login/logout handlers.
   - Create frontend/src/components/ProtectedRoute.jsx for role-guarded routes.
   - Create frontend/src/layouts/MainLayout.jsx and WorkspaceLayout.jsx.
2. R1 Landing Page:
   - Implement frontend/src/pages/HomePage.jsx matching the blueprint:
     - Sticky topbar with logo, navigation links, prominent "Đăng nhập" and "Đăng ký" buttons, and authenticated user indicator.
     - Hero section with headline "Chăm sóc sức khỏe toàn diện với đội ngũ chuyên gia hàng đầu", CTA buttons, and `consultation-hero.png` with floating badges.
     - 4 stats cards, 6 department cards, 4-step workflow, and comprehensive footer.
3. R2 2-Step Registration with Real SMTP OTP:
   - Implement frontend/src/pages/auth/RegisterPage.jsx matching spec_miner_m2_3 blueprint:
     - Step 1: Account setup (`username`, `fullName`, `email`, `password`, `confirmPassword`, `agreeTerms`). Calls `POST /api/patients/register`.
     - Real SMTP OTP verification gate: 6 individual digit input boxes, paste support, 60s cooldown timer for "Gửi lại mã OTP" (calls `POST /api/patients/send-otp`), and verification call `POST /api/patients/verify-otp`.
     - Step 2: Patient demographics matching table `patients`:
       - Personal fields (REQUIRED): `fullName`, `dateOfBirth` (past date only), `gender` (MALE/FEMALE/OTHER), `phone` (10-11 digits), `address`, `contactEmail` (read-only from step 1).
       - Guardian fields (OPTIONAL): `emergencyContactName`, `emergencyContactPhone`.
       - Calls `POST /api/patients/complete-profile`.
     - Success banner with generated `patientCode` and redirect to `/login`.
4. R3 Multi-Role Login:
   - Implement frontend/src/pages/auth/LoginPage.jsx matching explorer_m2_2 blueprint:
     - Card layout with hospital branding.
     - Dual credential input field labeled "Email hoặc Tên đăng nhập" mapping to backend `username` field.
     - Password input with show/hide toggle.
     - "Quên mật khẩu" link (`href="#"`) showing hospital guidance modal.
     - "Chưa có tài khoản? Đăng ký ngay" link to `/register`.
     - Quick demo chips for Patient, Receptionist, Doctor.
     - Error alerts on 401/403.
     - Automatic role redirection (`PATIENT` -> `/patient`, `RECEPTIONIST` -> `/reception`, `DOCTOR` -> `/doctor`, `ADMIN` -> `/admin`).
5. Wire App Routes in frontend/src/App.jsx.
6. Build Verification:
   ```powershell
   cd frontend
   npm run build
   ```
   Verify 100% successful build with zero errors.
7. Write your handoff report to:
   c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m2\handoff.md
8. Send completion message to Parent (2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
