# Project: Hospital Management System Showcase

## Architecture
- **Backend Architecture**: Spring Boot 4.0.1, Java 17/21, Spring Security 6, Spring Data JPA, JavaMailSender (Gmail SMTP), MySQL 8.0+.
  - Directory: `backend/swd`
  - Rest APIs:
    - `/api/auth/**`: Multi-role login supporting both Username and Email with Password, JWT/AuthSession token generation, session verification, logout.
    - `/api/patients/**`: Two-step registration: Step 1 (Username, Email, Password + SMTP OTP sending & verification), Step 2 (`/api/patients/complete-profile` accepting required patient fields vs optional emergency contacts).
    - `/api/appointments/**` & `/api/patient/appointments`: Patient appointment listing, detail viewing, cancellation (with 24h notice rule), rescheduling, and available slots query.
    - `/api/reception/**`: Restored `ReceptionAppointmentController` (hospital-wide appointment list, detail, check-in, undo check-in, cancel, reschedule) and new `ReceptionPatientController` (patient search, detail, create, edit, activate/deactivate).
    - `/api/doctor/**`: Doctor view data and clinical encounter access.
- **Frontend Architecture**: React 18.2.0, Vite 7.3.1 (`preserveSymlinks: true`), Tailwind CSS 3.4.14, React Router DOM 6.30.0, Axios 1.7.9.
  - Directory: `frontend`
  - Layouts: `MainLayout` (Landing topbar with Login & Register links, Footer), `WorkspaceLayout` (Dynamic role-based sidebar, header with user avatar/name, logout).
  - Routes:
    - `/`: Landing page (Hospital introduction, hero image, specialties, topbar navigation).
    - `/login`: Multi-role login form (Email/Username + Password), "Quên mật khẩu" (`href="#"`) link, Register link.
    - `/register`: 2-step OTP registration flow (Step 1 Account & OTP verification -> Step 2 Patient demographic form with required vs optional fields).
    - `/patient/**`: Patient portal (Sidebar: Đặt lịch hẹn [placeholder], Quản lý lịch hẹn [search, list, detail, cancel, reschedule]).
    - `/reception/**`: Receptionist portal (Sidebar: Tạo hẹn khám walk-in [placeholder], Quản lý lịch hẹn [list, detail, check-in, cancel, reschedule], Quản lý bệnh nhân [search, list, detail, create, edit, activate/deactivate]).
    - `/doctor/**`: Doctor portal (Welcome banner with Doctor name, dashboard placeholder).
- **Data Flow & Shared Interfaces**:
  - Stateless Bearer token stored in browser `localStorage`, attached to Axios HTTP requests via `Authorization: Bearer <token>`.
  - Roles: `PATIENT`, `RECEPTIONIST`, `DOCTOR`.
  - Error responses follow unified format: `ApiResponse<T>(code, message, data, timestamp)`.

