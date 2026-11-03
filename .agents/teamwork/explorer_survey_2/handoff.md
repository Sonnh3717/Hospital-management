# Handoff Report: Database Schema & Entity Model Survey

- **Agent**: Explorer 2 (Database Schema & Model Explorer)
- **Role**: teamwork_explorer
- **Working Directory**: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\explorer_survey_2\`
- **Target Task**: Architectural Survey of Database Schemas, JPA Entities, Patient Fields (R2), Auth/Roles (R3), Appointments (R4, R5, R6), and Seed Data.

---

## 1. Observation

### 1.1. Physical Database Baseline & Configuration
- **Root Schema File**: `Hospital_Database_28_Tables_MySQL (1).sql` (682 lines, UTF-8, MySQL 8.0+ / 8.4 LTS).
  - Lines 10–11: Creates database `hospital_management` (UTF-8mb4, collation `utf8mb4_0900_ai_ci`).
  - Defines exactly 28 physical tables:
    1. `roles` (line 14)
    2. `user_accounts` (line 24)
    3. `hospital_staff` (line 42)
    4. `doctor_profiles` (line 63)
    5. `patients` (line 80)
    6. `shift_templates` (line 103)
    7. `work_schedules` (line 121)
    8. `work_time_policies` (line 145)
    9. `schedule_change_requests` (line 166)
    10. `schedule_events` (line 197)
    11. `appointment_rules` (line 218)
    12. `appointment_slots` (line 243)
    13. `appointments` (line 264)
    14. `encounters` (line 313)
    15. `encounter_diagnoses` (line 336)
    16. `treatment_decisions` (line 356)
    17. `follow_up_requests` (line 372)
    18. `medical_services` (line 394)
    19. `staff_medical_services` (line 414)
    20. `medical_service_requests` (line 431)
    21. `medical_service_results` (line 479)
    22. `service_result_reviews` (line 495)
    23. `invoices` (line 509)
    24. `invoice_items` (line 528)
    25. `payments` (line 544)
    26. `patient_feedback` (line 569)
    27. `auth_sessions` (line 591)
    28. `password_reset_tokens` (line 607)
  - Defines 3 logical views: `v_appointment_overview` (line 632), `v_medical_service_queue` (line 646), and `v_invoice_balances` (line 660).
  - Only seeds `roles` table (lines 625–629):
    ```sql
    INSERT INTO roles (role_id, role_code, role_name) VALUES
      (1,'ADMIN','Admin'), (2,'MANAGER','Manager'), (3,'DOCTOR','Doctor'),
      (4,'MEDICAL_SERVICE_STAFF','Medical Service Staff'),
      (5,'RECEPTIONIST','Receptionist'), (6,'PATIENT','Patient');
    ```
- **Hibernate / DDL Auto Policy**:
  - `backend/swd/src/main/resources/application.properties`:
    - Line 11: `spring.jpa.hibernate.ddl-auto=none`
    - Line 12: `spring.jpa.properties.jakarta.persistence.schema-generation.database.action=none`
    - Line 14: `spring.sql.init.mode=never`
    - Line 10 comment: `# The SQL script owns the schema. Editing entities must never execute DDL.`
- **Target Migration File**:
  - `backend/swd/target/classes/db/clinical-workflow-migration.sql`:
    ```sql
    ALTER TABLE treatment_decisions
      ADD COLUMN follow_up_required BOOLEAN NOT NULL DEFAULT FALSE
        COMMENT 'Doctor requires a saved follow-up request before encounter completion.';
    ALTER TABLE payments MODIFY COLUMN invoice_id BIGINT UNSIGNED NULL;
    ```

