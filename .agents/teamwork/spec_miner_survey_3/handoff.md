# Handoff Report: Specification & Requirement Mining (R1–R6)

**Miner**: Spec Miner 3 (Specification & Requirement Miner)  
**Date**: 2026-11-02T17:20:00Z  
**Target Project**: Hospital Management System (`Hospital-management`)  
**Workspace Working Directory**: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_survey_3\`  
**Authoritative Request**: `ORIGINAL_REQUEST.md` (Requirements R1 to R6)

---

## 1. Observation

### 1.1 Architecture & Tech Stack Observed
- **Backend**: Spring Boot 4.0.1, Java 17, Spring Data JPA, Spring Security, Spring Mail (`spring-boot-starter-mail`), MySQL Connector (`mysql-connector-j`), Lombok. Located in `backend/swd`.
- **Frontend**: React 18.2.0, Vite 7.3.1, React Router 6.30.0, Axios 1.7.9, Tailwind CSS 3.4.14. Located in `frontend`.
- **Database Baseline**: `Hospital_Database_28_Tables_MySQL (1).sql` defines 28 tables (`roles`, `user_accounts`, `hospital_staff`, `doctor_profiles`, `patients`, `shift_templates`, `work_schedules`, `appointment_slots`, `appointments`, `encounters`, `invoices`, `auth_sessions`, etc.).
- **SMTP Configuration**: `backend/swd/src/main/resources/smtp.properties` defines `spring.mail.host=smtp.gmail.com`, port `587`, with auth and TLS configured. `RegistrationEmailService.java` sends transactional OTP emails.

### 1.2 Git Commit & Codebase Status
- Commit `41bd23c01214771742d4a5689ecf1681443e9ef5` ("Fix : duplicate url on undo check-in, delete all frontend code to refresh"):
  - Removed all old React pages and components, leaving `frontend/src` with only an unstyled placeholder `App.jsx` and `main.jsx`.
  - Deleted `ReceptionAppointmentController.java` and `DoctorClinicalController.java`.
- Commit `37cc97cc86974a6567579b74423c86f1fcf1f3d2` ("refactor : improve readability of code and package"):
  - Reorganized backend controllers into subpackages: `appointment/AppointmentController.java`, `auth/AuthController.java`, `patient/PatientController.java`, `system/HealthController.java`.
  - Backend services `ReceptionAppointmentServiceImpl.java` (359 lines) and `DoctorClinicalServiceImpl.java` (406 lines) are fully intact and compile cleanly with `BUILD SUCCESS` under `mvn test-compile`.

### 1.3 Requirement Verification Observations
1. **R1 (Landing Page)**:
   - Backend has `/api/health`.
   - Frontend `App.jsx` currently displays only a plain text string without CSS or topbar.
   - Public assets include `frontend/public/images/consultation-hero.png` and `favicon.svg`.
2. **R2 (2-Step Registration with OTP & Patient Info)**:
   - `PatientController.java` provides `/api/patients/register`, `/api/patients/send-otp`, `/api/patients/verify-otp`, `/api/patients/check-username`.
   - `PatientRegistrationServiceImpl.java` issues a 6-digit OTP, expires in 5 minutes, 60s resend cooldown.
   - **Gaps**:
     - `RegistrationCommands.Register` only accepts `username`, `fullName`, `email`, `password`, `confirmPassword`, `agreeTerms`.
     - Fields defined in table `patients` (`date_of_birth`, `gender`, `phone`, `address`, `emergency_contact_name`, `emergency_contact_phone`) are NOT captured during registration or exposed in any update endpoint.
     - Entity `RegistrationVerification.java` expects table `registration_verifications` which is not present in `Hospital_Database_28_Tables_MySQL (1).sql`.
3. **R3 (Multi-role Login)**:
   - `AuthController.java` exposes `POST /api/auth/login`.
   - `UserAccountRepository.findForLogin(login)` queries `findByUsername(login).or(() -> findByLoginEmail(login))`. It directly supports both username and email.
   - Returned `LoginResponse` includes session token and user details with role code (`PATIENT`, `RECEPTIONIST`, `DOCTOR`).
   - Old `LoginForm.jsx` was missing the "Quên mật khẩu" link with `href="#"`.
4. **R4 (Patient Dashboard & Features)**:
   - `AppointmentController.java` provides `/api/patient/appointments`, `/api/appointments/{id}`, `/api/appointments/{id}/cancel`, `/api/appointments/{id}/reschedule`.
   - Cancellation and rescheduling enforce a 24-hour (1440 minute) minimum notice rule for patients.
   - **Gaps**:
     - No patient-accessible endpoint currently exposes available appointment slots for rescheduling.
     - In `AppointmentController.getPatientAppointments`, fallback `principal.accountId()` queries `patient_id = account_id` rather than resolving the linked `Patient` ID.
     - Booking wizard is requested as a simple placeholder for this showcase.
5. **R5 (Receptionist Dashboard & Features)**:
   - Backend service `ReceptionAppointmentServiceImpl.java` implements hospital-wide appointment list (`list`), detail (`detail`), slot options (`options`), check-in (`checkIn`), undo check-in (`undoCheckIn`), cancellation (`cancel`), and rescheduling (`reschedule`).
   - `ReceptionAppointmentController.java` was deleted in commit `41bd23c` and must be restored.
   - Walk-in booking is requested as a simple placeholder for this showcase.
   - **Gaps in Patient Management**:
     - Only `searchPatients(search)` exists (returning a 30-item unpaginated list).
     - Missing patient detail (`GET /api/reception/patients/{id}`).
     - Missing standalone patient creation (`POST /api/reception/patients`).
     - Missing patient update/edit (`PUT /api/reception/patients/{id}`).
     - Missing active/deactivate patient account (`PUT /api/reception/patients/{id}/status`).
6. **R6 (Doctor Dashboard)**:
   - `DoctorClinicalServiceImpl.java` provides complete clinical operations.
   - Requirement only requires a dedicated Doctor layout with a welcome banner / dashboard placeholder after login.
7. **Build Environment Quirk**:
   - Running `vite build` on Windows with OneDrive triggers `EPERM` on `fs.realpathSync.native('...main.jsx')`. Adding `resolve: { preserveSymlinks: true }` in `frontend/vite.config.js` avoids native path resolution and builds successfully.

---

## 2. Logic Chain

1. **Decoupled Architecture**: Because backend is a REST API and frontend is a Vite React SPA, all R1–R6 requirements require synchronized frontend components and backend REST endpoints.
2. **Restoring Core Receptionist & Doctor APIs**: The backend logic for appointments, check-in, and doctor encounters is already written in `ReceptionAppointmentServiceImpl` and `DoctorClinicalServiceImpl`. Reintroducing `ReceptionAppointmentController.java` and `DoctorClinicalController.java` under `com.example.swd.controller.reception` and `com.example.swd.controller.doctor` instantly restores all core appointment workflows.
3. **Addressing the 2-Step Registration Gap (R2)**:
   - Step 1: User fills Account info (`username`, `email`, `password`). System validates uniqueness and sends OTP via SMTP. User submits OTP to verify.
   - Step 2: Patient Information form displays all fields from table `patients`. The system must clearly delineate patient fields (Họ và tên, Ngày sinh, Giới tính, Số điện thoại, Địa chỉ - REQUIRED) vs other person fields (Họ tên người liên hệ khẩn cấp, SĐT người liên hệ khẩn cấp - OPTIONAL).
   - Backend must either accept all profile fields upon completing registration or provide an endpoint `POST /api/patients/complete-profile` that updates the `Patient` entity with the verified account.
4. **Addressing Patient Management Gap for Receptionist (R5)**:
   - Receptionist needs full CRUD + activation for patients. Table `patients` stores demographic data; table `user_accounts` stores `status` (`ACTIVE`/`INACTIVE`).
   - Creating a `ReceptionPatientController.java` (or extending `ReceptionAppointmentController.java`) with endpoints `GET /api/reception/patients`, `GET /api/reception/patients/{id}`, `POST /api/reception/patients`, `PUT /api/reception/patients/{id}`, `PUT /api/reception/patients/{id}/status` satisfies all R5 criteria.
5. **Sidebar Navigation & Routing Alignment**:
   - Login redirection must route based on `user.role`:
     - `PATIENT` -> `/patient/appointments`
     - `RECEPTIONIST` -> `/reception/appointments`
     - `DOCTOR` -> `/doctor/dashboard`
   - Patient Sidebar: (1) Đặt lịch hẹn (placeholder card), (2) Quản lý lịch hẹn (search, list, detail modal, cancel, reschedule).
   - Receptionist Sidebar: (1) Tạo hẹn khám walk-in (placeholder card), (2) Quản lý lịch hẹn (search, list, detail, reschedule, cancel, check-in), (3) Quản lý bệnh nhân (search, list, detail, create, edit, activate/deactivate).
   - Doctor View: Sidebar/header + welcome banner with doctor's full name + dashboard placeholder.

---

## 3. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R1 Landing | Public Hospital Home | Intro to hospital, medical departments, doctor team, facilities | None (HTTP GET `/`) | HTML / React view with Topbar & Hero | 404 for bad routes | `MainLayout.jsx`, `HomePage.jsx` in git log |
| 2 | R1 Landing | Topbar Navigation | Header with Hospital Brand, links to Login (`/login`) and Register (`/register`) | Click events | Route change | N/A | `ORIGINAL_REQUEST.md`, `MainLayout.jsx` |
| 3 | R2 Registration | Username Availability | Real-time check if username is available | `username` (query param) | `boolean` (true/false) | 400 if invalid regex | `PatientController.java:37` |
| 4 | R2 Registration | Step 1 Account & OTP Trigger | Sends 6-digit OTP code to applicant's email via SMTP | `username`, `email`, `password`, `confirmPassword`, `agreeTerms` | `OtpView(message, email, expiresAt, resendAvailableAt)` | 409 USERNAME_IN_USE, 409 EMAIL_IN_USE, 503 SMTP_UNAVAILABLE | `PatientRegistrationServiceImpl.java:62` |
| 5 | R2 Registration | OTP Resend | Resends new 6-digit OTP with 60s cooldown constraint | `email` | `OtpView(...)` | 429 OTP_RESEND_TOO_SOON | `PatientRegistrationServiceImpl.java:101` |
| 6 | R2 Registration | Step 1 OTP Verification | Verifies 6-digit OTP and unlocks transition to Step 2 | `email`, `otp` (6 digits) | `VerifiedView(message, username, email)` | 400 INVALID_OTP, 400 OTP_EXPIRED, 429 OTP_ATTEMPTS_EXCEEDED (max 5) | `PatientRegistrationServiceImpl.java:118` |
| 7 | R2 Registration | Step 2 Patient Info Ingestion | Enters required patient fields (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`) & optional emergency fields | `PatientRegistrationForm` payload | Updated Patient Entity & confirmation | 400 VALIDATION_ERROR on missing required patient fields | `ORIGINAL_REQUEST.md`, Table `patients` schema |
| 8 | R3 Authentication | Multi-role Dual Login | Login via either username+password OR email+password | `LoginRequest(username, password)` | `LoginResponse(token, user: {id, username, fullName, role, patientId, staffId})` | 401 AUTH_INVALID_CREDENTIALS, 403 AUTH_ACCOUNT_INACTIVE | `AuthServiceImpl.java:38`, `UserAccountRepository:16` |
| 9 | R3 Authentication | Current Session Check | Retrieves authenticated user profile & role | `Authorization: Bearer <token>` | `UserInfoResponse` | 401 AUTH_EXPIRED_SESSION | `AuthController.java:32` |
| 10 | R3 Authentication | Logout | Revokes active session token | `Authorization: Bearer <token>` | `{success: true}` | 200 OK idempotent | `AuthController.java:40` |
| 11 | R3 Authentication | Forgot Password Link | Placeholder navigation link for password recovery | Click on link | Opens `href="#"` | None (no-op) | `ORIGINAL_REQUEST.md` R3 |
| 12 | R4 Patient | Booking Placeholder | Booking feature placeholder stating feature under development | Navigate to `/patient/booking` | Form/view placeholder card | N/A | `ORIGINAL_REQUEST.md` R4 |
| 13 | R4 Patient | Patient Appointment List | Displays appointments for logged-in patient with status filter | `patientId` (resolved from auth session) | `List<AppointmentResponse>` | 401 UNAUTHORIZED | `AppointmentController.java:149` |
| 14 | R4 Patient | Appointment Detail | Detailed modal/view of appointment, doctor, slot, code | `id` (path param) | `AppointmentResponse` | 404 APPT_NOT_FOUND | `AppointmentController.java:139` |
| 15 | R4 Patient | Cancel Appointment | Cancels booked appointment (min 24h notice enforced) | `id`, `CancelAppointmentRequest(reason)` | `AppointmentResponse` (status=CANCELLED) | 400 DEADLINE_EXCEEDED (<24h), 400 INVALID_STATUS | `AppointmentServiceImpl.java:131` |
| 16 | R4 Patient | Reschedule Appointment | Moves appointment to new slot (min 24h notice enforced) | `id`, `RescheduleRequest(newAppointmentSlotId)` | `AppointmentResponse` (updated slot) | 400 DEADLINE_EXCEEDED, 409 SLOT_FULL, 400 DUPLICATE_BOOKING | `AppointmentServiceImpl.java:165` |
| 17 | R5 Reception | Walk-in Booking Placeholder | Walk-in feature placeholder stating feature under development | Navigate to `/reception/walk-in` | Form/view placeholder card | N/A | `ORIGINAL_REQUEST.md` R5 |
| 18 | R5 Reception | Hospital-wide Appointment List | Paginated list of all hospital appointments with filters | `date`, `doctorId`, `status`, `search`, `page`, `size` | `PageView<AppointmentView>` | 403 FORBIDDEN if not receptionist | `ReceptionAppointmentServiceImpl.java:74` |
| 19 | R5 Reception | Appointment Check-in | Receptionist checks in an arriving patient | `id` (appointmentId) | `AppointmentView` (status=CHECKED_IN) | 409 ENCOUNTER_STARTED, 409 INVALID_STATE (not today or not BOOKED) | `ReceptionAppointmentServiceImpl.java:174` |
| 20 | R5 Reception | Undo Check-in | Reverses check-in if patient hasn't entered consultation room | `id` (appointmentId) | `AppointmentView` (status=BOOKED) | 409 ENCOUNTER_STARTED | `ReceptionAppointmentServiceImpl.java:190` |
| 21 | R5 Reception | Reschedule & Cancel (Reception) | Flexible rescheduling & cancellation per hospital rules | `id`, `reason` / `slotId` | `AppointmentView` | 409 NOTICE_PERIOD, 409 SLOT_FULL | `ReceptionAppointmentServiceImpl.java:204` |
| 22 | R5 Reception | Patient Search & List | Search patients by name, code, phone | `search`, pagination params | `List<PatientView>` / `PageView<PatientView>` | 403 FORBIDDEN | `ReceptionAppointmentServiceImpl.java:123` |
| 23 | R5 Reception | Patient Detail | View full patient details including address & emergency contact | `patientId` | `PatientDetailView` | 404 NOT_FOUND | Table `patients`, `PatientRepository` |
| 24 | R5 Reception | Create Patient | Receptionist creates new patient record | `PatientCreateRequest` | Created `PatientView` | 400 VALIDATION_ERROR | Table `patients`, `PatientRepository` |
| 25 | R5 Reception | Edit Patient | Update patient demographics & emergency contacts | `patientId`, `PatientUpdateRequest` | Updated `PatientView` | 404 NOT_FOUND, 400 VALIDATION_ERROR | Table `patients`, `PatientRepository` |
| 26 | R5 Reception | Activate / Deactivate Patient | Toggle active status for linked patient user account | `patientId`, `status: ACTIVE/INACTIVE` | Updated status confirmation | 404 NOT_FOUND | Table `user_accounts`, `patients` |
| 27 | R6 Doctor | Doctor Layout & Welcome Banner | Dedicated layout with Doctor navigation and welcome greeting | Navigate to `/doctor/dashboard` | Dashboard banner with Doctor Name + overview cards | 403 FORBIDDEN if not doctor | `ORIGINAL_REQUEST.md` R6 |

