-- ====================================================================================================
-- SHOWCASE DEMO SEED DATA (Idempotent)
-- Project: Hospital Management System Showcase (Milestone 1)
-- Database: hospital_management (MySQL 8.0+)
--
-- Credential convention for all showcase accounts:
--   Password (clear text): Password123!
--   BCrypt Hash: $2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG
--
-- Accounts Seeded:
--   1. Patient:      username 'patient'      | email 'patient@hospital.vn'      | role PATIENT
--   2. Receptionist: username 'receptionist' | email 'receptionist@hospital.vn' | role RECEPTIONIST
--   3. Doctor:       username 'doctor'       | email 'doctor@hospital.vn'       | role DOCTOR
--   4. Admin:        username 'admin'        | email 'admin@hospital.vn'        | role ADMIN
--   5. Manager:      username 'manager'      | email 'manager@hospital.vn'      | role MANAGER
-- ====================================================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

-- Biến lưu hash BCrypt cho 'Password123!'
SET @demo_password_hash = '$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG';

-- Thiết lập mốc thời gian động theo giờ Việt Nam (UTC+7)
SET @vn_today = DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR));
SET @day_start = DATE_SUB(@vn_today, INTERVAL 7 HOUR);
SET @day_end = DATE_ADD(@day_start, INTERVAL 86399 SECOND);

SET @vn_tomorrow = DATE_ADD(@vn_today, INTERVAL 1 DAY);
SET @tomorrow_start = DATE_SUB(@vn_tomorrow, INTERVAL 7 HOUR);
SET @tomorrow_end = DATE_ADD(@tomorrow_start, INTERVAL 86399 SECOND);

-- ----------------------------------------------------------------------------------------------------
-- 1. SEED ROLES (Nếu chưa có)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `roles` (`role_id`, `role_code`, `role_name`) VALUES
  (1, 'ADMIN', 'Quản trị viên'),
  (2, 'MANAGER', 'Quản lý bệnh viện'),
  (3, 'DOCTOR', 'Bác sĩ chuyên khoa'),
  (4, 'MEDICAL_SERVICE_STAFF', 'Nhân viên dịch vụ y tế'),
  (5, 'RECEPTIONIST', 'Lễ tân / Tiếp đón'),
  (6, 'PATIENT', 'Bệnh nhân')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- ----------------------------------------------------------------------------------------------------
-- 2. SEED USER ACCOUNTS (Patient, Receptionist, Doctor, Admin, Manager)
-- ----------------------------------------------------------------------------------------------------
-- 2.1. Patient Account
INSERT INTO `user_accounts` (`role_id`, `username`, `login_email`, `password_hash`, `status`)
SELECT 6, 'patient', 'patient@hospital.vn', @demo_password_hash, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `user_accounts` WHERE `username` = 'patient');

UPDATE `user_accounts`
SET `login_email` = 'patient@hospital.vn',
    `password_hash` = @demo_password_hash,
    `status` = 'ACTIVE'
WHERE `username` = 'patient';

-- 2.2. Receptionist Account
INSERT INTO `user_accounts` (`role_id`, `username`, `login_email`, `password_hash`, `status`)
SELECT 5, 'receptionist', 'receptionist@hospital.vn', @demo_password_hash, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `user_accounts` WHERE `username` = 'receptionist');

UPDATE `user_accounts`
SET `login_email` = 'receptionist@hospital.vn',
    `password_hash` = @demo_password_hash,
    `status` = 'ACTIVE'
WHERE `username` = 'receptionist';

-- 2.3. Doctor Account
INSERT INTO `user_accounts` (`role_id`, `username`, `login_email`, `password_hash`, `status`)
SELECT 3, 'doctor', 'doctor@hospital.vn', @demo_password_hash, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `user_accounts` WHERE `username` = 'doctor');

UPDATE `user_accounts`
SET `login_email` = 'doctor@hospital.vn',
    `password_hash` = @demo_password_hash,
    `status` = 'ACTIVE'
WHERE `username` = 'doctor';

-- 2.4. Admin Account
INSERT INTO `user_accounts` (`role_id`, `username`, `login_email`, `password_hash`, `status`)
SELECT 1, 'admin', 'admin@hospital.vn', @demo_password_hash, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `user_accounts` WHERE `username` = 'admin');