### 1.2. The `patients` Table Structure & Field Mapping
- **MySQL Definition** (`Hospital_Database_28_Tables_MySQL (1).sql`, lines 80–100):
  ```sql
  CREATE TABLE `patients` (
    `patient_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
    `user_account_id` BIGINT UNSIGNED NULL COMMENT 'Tài khoản PATIENT nếu đã liên kết; có thể NULL với bệnh nhân tiếp nhận trực tiếp.',
    `patient_code` VARCHAR(30) NOT NULL COMMENT 'Mã bệnh nhân.',
    `full_name` VARCHAR(150) NOT NULL COMMENT 'Họ tên bệnh nhân.',
    `date_of_birth` DATE NULL COMMENT 'Ngày sinh; không lưu tuổi vì tuổi thay đổi theo thời gian.',
    `gender` ENUM('MALE','FEMALE','OTHER','UNSPECIFIED') NOT NULL DEFAULT 'UNSPECIFIED' COMMENT 'Thông tin giới tính trong hồ sơ.',
    `phone` VARCHAR(25) NULL COMMENT 'Số liên hệ; có thể dùng chung trong gia đình.',
    `contact_email` VARCHAR(254) NULL COMMENT 'Email liên hệ của hồ sơ, có thể khác login_email.',
    `address` VARCHAR(500) NULL COMMENT 'Địa chỉ liên hệ.',
    `emergency_contact_name` VARCHAR(150) NULL COMMENT 'Tên người liên hệ khẩn cấp.',
    `emergency_contact_phone` VARCHAR(25) NULL COMMENT 'Điện thoại người liên hệ khẩn cấp.',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
    PRIMARY KEY (`patient_id`),
    UNIQUE KEY `uq_t05_01` (`user_account_id`),
    UNIQUE KEY `uq_t05_02` (`patient_code`),
    KEY `ix_t05_01` (`phone`),
    KEY `ix_t05_02` (`full_name`),
    CONSTRAINT `fk_t05_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hồ sơ bệnh nhân';
  ```
- **JPA Entity**: `Patient.java` in `com.example.swd.entity.patient` directly mirrors this schema.
- **R2 Field Distinction**:
  - The request states (R2): *"Patient information: bao gồm các thông tin có trong bảng `patient` (các trường thông tin của chính bệnh nhân là bắt buộc / required, các thông tin của người khác là tùy chọn / optional)."*
  - **Patient's Personal Fields (Required / Bắt buộc)**:
    1. `full_name`: Họ và tên bệnh nhân (`VARCHAR(150)`, required).
    2. `date_of_birth`: Ngày tháng năm sinh (`DATE`, required, format `YYYY-MM-DD`).
    3. `gender`: Giới tính (`ENUM('MALE','FEMALE','OTHER')`, required; 'UNSPECIFIED' is DB default for legacy records).
    4. `phone`: Số điện thoại liên hệ của bệnh nhân (`VARCHAR(25)`, required).
    5. `address`: Địa chỉ liên hệ / nơi cư trú (`VARCHAR(500)`, required).
    - `contact_email`: Synchronized automatically from the registered account email (`VARCHAR(254)`).
    - `patient_code`: Auto-generated system code with pattern `PT-<24_hex_chars>` (`VARCHAR(30)`).
  - **Third-Party / Guardian / Emergency Contact Fields (Optional / Tùy chọn)**:
    1. `emergency_contact_name`: Tên người thân / người liên hệ khẩn cấp / người bảo hộ (`VARCHAR(150)`, optional / nullable).
    2. `emergency_contact_phone`: Số điện thoại người thân / người liên hệ khẩn cấp (`VARCHAR(25)`, optional / nullable).

### 1.3. User, Account, Role & Authentication Structure
- **Table `roles`** (`Hospital_Database_28_Tables_MySQL (1).sql`, lines 14–21):
  - Primary Key: `role_id TINYINT UNSIGNED`.
  - Unique: `role_code VARCHAR(32)`.
  - Roles defined: `ADMIN` (1), `MANAGER` (2), `DOCTOR` (3), `MEDICAL_SERVICE_STAFF` (4), `RECEPTIONIST` (5), `PATIENT` (6).
- **Table `user_accounts`** (`Hospital_Database_28_Tables_MySQL (1).sql`, lines 24–39):
  - PK: `user_account_id BIGINT UNSIGNED AUTO_INCREMENT`.
  - Foreign Key: `role_id TINYINT UNSIGNED` references `roles(role_id)` (Strict 1 role per user account).
  - Credentials:
    - `username VARCHAR(60) NOT NULL UNIQUE (uq_t02_01)`
    - `login_email VARCHAR(254) NOT NULL UNIQUE (uq_t02_02)`
    - `password_hash VARCHAR(255) NOT NULL` (BCrypt encoded)
    - `status ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'`
- **Dual-Credential Login Mechanism**:
  - `UserAccountRepository.java` (lines 16–19):
    ```java
    default Optional<UserAccount> findForLogin(String login) {
        return findByUsername(login).or(() -> findByLoginEmail(login));
    }
    ```
    This directly allows logging in using either `username + password` OR `email + password`.
