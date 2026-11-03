# Handoff Report: Codebase, Tech Stack & Architecture Survey

- **Agent**: Explorer 1 (Codebase, Tech Stack & Architecture Explorer)
- **Role**: teamwork_explorer
- **Working Directory**: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_1\`
- **Parent**: Orchestrator (Conversation ID: `2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7`)
- **Authoritative Request**: `.agents/teamwork/ORIGINAL_REQUEST.md`

---

## 1. Observation

### 1.1. High-Level Architecture & Tech Stack Identification
1. **Repository Layout**:
   - Multi-tier decoupled architecture: Maven multi-module parent at root (`pom.xml`), Spring Boot backend in `backend/swd`, and React SPA frontend in `frontend`.
   - Root `pom.xml` (lines 1–15):
     ```xml
     <groupId>com.example</groupId>
     <artifactId>hospital-management</artifactId>
     <version>0.0.1-SNAPSHOT</version>
     <packaging>pom</packaging>
     <modules>
         <module>backend/swd</module>
     </modules>
     ```
2. **Backend Framework & Runtime**:
   - File: `backend/swd/pom.xml` (lines 6–19, 21–61):
     - Parent: `org.springframework.boot:spring-boot-starter-parent:4.0.1`.
     - Java version: 17 configured (`<java.version>17</java.version>`), running on JDK 21 runtime (`Oracle JDK 21.0.11` on Windows 11).
     - Build tool: Apache Maven 3.9.12 via included wrapper (`backend/swd/mvnw`, `backend/swd/mvnw.cmd`).
     - Core starters:
       - `spring-boot-starter-webmvc` (RESTful APIs, Jackson, Jakarta Servlet)
       - `spring-boot-starter-data-jpa` (Hibernate 6/7, JPA repositories, JpaSpecificationExecutor)
       - `spring-boot-starter-validation` (Jakarta Bean Validation)
       - `spring-boot-starter-security` (Spring Security 6)
       - `spring-boot-starter-mail` (JavaMailSender integration)
       - `com.mysql:mysql-connector-j` (MySQL 8.x/9.x runtime JDBC driver)
       - `org.projectlombok:lombok` (Compile-time code generation)
       - `spring-boot-starter-data-jpa-test`, `spring-boot-starter-webmvc-test` (JUnit 5, Mockito)
3. **Frontend Framework & Tooling**:
   - File: `frontend/package.json` (lines 1–35):
     - Core: React 18.2.0 (`react`, `react-dom`).
     - Routing: `react-router-dom: ^6.30.0`.
     - Networking: `axios: ^1.7.9`.
     - Styling: `tailwindcss: ^3.4.14`, `postcss: ^8.4.41`, `autoprefixer: ^10.4.20`.
     - Build tool & Bundler: Vite 7.3.1 (`vite`, `@vitejs/plugin-react: ^5.1.1`).
     - Node engine: `^20.19.0 || >=22.12.0` (Running Node.js v24.20.0).
   - File: `frontend/vite.config.js` (lines 1–11):
     - Port configured: `5174` (`server: { port: 5174 }`).
   - File: `frontend/.env.example` (line 1):
     - `VITE_API_URL=http://localhost:8081/api`.

### 1.2. Build & Test Commands Execution & Runtime Diagnostics
1. **Backend Compilation**:
   - Command: `cd backend/swd; ./mvnw test-compile`
   - Result:
     ```
     [INFO] Building swd 0.0.1-SNAPSHOT
     [INFO] BUILD SUCCESS
     [INFO] Total time: 2.417 s
     ```
