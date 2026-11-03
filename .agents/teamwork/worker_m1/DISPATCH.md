# Task Assignment: Worker M1 (Backend APIs, Controllers, Services & Seed Data Integration)

## Context
Project: Hospital Management System Showcase - Milestone 1 (Backend APIs, DDL & Seed Data)
Authoritative Request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md

## Reference Reports
Read all 3 explorer handoff reports thoroughly before starting implementation:
1. `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\handoff.md` (DTOs and Bean Validation)
2. `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_2\handoff.md` (Controllers, Services, and Bug fixes)
3. `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\handoff.md` (Database migrations and seed scripts)

## Identity & Working Directory
- Role: Backend Implementation Worker
- Type: teamwork_worker
- Working Directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\
- Parent: Orchestrator (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership (Exclusively owned files)
You have exclusive write ownership of the following backend files:
1. `backend/swd/src/main/java/com/example/swd/dto/request/RegistrationCommands.java`
2. `backend/swd/src/main/java/com/example/swd/dto/request/ReceptionPatientRequests.java`
3. `backend/swd/src/main/java/com/example/swd/dto/response/ReceptionPatientViews.java`
4. `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`
5. `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`
6. `backend/swd/src/main/java/com/example/swd/service/PatientRegistrationService.java` & `impl/PatientRegistrationServiceImpl.java`
7. `backend/swd/src/main/java/com/example/swd/service/ReceptionPatientService.java` & `impl/ReceptionPatientServiceImpl.java`
8. `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`
9. `backend/swd/src/main/java/com/example/swd/service/AppointmentService.java` & `impl/AppointmentServiceImpl.java`
10. `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
11. `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`
12. `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java`
13. `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
14. Unit test classes in `backend/swd/src/test/java/com/example/swd/`

## Implementation Tasks
1. **Remove Duplicate Endpoints from `AppointmentController.java`**:
   - Remove lines 80–104 (`checkIn` and `undoCheckIn` mapped to `/reception/appointments/...`).
   - Fix `getPatientAppointments`: resolve patient ID from `patientRepository.findByUserAccount_Id(principal.accountId())` when `patientId` query param is null.
   - Add `GET /api/appointments/available-slots`.
2. **Re-create `ReceptionAppointmentController.java`**:
   - Restore under `com.example.swd.controller.reception` with `@RequestMapping("/api/reception")`, `@PreAuthorize("hasRole('RECEPTIONIST')")`, mapping `appointments`, `detail`, `options`, `create`, `checkIn`, `undoCheckIn`, `cancel`, `reschedule`.
   - In `ReceptionAppointmentServiceImpl.java`, make `actor.staffId()` null-safe by looking up staff by account ID if null.
3. **Implement Receptionist Patient Management**:
   - Create `ReceptionPatientRequests.java` (`CreatePatientRequest`, `UpdatePatientRequest`, `UpdateStatusRequest`).
   - Create `ReceptionPatientViews.java` (`PatientListItemView`, `PatientDetailView`).
   - Create `ReceptionPatientService.java` and `ReceptionPatientServiceImpl.java`.
   - Create `ReceptionPatientController.java` under `com.example.swd.controller.reception` (`GET /api/reception/patients`, `GET /api/reception/patients/{id}`, `POST /api/reception/patients`, `PUT /api/reception/patients/{id}`, `PUT /api/reception/patients/{id}/status`).
4. **Implement Patient Registration Step 2 Profile Completion**:
   - Add `CompleteProfile` record to `RegistrationCommands.java` with required patient fields (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`, `email`) and optional emergency fields (`emergencyContactName`, `emergencyContactPhone`).
   - Implement `completeProfile` in `PatientRegistrationService` & `PatientRegistrationServiceImpl`: checks OTP verified gate, updates `Patient` record, assigns `patientCode`, sets account status `ACTIVE`.
   - Add `POST /api/patients/complete-profile` in `PatientController.java`.
   - Update `SecurityConfig.java` to permit `/api/patients/complete-profile` and `/api/appointments/available-slots`.
5. **Session Principal Enrichment**:
   - In `SessionAuthenticationFilter.java`, resolve `staffId` and `patientId` for the principal so `StaffPrincipal` contains valid IDs.
6. **Build and Verification**:
   - Compile backend: `cd backend/swd; ./mvnw clean test-compile`.
   - Run unit tests: `cd backend/swd; ./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'`.
   - Add any new unit test (e.g. for completeProfile and Receptionist patient management) to verify new logic.

## Output
Write your handoff report to:
`c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\handoff.md`.
Document the exact files changed, compilation result, and test outputs.
Then send a completion message to the parent orchestrator.


## 2026-11-02T17:33:44Z
You are Worker M1: Backend Implementation Worker.
Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\
Read your task dispatch: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\worker_m1\DISPATCH.md
Read the authoritative request: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\ORIGINAL_REQUEST.md
Read the project architecture: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\PROJECT.md
Read all explorer reports in:
- c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_1\handoff.md
- c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_m1_2\handoff.md
- c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m1_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Implement the backend changes cleanly, run build and unit tests, document in handoff.md, and notify parent (Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7).