---

## 4. Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Dual Login | `username` contains `@` (e.g. `patient@test.com`) | `userAccountRepository.findForLogin` first tests `findByUsername`; failing that, tests `findByLoginEmail`. Validates password and authenticates. |
| 2 | Registration OTP | Wrong OTP entered 5 times | `PatientRegistrationServiceImpl` increments `failedAttempts`. At attempt 5, throws `429 TOO_MANY_REQUESTS` (`OTP_ATTEMPTS_EXCEEDED`). |
| 3 | Registration OTP Resend | User clicks resend before 60 seconds | Throws `429 TOO_MANY_REQUESTS` with message: "Vui lòng chờ X giây trước khi gửi lại mã OTP." |
| 4 | Registration Inactive Account | User attempts to login after Step 1 before OTP verification | Account status is `INACTIVE`. Login fails with `403 FORBIDDEN` (`AUTH_ACCOUNT_INACTIVE`). |
| 5 | Patient Reschedule <24h | Patient reschedules slot starting in 12 hours | Backend calculates `Duration.between(now, slot.startsAt).toMinutes() < 1440` and throws `400 BAD_REQUEST` (`DEADLINE_EXCEEDED`). |
| 6 | Reception Check-in | Checking in appointment scheduled for tomorrow | Throws `409 CONFLICT`: "Chỉ check-in lịch hẹn thuộc ngày tiếp nhận hôm nay." |
| 7 | Undo Check-in | Doctor has already started consultation (`encounter` exists) | Throws `409 CONFLICT` (`ENCOUNTER_STARTED`): "Không thể hoàn tác check-in vì Bác sĩ đã bắt đầu lượt khám." |
| 8 | Vite Build on Windows/OneDrive | Running `npm run build` with default vite config | Fails with `EPERM: operation not permitted, realpath '...main.jsx'`. Succeeded when configuring `resolve: { preserveSymlinks: true }`. |

