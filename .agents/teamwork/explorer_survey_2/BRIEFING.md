# BRIEFING — 2026-11-02T17:15:00Z

## Mission
Explore database schemas, migration files, SQL scripts, and ORM entity classes to detail patient, user/role, and appointment models, seed data, and field requirements.

## 🔒 My Identity
- Archetype: teamwork_explorer
- Roles: Database Schema & Model Explorer
- Working directory: c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2
- Original parent: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Milestone: Initial Survey & Architecture Mapping

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT modify source code or DB directly
- Write only to .agents/teamwork/explorer_survey_2/

## Current Parent
- Conversation ID: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7
- Updated: 2026-11-02T17:15:00Z

## Investigation State
- **Explored paths**:
  - `Hospital_Database_28_Tables_MySQL (1).sql` (all 28 tables, views, triggers, and constraints).
  - `backend/swd/src/main/resources/application.properties` and `smtp.properties`.
  - `backend/swd/target/classes/db/clinical-workflow-migration.sql`.
  - `com.example.swd.entity.*` (Patient, UserAccount, Role, HospitalStaff, DoctorProfile, Appointment, Encounter, RegistrationVerification).
  - `com.example.swd.repository.*` (UserAccountRepository, AppointmentRepository, PatientRepository, RegistrationVerificationRepository).
  - `com.example.swd.service.impl.AuthServiceImpl`, `PatientRegistrationServiceImpl`, `AppointmentServiceImpl`.
  - `docs/spec/common/login.md`, `docs/spec/appointment/checkIn.md`, `viewAppointmentList.md`.
- **Key findings**:
  1. `patients` table structure clearly divides into patient personal fields (required: full_name, date_of_birth, gender, phone, address) vs third-party emergency contact fields (optional: emergency_contact_name, emergency_contact_phone) satisfying R2.
  2. Dual credential authentication (`username + password` OR `email + password`) is supported natively via `UserAccountRepository.findForLogin()`.
  3. Single role per user (`roles`: ADMIN, MANAGER, DOCTOR, MEDICAL_SERVICE_STAFF, RECEPTIONIST, PATIENT).
  4. Appointments link to doctor and schedule via `appointment_slots` -> `work_schedules` -> `hospital_staff` / `doctor_profiles`.
  5. Critical DDL gap: `registration_verifications` entity exists in Java but is absent from the 28-table MySQL script. Provided DDL migration script.
  6. Seed data gap: Baseline script only seeds `roles`. Provided complete showcase seed script `seed_demo_data.sql` for Patient, Receptionist, and Doctor test accounts.
- **Unexplored areas**: None within database schema and model scope.

## Key Decisions Made
- Fully documented 5-component handoff report in `handoff.md`.
- Prepared DDL migration script for `registration_verifications` and seed script for showcase accounts.

## Artifact Index
- `DISPATCH.md` — Task assignment & instructions
- `progress.md` — Liveness heartbeat & milestone log
- `handoff.md` — 5-component comprehensive investigation report
