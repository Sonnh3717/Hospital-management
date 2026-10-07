-- Hospital Appointment & Medical Service Management System
-- Logical/physical baseline: exactly 28 tables; MySQL 8.0.16+ (8.4 LTS preferred).
-- Install into a NEW/EMPTY schema. No DROP, no IF NOT EXISTS masking an old schema.
-- 3NF-oriented base data + explicit historical facts + generated constraint columns.
-- Backend transactions/authorization remain required; see Hospital_Database_Design_28_Tables.md.
-- Every application connection must use UTC; shift template TIME uses Asia/Ho_Chi_Minh.
SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';
SET SESSION sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
CREATE DATABASE IF NOT EXISTS hospital_management CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE hospital_management;

-- 01. roles - Vai trò
CREATE TABLE `roles` (
  `role_id` TINYINT UNSIGNED NOT NULL COMMENT 'Khóa chính; sáu giá trị được seed trong script.',
  `role_code` VARCHAR(32) NOT NULL COMMENT 'Mã vai trò dùng trong backend.',
  `role_name` VARCHAR(80) NOT NULL COMMENT 'Tên vai trò hiển thị.',
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_t01_01` (`role_code`),
  CONSTRAINT `ck_t01_01` CHECK (role_code IN ('ADMIN','MANAGER','DOCTOR','MEDICAL_SERVICE_STAFF','RECEPTIONIST','PATIENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Vai trò';

-- 02. user_accounts - Tài khoản người dùng
CREATE TABLE `user_accounts` (
  `user_account_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `role_id` TINYINT UNSIGNED NOT NULL COMMENT 'Vai trò duy nhất của tài khoản.',
  `username` VARCHAR(60) NOT NULL COMMENT 'Tên đăng nhập, duy nhất.',
  `login_email` VARCHAR(254) NOT NULL COMMENT 'Email đăng nhập/khôi phục; backend chuẩn hóa trước khi lưu.',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Chuỗi hash mật khẩu do thư viện mật mã tạo; không lưu mật khẩu rõ.',
  `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Trạng thái cho phép đăng nhập.',
  `password_changed_at` DATETIME(6) NULL COMMENT 'Lần thay đổi mật khẩu gần nhất.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`user_account_id`),
  UNIQUE KEY `uq_t02_01` (`username`),
  UNIQUE KEY `uq_t02_02` (`login_email`),
  KEY `ix_t02_01` (`role_id`, `status`, `user_account_id`),
  CONSTRAINT `fk_t02_01` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Tài khoản người dùng';

-- 03. hospital_staff - Hồ sơ nhân viên
CREATE TABLE `hospital_staff` (
  `staff_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `user_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Tài khoản nội bộ tương ứng.',
  `staff_code` VARCHAR(30) NOT NULL COMMENT 'Mã nhân viên.',
  `full_name` VARCHAR(150) NOT NULL COMMENT 'Họ tên nhân viên.',
  `date_of_birth` DATE NULL COMMENT 'Ngày sinh.',
  `gender` ENUM('MALE','FEMALE','OTHER','UNSPECIFIED') NOT NULL DEFAULT 'UNSPECIFIED' COMMENT 'Thông tin giới tính trong hồ sơ.',
  `phone` VARCHAR(25) NULL COMMENT 'Số điện thoại liên hệ; không buộc duy nhất.',
  `address` VARCHAR(500) NULL COMMENT 'Địa chỉ liên hệ.',
  `hire_date` DATE NULL COMMENT 'Ngày bắt đầu công tác.',
  `employment_status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE' COMMENT 'Tình trạng công tác, phân biệt với quyền đăng nhập.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `uq_t03_01` (`user_account_id`),
  UNIQUE KEY `uq_t03_02` (`staff_code`),
  KEY `ix_t03_01` (`full_name`),
  CONSTRAINT `fk_t03_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hồ sơ nhân viên';

-- 04. doctor_profiles - Hồ sơ chuyên môn bác sĩ
CREATE TABLE `doctor_profiles` (
  `doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'PK đồng thời là FK: cùng giá trị với hospital_staff.staff_id.',
  `license_number` VARCHAR(60) NOT NULL COMMENT 'Số giấy phép hành nghề.',
  `specialization` VARCHAR(150) NOT NULL COMMENT 'Mô tả chuyên môn; chưa xây dựng danh mục chuyên khoa riêng.',
  `qualification_summary` TEXT NULL COMMENT 'Giới thiệu bằng cấp/trình độ bằng văn bản.',
  `biography` TEXT NULL COMMENT 'Giới thiệu bác sĩ.',
  `profile_image_url` VARCHAR(1024) NULL COMMENT 'Đường dẫn ảnh hồ sơ.',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cho phép hiển thị/nhận phân công khám mới.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `uq_t04_01` (`license_number`),
  CONSTRAINT `fk_t04_01` FOREIGN KEY (`doctor_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t04_01` CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Hồ sơ chuyên môn bác sĩ';

-- 05. patients - Hồ sơ bệnh nhân
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

-- 06. shift_templates - Mẫu ca làm việc
CREATE TABLE `shift_templates` (
  `shift_template_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `shift_code` VARCHAR(30) NOT NULL COMMENT 'Mã mẫu ca.',
  `shift_name` VARCHAR(100) NOT NULL COMMENT 'Tên ca.',
  `start_time` TIME NOT NULL COMMENT 'Giờ bắt đầu theo Asia/Ho_Chi_Minh.',
  `end_time` TIME NOT NULL COMMENT 'Giờ kết thúc theo Asia/Ho_Chi_Minh.',
  `end_day_offset` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0: kết thúc cùng ngày; 1: kết thúc ngày kế tiếp.',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cho phép sử dụng để lập ca mới.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`shift_template_id`),
  UNIQUE KEY `uq_t06_01` (`shift_code`),
  CONSTRAINT `ck_t06_01` CHECK (is_active IN (0,1)),
  CONSTRAINT `ck_t06_02` CHECK (start_time BETWEEN '00:00:00' AND '23:59:59' AND end_time BETWEEN '00:00:00' AND '23:59:59'),
  CONSTRAINT `ck_t06_03` CHECK ((end_day_offset = 0 AND end_time > start_time) OR (end_day_offset = 1 AND end_time <= start_time))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Mẫu ca làm việc';

-- 07. work_schedules - Lịch phân công làm việc
CREATE TABLE `work_schedules` (
  `work_schedule_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên được phân công.',
  `shift_template_id` BIGINT UNSIGNED NOT NULL COMMENT 'Mẫu dùng khi lập ca.',
  `starts_at` DATETIME(6) NOT NULL COMMENT 'Bắt đầu phân công thực tế, UTC.',
  `ends_at` DATETIME(6) NOT NULL COMMENT 'Kết thúc phân công thực tế, UTC.',
  `status` ENUM('SCHEDULED','CANCELLED') NOT NULL DEFAULT 'SCHEDULED' COMMENT 'Trạng thái phân công.',
  `assigned_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Manager lập phân công.',
  `note` VARCHAR(500) NULL COMMENT 'Ghi chú phân công.',
  `row_version` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Backend tăng khi cập nhật, để nhận biết yêu cầu thay đổi dựa trên lịch đã cũ.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`work_schedule_id`),
  KEY `ix_t07_01` (`staff_id`, `starts_at`, `ends_at`),
  KEY `ix_t07_02` (`starts_at`, `status`),
  KEY `ix_t07_03` (`shift_template_id`),
  KEY `ix_t07_04` (`assigned_by_staff_id`),
  CONSTRAINT `fk_t07_01` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t07_02` FOREIGN KEY (`shift_template_id`) REFERENCES `shift_templates` (`shift_template_id`),
  CONSTRAINT `fk_t07_03` FOREIGN KEY (`assigned_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t07_01` CHECK (ends_at > starts_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lịch phân công làm việc';

-- 08. work_time_policies - Chính sách thời gian làm việc
CREATE TABLE `work_time_policies` (
  `work_time_policy_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `role_id` TINYINT UNSIGNED NOT NULL COMMENT 'Một bộ chính sách hiện hành cho một role nội bộ.',
  `max_daily_work_minutes` SMALLINT UNSIGNED NOT NULL COMMENT 'Giới hạn phút làm theo ngày địa phương.',
  `max_weekly_work_minutes` SMALLINT UNSIGNED NOT NULL COMMENT 'Giới hạn phút làm trong tuần, từ thứ Hai theo giờ địa phương.',
  `min_rest_minutes` SMALLINT UNSIGNED NOT NULL COMMENT 'Khoảng nghỉ tối thiểu giữa hai ca.',
  `schedule_change_notice_days` SMALLINT UNSIGNED NOT NULL DEFAULT 7 COMMENT 'Thời gian báo trước theo UC 23: không dưới 7 ngày.',
  `updated_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Admin cập nhật chính sách.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`work_time_policy_id`),
  UNIQUE KEY `uq_t08_01` (`role_id`),
  KEY `ix_t08_01` (`updated_by_staff_id`),
  CONSTRAINT `fk_t08_01` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_t08_02` FOREIGN KEY (`updated_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t08_01` CHECK (max_daily_work_minutes BETWEEN 1 AND 1440),
  CONSTRAINT `ck_t08_02` CHECK (max_weekly_work_minutes BETWEEN 1 AND 10080),
  CONSTRAINT `ck_t08_03` CHECK (schedule_change_notice_days >= 7)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Chính sách thời gian làm việc';

-- 09. schedule_change_requests - Yêu cầu thay đổi lịch
CREATE TABLE `schedule_change_requests` (
  `schedule_change_request_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `work_schedule_id` BIGINT UNSIGNED NOT NULL COMMENT 'Phân công được đề nghị thay đổi.',
  `requested_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên gửi tại thời điểm đề nghị; giữ nguyên nếu lịch sau đó được phân lại.',
  `request_type` ENUM('LEAVE','RESCHEDULE') NOT NULL COMMENT 'Nghỉ ca hoặc đổi thời gian làm việc.',
  `based_on_version` INT UNSIGNED NOT NULL COMMENT 'row_version của lịch tại lúc gửi; dùng phát hiện lịch đã bị sửa.',
  `original_starts_at` DATETIME(6) NOT NULL COMMENT 'Thời gian gốc tại lúc đề nghị, lưu như sự kiện lịch sử.',
  `original_ends_at` DATETIME(6) NOT NULL COMMENT 'Kết thúc gốc tại lúc đề nghị.',
  `requested_starts_at` DATETIME(6) NULL COMMENT 'Thời gian mới; NULL với LEAVE.',
  `requested_ends_at` DATETIME(6) NULL COMMENT 'Kết thúc mới; NULL với LEAVE.',
  `reason` TEXT NOT NULL COMMENT 'Lý do đề nghị.',
  `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái xử lý.',
  `submitted_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm gửi yêu cầu.',
  `processed_by_staff_id` BIGINT UNSIGNED NULL COMMENT 'Manager quyết định.',
  `processed_at` DATETIME(6) NULL COMMENT 'Thời điểm quyết định.',
  `decision_note` TEXT NULL COMMENT 'Ghi chú; bắt buộc có lý do khi từ chối.',
  PRIMARY KEY (`schedule_change_request_id`),
  KEY `ix_t09_01` (`work_schedule_id`, `status`),
  KEY `ix_t09_02` (`status`, `submitted_at`),
  KEY `ix_t09_03` (`requested_by_staff_id`),
  KEY `ix_t09_04` (`processed_by_staff_id`),
  CONSTRAINT `fk_t09_01` FOREIGN KEY (`work_schedule_id`) REFERENCES `work_schedules` (`work_schedule_id`),
  CONSTRAINT `fk_t09_02` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t09_03` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t09_01` CHECK (original_ends_at > original_starts_at),
  CONSTRAINT `ck_t09_02` CHECK ((request_type='LEAVE' AND requested_starts_at IS NULL AND requested_ends_at IS NULL) OR (request_type='RESCHEDULE' AND requested_starts_at IS NOT NULL AND requested_ends_at IS NOT NULL AND requested_ends_at > requested_starts_at)),
  CONSTRAINT `ck_t09_03` CHECK ((status='PENDING' AND processed_by_staff_id IS NULL AND processed_at IS NULL) OR (status IN ('APPROVED','REJECTED') AND processed_by_staff_id IS NOT NULL AND processed_at IS NOT NULL AND processed_at >= submitted_at)),
  CONSTRAINT `ck_t09_04` CHECK (status <> 'REJECTED' OR (decision_note IS NOT NULL AND CHAR_LENGTH(TRIM(decision_note)) > 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Yêu cầu thay đổi lịch';

-- 10. schedule_events - Sự kiện lịch làm việc
CREATE TABLE `schedule_events` (
  `schedule_event_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên có sự kiện trên lịch.',
  `title` VARCHAR(150) NOT NULL COMMENT 'Tên sự kiện.',
  `description` TEXT NULL COMMENT 'Nội dung sự kiện.',
  `starts_at` DATETIME(6) NOT NULL COMMENT 'Bắt đầu sự kiện, UTC.',
  `ends_at` DATETIME(6) NOT NULL COMMENT 'Kết thúc sự kiện, UTC.',
  `blocks_booking` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Có chặn việc nhận lịch khám mới trong khoảng này không.',
  `created_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Admin tạo sự kiện.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`schedule_event_id`),
  KEY `ix_t10_01` (`staff_id`, `starts_at`, `ends_at`),
  KEY `ix_t10_02` (`created_by_staff_id`),
  CONSTRAINT `fk_t10_01` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t10_02` FOREIGN KEY (`created_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t10_01` CHECK (ends_at > starts_at),
  CONSTRAINT `ck_t10_02` CHECK (blocks_booking IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Sự kiện lịch làm việc';

-- 11. appointment_rules - Quy tắc lịch hẹn
CREATE TABLE `appointment_rules` (
  `appointment_rule_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `rule_code` VARCHAR(30) NOT NULL COMMENT 'Mã bộ quy tắc.',
  `rule_name` VARCHAR(150) NOT NULL COMMENT 'Tên bộ quy tắc.',
  `slot_duration_minutes` SMALLINT UNSIGNED NOT NULL COMMENT 'Độ dài mặc định khi sinh khung giờ mới.',
  `default_slot_capacity` SMALLINT UNSIGNED NOT NULL COMMENT 'Sức chứa mặc định khi sinh khung giờ mới.',
  `min_booking_notice_minutes` INT UNSIGNED NOT NULL COMMENT 'Báo trước tối thiểu cho đặt hẹn trước; không áp dụng cho walk-in.',
  `max_booking_days_ahead` SMALLINT UNSIGNED NOT NULL COMMENT 'Số ngày xa nhất cho phép đặt trước.',
  `cancellation_notice_minutes` INT UNSIGNED NOT NULL COMMENT 'Báo trước tối thiểu khi hủy hẹn.',
  `reschedule_notice_minutes` INT UNSIGNED NOT NULL COMMENT 'Báo trước tối thiểu khi đổi hẹn.',
  `no_show_grace_minutes` SMALLINT UNSIGNED NOT NULL COMMENT 'Khoảng trễ dùng để ghi nhận no-show.',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cho phép áp dụng cho slot mới.',
  `updated_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Admin cấu hình.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`appointment_rule_id`),
  UNIQUE KEY `uq_t11_01` (`rule_code`),
  KEY `ix_t11_01` (`updated_by_staff_id`),
  CONSTRAINT `fk_t11_01` FOREIGN KEY (`updated_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t11_01` CHECK (slot_duration_minutes BETWEEN 1 AND 1440),
  CONSTRAINT `ck_t11_02` CHECK (default_slot_capacity > 0),
  CONSTRAINT `ck_t11_03` CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Quy tắc lịch hẹn';

-- 12. appointment_slots - Khung giờ nhận hẹn
CREATE TABLE `appointment_slots` (
  `appointment_slot_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `work_schedule_id` BIGINT UNSIGNED NOT NULL COMMENT 'Phân công của bác sĩ; không chép staff_id/doctor_id sang đây.',
  `appointment_rule_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bộ quy tắc dùng cho khung giờ.',
  `starts_at` DATETIME(6) NOT NULL COMMENT 'Bắt đầu slot cụ thể, UTC.',
  `ends_at` DATETIME(6) NOT NULL COMMENT 'Kết thúc slot cụ thể, UTC.',
  `capacity` SMALLINT UNSIGNED NOT NULL COMMENT 'Sức chứa thực tế của slot, độc lập với giá trị mặc định trong rule.',
  `status` ENUM('OPEN','BLOCKED') NOT NULL DEFAULT 'OPEN' COMMENT 'Cho phép nhận hẹn mới hay đang bị chặn; FULL được tính từ số người đã đặt.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`appointment_slot_id`),
  UNIQUE KEY `uq_t12_01` (`work_schedule_id`, `starts_at`),
  KEY `ix_t12_01` (`starts_at`, `status`),
  KEY `ix_t12_02` (`appointment_rule_id`),
  CONSTRAINT `fk_t12_01` FOREIGN KEY (`work_schedule_id`) REFERENCES `work_schedules` (`work_schedule_id`),
  CONSTRAINT `fk_t12_02` FOREIGN KEY (`appointment_rule_id`) REFERENCES `appointment_rules` (`appointment_rule_id`),
  CONSTRAINT `ck_t12_01` CHECK (ends_at > starts_at),
  CONSTRAINT `ck_t12_02` CHECK (capacity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Khung giờ nhận hẹn';

-- 13. appointments - Lịch hẹn
CREATE TABLE `appointments` (
  `appointment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `appointment_code` VARCHAR(40) NOT NULL COMMENT 'Mã tra cứu lịch hẹn.',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bệnh nhân được đặt hẹn.',
  `appointment_slot_id` BIGINT UNSIGNED NOT NULL COMMENT 'Khung giờ hiện tại; bác sĩ dự kiến được suy ra từ lịch làm việc.',
  `booking_source` ENUM('ONLINE','ASSISTED','WALK_IN') NOT NULL COMMENT 'Nguồn đặt theo UC 40, 43, 19.',
  `status` ENUM('BOOKED','CHECKED_IN','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'BOOKED' COMMENT 'Trạng thái tiếp nhận gốc.',
  `reason` VARCHAR(500) NULL COMMENT 'Lý do đến khám.',
  `note` TEXT NULL COMMENT 'Ghi chú hành chính.',
  `created_by_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Patient đặt online hoặc Receptionist đặt hỗ trợ.',
  `checked_in_at` DATETIME(6) NULL COMMENT 'Thời điểm check-in còn hiệu lực.',
  `checked_in_by_staff_id` BIGINT UNSIGNED NULL COMMENT 'Receptionist check-in.',
  `last_check_in_reversed_at` DATETIME(6) NULL COMMENT 'Lần hoàn tác check-in gần nhất, không phải lịch sử đầy đủ.',
  `last_check_in_reversed_by_staff_id` BIGINT UNSIGNED NULL COMMENT 'Receptionist hoàn tác gần nhất.',
  `cancelled_at` DATETIME(6) NULL COMMENT 'Thời điểm hủy.',
  `cancelled_by_account_id` BIGINT UNSIGNED NULL COMMENT 'Người thực hiện hủy theo quyền của UC 15.',
  `cancellation_reason` VARCHAR(500) NULL COMMENT 'Lý do hủy phục vụ báo cáo nếu có.',
  `no_show_marked_at` DATETIME(6) NULL COMMENT 'Thời điểm ghi nhận bỏ hẹn.',
  `last_rescheduled_at` DATETIME(6) NULL COMMENT 'Thời điểm đổi hẹn gần nhất.',
  `last_rescheduled_by_account_id` BIGINT UNSIGNED NULL COMMENT 'Người đổi hẹn gần nhất.',
  `active_slot_id` BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status IN ('BOOKED','CHECKED_IN') THEN appointment_slot_id ELSE NULL END) STORED COMMENT 'Cột sinh để ngăn cùng bệnh nhân giữ hai lịch có hiệu lực trong cùng slot.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `uq_t13_01` (`appointment_code`),
  UNIQUE KEY `uq_t13_02` (`patient_id`, `active_slot_id`),
  KEY `ix_t13_01` (`patient_id`, `created_at`),
  KEY `ix_t13_02` (`appointment_slot_id`, `status`),
  KEY `ix_t13_03` (`status`, `cancelled_at`),
  KEY `ix_t13_04` (`created_by_account_id`),
  KEY `ix_t13_05` (`checked_in_by_staff_id`),
  KEY `ix_t13_06` (`last_check_in_reversed_by_staff_id`),
  KEY `ix_t13_07` (`cancelled_by_account_id`),
  KEY `ix_t13_08` (`last_rescheduled_by_account_id`),
  CONSTRAINT `fk_t13_01` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  CONSTRAINT `fk_t13_02` FOREIGN KEY (`appointment_slot_id`) REFERENCES `appointment_slots` (`appointment_slot_id`),
  CONSTRAINT `fk_t13_03` FOREIGN KEY (`created_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `fk_t13_04` FOREIGN KEY (`checked_in_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t13_05` FOREIGN KEY (`last_check_in_reversed_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t13_06` FOREIGN KEY (`cancelled_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `fk_t13_07` FOREIGN KEY (`last_rescheduled_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `ck_t13_01` CHECK ((status='CHECKED_IN' AND checked_in_at IS NOT NULL AND checked_in_by_staff_id IS NOT NULL) OR (status<>'CHECKED_IN' AND checked_in_at IS NULL AND checked_in_by_staff_id IS NULL)),
  CONSTRAINT `ck_t13_02` CHECK ((status='CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_by_account_id IS NOT NULL) OR (status<>'CANCELLED' AND cancelled_at IS NULL AND cancelled_by_account_id IS NULL)),
  CONSTRAINT `ck_t13_03` CHECK ((status='NO_SHOW' AND no_show_marked_at IS NOT NULL) OR (status<>'NO_SHOW' AND no_show_marked_at IS NULL)),
  CONSTRAINT `ck_t13_04` CHECK ((last_rescheduled_at IS NULL AND last_rescheduled_by_account_id IS NULL) OR (last_rescheduled_at IS NOT NULL AND last_rescheduled_by_account_id IS NOT NULL)),
  CONSTRAINT `ck_t13_05` CHECK ((last_check_in_reversed_at IS NULL AND last_check_in_reversed_by_staff_id IS NULL) OR (last_check_in_reversed_at IS NOT NULL AND last_check_in_reversed_by_staff_id IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lịch hẹn';

-- 14. encounters - Lượt khám
CREATE TABLE `encounters` (
  `encounter_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `appointment_id` BIGINT UNSIGNED NOT NULL COMMENT 'Một lịch hẹn có tối đa một lượt khám.',
  `responsible_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ thực sự chịu trách nhiệm lượt khám; đây là sự phân công lâm sàng.',
  `chief_complaint` TEXT NULL COMMENT 'Lý do khám chính theo khai thác lâm sàng.',
  `symptoms` TEXT NULL COMMENT 'Triệu chứng ghi nhận.',
  `clinical_findings` TEXT NULL COMMENT 'Kết quả khám lâm sàng.',
  `clinical_notes` TEXT NULL COMMENT 'Thông tin lâm sàng bổ sung phù hợp lượt khám.',
  `started_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm bác sĩ bắt đầu khám; dùng báo cáo thời gian khám.',
  `completed_at` DATETIME(6) NULL COMMENT 'Thời điểm xác nhận hoàn tất.',
  `status` ENUM('IN_PROGRESS','COMPLETED') NOT NULL DEFAULT 'IN_PROGRESS' COMMENT 'Trạng thái lượt khám.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`encounter_id`),
  UNIQUE KEY `uq_t14_01` (`appointment_id`),
  KEY `ix_t14_01` (`responsible_doctor_id`, `status`, `started_at`),
  CONSTRAINT `fk_t14_01` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  CONSTRAINT `fk_t14_02` FOREIGN KEY (`responsible_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `ck_t14_01` CHECK ((status='IN_PROGRESS' AND completed_at IS NULL) OR (status='COMPLETED' AND completed_at IS NOT NULL AND completed_at >= started_at)),
  CONSTRAINT `ck_t14_02` CHECK (status<>'COMPLETED' OR (clinical_findings IS NOT NULL AND CHAR_LENGTH(TRIM(clinical_findings))>0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lượt khám';

-- 15. encounter_diagnoses - Chẩn đoán của lượt khám
CREATE TABLE `encounter_diagnoses` (
  `encounter_diagnosis_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `encounter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lượt khám có chẩn đoán.',
  `diagnosis_code` VARCHAR(30) NULL COMMENT 'Mã tham chiếu nếu sử dụng; chưa tạo danh mục mã bệnh riêng.',
  `diagnosis_text` VARCHAR(1000) NOT NULL COMMENT 'Nội dung chẩn đoán do bác sĩ ghi cho lượt khám, không phải tên chuẩn của mã bệnh.',
  `is_primary` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Đánh dấu chẩn đoán chính.',
  `recorded_by_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ ghi nhận.',
  `primary_encounter_id` BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_primary=1 THEN encounter_id ELSE NULL END) STORED COMMENT 'Cột sinh để bảo đảm tối đa một chẩn đoán chính mỗi encounter.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`encounter_diagnosis_id`),
  UNIQUE KEY `uq_t15_01` (`primary_encounter_id`),
  KEY `ix_t15_01` (`encounter_id`),
  KEY `ix_t15_02` (`recorded_by_doctor_id`),
  CONSTRAINT `fk_t15_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t15_02` FOREIGN KEY (`recorded_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `ck_t15_01` CHECK (is_primary IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Chẩn đoán của lượt khám';

-- 16. treatment_decisions - Quyết định điều trị
CREATE TABLE `treatment_decisions` (
  `treatment_decision_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `encounter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lượt khám; tối đa một quyết định hiện hành.',
  `recorded_by_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ chịu trách nhiệm ghi nhận.',
  `decision_text` TEXT NOT NULL COMMENT 'Quyết định hoặc kế hoạch điều trị.',
  `instructions` TEXT NULL COMMENT 'Hướng dẫn cho bệnh nhân.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`treatment_decision_id`),
  UNIQUE KEY `uq_t16_01` (`encounter_id`),
  KEY `ix_t16_01` (`recorded_by_doctor_id`),
  CONSTRAINT `fk_t16_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t16_02` FOREIGN KEY (`recorded_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Quyết định điều trị';

-- 17. follow_up_requests - Yêu cầu tái khám
CREATE TABLE `follow_up_requests` (
  `follow_up_request_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `encounter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lượt khám tạo ra yêu cầu tái khám.',
  `requested_by_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ đề nghị tái khám.',
  `reason` TEXT NOT NULL COMMENT 'Lý do cần tái khám.',
  `requested_from_date` DATE NOT NULL COMMENT 'Ngày mong muốn bắt đầu tái khám theo giờ địa phương.',
  `requested_to_date` DATE NULL COMMENT 'Ngày cuối của khoảng mong muốn nếu có.',
  `priority` ENUM('ROUTINE','URGENT') NOT NULL DEFAULT 'ROUTINE' COMMENT 'Ưu tiên tái khám; độc lập với ưu tiên thực hiện dịch vụ.',
  `scheduled_appointment_id` BIGINT UNSIGNED NULL COMMENT 'Lịch hẹn mới thực hiện yêu cầu này, có thể chưa được đặt.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`follow_up_request_id`),
  UNIQUE KEY `uq_t17_01` (`scheduled_appointment_id`),
  KEY `ix_t17_01` (`encounter_id`, `requested_from_date`),
  KEY `ix_t17_02` (`requested_by_doctor_id`),
  CONSTRAINT `fk_t17_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t17_02` FOREIGN KEY (`requested_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `fk_t17_03` FOREIGN KEY (`scheduled_appointment_id`) REFERENCES `appointments` (`appointment_id`),
  CONSTRAINT `ck_t17_01` CHECK (requested_to_date IS NULL OR requested_to_date >= requested_from_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Yêu cầu tái khám';

-- 18. medical_services - Danh mục dịch vụ y tế
CREATE TABLE `medical_services` (
  `medical_service_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `service_code` VARCHAR(30) NOT NULL COMMENT 'Mã dịch vụ.',
  `service_name` VARCHAR(180) NOT NULL COMMENT 'Tên dịch vụ.',
  `description` TEXT NULL COMMENT 'Mô tả dịch vụ.',
  `base_price` DECIMAL(12,2) NOT NULL COMMENT 'Giá cơ bản hiện hành, VND.',
  `estimated_duration_minutes` SMALLINT UNSIGNED NULL COMMENT 'Thời gian thực hiện dự kiến.',
  `result_requirements` TEXT NULL COMMENT 'Mô tả nội dung kết quả bắt buộc theo loại dịch vụ.',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Cho phép chỉ định mới; không xóa dữ liệu lịch sử.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`medical_service_id`),
  UNIQUE KEY `uq_t18_01` (`service_code`),
  KEY `ix_t18_01` (`is_active`, `service_name`),
  CONSTRAINT `ck_t18_01` CHECK (base_price >= 0),
  CONSTRAINT `ck_t18_02` CHECK (estimated_duration_minutes IS NULL OR estimated_duration_minutes > 0),
  CONSTRAINT `ck_t18_03` CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Danh mục dịch vụ y tế';

-- 19. staff_medical_services - Phân công nhân viên theo dịch vụ
CREATE TABLE `staff_medical_services` (
  `staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên có role MEDICAL_SERVICE_STAFF.',
  `medical_service_id` BIGINT UNSIGNED NOT NULL COMMENT 'Dịch vụ được phân công.',
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Phân công còn hiệu lực để nhận việc mới.',
  `assigned_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Admin cấu hình phân công trong thông tin nhân viên.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`staff_id`, `medical_service_id`),
  KEY `ix_t19_01` (`medical_service_id`, `is_active`, `staff_id`),
  KEY `ix_t19_02` (`assigned_by_staff_id`),
  CONSTRAINT `fk_t19_01` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t19_02` FOREIGN KEY (`medical_service_id`) REFERENCES `medical_services` (`medical_service_id`),
  CONSTRAINT `fk_t19_03` FOREIGN KEY (`assigned_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t19_01` CHECK (is_active IN (0,1))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phân công nhân viên theo dịch vụ';

-- 20. medical_service_requests - Yêu cầu dịch vụ y tế
CREATE TABLE `medical_service_requests` (
  `medical_service_request_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `request_code` VARCHAR(40) NOT NULL COMMENT 'Mã chỉ định.',
  `encounter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lượt khám nguồn; bệnh nhân được suy ra qua encounter và appointment.',
  `requesting_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ phát hành chỉ định.',
  `medical_service_id` BIGINT UNSIGNED NOT NULL COMMENT 'Một dịch vụ được yêu cầu.',
  `priority` ENUM('ROUTINE','URGENT') NOT NULL DEFAULT 'ROUTINE' COMMENT 'Ưu tiên xử lý dịch vụ.',
  `clinical_indication` TEXT NULL COMMENT 'Lý do/chỉ dẫn chuyên môn cần cho nhân viên thực hiện.',
  `status` ENUM('ORDERED','ACCEPTED','IN_PROGRESS','COMPLETED','CANCELLED','UNABLE_TO_PERFORM') NOT NULL DEFAULT 'ORDERED' COMMENT 'Trạng thái xử lý hiện tại.',
  `responsible_staff_id` BIGINT UNSIGNED NULL COMMENT 'Nhân viên nhận trách nhiệm, có thể NULL trước tiếp nhận.',
  `requested_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm chỉ định.',
  `accepted_at` DATETIME(6) NULL COMMENT 'Thời điểm nhận trách nhiệm; không chứng minh bệnh nhân đã có mặt.',
  `started_at` DATETIME(6) NULL COMMENT 'Thời điểm bắt đầu thực hiện thực tế.',
  `completed_at` DATETIME(6) NULL COMMENT 'Thời điểm dịch vụ và kết quả bắt buộc hoàn tất.',
  `cancelled_at` DATETIME(6) NULL COMMENT 'Thời điểm hủy yêu cầu chưa được tiếp nhận.',
  `cancellation_reason` VARCHAR(500) NULL COMMENT 'Lý do hủy nếu được ghi nhận.',
  `unable_at` DATETIME(6) NULL COMMENT 'Thời điểm xác nhận không thể thực hiện/hoàn tất.',
  `unable_reason` TEXT NULL COMMENT 'Lý do không thể thực hiện.',
  `unable_recorded_by_staff_id` BIGINT UNSIGNED NULL COMMENT 'Nhân viên ghi nhận ngoại lệ.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Lần cập nhật gần nhất.',
  PRIMARY KEY (`medical_service_request_id`),
  UNIQUE KEY `uq_t20_01` (`request_code`),
  KEY `ix_t20_01` (`encounter_id`, `status`),
  KEY `ix_t20_02` (`medical_service_id`, `status`, `priority`, `requested_at`),
  KEY `ix_t20_03` (`responsible_staff_id`, `status`, `started_at`),
  KEY `ix_t20_04` (`completed_at`, `medical_service_id`),
  KEY `ix_t20_05` (`requesting_doctor_id`),
  KEY `ix_t20_06` (`responsible_staff_id`, `medical_service_id`),
  KEY `ix_t20_07` (`unable_recorded_by_staff_id`, `medical_service_id`),
  CONSTRAINT `fk_t20_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t20_02` FOREIGN KEY (`requesting_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `fk_t20_03` FOREIGN KEY (`medical_service_id`) REFERENCES `medical_services` (`medical_service_id`),
  CONSTRAINT `fk_t20_04` FOREIGN KEY (`responsible_staff_id`, `medical_service_id`) REFERENCES `staff_medical_services` (`staff_id`, `medical_service_id`),
  CONSTRAINT `fk_t20_05` FOREIGN KEY (`unable_recorded_by_staff_id`, `medical_service_id`) REFERENCES `staff_medical_services` (`staff_id`, `medical_service_id`),
  CONSTRAINT `ck_t20_01` CHECK ((accepted_at IS NULL AND responsible_staff_id IS NULL) OR (accepted_at IS NOT NULL AND responsible_staff_id IS NOT NULL AND accepted_at >= requested_at)),
  CONSTRAINT `ck_t20_02` CHECK (started_at IS NULL OR (accepted_at IS NOT NULL AND started_at >= accepted_at)),
  CONSTRAINT `ck_t20_03` CHECK ((status='COMPLETED' AND completed_at IS NOT NULL AND started_at IS NOT NULL AND completed_at >= started_at) OR (status<>'COMPLETED' AND completed_at IS NULL)),
  CONSTRAINT `ck_t20_04` CHECK (status NOT IN ('ACCEPTED','IN_PROGRESS','COMPLETED') OR (accepted_at IS NOT NULL AND responsible_staff_id IS NOT NULL)),
  CONSTRAINT `ck_t20_05` CHECK (status NOT IN ('IN_PROGRESS','COMPLETED') OR started_at IS NOT NULL),
  CONSTRAINT `ck_t20_06` CHECK (status NOT IN ('ORDERED','ACCEPTED','CANCELLED') OR started_at IS NULL),
  CONSTRAINT `ck_t20_07` CHECK (status<>'ORDERED' OR accepted_at IS NULL),
  CONSTRAINT `ck_t20_08` CHECK ((status='CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_at >= requested_at AND accepted_at IS NULL) OR (status<>'CANCELLED' AND cancelled_at IS NULL)),
  CONSTRAINT `ck_t20_09` CHECK ((status='UNABLE_TO_PERFORM' AND unable_at IS NOT NULL AND unable_at >= requested_at AND unable_reason IS NOT NULL AND CHAR_LENGTH(TRIM(unable_reason))>0 AND unable_recorded_by_staff_id IS NOT NULL) OR (status<>'UNABLE_TO_PERFORM' AND unable_at IS NULL AND unable_reason IS NULL AND unable_recorded_by_staff_id IS NULL)),
  CONSTRAINT `ck_t20_10` CHECK (unable_at IS NULL OR started_at IS NULL OR unable_at >= started_at),
  CONSTRAINT `ck_t20_11` CHECK (unable_at IS NULL OR accepted_at IS NULL OR unable_at >= accepted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Yêu cầu dịch vụ y tế';

-- 21. medical_service_results - Kết quả dịch vụ y tế
CREATE TABLE `medical_service_results` (
  `medical_service_result_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `medical_service_request_id` BIGINT UNSIGNED NOT NULL COMMENT 'Request gốc, tối đa một kết quả.',
  `result_summary` TEXT NOT NULL COMMENT 'Tóm tắt/kết luận kết quả.',
  `result_content` LONGTEXT NOT NULL COMMENT 'Nội dung báo cáo theo dịch vụ; một tài liệu kết quả, không dùng để lưu danh sách FK.',
  `attachment_url` VARCHAR(1024) NULL COMMENT 'Một tệp báo cáo tổng hợp nếu có; không lưu chuỗi nhiều URL.',
  `recorded_by_staff_id` BIGINT UNSIGNED NOT NULL COMMENT 'Nhân viên ghi nhận kết quả, phải được phụ trách dịch vụ tương ứng.',
  `finalized_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm xác nhận kết quả hoàn tất.',
  PRIMARY KEY (`medical_service_result_id`),
  UNIQUE KEY `uq_t21_01` (`medical_service_request_id`),
  KEY `ix_t21_01` (`recorded_by_staff_id`, `finalized_at`),
  CONSTRAINT `fk_t21_01` FOREIGN KEY (`medical_service_request_id`) REFERENCES `medical_service_requests` (`medical_service_request_id`),
  CONSTRAINT `fk_t21_02` FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Kết quả dịch vụ y tế';

-- 22. service_result_reviews - Ghi nhận xử lý kết quả
CREATE TABLE `service_result_reviews` (
  `service_result_review_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `medical_service_result_id` BIGINT UNSIGNED NOT NULL COMMENT 'Kết quả được xác nhận xử lý; tối đa một xác nhận trong phạm vi này.',
  `reviewing_doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Bác sĩ có trách nhiệm xử lý.',
  `handling_decision` TEXT NOT NULL COMMENT 'Quyết định xử lý lâm sàng.',
  `handled_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm xác nhận đã xử lý.',
  PRIMARY KEY (`service_result_review_id`),
  UNIQUE KEY `uq_t22_01` (`medical_service_result_id`),
  KEY `ix_t22_01` (`reviewing_doctor_id`, `handled_at`),
  CONSTRAINT `fk_t22_01` FOREIGN KEY (`medical_service_result_id`) REFERENCES `medical_service_results` (`medical_service_result_id`),
  CONSTRAINT `fk_t22_02` FOREIGN KEY (`reviewing_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Ghi nhận xử lý kết quả';

-- 23. invoices - Phiếu thu tiền dịch vụ
CREATE TABLE `invoices` (
  `invoice_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `invoice_number` VARCHAR(40) NOT NULL COMMENT 'Mã phiếu.',
  `encounter_id` BIGINT UNSIGNED NOT NULL COMMENT 'Một encounter có thể phát sinh nhiều phiếu ở các lần chỉ định khác nhau.',
  `document_status` ENUM('DRAFT','ISSUED','VOID') NOT NULL DEFAULT 'DRAFT' COMMENT 'Vòng đời phiếu; tình trạng đã trả tiền được suy ra từ payments.',
  `issued_at` DATETIME(6) NULL COMMENT 'Thời điểm chốt nội dung phiếu.',
  `due_at` DATETIME(6) NULL COMMENT 'Hạn thanh toán nếu quy trình quy định.',
  `note` VARCHAR(500) NULL COMMENT 'Ghi chú khoản thu.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `uq_t23_01` (`invoice_number`),
  KEY `ix_t23_01` (`encounter_id`, `created_at`),
  CONSTRAINT `fk_t23_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `ck_t23_01` CHECK (document_status<>'ISSUED' OR issued_at IS NOT NULL),
  CONSTRAINT `ck_t23_02` CHECK (due_at IS NULL OR (issued_at IS NOT NULL AND due_at >= issued_at))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phiếu thu tiền dịch vụ';

-- 24. invoice_items - Chi tiết khoản thu
CREATE TABLE `invoice_items` (
  `invoice_item_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `invoice_id` BIGINT UNSIGNED NOT NULL COMMENT 'Phiếu chứa dòng thu.',
  `medical_service_request_id` BIGINT UNSIGNED NOT NULL COMMENT 'Request được tính phí; không tính cùng request trên hai phiếu.',
  `service_name_at_billing` VARCHAR(180) NOT NULL COMMENT 'Tên dịch vụ tại thời điểm tính phí, là thông tin lịch sử.',
  `unit_price_at_billing` DECIMAL(12,2) NOT NULL COMMENT 'Giá cho một lần thực hiện request, VND.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo dòng.',
  PRIMARY KEY (`invoice_item_id`),
  UNIQUE KEY `uq_t24_01` (`medical_service_request_id`),
  KEY `ix_t24_01` (`invoice_id`),
  CONSTRAINT `fk_t24_01` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`),
  CONSTRAINT `fk_t24_02` FOREIGN KEY (`medical_service_request_id`) REFERENCES `medical_service_requests` (`medical_service_request_id`),
  CONSTRAINT `ck_t24_01` CHECK (unit_price_at_billing >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Chi tiết khoản thu';

-- 25. payments - Giao dịch thanh toán
CREATE TABLE `payments` (
  `payment_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `invoice_id` BIGINT UNSIGNED NOT NULL COMMENT 'Phiếu được thanh toán.',
  `initiated_by_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Tài khoản Patient khởi tạo giao dịch.',
  `payment_reference` VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Mã yêu cầu do backend tạo; dùng cùng mã khi retry một lần khởi tạo.',
  `provider` VARCHAR(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'Mã nhà cung cấp thanh toán được cấu hình, không phải role.',
  `provider_transaction_id` VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin NULL COMMENT 'Mã giao dịch từ nhà cung cấp, có thể chưa có lúc khởi tạo.',
  `amount` DECIMAL(12,2) NOT NULL COMMENT 'Số tiền của giao dịch, VND; đối chiếu với số tiền phiếu khi khởi tạo.',
  `status` ENUM('PENDING','SUCCEEDED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Trạng thái giao dịch từ xử lý kết quả đã xác minh.',
  `initiated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm khởi tạo.',
  `completed_at` DATETIME(6) NULL COMMENT 'Thời điểm có kết quả cuối.',
  `failure_reason` VARCHAR(500) NULL COMMENT 'Lý do lỗi/hủy nếu có.',
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_t25_01` (`payment_reference`),
  UNIQUE KEY `uq_t25_02` (`provider`, `provider_transaction_id`),
  KEY `ix_t25_01` (`invoice_id`, `status`, `initiated_at`),
  KEY `ix_t25_02` (`initiated_by_account_id`),
  CONSTRAINT `fk_t25_01` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`),
  CONSTRAINT `fk_t25_02` FOREIGN KEY (`initiated_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `ck_t25_01` CHECK (amount > 0),
  CONSTRAINT `ck_t25_02` CHECK ((status='PENDING' AND completed_at IS NULL) OR (status<>'PENDING' AND completed_at IS NOT NULL AND completed_at >= initiated_at)),
  CONSTRAINT `ck_t25_03` CHECK (status<>'SUCCEEDED' OR (provider_transaction_id IS NOT NULL AND CHAR_LENGTH(provider_transaction_id)>0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Giao dịch thanh toán';

-- 26. patient_feedback - Phản hồi bệnh nhân
CREATE TABLE `patient_feedback` (
  `patient_feedback_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `appointment_id` BIGINT UNSIGNED NOT NULL COMMENT 'Lịch hẹn được đánh giá; bệnh nhân suy ra từ đây.',
  `rating` TINYINT UNSIGNED NOT NULL COMMENT 'Điểm đánh giá từ 1 đến 5.',
  `content` TEXT NOT NULL COMMENT 'Nội dung phản hồi gốc của Patient.',
  `handling_status` ENUM('NEW','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'NEW' COMMENT 'Tiến độ xử lý hiện tại.',
  `handled_by_staff_id` BIGINT UNSIGNED NULL COMMENT 'Manager xử lý.',
  `handling_note` TEXT NULL COMMENT 'Ghi chú xử lý của Manager, tách khỏi content.',
  `handling_updated_at` DATETIME(6) NULL COMMENT 'Thời điểm cập nhật xử lý gần nhất.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo, UTC.',
  `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm cập nhật gần nhất, UTC.',
  PRIMARY KEY (`patient_feedback_id`),
  UNIQUE KEY `uq_t26_01` (`appointment_id`),
  KEY `ix_t26_01` (`handling_status`, `created_at`),
  KEY `ix_t26_02` (`handled_by_staff_id`),
  CONSTRAINT `fk_t26_01` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  CONSTRAINT `fk_t26_02` FOREIGN KEY (`handled_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `ck_t26_01` CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT `ck_t26_02` CHECK (handling_status='NEW' OR (handled_by_staff_id IS NOT NULL AND handling_updated_at IS NOT NULL))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phản hồi bệnh nhân';

-- 27. auth_sessions - Phiên đăng nhập
CREATE TABLE `auth_sessions` (
  `session_id` CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL COMMENT 'UUID do backend sinh, đưa vào claim sid của JWT.',
  `user_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Chủ phiên.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm tạo phiên.',
  `expires_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm phiên hết hạn; JWT exp không được muộn hơn.',
  `revoked_at` DATETIME(6) NULL COMMENT 'Thời điểm thu hồi phiên, NULL khi chưa thu hồi.',
  `revocation_reason` ENUM('LOGOUT','ACCOUNT_DISABLED','PASSWORD_RESET') NULL COMMENT 'Lý do thu hồi nếu có.',
  PRIMARY KEY (`session_id`),
  KEY `ix_t27_01` (`user_account_id`, `revoked_at`, `expires_at`),
  KEY `ix_t27_02` (`expires_at`),
  CONSTRAINT `fk_t27_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `ck_t27_01` CHECK (expires_at > created_at),
  CONSTRAINT `ck_t27_02` CHECK ((revoked_at IS NULL AND revocation_reason IS NULL) OR (revoked_at IS NOT NULL AND revocation_reason IS NOT NULL AND revoked_at >= created_at))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Phiên đăng nhập';

-- 28. password_reset_tokens - Yêu cầu đặt lại mật khẩu
CREATE TABLE `password_reset_tokens` (
  `password_reset_token_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Khóa chính, tự tăng.',
  `user_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Tài khoản cần đặt lại mật khẩu.',
  `token_hash` BINARY(32) NOT NULL COMMENT 'SHA-256 của token ngẫu nhiên entropy cao; không áp dụng cách hash này cho mật khẩu.',
  `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT 'Thời điểm phát hành.',
  `expires_at` DATETIME(6) NOT NULL COMMENT 'Hạn sử dụng.',
  `used_at` DATETIME(6) NULL COMMENT 'Đánh dấu đã sử dụng.',
  `invalidated_at` DATETIME(6) NULL COMMENT 'Hủy mã chưa dùng khi cấp mã mới hoặc sau khi reset thành công.',
  PRIMARY KEY (`password_reset_token_id`),
  UNIQUE KEY `uq_t28_01` (`token_hash`),
  KEY `ix_t28_01` (`user_account_id`, `created_at`),
  KEY `ix_t28_02` (`expires_at`),
  CONSTRAINT `fk_t28_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `ck_t28_01` CHECK (expires_at > created_at),
  CONSTRAINT `ck_t28_02` CHECK (used_at IS NULL OR (used_at >= created_at AND used_at < expires_at)),
  CONSTRAINT `ck_t28_03` CHECK (invalidated_at IS NULL OR invalidated_at >= created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Yêu cầu đặt lại mật khẩu';

INSERT INTO roles (role_id, role_code, role_name) VALUES
  (1,'ADMIN','Admin'), (2,'MANAGER','Manager'), (3,'DOCTOR','Doctor'),
  (4,'MEDICAL_SERVICE_STAFF','Medical Service Staff'),
  (5,'RECEPTIONIST','Receptionist'), (6,'PATIENT','Patient');

-- Views derive read models; they are not extra persisted tables.
-- Access control MUST still be enforced in the backend.
CREATE VIEW v_appointment_overview AS
SELECT a.appointment_id, a.appointment_code, a.patient_id,
       a.appointment_slot_id, sl.starts_at, sl.ends_at,
       ws.staff_id AS scheduled_doctor_id,
       e.encounter_id, e.responsible_doctor_id,
       a.booking_source, a.status AS reception_status,
       CASE WHEN e.status='COMPLETED' THEN 'COMPLETED'
            WHEN e.status='IN_PROGRESS' THEN 'IN_PROGRESS'
            ELSE a.status END AS display_status
FROM appointments a
JOIN appointment_slots sl ON sl.appointment_slot_id=a.appointment_slot_id
JOIN work_schedules ws ON ws.work_schedule_id=sl.work_schedule_id
LEFT JOIN encounters e ON e.appointment_id=a.appointment_id;

CREATE VIEW v_medical_service_queue AS
SELECT r.medical_service_request_id, r.request_code,
       r.medical_service_id, r.encounter_id, a.patient_id,
       r.priority, CASE WHEN r.priority='URGENT' THEN 0 ELSE 1 END AS priority_rank,
       r.status, r.requested_at, r.accepted_at, r.responsible_staff_id,
       CASE WHEN r.status='ORDERED' THEN 'AWAITING_ACCEPTANCE'
            ELSE 'AWAITING_EXECUTION' END AS queue_stage
FROM medical_service_requests r
JOIN encounters e ON e.encounter_id=r.encounter_id
JOIN appointments a ON a.appointment_id=e.appointment_id
WHERE r.status IN ('ORDERED','ACCEPTED');
-- Consumers explicitly ORDER BY priority_rank, requested_at, medical_service_request_id.
-- This view does not prove physical presence of a patient at the service location.

CREATE VIEW v_invoice_balances AS
SELECT i.invoice_id, i.invoice_number, i.encounter_id,
       a.patient_id, i.document_status,
       COALESCE((SELECT SUM(ii.unit_price_at_billing)
                 FROM invoice_items ii
                 WHERE ii.invoice_id=i.invoice_id),0.00) AS total_amount,
       COALESCE((SELECT SUM(pp.amount)
                 FROM payments pp
                 WHERE pp.invoice_id=i.invoice_id
                   AND pp.status='SUCCEEDED'),0.00) AS paid_amount,
       COALESCE((SELECT SUM(ii.unit_price_at_billing)
                 FROM invoice_items ii
                 WHERE ii.invoice_id=i.invoice_id),0.00)
       - COALESCE((SELECT SUM(pp.amount)
                   FROM payments pp
                   WHERE pp.invoice_id=i.invoice_id
                     AND pp.status='SUCCEEDED'),0.00) AS outstanding_amount
FROM invoices i
JOIN encounters e ON e.encounter_id=i.encounter_id
JOIN appointments a ON a.appointment_id=e.appointment_id;
-- Correlated aggregates avoid both join multiplication and MySQL's restriction
-- on subqueries in the FROM clause of a view definition.