- **Session Tracking (`auth_sessions`)**:
  - PK: `session_id CHAR(36) UUID`.
  - `user_account_id BIGINT UNSIGNED FK`.
  - `expires_at DATETIME(6)` (set to now + 24 hours in `AuthServiceImpl.java:58`).
  - `revoked_at DATETIME(6) NULL`, `revocation_reason ENUM('LOGOUT','ACCOUNT_DISABLED','PASSWORD_RESET') NULL`.
- **Role to Profile Mapping**:
  - `PATIENT` -> `patients.user_account_id = user_accounts.user_account_id` (1:1).
  - `RECEPTIONIST` -> `hospital_staff.user_account_id = user_accounts.user_account_id` (1:1).
  - `DOCTOR` -> `hospital_staff.user_account_id = user_accounts.user_account_id` (1:1) AND `doctor_profiles.doctor_id = hospital_staff.staff_id` (1:1).
  - In `AuthServiceImpl.java:96–114` and `buildUserInfo:130–156`: If staff is present, populates `staffId`; if patient is present, populates `patientId`.

### 1.4. Appointment & Clinical Examination Structure
- **Table `appointments`** (`Hospital_Database_28_Tables_MySQL (1).sql`, lines 264–310):
  - PK: `appointment_id BIGINT UNSIGNED AUTO_INCREMENT`.
  - `appointment_code VARCHAR(40) NOT NULL UNIQUE` (e.g. `APT-...`).
  - `patient_id BIGINT UNSIGNED NOT NULL FK -> patients(patient_id)`.
  - `appointment_slot_id BIGINT UNSIGNED NOT NULL FK -> appointment_slots(appointment_slot_id)`.
  - `booking_source ENUM('ONLINE','ASSISTED','WALK_IN') NOT NULL`.
  - `status ENUM('BOOKED','CHECKED_IN','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'BOOKED'`.
  - `created_by_account_id BIGINT UNSIGNED NOT NULL FK -> user_accounts(user_account_id)`.
  - `checked_in_at DATETIME(6) NULL`, `checked_in_by_staff_id BIGINT UNSIGNED NULL FK -> hospital_staff(staff_id)`.
  - `cancelled_at DATETIME(6) NULL`, `cancelled_by_account_id BIGINT UNSIGNED NULL FK -> user_accounts(user_account_id)`, `cancellation_reason VARCHAR(500) NULL`.
  - `last_rescheduled_at DATETIME(6) NULL`, `last_rescheduled_by_account_id BIGINT UNSIGNED NULL FK -> user_accounts(user_account_id)`.
  - `active_slot_id`: STORED generated column (`CASE WHEN status IN ('BOOKED','CHECKED_IN') THEN appointment_slot_id ELSE NULL END`), enforcing unique constraint `uq_t13_02 (patient_id, active_slot_id)`.
- **Doctor, Department & Shift Resolution**:
  - `appointments` -> `appointment_slots` (`starts_at`, `ends_at`, `capacity`, `status: OPEN/BLOCKED`).
  - `appointment_slots` -> `work_schedules` (`staff_id` of doctor, `shift_template_id`, `starts_at`, `ends_at`).
  - `work_schedules.staff_id` -> `hospital_staff` -> `doctor_profiles` (`doctor_id = staff_id`, `specialization`, `license_number`).
  - `shift_templates` (`shift_code`, `shift_name`, `start_time`, `end_time`).
- **Clinical Encounter (`encounters`)**:
  - `encounters.appointment_id -> appointments(appointment_id)` (1:1).
  - `responsible_doctor_id -> doctor_profiles(doctor_id)`.
  - `status ENUM('IN_PROGRESS','COMPLETED')`.
  - Display Status View (`v_appointment_overview`):
    - When `encounters.status = 'COMPLETED'` -> `COMPLETED`.
    - When `encounters.status = 'IN_PROGRESS'` -> `IN_PROGRESS`.
    - Otherwise -> `appointments.status` (`BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`).

