-- ====================================================================================================
-- SCRIPT INSERT DỮ LIỆU MẪU ĐỂ TEST CÁC TÍNH NĂNG COMMON & APPOINTMENT LIFECYCLE
-- Hệ thống: Dermatology Hospital Booking and Medical Service Management System
-- Database: hospital_management (MySQL 8.0+)
-- Mật khẩu mặc định cho tất cả các tài khoản test: Password@123
-- Hash BCrypt: $2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe
-- ====================================================================================================

USE `hospital_management`;

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Biến lưu hash mật khẩu chung cho test: 'Password@123'
SET @test_password_hash = '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe';

-- ----------------------------------------------------------------------------------------------------
-- 1. SEED ROLES (Nếu chưa có)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `roles` (`role_id`, `role_code`, `role_name`) VALUES
  (1, 'ADMIN', 'Quản trị viên'),
  (2, 'MANAGER', 'Quản lý bệnh viện'),
  (3, 'DOCTOR', 'Bác sĩ chuyên khoa'),
  (4, 'MEDICAL_SERVICE_STAFF', 'Nhân viên dịch vụ y tế'),
  (5, 'RECEPTIONIST', 'Lễ tân / Tiếp đón'),
  (6, 'PATIENT', 'Người bệnh')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);

-- ----------------------------------------------------------------------------------------------------
-- 2. SEED TÀI KHOẢN NGƯỜI DÙNG (user_accounts) CHO TẤT CẢ 6 ROLES
-- ----------------------------------------------------------------------------------------------------
-- Admin: admin / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(101, 1, 'admin', 'admin@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Manager: manager / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(102, 2, 'manager', 'manager@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Receptionist: receptionist / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(103, 5, 'receptionist', 'receptionist@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Doctor: doctor / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(104, 3, 'doctor', 'doctor@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Service Staff: servicestaff / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(105, 4, 'servicestaff', 'servicestaff@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Patient: patient / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(106, 6, 'patient', 'patient@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- Patient 2: patient02 / Password@123
INSERT INTO `user_accounts` (`user_account_id`, `role_id`, `username`, `login_email`, `password_hash`, `status`) VALUES
(107, 6, 'patient02', 'patient02@hospital.test', @test_password_hash, 'ACTIVE')
ON DUPLICATE KEY UPDATE `password_hash` = VALUES(`password_hash`), `status` = 'ACTIVE';

-- ----------------------------------------------------------------------------------------------------
-- 3. SEED HỒ SƠ NHÂN VIÊN BỆNH VIỆN (hospital_staff)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `hospital_staff` (`staff_id`, `user_account_id`, `staff_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `address`, `hire_date`, `employment_status`) VALUES
(201, 101, 'STF-ADMIN', 'Nguyễn Văn Quản Trị', '1985-01-15', 'MALE', '0912000001', 'Tòa nhà Bệnh viện Da liễu, Hà Nội', '2020-01-01', 'ACTIVE'),
(202, 102, 'STF-MNG01', 'Trần Thị Giám Đốc', '1982-08-20', 'FEMALE', '0912000002', 'Phòng Quản lý điều hành, Hà Nội', '2021-03-15', 'ACTIVE'),
(203, 103, 'STF-REC01', 'Lê Thu Hà (Tiếp Tân)', '1995-11-05', 'FEMALE', '0912000003', 'Quầy Tiếp đón Tầng 1, Hà Nội', '2023-06-01', 'ACTIVE'),
(204, 104, 'STF-DOC01', 'BSCKII. Vũ Minh Tuấn', '1980-04-10', 'MALE', '0912000004', 'Khoa Da liễu Lâm sàng, Hà Nội', '2018-09-01', 'ACTIVE'),
(205, 105, 'STF-LAB01', 'KTV. Hoàng Đức Long', '1993-02-28', 'MALE', '0912000005', 'Khoa Xét nghiệm & Soi da, Hà Nội', '2022-10-15', 'ACTIVE')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`), `employment_status` = 'ACTIVE';

-- ----------------------------------------------------------------------------------------------------
-- 4. SEED HỒ SƠ BÁC SĨ (doctor_profiles)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `doctor_profiles` (`doctor_id`, `license_number`, `specialization`, `qualification_summary`, `biography`, `profile_image_url`, `is_active`) VALUES
(204, 'CCHN-DL-001234', 'Da liễu thẩm mỹ & Trị sẹo / Mụn trứng cá', 'Bác sĩ Chuyên khoa II - Đại học Y Hà Nội', 'Hơn 15 năm kinh nghiệm điều trị các bệnh lý da liễu mạn tính, laser thẩm mỹ và phục hồi da tổn thương.', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', 1)
ON DUPLICATE KEY UPDATE `specialization` = VALUES(`specialization`), `is_active` = 1;

-- ----------------------------------------------------------------------------------------------------
-- 5. SEED HỒ SƠ BỆNH NHÂN (patients)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `patients` (`patient_id`, `user_account_id`, `patient_code`, `full_name`, `date_of_birth`, `gender`, `phone`, `contact_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
(301, 106, 'BN-2026-001', 'Nguyễn Hoàng Yến', '1998-05-12', 'FEMALE', '0987654321', 'patient@hospital.test', '123 Đường Cầu Giấy, Cầu Giấy, Hà Nội', 'Nguyễn Văn Nam (Bố)', '0987654320'),
(302, 107, 'BN-2026-002', 'Phạm Quang Minh', '1995-10-25', 'MALE', '0977112233', 'patient02@hospital.test', '456 Phố Huế, Hai Bà Trưng, Hà Nội', 'Trần Kim Chi (Vợ)', '0977112234')
ON DUPLICATE KEY UPDATE `full_name` = VALUES(`full_name`);

-- ----------------------------------------------------------------------------------------------------
-- 6. SEED QUY ĐỊNH ĐẶT LỊCH (appointment_rules) - Ràng buộc 24h (1440 phút)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointment_rules` (`appointment_rule_id`, `rule_code`, `rule_name`, `slot_duration_minutes`, `default_slot_capacity`, `min_booking_notice_minutes`, `max_booking_days_ahead`, `cancellation_notice_minutes`, `reschedule_notice_minutes`, `no_show_grace_minutes`, `is_active`, `updated_by_staff_id`) VALUES
(1, 'RULE-DEFAULT', 'Quy định đặt lịch chuẩn Bệnh viện Da liễu', 30, 3, 60, 30, 1440, 1440, 15, 1, 201)
ON DUPLICATE KEY UPDATE `cancellation_notice_minutes` = 1440, `reschedule_notice_minutes` = 1440;

-- ----------------------------------------------------------------------------------------------------
-- 7. SEED DANH MỤC DỊCH VỤ Y TẾ (medical_services)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `medical_services` (`medical_service_id`, `service_code`, `service_name`, `description`, `base_price`, `estimated_duration_minutes`, `result_requirements`, `is_active`) VALUES
(1, 'SRV-EXAM-GEN', 'Khám Da Liễu Tổng Quát', 'Thăm khám lâm sàng, đánh giá tổng thể tình trạng da, tư vấn phác đồ điều trị ban đầu.', 200000.00, 30, 'Bác sĩ ghi nhận triệu chứng, khám tổn thương da và kết luận chẩn đoán ICD.', 1),
(2, 'SRV-DERMASCOPY', 'Soi Da Kỹ Thuật Số Chuyên Sâu', 'Sử dụng máy soi da phân tích tầng biểu bì, tuyến bã nhờn, sắc tố melanin và vi nấm.', 150000.00, 20, 'Hình ảnh phóng đại tổn thương và phiếu phân tích mức độ viêm/tăng sắc tố.', 1),
(3, 'SRV-LASER-CO2', 'Điều Trị Laser CO2 Fractional', 'Laser vi điểm điều trị sẹo rỗ, nốt ruồi, u tuyến mồ hôi và trẻ hóa bề mặt da.', 1200000.00, 45, 'Biên bản thực hiện thủ thuật laser và hướng dẫn bôi kem phục hồi sau can thiệp.', 1),
(4, 'SRV-TEST-FUNGUS', 'Xét Nghiệm Soi Tươi Vi Nấm', 'Lấy vảy da/móng soi trực tiếp dưới kính hiển vi tìm sợi nấm hoặc tế bào nấm men.', 100000.00, 15, 'Kết quả âm tính/dương tính với sợi nấm có vách ngăn hoặc bào tử nấm.', 1)
ON DUPLICATE KEY UPDATE `base_price` = VALUES(`base_price`), `is_active` = 1;

-- ----------------------------------------------------------------------------------------------------
-- 8. SEED MẪU CA (shift_templates) & CA LÀM VIỆC CỦA BÁC SĨ (work_schedules)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `shift_templates` (`shift_template_id`, `template_code`, `template_name`, `start_time`, `end_time`, `is_active`, `updated_by_staff_id`) VALUES
(1, 'SHIFT-MORNING', 'Ca Sáng (08:00 - 12:00)', '08:00:00', '12:00:00', 1, 202),
(2, 'SHIFT-AFTERNOON', 'Ca Chiều (13:30 - 17:30)', '13:30:00', '17:30:00', 1, 202)
ON DUPLICATE KEY UPDATE `template_name` = VALUES(`template_name`);

-- Ca làm việc hôm nay & ngày mai của Bác sĩ Vũ Minh Tuấn (staff_id = 204)
INSERT INTO `work_schedules` (`work_schedule_id`, `staff_id`, `shift_template_id`, `starts_at`, `ends_at`, `status`, `assigned_by_staff_id`, `note`) VALUES
(501, 204, 1, DATE_ADD(CURDATE(), INTERVAL 8 HOUR), DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 'SCHEDULED', 202, 'Ca khám sáng thường quy hôm nay'),
(502, 204, 2, DATE_ADD(CURDATE(), INTERVAL 13 HOUR + INTERVAL 30 MINUTE), DATE_ADD(CURDATE(), INTERVAL 17 HOUR + INTERVAL 30 MINUTE), 'SCHEDULED', 202, 'Ca khám chiều thường quy hôm nay'),
(503, 204, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 12 HOUR), 'SCHEDULED', 202, 'Ca khám sáng ngày mai (+24h để test Đổi/Hủy)')
ON DUPLICATE KEY UPDATE `status` = 'SCHEDULED';

-- ----------------------------------------------------------------------------------------------------
-- 9. SEED KHUNG GIỜ KHÁM (appointment_slots)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointment_slots` (`appointment_slot_id`, `work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`) VALUES
-- Ca sáng hôm nay
(601, 501, 1, DATE_ADD(CURDATE(), INTERVAL 8 HOUR), DATE_ADD(CURDATE(), INTERVAL 8 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'),
(602, 501, 1, DATE_ADD(CURDATE(), INTERVAL 8 HOUR + INTERVAL 30 MINUTE), DATE_ADD(CURDATE(), INTERVAL 9 HOUR), 3, 'OPEN'),
(603, 501, 1, DATE_ADD(CURDATE(), INTERVAL 9 HOUR), DATE_ADD(CURDATE(), INTERVAL 9 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'),
(604, 501, 1, DATE_ADD(CURDATE(), INTERVAL 9 HOUR + INTERVAL 30 MINUTE), DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 3, 'OPEN'),
-- Ca sáng ngày mai (dùng để test Đổi lịch & Hủy lịch thỏa điều kiện >= 24h)
(605, 503, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN'),
(606, 503, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR + INTERVAL 30 MINUTE), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), 3, 'OPEN'),
(607, 503, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR + INTERVAL 30 MINUTE), 3, 'OPEN')
ON DUPLICATE KEY UPDATE `status` = 'OPEN';

-- ----------------------------------------------------------------------------------------------------
-- 10. SEED CÁC LỊCH HẸN MẪU ĐỂ TEST ĐỦ CÁC TRẠNG THÁI (appointments)
-- ----------------------------------------------------------------------------------------------------
-- 10.1. Lịch hẹn BOOKED ngày mai (Đủ điều kiện >= 24h để test HỦY hoặc ĐỔI LỊCH)
INSERT INTO `appointments` (`appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `note`, `created_by_account_id`) VALUES
(701, 'APPT-TEST-BOOKED', 301, 605, 'ONLINE', 'BOOKED', 'Nổi mụn bọc vùng trán và má trái', 'Lịch hẹn ngày mai để test đổi lịch hoặc hủy hẹn', 106)
ON DUPLICATE KEY UPDATE `status` = 'BOOKED';

-- 10.2. Lịch hẹn CHECKED_IN sáng nay (Đã qua quầy tiếp đón, chờ bác sĩ khám hoặc test Hoàn tác check-in)
INSERT INTO `appointments` (`appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `note`, `created_by_account_id`, `checked_in_at`, `checked_in_by_staff_id`) VALUES
(702, 'APPT-TEST-CHECKEDIN', 302, 601, 'ASSISTED', 'CHECKED_IN', 'Ngứa nhiều về đêm, nghi ngờ ghẻ hoặc chàm', 'Tiếp tân tiếp đón lúc 07:55', 103, DATE_ADD(CURDATE(), INTERVAL 7 HOUR + INTERVAL 55 MINUTE), 203)
ON DUPLICATE KEY UPDATE `status` = 'CHECKED_IN';

-- 10.3. Lịch hẹn COMPLETED (Đã khám xong lâm sàng, Encounter hoàn tất)
INSERT INTO `appointments` (`appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `created_by_account_id`, `checked_in_at`, `checked_in_by_staff_id`) VALUES
(703, 'APPT-TEST-COMPLETED', 301, 602, 'ONLINE', 'COMPLETED', 'Tái khám sau 2 tuần uống isotretinoin', 106, DATE_ADD(CURDATE(), INTERVAL 8 HOUR + INTERVAL 25 MINUTE), 203)
ON DUPLICATE KEY UPDATE `status` = 'COMPLETED';

-- 10.4. Lịch hẹn CANCELLED (Đã bị hủy trước 24h)
INSERT INTO `appointments` (`appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `created_by_account_id`, `cancelled_at`, `cancelled_by_account_id`, `cancellation_reason`) VALUES
(704, 'APPT-TEST-CANCELLED', 302, 607, 'ONLINE', 'CANCELLED', 'Khám nốt ruồi bất thường', 107, NOW(), 107, 'Bệnh nhân bận công tác đột xuất')
ON DUPLICATE KEY UPDATE `status` = 'CANCELLED';

-- 10.5. Lịch hẹn NO_SHOW (Hết ca khám mà không đến check-in, do Cron Job đánh dấu)
INSERT INTO `appointments` (`appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`, `booking_source`, `status`, `reason`, `created_by_account_id`, `no_show_marked_at`) VALUES
(705, 'APPT-TEST-NOSHOW', 302, 603, 'ONLINE', 'NO_SHOW', 'Rụng tóc từng mảng sau sinh', 107, NOW())
ON DUPLICATE KEY UPDATE `status` = 'NO_SHOW';

-- ----------------------------------------------------------------------------------------------------
-- 11. SEED ENCOUNTER CHO LỊCH HẸN ĐÃ HOÀN THÀNH (encounters)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `encounters` (`encounter_id`, `appointment_id`, `responsible_doctor_id`, `chief_complaint`, `symptoms`, `clinical_findings`, `clinical_notes`, `started_at`, `completed_at`, `status`) VALUES
(801, 703, 204, 'Tái khám mụn trứng cá nang bọc', 'Da bớt dầu, còn thâm và vài nốt sẩn viêm rải rác', 'Tổn thương viêm giảm 70%, không có sẹo lồi mới', 'Bệnh nhân tuân thủ bôi thuốc đúng cách, tiếp tục duy trì phác đồ.', DATE_ADD(CURDATE(), INTERVAL 8 HOUR + INTERVAL 35 MINUTE), DATE_ADD(CURDATE(), INTERVAL 8 HOUR + INTERVAL 55 MINUTE), 'COMPLETED')
ON DUPLICATE KEY UPDATE `status` = 'COMPLETED';

-- ====================================================================================================
-- KẾT THÚC SEED DỮ LIỆU TEST
-- ====================================================================================================

