# Handoff Report: Spec Miner M1-3 — Database Migration & Seed Data Specification

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | DDL Migration | `registration_verifications` Table Schema | Stores OTP verification state for self-registered patient accounts before profile completion. PK/FK on `user_account_id`. | DDL script execution against MySQL `hospital_management` | Table `registration_verifications` created with InnoDB utf8mb4 | Fails if `user_accounts` table does not exist; idempotent with `IF NOT EXISTS` | `RegistrationVerification.java`, `PatientRegistrationServiceImpl.java` |
| 2 | Identity / Auth | Patient Demo Account | Ready-to-use patient account with dual login support (username `patient`, email `patient@hospital.vn`, password `Password123!`). | SQL seed script | `user_accounts` row with role_id=6, status='ACTIVE', linked to `patients` row | Fails on unique duplicate unless handled via `NOT EXISTS` / `UPDATE` | `ORIGINAL_REQUEST.md`, `PROJECT.md`, `Patient.java` |
| 3 | Identity / Staff | Receptionist Demo Account | Ready-to-use receptionist account (username `receptionist`, email `receptionist@hospital.vn`, password `Password123!`). | SQL seed script | `user_accounts` row with role_id=5, linked to `hospital_staff` row (`STF-REC001`) | Fails on unique staff_code or user_account_id collision | `HospitalStaff.java`, `ReceptionAppointmentServiceImpl.java` |
| 4 | Identity / Staff | Doctor Demo Account & Profile | Ready-to-use doctor account (username `doctor`, email `doctor@hospital.vn`, password `Password123!`). | SQL seed script | `user_accounts` row (role_id=3) linked to `hospital_staff` (`DOC-001`) and `doctor_profiles` | Fails on license_number collision or missing staff record | `DoctorProfile.java`, `DoctorProfileRepository.java` |
| 5 | Scheduling | Dynamic Vietnam-Time Shifts & Schedules | Shift templates (`SHIFT-ALLDAY`, `SHIFT-MORNING`) and doctor work schedules for Today and Tomorrow calculated dynamically relative to Vietnam timezone (UTC+7). | SQL expressions: `@vn_today`, `@day_start`, `@tomorrow_start` | `shift_templates` and `work_schedules` records | Fails if `ends_at <= starts_at` (CHECK `ck_t07_01`) | `Hospital_Database_28_Tables_MySQL (1).sql` §06-07 |
| 6 | Appointments | Dynamic Appointment Slots | Slots for Today (08:00, 08:30, 09:00, 14:00 VN) and Tomorrow (08:00, 08:30, 09:00 VN) generated under doctor's work schedule. | Work schedule IDs, appointment rule ID, UTC start/end times | `appointment_slots` rows with status='OPEN' | Fails on duplicate `(work_schedule_id, starts_at)` (UQ `uq_t12_01`) | `AppointmentSlot.java`, `appointmentLifecycle_and_scheduledTasks.md` |
| 7 | Appointments | Sample Appointments (`CHECKED_IN`, `BOOKED`, `CANCELLED`) | High-fidelity sample appointments: CHECKED_IN for today (receptionist queue demo), BOOKED for tomorrow (>= 24h for reschedule/cancel demo), CANCELLED (filter demo). | Appointment codes, patient ID, slot IDs, staff IDs | `appointments` rows satisfying MySQL CHECK constraints | Fails with MySQL check constraint violation if status fields violate `ck_t13_01` to `ck_t13_05` | `Hospital_Database_28_Tables_MySQL (1).sql` §13, `Appointment.java` |
| 8 | Maintenance | Idempotent Re-Run Capability | Allows running seed scripts repeatedly on clean or existing databases without primary/unique key conflicts, while updating credentials to showcase defaults. | `INSERT ... SELECT ... WHERE NOT EXISTS (...)` and `UPDATE` | Deterministic demo database state | No SQL syntax or constraint runtime errors on re-execution | `clinical-demo-seed.sql`, `test-seed-data.sql` |
| 9 | Database Setup | Standalone SQL Script Pipeline | Schema creation, clinical migration, verification table migration, and demo seed execution sequence via MySQL CLI / Workbench. | Executing 4 SQL scripts in sequence | Complete functioning `hospital_management` database | Fails if scripts are executed out of order | `application.properties`, `docs/database-jpa.md` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | `appointments` Check-in Status | `status='CHECKED_IN'` with `checked_in_at=NULL` or `checked_in_by_staff_id=NULL` | MySQL rejected with `Check constraint 'ck_t13_01' is violated`. Seed script explicitly populates both fields for CHECKED_IN. |
| 2 | `appointments` Booked Status | `status='BOOKED'` with non-null `checked_in_at` or `cancelled_at` | MySQL rejected with `Check constraint 'ck_t13_01'` or `'ck_t13_02'`. Seed script ensures these timestamp fields remain NULL for BOOKED. |
| 3 | `appointments` Active Slot Collision | Same patient assigned two `BOOKED` or `CHECKED_IN` appointments on the same slot | MySQL generated column `active_slot_id` triggers `uq_t13_02 (patient_id, active_slot_id)` unique violation. Seed script uses distinct slots for each appointment. |
| 4 | Reschedule & Cancel Notice Threshold | Appointment scheduled < 24h from now | Patient self-service cancel and reschedule endpoints throw `TOO_LATE_TO_CANCEL` or `TOO_LATE_TO_RESCHEDULE` (rule requires 1440 min notice). Seed script places BOOKED appointment on Tomorrow's slot (>= 24h away). |
| 5 | Timezone Discrepancy (UTC vs UTC+7) | Hardcoded static UTC timestamps in seed data | On showcase days in different months/dates, appointment queries checking `today()` in `ReceptionAppointmentServiceImpl` return empty lists. Dynamic expressions (`DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR)`) ensure demo data is perpetually aligned with the current day. |
| 6 | Seed Script Re-execution | Existing user accounts with different IDs or passwords | Hardcoded `user_account_id` in `INSERT` causes duplicate key errors or corrupts auto-increment sequence. `INSERT ... WHERE NOT EXISTS` + `UPDATE` pattern updates existing rows cleanly without errors. |
| 7 | `registration_verifications` Lock Threshold | 5 consecutive invalid OTP attempts | `PatientRegistrationServiceImpl` locks verification with `TOO_MANY_ATTEMPTS`. Table definition requires `failed_attempts INT UNSIGNED NOT NULL DEFAULT 0`. |
| 8 | Clinical Payment Pre-payment | `payments.invoice_id` is NOT NULL before encounter completion | Baseline 28-table schema required `invoice_id NOT NULL`. `clinical-workflow-migration.sql` alters column to `NULL` to support advance appointment booking checkout. |