UPDATE `user_accounts`
SET `login_email` = 'admin@hospital.vn',
    `password_hash` = @demo_password_hash,
    `status` = 'ACTIVE'
WHERE `username` = 'admin';

-- 2.5. Manager Account
INSERT INTO `user_accounts` (`role_id`, `username`, `login_email`, `password_hash`, `status`)
SELECT 2, 'manager', 'manager@hospital.vn', @demo_password_hash, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `user_accounts` WHERE `username` = 'manager');

UPDATE `user_accounts`
SET `login_email` = 'manager@hospital.vn',
    `password_hash` = @demo_password_hash,
    `status` = 'ACTIVE'
WHERE `username` = 'manager';

-- Lấy IDs của các tài khoản đã seed
SET @patient_account_id = (SELECT `user_account_id` FROM `user_accounts` WHERE `username` = 'patient' LIMIT 1);
SET @reception_account_id = (SELECT `user_account_id` FROM `user_accounts` WHERE `username` = 'receptionist' LIMIT 1);
SET @doctor_account_id = (SELECT `user_account_id` FROM `user_accounts` WHERE `username` = 'doctor' LIMIT 1);
SET @admin_account_id = (SELECT `user_account_id` FROM `user_accounts` WHERE `username` = 'admin' LIMIT 1);
SET @manager_account_id = (SELECT `user_account_id` FROM `user_accounts` WHERE `username` = 'manager' LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 3. SEED HOSPITAL STAFF (Admin, Manager, Receptionist, Doctor)
-- ----------------------------------------------------------------------------------------------------
-- 3.1. Admin Staff
INSERT INTO `hospital_staff` (`user_account_id`, `staff_code`, `full_name`, `gender`, `phone`, `employment_status`)
SELECT @admin_account_id, 'STF-ADMIN', 'Quản trị viên Hệ thống', 'MALE', '0912000001', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `hospital_staff` WHERE `staff_code` = 'STF-ADMIN' OR `user_account_id` = @admin_account_id);

-- 3.2. Manager Staff
INSERT INTO `hospital_staff` (`user_account_id`, `staff_code`, `full_name`, `gender`, `phone`, `employment_status`)
SELECT @manager_account_id, 'STF-MNG01', 'Trần Thị Quản Lý', 'FEMALE', '0912000002', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `hospital_staff` WHERE `staff_code` = 'STF-MNG01' OR `user_account_id` = @manager_account_id);

-- 3.3. Receptionist Staff
INSERT INTO `hospital_staff` (`user_account_id`, `staff_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `address`, `hire_date`, `employment_status`)
SELECT @reception_account_id, 'STF-REC001', 'Lê Thu Hà (Lễ Tân)', '1995-11-05', 'FEMALE', '0912000003', 'Quầy Tiếp đón Tầng 1, Bệnh viện Da liễu, Hà Nội', '2022-06-01', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `hospital_staff` WHERE `staff_code` = 'STF-REC001' OR `user_account_id` = @reception_account_id);

-- 3.4. Doctor Staff
INSERT INTO `hospital_staff` (`user_account_id`, `staff_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `address`, `hire_date`, `employment_status`)
SELECT @doctor_account_id, 'DOC-001', 'BS.CKII Trần Văn Minh', '1980-04-12', 'MALE', '0912000004', 'Phòng Khám Da Liễu 01, Bệnh viện Da liễu, Hà Nội', '2018-09-01', 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM `hospital_staff` WHERE `staff_code` = 'DOC-001' OR `user_account_id` = @doctor_account_id);