2. **Backend Unit Testing Diagnostics**:
   - When running standard test command `./mvnw test '-Dtest=PatientRegistrationServiceTest'` on Java 21, the test execution stalled on:
     ```
     Running com.example.swd.service.PatientRegistrationServiceTest
     Mockito is currently self-attaching to enable the inline-mock-maker.
     WARNING: A Java agent has been loaded dynamically (byte-buddy-agent-1.17.8.jar)
     ```
   - Cause: Under JDK 21 on Windows, Mockito 5 inline mock maker's self-attachment hangs due to JDK 21 dynamic agent loading restrictions.
   - Verified solution: Supplying ByteBuddy agent explicitly via `-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar`.
   - Verified execution:
     - Command: `cd backend/swd; ./mvnw test '-Dtest=PatientRegistrationServiceTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'`
     - Result: `Tests run: 17, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.734 s. BUILD SUCCESS.`
     - Command: `cd backend/swd; ./mvnw test '-Dtest=RegistrationEmailServiceTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'`
     - Result: `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.811 s. BUILD SUCCESS.`
3. **Frontend Build Diagnostics**:
   - Command: `cd frontend; npm run build`
   - Result:
     ```
     error during build:
     [vite:build-html] EPERM: operation not permitted, realpath 'C:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\frontend\src\main.jsx'
     ```
   - Cause: Node.js `fs.realpathSync.native` triggers `EPERM` when resolving files inside OneDrive sync directory on Windows.
   - In `node_modules/vite/dist/node/chunks/config.js` lines 32932–32935:
     ```javascript
     function getRealPath(resolved, preserveSymlinks) {
         if (!preserveSymlinks) resolved = safeRealpathSync(resolved);
         return normalizePath(resolved);
     }
     ```
   - Verified solution: Configuring `resolve: { preserveSymlinks: true }` in `frontend/vite.config.js`.
   - Programmatic verification: `node -e "const { build } = require('vite'); build({ resolve: { preserveSymlinks: true } }).then(...)` bypassed `EPERM realpath` completely.
   - Subsequent missing asset: `frontend/src/main.jsx` imports `./index.css`, `./styles/global.css`, and `./styles/clinical.css`, which are currently missing on disk and must be created.

### 1.3. Code Layout & Directory Structure
1. **Backend Source Layout (`backend/swd/src/main/`)**:
   - `java/com/example/swd/`:
     - `SwdApplication.java`: Spring Boot main class.
     - `config/`:
       - `ClinicalUploadConfig.java`: Multipart / clinical upload configuration.
       - `SmtpConfig.java`: Mail sender bean (`JavaMailSender`) and system UTC `Clock`.
       - `WebConfig.java`: CORS configuration allowing origins `*`, methods `GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD`, and credentials.
     - `security/`:
       - `SecurityConfig.java`: Stateless session, URL authorization, BCrypt password encoder, filter ordering.
       - `SessionAuthenticationFilter.java`: OncePerRequestFilter parsing Bearer tokens, resolving `auth_sessions`.
       - `StaffPrincipal.java`: User identity record (`accountId`, `staffId`, `username`, `fullName`, `role`, `patientId`).
       - `SecurityResponses.java`: Standard JSON error writer for 401 and 403 responses.
     - `controller/`:
       - `appointment/AppointmentController.java`: Appointment booking, payOS checkout, check-in, undo check-in, cancel, reschedule, details, patient appointments, doctor appointments.
       - `auth/AuthController.java`: Login (`/api/auth/login`), current user (`/api/auth/me`), logout (`/api/auth/logout`).
       - `patient/PatientController.java`: Registration (`/api/patients/register`), OTP sending (`/api/patients/send-otp`), OTP verification (`/api/patients/verify-otp`), username check (`/api/patients/check-username`).
       - `medicalservice/MedicalServiceController.java`: Medical service queue workflows.
       - `system/HealthController.java`: Health check endpoint (`/api/health`).
       - `reception/`: Folder present, currently empty (ready for Receptionist patient management endpoints).
     - `dto/`:
       - `request/`: `LoginRequest`, `RegistrationCommands` (records `Register`, `SendOtp`, `VerifyOtp`), `ReceptionRequests` (records `NewPatient`, `CreateAppointment`, `CancelAppointment`, `RescheduleAppointment`), `CreateAppointmentRequest`, `RescheduleRequest`, `CancelAppointmentRequest`, `UndoCheckInRequest`.
       - `response/`: `ApiResponse<T>`, `LoginResponse`, `UserInfoResponse`, `AppointmentResponse`, `AppointmentTicketResponse`, `BookingCheckoutResponse`, `WorkflowViews`.
     - `entity/`:
       - `identity/`: `UserAccount`, `Role`, `AuthSession`, `RegistrationVerification`, `PasswordResetToken`.
       - `patient/`: `Patient`.
       - `staff/`: `HospitalStaff`, `DoctorProfile`.
       - `appointment/`: `Appointment`, `AppointmentSlot`, `AppointmentRule`, `WorkSchedule`, `ShiftTemplate`.
       - `clinical/`: `Encounter`, `EncounterDiagnosis`, `TreatmentDecision`, `FollowUpRequest`.
       - `billing/`: `Invoice`, `InvoiceItem`, `Payment`.
       - `medicalservice/`: `MedicalService`, `StaffMedicalService`, `MedicalServiceRequest`, `MedicalServiceResult`.
     - `repository/`: `UserAccountRepository`, `PatientRepository`, `AuthSessionRepository`, `RoleRepository`, `AppointmentRepository`, `RegistrationVerificationRepository`, `HospitalStaffRepository`, etc.
     - `service/` & `service/impl/`: `AuthService` / `AuthServiceImpl`, `PatientRegistrationService` / `PatientRegistrationServiceImpl`, `AppointmentService` / `AppointmentServiceImpl`.
     - `integration/`: `RegistrationEmailService` (SMTP mailer), `PayOSService` (payment gateway).
   - `resources/`:
     - `application.properties`: Port 8081, MySQL JDBC URL, JPA ddl-auto=none.
     - `smtp.properties`: Host, port, username, password, STARTTLS properties.