---

## 5. Implementation Mapping: Exact Files, Endpoints & Components to Create or Update

### 5.1 Backend (`backend/swd`)

| Component / Layer | File Path | Action | Description / Endpoints |
|---|---|---|---|
| **Controller** | `com/example/swd/controller/reception/ReceptionAppointmentController.java` | **CREATE** (Restore) | Recreate controller deleted in `41bd23c`: exposes `GET /api/reception/appointments`, `GET /api/reception/appointments/{id}`, `GET /api/reception/options`, `POST /api/reception/appointments/{id}/check-in`, `POST /api/reception/appointments/{id}/undo-check-in`, `POST /api/reception/appointments/{id}/cancel`, `POST /api/reception/appointments/{id}/reschedule`. |
| **Controller** | `com/example/swd/controller/reception/ReceptionPatientController.java` | **CREATE** | Exposes receptionist patient management: `GET /api/reception/patients` (list & search), `GET /api/reception/patients/{id}` (detail), `POST /api/reception/patients` (create), `PUT /api/reception/patients/{id}` (edit), `PUT /api/reception/patients/{id}/status` (activate/deactivate). |
| **Controller** | `com/example/swd/controller/patient/PatientController.java` | **UPDATE** | Add endpoint for Step 2 profile completion `POST /api/patients/complete-profile` accepting required patient fields (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`) and optional emergency fields. |
| **Controller** | `com/example/swd/controller/appointment/AppointmentController.java` | **UPDATE** | 1) Fix `getPatientAppointments` to resolve `Patient` record from `principal.accountId()` when `patientId` param is omitted; 2) Add `GET /api/appointments/available-slots` so patients can view available slots for rescheduling. |
| **DTO** | `com/example/swd/dto/request/RegistrationCommands.java` | **UPDATE** | Add `PatientProfileInput` record with validation: `@NotBlank fullName`, `@NotNull dateOfBirth`, `@NotNull gender`, `@NotBlank phone`, `@NotBlank address`, optional `emergencyContactName`, optional `emergencyContactPhone`. |
| **DTO** | `com/example/swd/dto/request/ReceptionRequests.java` | **UPDATE** | Add DTOs for `PatientCreateRequest`, `PatientUpdateRequest`, `PatientStatusRequest`. |
| **Service** | `com/example/swd/service/PatientRegistrationService.java` & `impl/...` | **UPDATE** | Add `completePatientProfile(String email, PatientProfileInput input)` to persist patient demographic & emergency fields to DB and activate account. |
| **Service** | `com/example/swd/service/ReceptionPatientService.java` & `impl/...` | **CREATE** | Implement patient CRUD, detail view, and active/deactivate toggle for receptionists. |
| **Database DDL** | `backend/swd/src/main/resources/db/` or root `create_DB.sql` | **VERIFY / SCRIPT** | Ensure table `registration_verifications` exists in MySQL schema (matching entity `RegistrationVerification.java`). |

### 5.2 Frontend (`frontend`)

| Layer / Role | File Path | Action | Description |
|---|---|---|---|
| **Vite Config** | `frontend/vite.config.js` | **UPDATE** | Add `resolve: { preserveSymlinks: true }` to eliminate Windows/OneDrive `fs.realpathSync.native` EPERM error during build. |
| **Styles** | `frontend/src/styles/` (`global.css`, `layout.css`, `auth.css`, `workspace.css`, `operations.css`) | **CREATE** | Restore professional design system styles for navbar, cards, tables, badges, buttons, forms, modals. |
| **Components** | `frontend/src/components/` (`Icon.jsx`, `ui/Button.jsx`, `ui/Field.jsx`, `ui/Modal.jsx`, `ui/StatusBadge.jsx`, `ui/EmptyState.jsx`) | **CREATE** | Core UI primitives for layouts, forms, and dialogs. |
| **Auth & Shell** | `frontend/src/layouts/MainLayout.jsx` | **CREATE** | Landing page layout with topbar: Brand, Nav links, prominent "Đăng nhập" and "Đăng ký" buttons, Footer. |
| **Auth & Shell** | `frontend/src/layouts/WorkspaceLayout.jsx` | **CREATE** | Workspace shell with dynamic sidebar per role (`PATIENT`, `RECEPTIONIST`, `DOCTOR`), top header with user avatar/name, and logout button. |
| **Context & Hooks** | `frontend/src/context/AuthProvider.jsx`, `hooks/useAuth.js` | **CREATE** | Authentication state management with session token persistence, user profile, login, logout, and role check. |
| **Services API** | `frontend/src/services/api.js`, `authService.js`, `registrationService.js`, `appointmentService.js`, `receptionService.js` | **CREATE** | Axios client with `Bearer <token>` interceptor and typed service functions. |
| **R1 Landing** | `frontend/src/pages/HomePage.jsx` | **CREATE** | Aesthetic landing page: Hospital introduction, Hero with `consultation-hero.png`, specialties, doctors, quick links. |
| **R2 Register** | `frontend/src/pages/auth/RegisterPage.jsx` | **CREATE** | Step 1 Form (username, email, password, confirmPassword) -> Send OTP -> Step 1 OTP Verification -> Step 2 Patient Info Form (distinct required patient fields vs optional emergency fields) -> Finish. |
| **R3 Login** | `frontend/src/pages/auth/LoginPage.jsx` | **CREATE** | Multi-role login form (Email/Username + Password), "Quên mật khẩu" (`href="#"`) link, "Đăng ký" link, and automatic redirection to role dashboards. |
| **R4 Patient** | `frontend/src/pages/patient/PatientBookingPage.jsx` | **CREATE** | Booking placeholder card: "Tính năng Đặt lịch hẹn đang được phát triển". |
| **R4 Patient** | `frontend/src/pages/patient/PatientAppointmentsPage.jsx` | **CREATE** | Patient appointment management: search bar, list with status badges, appointment detail modal, cancel appointment modal, reschedule modal. |
| **R5 Reception** | `frontend/src/pages/reception/ReceptionWalkInPage.jsx` | **CREATE** | Walk-in booking placeholder card: "Tính năng Tạo hẹn khám walk-in đang được phát triển". |
| **R5 Reception** | `frontend/src/pages/reception/ReceptionAppointmentsPage.jsx` | **CREATE** | Hospital-wide appointment management: date/doctor/status filters, patient search, appointment list, check-in action, reschedule, cancel. |
| **R5 Reception** | `frontend/src/pages/reception/ReceptionPatientsPage.jsx` | **CREATE** | Patient management: search, patient table, view patient detail modal, create new patient modal, edit patient modal, activate/deactivate toggle. |
| **R6 Doctor** | `frontend/src/pages/doctor/DoctorDashboardPage.jsx` | **CREATE** | Doctor layout with welcome greeting banner ("Bác sĩ [Họ tên]") and dashboard placeholder cards. |
| **Routing** | `frontend/src/App.jsx` | **UPDATE** | Configure `BrowserRouter`, public routes (`/`, `/login`, `/register`), and role-protected routes (`/patient/*`, `/reception/*`, `/doctor/*`). |

---

## 6. Caveats
1. **Database Schema Sync**:
   - `Hospital_Database_28_Tables_MySQL (1).sql` contains 28 tables and does not include `registration_verifications`. If the local MySQL instance was initialized solely with that SQL file, table `registration_verifications` must be created with DDL before running registration OTP flow.
2. **SMTP Credentials**:
   - `smtp.properties` has configured credentials for `smtp.gmail.com:587`. If Gmail restricts app password access or internet connection is blocked in restricted sandboxes, SMTP errors can occur (`SMTP_UNAVAILABLE`). Mock / fallback logs or test email credentials should be validated.
3. **24-hour Notice Rule**:
   - In `AppointmentServiceImpl`, cancelling or rescheduling by a patient requires `>1440 minutes` notice. If testing with appointments created today, the backend will reject patient cancellation/rescheduling with `DEADLINE_EXCEEDED`. For showcase testing, receptionist reschedule/cancel or future test data can be utilized.

---

## 7. Conclusion
- The backend Spring Boot application contains solid foundation services (`AppointmentServiceImpl`, `ReceptionAppointmentServiceImpl`, `DoctorClinicalServiceImpl`, `AuthServiceImpl`) that cover the business logic.
- The primary gaps are:
  1. Frontend was emptied in commit `41bd23c` and must be reconstructed with complete views for R1 (Landing Page), R2 (2-Step Registration with Patient Info), R3 (Multi-role Login), R4 (Patient view & Appointment management), R5 (Receptionist view with Walk-in, Appointments & Patient management), and R6 (Doctor view).
  2. In backend, `ReceptionAppointmentController.java` was deleted and needs reinstatement, plus adding the missing patient management endpoints for Receptionist (R5) and Step 2 profile completion for Patient registration (R2).
  3. `vite.config.js` requires `resolve.preserveSymlinks: true` to prevent Windows/OneDrive realpath build failures.

---

## 8. Verification Method
1. **Backend Verification**:
   - Run `mvn test-compile` from `backend/swd` to ensure Java compilation passes without error.
   - Run unit tests: `mvn test -Dtest=PatientRegistrationServiceTest,PatientControllerTest`.
2. **Frontend Build Verification**:
   - Verify `vite.config.js` has `resolve: { preserveSymlinks: true }`.
   - Run `npm run build` from `frontend` to verify successful asset bundle creation in `frontend/dist`.
3. **Functional UI Flow Verification**:
   - **R1**: Navigate to `http://localhost:5174/` -> Verify header topbar shows "Đăng nhập" and "Đăng ký" buttons. Click to verify routing to `/login` and `/register`.
   - **R2**: Navigate to `/register` -> Fill username, email, password -> Verify OTP email sent -> Enter 6-digit OTP -> Verify transition to Step 2 -> Fill patient required info (name, DOB, gender, phone, address) and optional emergency contact -> Submit -> Verify record created in database.
   - **R3**: Navigate to `/login` -> Verify "Quên mật khẩu" link has `href="#"` -> Test login with (username + password) and (email + password) for Patient, Receptionist, Doctor -> Verify automatic redirection to `/patient/appointments`, `/reception/appointments`, and `/doctor/dashboard`.
   - **R4**: As Patient, verify sidebar has "Đặt lịch hẹn" (placeholder) and "Quản lý lịch hẹn". Test appointment search, detail view, cancel, reschedule.
   - **R5**: As Receptionist, verify sidebar has "Tạo hẹn khám walk-in" (placeholder), "Quản lý lịch hẹn", and "Quản lý bệnh nhân". Test appointment check-in, search, cancel, reschedule. Test patient search, detail view, create new patient, edit patient, activate/deactivate.
   - **R6**: As Doctor, verify welcome greeting banner with doctor name and dashboard placeholder.