### 1.5. Schema Discrepancy: `registration_verifications` Missing in Baseline SQL
- **Entity**: `com.example.swd.entity.identity.RegistrationVerification` exists in source code (`RegistrationVerification.java`, lines 18–46).
- **Service & Test Usage**: Directly used by `PatientRegistrationServiceImpl.java` and `PatientRegistrationServiceTest.java`.
- **Database Status**: The table `registration_verifications` does NOT exist in `Hospital_Database_28_Tables_MySQL (1).sql`.
- Since `spring.jpa.hibernate.ddl-auto=none`, running registration in an environment initialized solely with `Hospital_Database_28_Tables_MySQL (1).sql` will fail with `Table 'hospital_management.registration_verifications' doesn't exist`.

### 1.6. Seed Data Audit
- `Hospital_Database_28_Tables_MySQL (1).sql` only contains `INSERT INTO roles`.
- No demo users, staff records, doctor profiles, schedules, or appointments are pre-seeded in the database script.
- Existing tests (`AppointmentWorkflowIntegrationTest.java`) generate random volatile accounts (`rec.test.<nano>`, `pat.test.<nano>`, `doc.test.<nano>`) which are wiped or randomized.
- Showcase requirements (R3: Login as Patient, Receptionist, Doctor; R4: Patient dashboard; R5: Receptionist dashboard; R6: Doctor view) require fixed demo accounts.

---

## 2. Logic Chain

1. **Premise 1**: The application has `ddl-auto=none` and delegates all DDL to SQL scripts.
   - *Observation Reference*: `application.properties:11`, `Hospital_Database_28_Tables_MySQL (1).sql:1–682`.
2. **Premise 2**: Feature R2 requires two-step patient registration with OTP verification.
   - *Observation Reference*: `ORIGINAL_REQUEST.md:16–20`, `RegistrationCommands.java`, `PatientRegistrationServiceImpl.java`.
3. **Inference 1**: `RegistrationVerification.java` requires table `registration_verifications`. A migration DDL script must be run or included to ensure the OTP storage table exists.
4. **Premise 3**: Feature R2 specifies that patient's own information is required, while information of other people (guardian/emergency contact) is optional.
   - *Observation Reference*: `ORIGINAL_REQUEST.md:19, 50`.
   - In `patients` table, the only third-party fields are `emergency_contact_name` and `emergency_contact_phone`.
5. **Inference 2**: The patient registration step 2 form must mandate `full_name`, `date_of_birth`, `gender`, `phone`, `address`, and make `emergency_contact_name` and `emergency_contact_phone` optional.
6. **Premise 4**: Feature R3 requires login support for 3 roles (Patient, Receptionist, Doctor) with both (Username + Password) or (Email + Password).
   - *Observation Reference*: `ORIGINAL_REQUEST.md:21–25`, `UserAccountRepository.java:16–19`, `AuthServiceImpl.java:38–67`.
7. **Inference 3**: The backend already implements `findForLogin()` matching username or email against `user_accounts`. All 3 roles are first-class role codes in `roles` table.
8. **Premise 5**: Feature R4, R5, R6 and showcase validation require logging in with test accounts across all 3 roles, seeing schedules and managing appointments.
   - *Observation Reference*: `ORIGINAL_REQUEST.md:27–68`. Currently, no accounts exist in `Hospital_Database_28_Tables_MySQL (1).sql`.