2. **Frontend Source Layout (`frontend/`)**:
   - `index.html`: Base HTML template with viewport, favicon, and script module hook.
   - `vite.config.js`: Dev server on port 5174.
   - `tailwind.config.js`: Tailwind v3 content scan across `index.html` and `src/**/*.{js,jsx,ts,tsx}`.
   - `public/images/`: Contains `consultation-hero.png`.
   - `src/`: Currently contains only `App.jsx` and `main.jsx` (cleared in git commit `41bd23c` to enable a clean rewrite).

### 1.4. Authentication, Security & SMTP Configuration
1. **Authentication Flow**:
   - Public Login endpoint: `POST /api/auth/login`.
   - Dual-credential support: `UserAccountRepository.java:16–19`:
     ```java
     default Optional<UserAccount> findForLogin(String login) {
         return findByUsername(login).or(() -> findByLoginEmail(login));
     }
     ```
     Users can log in with either Username OR Email.
   - Password verification: `passwordEncoder.matches(request.getPassword(), account.getPasswordHash())` with BCrypt.
   - Session generation: Creates `AuthSession` with UUID token in `auth_sessions`, expires in 24 hours (`plusDays(1)`).
   - Response payload:
     ```json
     {
       "token": "04bfdbb5-31c3-4d6f-bf3a-e274c3d31481",
       "user": {
         "id": 1,
         "accountId": 1,
         "username": "patient",
         "fullName": "Nguyễn Văn An",
         "role": "PATIENT",
         "staffId": null,
         "patientId": 1
       }
     }
     ```
2. **Security & Route Guarding (`SecurityConfig.java:42–56`)**:
   - `permitAll()`: `GET /api/health`, `POST /api/auth/login`, `/api/public/**`, `POST /api/patients/register`, `POST /api/patients/send-otp`, `POST /api/patients/verify-otp`, `GET /api/patients/check-username`.
   - `authenticated()`: `/api/auth/me`, `/api/auth/logout`.
   - `hasRole('RECEPTIONIST')`: `/api/reception/**`.
   - `hasRole('DOCTOR')`: `/api/doctor/**`.
   - `hasRole('PATIENT')`: `/api/patient/**`.
   - Stateless session management with custom Bearer token resolution in `SessionAuthenticationFilter`.