SET @admin_staff_id = (SELECT `staff_id` FROM `hospital_staff` WHERE `staff_code` = 'STF-ADMIN' LIMIT 1);
SET @manager_staff_id = (SELECT `staff_id` FROM `hospital_staff` WHERE `staff_code` = 'STF-MNG01' LIMIT 1);
SET @reception_staff_id = (SELECT `staff_id` FROM `hospital_staff` WHERE `staff_code` = 'STF-REC001' LIMIT 1);
SET @doctor_staff_id = (SELECT `staff_id` FROM `hospital_staff` WHERE `staff_code` = 'DOC-001' LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 4. SEED DOCTOR PROFILE (doctor_profiles)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `doctor_profiles` (`doctor_id`, `license_number`, `specialization`, `qualification_summary`, `biography`, `profile_image_url`, `is_active`)
SELECT @doctor_staff_id, 'CCHN-001234/BYT', 'Chuyên khoa Da liễu & Laser Thẩm mỹ',
       'Bác sĩ Chuyên khoa II Da liễu, Đại học Y Hà Nội',
       'Hơn 15 năm kinh nghiệm chẩn đoán, điều trị mụn trứng cá nang bọc, viêm da cơ địa và laser thẩm mỹ da liễu chuyên sâu.',
       'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', 1
WHERE NOT EXISTS (SELECT 1 FROM `doctor_profiles` WHERE `doctor_id` = @doctor_staff_id OR `license_number` = 'CCHN-001234/BYT');

-- ----------------------------------------------------------------------------------------------------
-- 5. SEED PATIENT PROFILES (patients)
-- ----------------------------------------------------------------------------------------------------
-- 5.1. Bệnh nhân chính có tài khoản đăng nhập (patient)
INSERT INTO `patients` (`user_account_id`, `patient_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `contact_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`)
SELECT @patient_account_id, 'PT-SHOWCASE001', 'Nguyễn Văn Bệnh Nhân', '1998-10-12', 'MALE', '0901234567', 'patient@hospital.vn', '123 Giải Phóng, Hai Bà Trưng, Hà Nội', 'Nguyễn Thị Bình', '0909888777'
WHERE NOT EXISTS (SELECT 1 FROM `patients` WHERE `patient_code` = 'PT-SHOWCASE001' OR `user_account_id` = @patient_account_id);

SET @patient_id = (SELECT `patient_id` FROM `patients` WHERE `patient_code` = 'PT-SHOWCASE001' LIMIT 1);

-- 5.2. Bệnh nhân thứ hai phục vụ chức năng tìm kiếm & quản lý bệnh nhân của Tiếp tân
INSERT INTO `patients` (`user_account_id`, `patient_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `contact_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`)
SELECT NULL, 'PT-SHOWCASE002', 'Trần Thị Lan', '2001-03-24', 'FEMALE', '0918765432', 'lan.tran@hospital.test', '45 Đường Cầu Giấy, Cầu Giấy, Hà Nội', 'Trần Văn Hùng', '0918765999'
WHERE NOT EXISTS (SELECT 1 FROM `patients` WHERE `patient_code` = 'PT-SHOWCASE002');

SET @patient_2_id = (SELECT `patient_id` FROM `patients` WHERE `patient_code` = 'PT-SHOWCASE002' LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 6. SEED REGISTRATION VERIFICATION (registration_verifications)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `registration_verifications` (`user_account_id`, `otp_hash`, `expires_at`, `last_sent_at`, `failed_attempts`, `verified_at`, `terms_accepted_at`)
SELECT @patient_account_id, @demo_password_hash, DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE), UTC_TIMESTAMP(), 0, UTC_TIMESTAMP(), UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM `registration_verifications` WHERE `user_account_id` = @patient_account_id);

-- ----------------------------------------------------------------------------------------------------
-- 7. SEED SHIFT TEMPLATES (shift_templates)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `shift_templates` (`shift_code`, `shift_name`, `start_time`, `end_time`, `end_day_offset`, `is_active`)
SELECT 'SHIFT-ALLDAY', 'Ca cả ngày (08:00 - 17:00)', '08:00:00', '17:00:00', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `shift_templates` WHERE `shift_code` = 'SHIFT-ALLDAY');

INSERT INTO `shift_templates` (`shift_code`, `shift_name`, `start_time`, `end_time`, `end_day_offset`, `is_active`)
SELECT 'SHIFT-MORNING', 'Ca sáng thường quy (08:00 - 12:00)', '08:00:00', '12:00:00', 0, 1
WHERE NOT EXISTS (SELECT 1 FROM `shift_templates` WHERE `shift_code` = 'SHIFT-MORNING');