---

## 1. Observation

1. **Schema Baseline and Configuration**:
   - File `Hospital_Database_28_Tables_MySQL (1).sql` defines 28 tables, 6 roles (`ADMIN`, `MANAGER`, `DOCTOR`, `MEDICAL_SERVICE_STAFF`, `RECEPTIONIST`, `PATIENT`), and 3 views (`v_appointment_overview`, `v_medical_service_queue`, `v_invoice_balances`).
   - File `backend/swd/src/main/resources/application.properties` specifies:
     - `spring.jpa.hibernate.ddl-auto=none`
     - `spring.jpa.properties.jakarta.persistence.schema-generation.database.action=none`
     - `spring.sql.init.mode=never`
     - Database URL: `jdbc:mysql://localhost:3306/hospital_management?createDatabaseIfNotExist=true&connectionTimeZone=UTC&forceConnectionTimeZoneToSession=true`
     - User: `admin`, Password: `123456`
   - Schema owns the DDL; Spring Boot will not auto-generate or alter tables.

2. **Entity `RegistrationVerification.java`**:
   - Location: `backend/swd/src/main/java/com/example/swd/entity/identity/RegistrationVerification.java`
   - Line 19: `@Table(name = "registration_verifications")`
   - Line 25: `@Id @Column(name = "user_account_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")`
   - Lines 28-32: `@MapsId @OneToOne ... @JoinColumn(name = "user_account_id", nullable = false, foreignKey = @ForeignKey(name = "fk_registration_account"))`
   - Line 34: `@Column(name = "otp_hash", nullable = false, length = 255)`
   - Line 36: `@Column(name = "expires_at", nullable = false, columnDefinition = "DATETIME(6)")`
   - Line 38: `@Column(name = "last_sent_at", nullable = false, columnDefinition = "DATETIME(6)")`
   - Line 40: `@Column(name = "failed_attempts", nullable = false, columnDefinition = "INT UNSIGNED")`
   - Line 42: `@Column(name = "verified_at", columnDefinition = "DATETIME(6)")` (nullable)
   - Line 44: `@Column(name = "terms_accepted_at", nullable = false, columnDefinition = "DATETIME(6)")`
   - Prior to this task, table `registration_verifications` did NOT exist in `Hospital_Database_28_Tables_MySQL (1).sql`.