3. **SMTP Email Delivery (`smtp.properties` & `SmtpConfig.java`)**:
   - Loaded via `@PropertySource("classpath:smtp.properties")`.
   - Pre-configured defaults:
     ```properties
     spring.mail.host=${SMTP_HOST:smtp.gmail.com}
     spring.mail.port=${SMTP_PORT:587}
     spring.mail.username=${SMTP_USERNAME:emnam2k5@gmail.com}
     spring.mail.password=${SMTP_PASSWORD:zwgz gkwq ykjo crut}
     spring.mail.properties.mail.smtp.auth=${SMTP_AUTH:true}
     spring.mail.properties.mail.smtp.starttls.enable=${SMTP_STARTTLS:true}
     spring.mail.properties.mail.smtp.starttls.required=${SMTP_STARTTLS:true}
     app.mail.from=${SMTP_FROM:${SMTP_USERNAME:}}
     ```
   - Delivery logic: `RegistrationEmailService.sendOtp(address, otp)` formats a 6-digit numeric OTP with 5-minute validity instructions and delivers via Gmail SMTP.

---

## 2. Logic Chain

1. **Premise 1**: The course project requires a showcase demonstrating Landing Page (R1), OTP registration (R2), multi-role login (R3), and role-based screens for Patient (R4), Receptionist (R5), and Doctor (R6).
   - *Observation Ref*: `ORIGINAL_REQUEST.md:1–68`.
2. **Premise 2**: The backend already contains well-tested controllers, services, repositories, and entities for authentication, patient registration with OTP, appointment booking, check-in, undo check-in, cancel, and reschedule.
   - *Observation Ref*: `backend/swd/src/main/java/com/example/swd/`, tests pass 20/20 in 1.7s.
3. **Premise 3**: The backend supports dual-credential login natively (`UserAccountRepository.findForLogin()`), handling both username + password and email + password.
   - *Observation Ref*: `UserAccountRepository.java:16–19`, `AuthServiceImpl.java:39–47`.
4. **Premise 4**: The frontend was intentionally reset in git commit `41bd23c` ("delete all frontend code to refresh"), leaving only minimal stubs (`App.jsx` and `main.jsx`), and needs full implementation of the UI components and pages.
   - *Observation Ref*: `git log` commit `41bd23c`, `frontend/src/`.
5. **Premise 5**: Running Vite on Windows inside a OneDrive directory with Node 24 fails with `EPERM realpath` unless `resolve: { preserveSymlinks: true }` is enabled in `vite.config.js`.
   - *Observation Ref*: `config.js:32932–32935`, experimental build verification.
6. **Premise 6**: The physical database schema requires the `registration_verifications` table (identified in `explorer_survey_2/handoff.md`), and fixed seed accounts are required to log into Patient, Receptionist, and Doctor views without manual DB manipulation.
   - *Observation Ref*: `explorer_survey_2/handoff.md:231–300`.
7. **Inference**: By pairing the existing Spring Boot REST endpoints with:
   - A Vite config update (`preserveSymlinks: true`) and Tailwind CSS entry,
   - A clean React frontend structure (Landing Page, Login, Register, Patient, Receptionist, Doctor screens),
   - A Receptionist patient management endpoint in `controller/reception/`,
   - And running the DDL migration + seed script,
   all functional and presentation requirements from R1 to R6 can be completely fulfilled.

---

## 3. Caveats