SET @shift_template_id = (SELECT `shift_template_id` FROM `shift_templates` WHERE `shift_code` = 'SHIFT-ALLDAY' LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 8. SEED APPOINTMENT RULES (appointment_rules)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointment_rules` (`rule_code`, `rule_name`, `slot_duration_minutes`, `default_slot_capacity`, `min_booking_notice_minutes`, `max_booking_days_ahead`, `cancellation_notice_minutes`, `reschedule_notice_minutes`, `no_show_grace_minutes`, `is_active`, `updated_by_staff_id`)
SELECT 'RULE-DEFAULT', 'Quy tắc khám da liễu tiêu chuẩn', 30, 3, 60, 30, 1440, 1440, 15, 1, @admin_staff_id
WHERE NOT EXISTS (SELECT 1 FROM `appointment_rules` WHERE `rule_code` = 'RULE-DEFAULT');

SET @appointment_rule_id = (SELECT `appointment_rule_id` FROM `appointment_rules` WHERE `rule_code` = 'RULE-DEFAULT' LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 9. SEED WORK SCHEDULES CHO BÁC SĨ (work_schedules)
-- ----------------------------------------------------------------------------------------------------
-- 9.1. Lịch trực hôm nay của Bác sĩ
INSERT INTO `work_schedules` (`staff_id`, `shift_template_id`, `starts_at`, `ends_at`, `status`, `assigned_by_staff_id`, `note`)
SELECT @doctor_staff_id, @shift_template_id, @day_start, @day_end, 'SCHEDULED', @manager_staff_id, 'Lịch khám thường quy hôm nay'
WHERE NOT EXISTS (SELECT 1 FROM `work_schedules` WHERE `staff_id` = @doctor_staff_id AND `starts_at` = @day_start);

SET @schedule_today_id = (SELECT `work_schedule_id` FROM `work_schedules` WHERE `staff_id` = @doctor_staff_id AND `starts_at` = @day_start LIMIT 1);

-- 9.2. Lịch trực ngày mai của Bác sĩ
INSERT INTO `work_schedules` (`staff_id`, `shift_template_id`, `starts_at`, `ends_at`, `status`, `assigned_by_staff_id`, `note`)
SELECT @doctor_staff_id, @shift_template_id, @tomorrow_start, @tomorrow_end, 'SCHEDULED', @manager_staff_id, 'Lịch khám thường quy ngày mai'
WHERE NOT EXISTS (SELECT 1 FROM `work_schedules` WHERE `staff_id` = @doctor_staff_id AND `starts_at` = @tomorrow_start);

SET @schedule_tomorrow_id = (SELECT `work_schedule_id` FROM `work_schedules` WHERE `staff_id` = @doctor_staff_id AND `starts_at` = @tomorrow_start LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 10. SEED APPOINTMENT SLOTS (appointment_slots)
-- ----------------------------------------------------------------------------------------------------
-- 10.1. Slots hôm nay (Vietnam: 08:00, 08:30, 09:00, 14:00)
-- Slot 1: 08:00 - 08:30 (dùng cho CHECKED_IN)
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_today_id, @appointment_rule_id, DATE_ADD(@day_start, INTERVAL 8 HOUR), DATE_ADD(@day_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_today_id AND `starts_at` = DATE_ADD(@day_start, INTERVAL 8 HOUR));

-- Slot 2: 08:30 - 09:00
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_today_id, @appointment_rule_id, DATE_ADD(@day_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE), DATE_ADD(@day_start, INTERVAL 9 HOUR), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_today_id AND `starts_at` = DATE_ADD(@day_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE));

-- Slot 3: 09:00 - 09:30
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_today_id, @appointment_rule_id, DATE_ADD(@day_start, INTERVAL 9 HOUR), DATE_ADD(@day_start, INTERVAL 9 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_today_id AND `starts_at` = DATE_ADD(@day_start, INTERVAL 9 HOUR));

-- Slot 4: 14:00 - 14:30
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_today_id, @appointment_rule_id, DATE_ADD(@day_start, INTERVAL 14 HOUR), DATE_ADD(@day_start, INTERVAL 14 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_today_id AND `starts_at` = DATE_ADD(@day_start, INTERVAL 14 HOUR));

-- 10.2. Slots ngày mai (Vietnam: 08:00, 08:30, 09:00)
-- Slot 5: ngày mai 08:00 - 08:30 (dùng cho BOOKED - đủ điều kiện >= 24h để test Hủy & Đổi lịch)
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_tomorrow_id, @appointment_rule_id, DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR), DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR));

-- Slot 6: ngày mai 08:30 - 09:00 (dùng làm slot đích để test Đổi lịch)
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_tomorrow_id, @appointment_rule_id, DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE), DATE_ADD(@tomorrow_start, INTERVAL 9 HOUR), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE));

-- Slot 7: ngày mai 09:00 - 09:30 (dùng cho CANCELLED)
INSERT INTO `appointment_slots` (`work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`)
SELECT @schedule_tomorrow_id, @appointment_rule_id, DATE_ADD(@tomorrow_start, INTERVAL 9 HOUR), DATE_ADD(@tomorrow_start, INTERVAL 9 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'
WHERE NOT EXISTS (SELECT 1 FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 9 HOUR));

SET @slot_today_1 = (SELECT `appointment_slot_id` FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_today_id AND `starts_at` = DATE_ADD(@day_start, INTERVAL 8 HOUR) LIMIT 1);
SET @slot_tomorrow_1 = (SELECT `appointment_slot_id` FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR) LIMIT 1);
SET @slot_tomorrow_2 = (SELECT `appointment_slot_id` FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 8 HOUR + INTERVAL 30 MINUTE) LIMIT 1);
SET @slot_tomorrow_3 = (SELECT `appointment_slot_id` FROM `appointment_slots` WHERE `work_schedule_id` = @schedule_tomorrow_id AND `starts_at` = DATE_ADD(@tomorrow_start, INTERVAL 9 HOUR) LIMIT 1);

-- ----------------------------------------------------------------------------------------------------
-- 11. SEED APPOINTMENTS (appointments)
-- ----------------------------------------------------------------------------------------------------
-- 11.1. Lịch hẹn CHECKED_IN hôm nay (Tiếp tân đã check-in, đang chờ vào khám)
INSERT INTO `appointments` (`appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `note`, `created_by_account_id`, `checked_in_at`, `checked_in_by_staff_id`)
SELECT CONCAT('APT-CHKIN-', DATE_FORMAT(@vn_today, '%Y%m%d')), @patient_id, @slot_today_1, 'ASSISTED', 'CHECKED_IN',
       'Tái khám viêm da tiếp xúc và nhận kết quả điều trị', 'Bệnh nhân đến đúng giờ tại quầy tiếp đón',
       @reception_account_id, UTC_TIMESTAMP(), @reception_staff_id