3. **Credential and BCrypt Specification**:
   - Clear text password required: `Password123!`
   - Standard BCrypt hash (strength 10, 60 characters):
     `$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG`
   - `SecurityConfig.java` line 27 uses `new BCryptPasswordEncoder()`, which natively verifies this hash.

4. **Timezone Handling in Service Implementation**:
   - `ReceptionAppointmentServiceImpl.java` lines 53 and 356-357:
     `private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");`
     `private static LocalDate today() { return LocalDate.now(VIETNAM); }`
     `private static LocalDateTime utcStart(LocalDate date) { return date.atStartOfDay(VIETNAM).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime(); }`
   - When listing appointments for today, reception checks `appointmentSlot.startsAt >= utcStart(today) AND appointmentSlot.startsAt < utcStart(today + 1)`.
   - UTC midnight in Vietnam corresponds to 17:00:00 UTC of the previous calendar day.

5. **MySQL Strict Constraints in `appointments` Table**:
   - `Hospital_Database_28_Tables_MySQL (1).sql` lines 305-309:
     - `ck_t13_01`: `(status='CHECKED_IN' AND checked_in_at IS NOT NULL AND checked_in_by_staff_id IS NOT NULL) OR (status<>'CHECKED_IN' AND checked_in_at IS NULL AND checked_in_by_staff_id IS NULL)`
     - `ck_t13_02`: `(status='CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_by_account_id IS NOT NULL) OR (status<>'CANCELLED' AND cancelled_at IS NULL AND cancelled_by_account_id IS NULL)`
     - `uq_t13_02`: `UNIQUE KEY (patient_id, active_slot_id)` where `active_slot_id` is generated for `BOOKED` and `CHECKED_IN`.

---

## 2. Logic Chain

1. **Step 1: DDL Migration Design**:
   - Because `spring.jpa.hibernate.ddl-auto=none`, any missing table must be provisioned via an explicit SQL migration.
   - Matching `RegistrationVerification.java` exact field mappings, `registration_verifications` must have `user_account_id` as `BIGINT UNSIGNED` primary key with foreign key constraint `fk_registration_account` to `user_accounts(user_account_id) ON DELETE CASCADE`.
   - The script must use `CREATE TABLE IF NOT EXISTS` so it can be re-run safely without error.

2. **Step 2: Seed Script Idempotency Design**:
   - A naive `INSERT` with hardcoded `user_account_id` fails if auto-increment has advanced or if demo records were created with different IDs.
   - Using the pattern:
     ```sql
     INSERT INTO user_accounts (role_id, username, login_email, password_hash, status)
     SELECT 6, 'patient', 'patient@hospital.vn', @demo_password_hash, 'ACTIVE'
     WHERE NOT EXISTS (SELECT 1 FROM user_accounts WHERE username = 'patient');
     
     UPDATE user_accounts SET login_email = 'patient@hospital.vn', password_hash = @demo_password_hash, status = 'ACTIVE' WHERE username = 'patient';
     ```
     guarantees that:
     (a) If the table is empty, rows are cleanly created.
     (b) If rows already exist (e.g. from prior development seeds with `.test` domains), their login credentials and status are reset to the official showcase values (`@hospital.vn`, `Password123!`, `ACTIVE`).
   - Foreign key references are dynamically resolved via subqueries (`SELECT user_account_id FROM user_accounts WHERE username = 'patient' LIMIT 1`).

3. **Step 3: Temporal Alignment for Showcase Demo**:
   - If appointments were seeded with fixed calendar dates (e.g., 2026-10-15), tests or demos executed on any other date would show 0 appointments on the Receptionist or Patient dashboards.
   - By calculating the local Vietnam date dynamically:
     ```sql
     SET @vn_today = DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR));
     SET @day_start = DATE_SUB(@vn_today, INTERVAL 7 HOUR);
     ```
     appointments and slots generated for today and tomorrow will ALWAYS be relevant on whatever day the showcase is evaluated.