## Feature Inventory
Every feature from the Survey phase and `ORIGINAL_REQUEST.md` is cataloged below with its assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1 Hospital Landing Page | Beautiful hospital introduction page with overview, specialties, facilities | M2 | ORIGINAL_REQUEST §R1 |
| 2 | R1 Topbar Navigation | Topbar prominently displaying "Đăng nhập" and "Đăng ký" navigation links | M2 | ORIGINAL_REQUEST §R1 |
| 3 | R2 Registration Step 1 | Form capturing username, email, password; validation for uniqueness | M1, M2 | ORIGINAL_REQUEST §R2 |
| 4 | R2 SMTP OTP Email Dispatch | Real SMTP email dispatch sending 6-digit OTP code to registered email | M1, M2 | ORIGINAL_REQUEST §R2 |
| 5 | R2 OTP Verification Gate | Strict OTP verification gate preventing transition to Step 2 on invalid/unverified OTP | M1, M2 | ORIGINAL_REQUEST §R2 |
| 6 | R2 Registration Step 2 Patient Info | Ingestion of patient information from table `patients`: required patient fields (`full_name`, `date_of_birth`, `gender`, `phone`, `address`) vs optional guardian fields (`emergency_contact_name`, `emergency_contact_phone`) | M1, M2 | ORIGINAL_REQUEST §R2 |
| 7 | R2 DB Persistence & Activation | Complete persistence of account and patient profile to database, activated upon verification | M1 | ORIGINAL_REQUEST §R2 |
| 8 | R3 Multi-Role Dual Login | Login supporting Patient, Receptionist, Doctor via (Email + Password) OR (Username + Password) | M1, M2 | ORIGINAL_REQUEST §R3 |
| 9 | R3 Login Page Links | Login screen displaying "Quên mật khẩu" (`href="#"`) and button to switch to Register | M2 | ORIGINAL_REQUEST §R3 |
| 10 | R3 Role-based Redirection | Automatic redirection to role-specific dashboard upon successful authentication | M2 | ORIGINAL_REQUEST §R3 |
| 11 | R4 Patient Sidebar | Sidebar containing: (1) Đặt lịch hẹn, (2) Quản lý lịch hẹn | M3 | ORIGINAL_REQUEST §R4 |
| 12 | R4 Patient Booking Placeholder | Form booking placeholder card indicating feature is under development | M3 | ORIGINAL_REQUEST §R4 |
| 13 | R4 Patient Appointment List & Search | Patient can search and view list of their own appointments with status badges | M1, M3 | ORIGINAL_REQUEST §R4 |
| 14 | R4 Patient Appointment Detail | Patient can view full details of a selected appointment | M1, M3 | ORIGINAL_REQUEST §R4 |
| 15 | R4 Patient Appointment Cancellation | Patient can cancel their appointment (subject to 24h notice rule) | M1, M3 | ORIGINAL_REQUEST §R4 |
| 16 | R4 Patient Appointment Rescheduling | Patient can reschedule their appointment to an available slot | M1, M3 | ORIGINAL_REQUEST §R4 |
| 17 | R5 Receptionist Sidebar | Sidebar containing: (1) Tạo hẹn khám walk-in, (2) Quản lý lịch hẹn, (3) Quản lý bệnh nhân | M3 | ORIGINAL_REQUEST §R5 |
| 18 | R5 Receptionist Walk-in Placeholder | Walk-in booking placeholder card indicating feature is under development | M3 | ORIGINAL_REQUEST §R5 |
| 19 | R5 Hospital-wide Appointment List | Receptionist can search and view list of all hospital appointments with filters | M1, M3 | ORIGINAL_REQUEST §R5 |
| 20 | R5 Receptionist Appointment Detail | Receptionist can view complete details of any appointment | M1, M3 | ORIGINAL_REQUEST §R5 |
| 21 | R5 Receptionist Check-in | Receptionist executes check-in for arriving appointments | M1, M3 | ORIGINAL_REQUEST §R5 |
| 22 | R5 Receptionist Reschedule & Cancel | Receptionist can reschedule or cancel appointments | M1, M3 | ORIGINAL_REQUEST §R5 |
| 23 | R5 Receptionist Patient Search & List | Full search and view list of all hospital patients | M1, M3 | ORIGINAL_REQUEST §R5 |
| 24 | R5 Receptionist Patient Detail View | View detailed patient profile including demographics and emergency contacts | M1, M3 | ORIGINAL_REQUEST §R5 |
| 25 | R5 Receptionist Create New Patient | Receptionist creates a new patient record in the system | M1, M3 | ORIGINAL_REQUEST §R5 |
| 26 | R5 Receptionist Edit Patient Info | Receptionist updates patient demographics and emergency contact information | M1, M3 | ORIGINAL_REQUEST §R5 |
| 27 | R5 Receptionist Patient Status Toggle | Receptionist activates or deactivates patient accounts | M1, M3 | ORIGINAL_REQUEST §R5 |
| 28 | R6 Doctor View Layout | Dedicated Doctor layout with welcome greeting banner and dashboard placeholder | M3 | ORIGINAL_REQUEST §R6 |
| 29 | E2E Regression & Acceptance Suite | End-to-end verification passing 100% opaque-box requirement tests | M4 | ORIGINAL_REQUEST Acceptance Criteria |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Backend APIs, DDL & Seed Data | Restore Receptionist controllers, add Patient profile completion endpoint, Receptionist patient management CRUD, DDL for `registration_verifications`, and seed demo accounts | none | DONE |
| M2 | Frontend Foundation, Landing Page & Authentication (R1, R2, R3) | Vite config fix, Tailwind styling, Landing Page (R1), 2-step OTP Registration with required/optional patient fields (R2), Multi-role Login with dual credentials & forgot password link (R3) | M1 | DONE |
| M3 | Role-Based Dashboards & Management (R4, R5, R6) | Workspace layouts and sidebars: Patient portal with booking placeholder & appointment management (R4); Receptionist portal with walk-in placeholder, appointment check-in/reschedule/cancel & patient CRUD (R5); Doctor welcome layout (R6) | M2 | DONE |
| M4 | Final Milestone: E2E Verification & Adversarial Hardening | Phase 1: Pass 100% of E2E test suite published in TEST_READY.md. Phase 2: Adversarial coverage hardening | M3 | DONE |