WHERE NOT EXISTS (SELECT 1 FROM `appointments` WHERE `appointment_code` = CONCAT('APT-CHKIN-', DATE_FORMAT(@vn_today, '%Y%m%d')));

-- 11.2. Lịch hẹn BOOKED ngày mai (Đủ điều kiện >= 24h để test Hủy hẹn & Đổi lịch hẹn)
INSERT INTO `appointments` (`appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `note`, `created_by_account_id`)
SELECT CONCAT('APT-BOOKED-', DATE_FORMAT(@vn_today, '%Y%m%d')), @patient_id, @slot_tomorrow_1, 'ONLINE', 'BOOKED',
       'Khám mụn trứng cá vùng má và tư vấn chăm sóc da chuyên sâu', 'Lịch hẹn đặt online qua cổng bệnh nhân',
       @patient_account_id
WHERE NOT EXISTS (SELECT 1 FROM `appointments` WHERE `appointment_code` = CONCAT('APT-BOOKED-', DATE_FORMAT(@vn_today, '%Y%m%d')));

-- 11.3. Lịch hẹn CANCELLED ngày mai (Lịch hẹn đã hủy để kiểm tra bộ lọc trạng thái)
INSERT INTO `appointments` (`appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `note`, `created_by_account_id`, `cancelled_at`, `cancelled_by_account_id`, `cancellation_reason`)
SELECT CONCAT('APT-CANCL-', DATE_FORMAT(@vn_today, '%Y%m%d')), @patient_2_id, @slot_tomorrow_3, 'ONLINE', 'CANCELLED',
       'Khám nốt sần sắc tố da lưng', 'Đã liên hệ xác nhận hủy hẹn trước 24h',
       @patient_account_id, UTC_TIMESTAMP(), @patient_account_id, 'Bệnh nhân có lịch công tác đột xuất'
WHERE NOT EXISTS (SELECT 1 FROM `appointments` WHERE `appointment_code` = CONCAT('APT-CANCL-', DATE_FORMAT(@vn_today, '%Y%m%d')));

-- ====================================================================================================
-- KẾT THÚC SEED DỮ LIỆU DEMO SHOWCASE
-- ====================================================================================================