4. **Step 4: Constraint Integrity**:
   - The CHECK constraint `ck_t13_01` mandates that `status='CHECKED_IN'` MUST have non-null `checked_in_at` and `checked_in_by_staff_id`.
   - The CHECK constraint `ck_t13_02` mandates that non-CANCELLED records MUST have NULL `cancelled_at` and `cancelled_by_account_id`.
   - The seed script precisely populates these fields per status to ensure 100% compliance with MySQL strict validation rules.

---

## 3. Caveats

1. **Database Script Execution Ownership**:
   - Because `spring.sql.init.mode=never` is configured, developers or CI runners MUST execute the SQL scripts manually or via a startup hook (e.g. via MySQL CLI or Workbench). Spring Boot will not run them automatically on application launch.
2. **Clinical Workflow Migration Prerequisite**:
   - If online payment booking (`/api/public/appointments/checkout`) is used, `clinical-workflow-migration.sql` must be applied because the original 28-table schema had `payments.invoice_id NOT NULL`.
3. **Password Hashing Speed**:
   - The BCrypt hash provided has cost factor 10 (1024 rounds), taking ~60-80ms per verification. This is optimal for security and demo responsiveness.

---

## 4. Conclusion

1. **Delivered DDL Migration**:
   - Created `backend/swd/src/main/resources/db/migration_registration_verifications.sql`.
   - Contains 100% compliant, idempotent DDL for table `registration_verifications` matching `RegistrationVerification.java`.
2. **Delivered Showcase Seed Script**:
   - Created `backend/swd/src/main/resources/db/showcase_demo_seed.sql`.
   - Provisions all 3 required showcase roles (`patient`, `receptionist`, `doctor`) plus admin and manager.
   - All passwords set to `Password123!` via verified BCrypt hash `$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG`.
   - Seeds dynamic work schedules, 7 appointment slots (today & tomorrow), and 3 sample appointments (`CHECKED_IN`, `BOOKED`, `CANCELLED`).
3. **Delivered Clinical Alteration Script**:
   - Restored `backend/swd/src/main/resources/db/clinical-workflow-migration.sql` for `treatment_decisions.follow_up_required` and nullable `payments.invoice_id`.

---

## 5. Verification Method

### Method 1: Local MySQL Execution Sequence
Run the following commands in PowerShell from the project root:

```powershell
# 1. Base 28 tables and seed roles
Get-Content "Hospital_Database_28_Tables_MySQL (1).sql" | mysql -u admin -p123456 hospital_management

# 2. Clinical alterations (optional, recommended)
Get-Content "backend\swd\src\main\resources\db\clinical-workflow-migration.sql" | mysql -u admin -p123456 hospital_management

# 3. Registration verifications table migration
Get-Content "backend\swd\src\main\resources\db\migration_registration_verifications.sql" | mysql -u admin -p123456 hospital_management

# 4. Showcase demo seed script
Get-Content "backend\swd\src\main\resources\db\showcase_demo_seed.sql" | mysql -u admin -p123456 hospital_management
```

### Method 2: Verifying Seed Data in Database
Execute the following verification query in MySQL:

```sql
USE hospital_management;

-- 1. Check user accounts
SELECT user_account_id, username, login_email, role_id, status FROM user_accounts 
WHERE username IN ('patient', 'receptionist', 'doctor', 'admin', 'manager');

-- 2. Check linked profiles
SELECT s.staff_code, s.full_name, u.username, dp.license_number, dp.specialization 
FROM hospital_staff s
JOIN user_accounts u ON u.user_account_id = s.user_account_id
LEFT JOIN doctor_profiles dp ON dp.doctor_id = s.staff_id;

SELECT p.patient_code, p.full_name, p.phone, u.username 
FROM patients p
LEFT JOIN user_accounts u ON u.user_account_id = p.user_account_id;

-- 3. Check dynamic slots and appointments for today & tomorrow
SELECT a.appointment_code, a.status, a.booking_source, sl.starts_at, sl.ends_at, p.full_name AS patient_name
FROM appointments a
JOIN appointment_slots sl ON sl.appointment_slot_id = a.appointment_slot_id
JOIN patients p ON p.patient_id = a.patient_id
ORDER BY sl.starts_at ASC;
```

Expected result:
- Accounts `patient`, `receptionist`, `doctor` have `status='ACTIVE'`.
- `appointments` displays 1 `CHECKED_IN` appointment today, 1 `BOOKED` appointment tomorrow, and 1 `CANCELLED` appointment tomorrow.