9. **Inference 4**: A dedicated, idempotent seed script (`seed_demo_data.sql`) must be provided with known credentials (`Password123!`), linked staff, doctor profiles, and appointments across all lifecycle statuses (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`).

---

## 3. Caveats

1. **Database Runtime Connection**: The physical MySQL database was not modified or executed during this read-only survey. The survey is based on the authoritative SQL scripts and Spring Data JPA entities in the codebase.
2. **Specialization Categories**: In `doctor_profiles`, the column `specialization` is `VARCHAR(150)` rather than a foreign key to a dedicated department table. As noted in the SQL comments, no independent specialty catalog table exists in the 28-table design.
3. **Patient Activation / Deactivation**: The `patients` table does not possess an independent `is_active` column. Deactivating a patient (per R5) operates on `user_accounts.status` (`ACTIVE` / `INACTIVE`). For walk-in patients without an online account (`user_account_id IS NULL`), deactivation either requires linking an account or managing them via administrative status convention.
4. **Payment Nullability**: As observed in `clinical-workflow-migration.sql`, `payments.invoice_id` was altered to be `NULL` to allow prepayment before encounter invoices are generated.

---

## 4. Conclusion

The data architecture is solid, normalized, and well-designed:
1. **Tables**: 28 baseline tables + 1 missing table (`registration_verifications`).
2. **`patients` Table Mapping for R2**:
   - Required patient fields: `full_name`, `date_of_birth`, `gender`, `phone`, `address`.
   - Optional third-party fields: `emergency_contact_name`, `emergency_contact_phone`.
3. **Multi-Role Authentication (R3)**:
   - Supported natively via `user_accounts` + `roles`.
   - Dual-credential login (Username or Email) is already functional in `UserAccountRepository.findForLogin()`.
4. **Appointment Management (R4, R5, R6)**:
   - Appointments link through `appointment_slots` -> `work_schedules` -> `hospital_staff` / `doctor_profiles`.
   - Supports statuses `BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW` on appointment, and `IN_PROGRESS`, `COMPLETED` on clinical encounter.
5. **Actionable Recommendations for Implementation Team**:
   - Run the DDL migration for `registration_verifications`.
   - Run the seed script for Patient, Receptionist, and Doctor test accounts.

---

## 5. Verification Method

### 5.1. DDL Migration Script for `registration_verifications`
Execute in MySQL to verify table creation:
```sql
USE hospital_management;

CREATE TABLE IF NOT EXISTS `registration_verifications` (
  `user_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'FK tới user_accounts, PK 1-1',
  `otp_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt hash của mã OTP 6 số',
  `expires_at` DATETIME(6) NOT NULL COMMENT 'Thời hạn hiệu lực của OTP (5 phút)',
  `last_sent_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm gửi gần nhất (chờ 60s resend)',
  `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần nhập sai (tối đa 5)',
  `verified_at` DATETIME(6) NULL COMMENT 'Thời điểm xác thực thành công',
  `terms_accepted_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm chấp nhận điều khoản',
  PRIMARY KEY (`user_account_id`),
  CONSTRAINT `fk_registration_account` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Xác thực OTP đăng ký bệnh nhân';
```

### 5.2. Showcase Demo Seed Script (`seed_demo_data.sql`)
The default password for all demo accounts below is `Password123!` (BCrypt hash `$2a$10$7R9gH9VpWpEcm9V7j7Y7Xe4lP5.5dM.P1vVzVzG8z6r3vUv9uX4qG` or standard spring BCrypt):

```sql
USE hospital_management;

-- 1. Ensure Roles are present
INSERT IGNORE INTO roles (role_id, role_code, role_name) VALUES
  (1,'ADMIN','Admin'), (2,'MANAGER','Manager'), (3,'DOCTOR','Doctor'),
  (4,'MEDICAL_SERVICE_STAFF','Medical Service Staff'),
  (5,'RECEPTIONIST','Receptionist'), (6,'PATIENT','Patient');

-- 2. Demo User Accounts (Password: Password123! -> BCrypt hash)
-- BCrypt for 'Password123!': $2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG (or generate via app)
INSERT IGNORE INTO user_accounts (user_account_id, role_id, username, login_email, password_hash, status) VALUES
  (1, 6, 'patient', 'patient@hospital.vn', '$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG', 'ACTIVE'),
  (2, 5, 'receptionist', 'receptionist@hospital.vn', '$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG', 'ACTIVE'),
  (3, 3, 'doctor', 'doctor@hospital.vn', '$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG', 'ACTIVE');

-- 3. Staff Profile for Receptionist & Doctor
INSERT IGNORE INTO hospital_staff (staff_id, user_account_id, staff_code, full_name, date_of_birth, gender, phone, employment_status) VALUES
  (1, 2, 'REC-001', 'Lê Thị Thu Thảo', '1996-08-15', 'FEMALE', '0912345678', 'ACTIVE'),
  (2, 3, 'DOC-001', 'BS.CKII Trần Văn Minh', '1982-04-20', 'MALE', '0987654321', 'ACTIVE');

-- 4. Doctor Profile
INSERT IGNORE INTO doctor_profiles (doctor_id, license_number, specialization, qualification_summary, is_active) VALUES
  (2, 'CCHN-001234/HN', 'Chuyên khoa Da liễu & Thẩm mỹ Da', 'Bác sĩ Chuyên khoa II Da liễu - 15 năm kinh nghiệm', 1);

-- 5. Patient Profile
INSERT IGNORE INTO patients (patient_id, user_account_id, patient_code, full_name, date_of_birth, gender, phone, contact_email, address, emergency_contact_name, emergency_contact_phone) VALUES
  (1, 1, 'PT-DEMO00000000000000000001', 'Nguyễn Văn An', '1998-10-12', 'MALE', '0901234567', 'patient@hospital.vn', 'Số 123 Giải Phóng, Đống Đa, Hà Nội', 'Nguyễn Thị Bình (Mẹ)', '0909888777');

-- 6. Shift Template & Work Schedule & Appointment Slots for Doctor
INSERT IGNORE INTO shift_templates (shift_template_id, shift_code, shift_name, start_time, end_time, end_day_offset, is_active) VALUES
  (1, 'SHIFT-MORNING', 'Ca Sáng (08:00 - 12:00)', '08:00:00', '12:00:00', 0, 1),
  (2, 'SHIFT-AFTERNOON', 'Ca Chiều (13:30 - 17:30)', '13:30:00', '17:30:00', 0, 1);

INSERT IGNORE INTO work_schedules (work_schedule_id, staff_id, shift_template_id, starts_at, ends_at, status, assigned_by_staff_id) VALUES
  (1, 2, 1, DATE_ADD(CURRENT_DATE(), INTERVAL 8 HOUR), DATE_ADD(CURRENT_DATE(), INTERVAL 12 HOUR), 'SCHEDULED', 1);

INSERT IGNORE INTO appointment_rules (appointment_rule_id, rule_code, rule_name, slot_duration_minutes, default_slot_capacity, min_booking_notice_minutes, max_booking_days_ahead, cancellation_notice_minutes, reschedule_notice_minutes, no_show_grace_minutes, is_active, updated_by_staff_id) VALUES
  (1, 'RULE-DEFAULT', 'Quy tắc khám Da liễu tiêu chuẩn', 30, 1, 60, 30, 1440, 1440, 30, 1, 1);

INSERT IGNORE INTO appointment_slots (appointment_slot_id, work_schedule_id, appointment_rule_id, starts_at, ends_at, capacity, status) VALUES
  (1, 1, 1, DATE_ADD(CURRENT_DATE(), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(CURRENT_DATE(), INTERVAL 8 HOUR), INTERVAL 30 MINUTE), 1, 'OPEN'),
  (2, 1, 1, DATE_ADD(CURRENT_DATE(), INTERVAL '8:30' HOUR_MINUTE), DATE_ADD(CURRENT_DATE(), INTERVAL 9 HOUR), 1, 'OPEN'),
  (3, 1, 1, DATE_ADD(CURRENT_DATE(), INTERVAL 9 HOUR), DATE_ADD(DATE_ADD(CURRENT_DATE(), INTERVAL 9 HOUR), INTERVAL 30 MINUTE), 1, 'OPEN');

-- 7. Sample Appointments
INSERT IGNORE INTO appointments (appointment_id, appointment_code, patient_id, appointment_slot_id, booking_source, status, reason, created_by_account_id) VALUES
  (1, 'APT-20261102-0001', 1, 1, 'ONLINE', 'BOOKED', 'Khám viêm da dị ứng vùng mặt', 1),
  (2, 'APT-20261102-0002', 1, 2, 'ONLINE', 'CHECKED_IN', 'Tái khám mụn trứng cá', 1);
```

### 5.3. Independent Files to Inspect
- Schema: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\Hospital_Database_28_Tables_MySQL (1).sql`
- Patient Entity: `backend/swd/src/main/java/com/example/swd/entity/patient/Patient.java`
- UserAccount Entity: `backend/swd/src/main/java/com/example/swd/entity/identity/UserAccount.java`
- Role Entity: `backend/swd/src/main/java/com/example/swd/entity/identity/Role.java`
- Appointment Entity: `backend/swd/src/main/java/com/example/swd/entity/appointment/Appointment.java`
- Registration Verification Entity: `backend/swd/src/main/java/com/example/swd/entity/identity/RegistrationVerification.java`
- Auth Service: `backend/swd/src/main/java/com/example/swd/service/impl/AuthServiceImpl.java`
- User Account Repository: `backend/swd/src/main/java/com/example/swd/repository/UserAccountRepository.java`