## Interface Contracts

### 1. Patient Registration Step 2 Contract
- Endpoint: `POST /api/patients/complete-profile`
- Request Headers: `Content-Type: application/json`
- Request Body (`PatientProfileInput`):
  ```json
  {
    "email": "patient@example.com",
    "fullName": "Nguyễn Văn An",        // REQUIRED (NotBlank)
    "dateOfBirth": "1998-10-12",       // REQUIRED (NotNull, YYYY-MM-DD)
    "gender": "MALE",                  // REQUIRED (NotNull: MALE, FEMALE, OTHER)
    "phone": "0901234567",             // REQUIRED (NotBlank)
    "address": "123 Giải Phóng, Hà Nội", // REQUIRED (NotBlank)
    "emergencyContactName": "Nguyễn Thị Bình", // OPTIONAL
    "emergencyContactPhone": "0909888777"     // OPTIONAL
  }
  ```
- Response Body:
  ```json
  {
    "code": 200,
    "message": "Hồ sơ bệnh nhân đã được hoàn tất thành công",
    "data": {
      "patientId": 1,
      "patientCode": "PT-DEMO00000000000000000001",
      "fullName": "Nguyễn Văn An"
    }
  }
  ```

### 2. Multi-Role Authentication Contract
- Endpoint: `POST /api/auth/login`
- Request Body (`LoginRequest`):
  ```json
  {
    "login": "patient" or "patient@hospital.vn",
    "password": "Password123!"
  }
  ```
- Response Body (`ApiResponse<LoginResponse>`):
  ```json
  {
    "token": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user": {
      "id": 1,
      "accountId": 1,
      "username": "patient",
      "fullName": "Nguyễn Văn An",
      "role": "PATIENT" | "RECEPTIONIST" | "DOCTOR",
      "staffId": null | 2,
      "patientId": 1 | null
    }
  }
  ```

### 3. Receptionist Patient Management Contract
- `GET /api/reception/patients?search=...&page=0&size=20`: Returns list/page of patients with account status.
- `GET /api/reception/patients/{id}`: Returns full patient profile with demographics and emergency contact.
- `POST /api/reception/patients`: Creates new patient record.
- `PUT /api/reception/patients/{id}`: Updates existing patient details.
- `PUT /api/reception/patients/{id}/status`: Activates (`ACTIVE`) or deactivates (`INACTIVE`) patient user account.

### 4. Appointment Management Contract
- `GET /api/patient/appointments`: Returns appointments for logged-in patient.
- `GET /api/reception/appointments`: Returns hospital-wide appointments with date, doctor, status filters.
- `POST /api/reception/appointments/{id}/check-in`: Checks in arriving appointment.
- `POST /api/appointments/{id}/cancel` & `/api/reception/appointments/{id}/cancel`: Cancels appointment with reason.
- `POST /api/appointments/{id}/reschedule` & `/api/reception/appointments/{id}/reschedule`: Moves appointment to new slot.

## Code Layout
- Backend Source: `backend/swd/src/main/java/com/example/swd/`
  - `controller/auth/`: Authentication endpoints.
  - `controller/patient/`: Patient registration and self-service.
  - `controller/reception/`: Receptionist appointments and patient management.
  - `controller/appointment/`: Appointment lifecycle operations.
  - `controller/doctor/`: Doctor clinical endpoints.
  - `service/` & `service/impl/`: Business domain logic and transactions.
  - `dto/`: Request/response contract definitions.
- Frontend Source: `frontend/src/`
  - `layouts/`: `MainLayout.jsx` (Landing topbar), `WorkspaceLayout.jsx` (Role sidebars).
  - `pages/`:
    - `HomePage.jsx`: Landing page (R1).
    - `auth/`: `LoginPage.jsx` (R3), `RegisterPage.jsx` (R2).
    - `patient/`: `PatientBookingPage.jsx` (R4), `PatientAppointmentsPage.jsx` (R4).
    - `reception/`: `ReceptionWalkInPage.jsx` (R5), `ReceptionAppointmentsPage.jsx` (R5), `ReceptionPatientsPage.jsx` (R5).
    - `doctor/`: `DoctorDashboardPage.jsx` (R6).
  - `services/`: Axios API clients and typed endpoints.
  - `styles/`: CSS stylesheets and Tailwind config.