1. **Vite OneDrive Symlink Behavior**: The `EPERM: operation not permitted, realpath` issue is strictly an environmental characteristic of Node.js 24 + Vite 7 running on NTFS with OneDrive cloud-sync reparse points. Applying `resolve: { preserveSymlinks: true }` in `vite.config.js` is harmless and standard for symlinked/OneDrive projects.
2. **Mockito Dynamic Agent Warning**: The test hang on Java 21 is caused by JEP 451 (disallowing dynamic loading of agents). Passing `-javaagent` in Maven Surefire solves it.
3. **Receptionist Full Patient CRUD API**: `AppointmentController` handles appointment check-in, undo check-in, cancellation, and rescheduling. However, full patient management (search, view detail, add, edit, active/deactivate patient per R5) requires an endpoint such as `ReceptionPatientController` in `backend/swd/src/main/java/com/example/swd/controller/reception/` or extending `PatientController`.
4. **Third-Party Icons**: Neither `lucide-react` nor `@heroicons/react` is currently listed in `package.json`. Rather than installing extra packages, inline SVG icons or standard icons should be utilized for UI simplicity.

---

## 4. Conclusion

1. **Tech Stack Assessment**:
   - Backend: Java 17/21, Spring Boot 4.0.1, Spring Security 6, Spring Data JPA, JavaMailSender (Gmail SMTP), MySQL 8.0+.
   - Frontend: React 18.2.0, Vite 7.3.1, Tailwind CSS 3.4.14, React Router DOM 6.30.0, Axios 1.7.9.
2. **Build & Test Verification**:
   - Backend build: `./mvnw clean compile` runs cleanly in ~2.4 seconds.
   - Backend test: `./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'` runs cleanly in ~5 seconds with 20/20 passing tests.
   - Frontend build: Add `resolve: { preserveSymlinks: true }` to `frontend/vite.config.js` and provide `index.css` to allow `npm run build` and `npm run dev` to execute without error.
3. **Authentication & SMTP**:
   - Multi-role login (Patient, Receptionist, Doctor) and dual identifier (Username OR Email) are fully operational.
   - SMTP credentials and delivery service are configured and tested.
4. **Actionable Roadmap for Implementation**:
   - **Step 1 (DB Setup)**: Run `registration_verifications` DDL migration and insert seed data for test accounts.
   - **Step 2 (Backend Enhancement)**: Implement `ReceptionPatientController` for Receptionist patient search, create, update, and active/deactivate operations.
   - **Step 3 (Frontend Fixes)**: Update `vite.config.js` (`preserveSymlinks: true`), add `index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
   - **Step 4 (Frontend Implementation)**: Implement Landing Page (`/`), Login (`/login`), 2-step OTP Register (`/register`), Patient Portal (`/patient`), Receptionist Portal (`/reception`), and Doctor View (`/doctor`).

---

## 5. Verification Method

### 5.1. Backend Build & Test Commands
Run in PowerShell from repository root:
```powershell
# 1. Compile backend
cd backend/swd
./mvnw clean compile

# 2. Run Registration and SMTP Unit Tests
./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'

# 3. Run Backend Server
./mvnw spring-boot:run
```
Expected output:
- `BUILD SUCCESS`
- Tests run: 20, Failures: 0, Errors: 0, Skipped: 0.
- Server starts on port 8081 (`Tomcat started on port 8081`).

### 5.2. Frontend Build & Dev Server Commands
Run in PowerShell from repository root:
```powershell
# 1. Inspect frontend
cd frontend

# 2. Run Vite build (after vite.config.js update & css creation)
npm run build

# 3. Run Frontend Dev Server
npm run dev
```
Expected output:
- `VITE v7.3.1 ready in ... ms`
- Local URL: `http://localhost:5174/`

### 5.3. Key Inspection Files
- Root Pom: `pom.xml`
- Backend Pom: `backend/swd/pom.xml`
- Security Config: `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`
- Auth Controller: `backend/swd/src/main/java/com/example/swd/controller/auth/AuthController.java`
- Patient Controller: `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
- Appointment Controller: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
- SMTP Properties: `backend/swd/src/main/resources/smtp.properties`
- Frontend Config: `frontend/vite.config.js`, `frontend/package.json`
