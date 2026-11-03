-- ====================================================================================================
-- SEED DATA TOÀN DIỆN CHO HỆ THỐNG QUẢN LÝ BỆNH VIỆN CHUYÊN KHOA DA LIỄU (DERMACARE)
-- Tương thích 100% với Schema Hibernate / Spring Boot JPA
-- Mật khẩu chung cho tất cả tài khoản: Password@123
-- Hash BCrypt (10 rounds): $2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe
-- ====================================================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Xóa dữ liệu cũ nếu có
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `invoice_items`;
TRUNCATE TABLE `invoices`;
TRUNCATE TABLE `medical_service_results`;
TRUNCATE TABLE `medical_service_requests`;
TRUNCATE TABLE `encounter_diagnoses`;
TRUNCATE TABLE `encounters`;
TRUNCATE TABLE `appointments`;
TRUNCATE TABLE `appointment_slots`;
TRUNCATE TABLE `work_schedules`;
TRUNCATE TABLE `shift_templates`;
TRUNCATE TABLE `appointment_rules`;
TRUNCATE TABLE `staff_medical_services`;
TRUNCATE TABLE `medical_services`;
TRUNCATE TABLE `doctor_profiles`;
TRUNCATE TABLE `patients`;
TRUNCATE TABLE `hospital_staff`;
TRUNCATE TABLE `auth_sessions`;
TRUNCATE TABLE `user_accounts`;
TRUNCATE TABLE `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------------------------------
-- 1. BẢNG ROLES (6 Vai trò cốt lõi trong hệ thống y tế)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `roles` (`role_id`, `role_code`, `role_name`) VALUES
(1, 'ADMIN', 'Quản trị viên hệ thống'),
(2, 'MANAGER', 'Quản lý vận hành bệnh viện'),
(3, 'RECEPTIONIST', 'Nhân viên lễ tân / Tiếp đón'),
(4, 'DOCTOR', 'Bác sĩ chuyên khoa da liễu'),
(5, 'MEDICAL_SERVICE_STAFF', 'Kỹ thuật viên xét nghiệm / Cận lâm sàng'),
(6, 'PATIENT', 'Người bệnh / Thân nhân');

-- ----------------------------------------------------------------------------------------------------
-- 2. BẢNG TÀI KHOẢN (user_accounts) - Mật khẩu: Password@123
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `user_accounts` (`user_account_id`, `username`, `login_email`, `password_hash`, `status`, `role_id`, `created_at`, `updated_at`) VALUES
(101, 'admin', 'admin@dermacare.hospital.vn', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 1, NOW(6), NOW(6)),
(102, 'manager', 'manager@dermacare.hospital.vn', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 2, NOW(6), NOW(6)),
(103, 'receptionist', 'receptionist@dermacare.hospital.vn', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 3, NOW(6), NOW(6)),
(104, 'doctor', 'doctor@dermacare.hospital.vn', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 4, NOW(6), NOW(6)),
(105, 'servicestaff', 'lab@dermacare.hospital.vn', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 5, NOW(6), NOW(6)),
(106, 'patient', 'yen.nguyen@example.com', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 6, NOW(6), NOW(6)),
(107, 'patient02', 'hung.tran@example.com', '$2a$10$KYGAbZbXWXAcqNx9R4lPnuJPg9gnyt4ADYe3CfxOdlslgd6yQPHHe', 'ACTIVE', 6, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 3. BẢNG NHÂN VIÊN Y TẾ (hospital_staff)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `hospital_staff` (`staff_id`, `user_account_id`, `staff_code`, `full_name`, `gender`, `date_of_birth`, `phone`, `address`, `hire_date`, `employment_status`, `created_at`, `updated_at`) VALUES
(201, 101, 'STF-ADM-001', 'Nguyễn Văn Quản Trị', 'MALE', '1985-05-15', '0912345678', 'Tòa nhà Hành chính Bệnh viện Da liễu DERMACARE', '2020-01-01', 'ACTIVE', NOW(6), NOW(6)),
(202, 102, 'STF-MNG-001', 'Trần Thị Giám Đốc', 'FEMALE', '1988-08-20', '0923456789', 'Phòng Điều hành & Quản lý Chất lượng y tế', '2021-03-15', 'ACTIVE', NOW(6), NOW(6)),
(203, 103, 'STF-REC-001', 'Lê Thu Hà (Tiếp Tân)', 'FEMALE', '1996-11-10', '0934567890', 'Quầy Tiếp đón & Chăm sóc khách hàng sảnh A', '2022-06-01', 'ACTIVE', NOW(6), NOW(6)),
(204, 104, 'STF-DOC-001', 'BSCKII. Vũ Minh Tuấn', 'MALE', '1980-04-12', '0945678901', 'Khoa Khám Da liễu & Thẩm mỹ Nội khoa', '2018-09-01', 'ACTIVE', NOW(6), NOW(6)),
(205, 105, 'STF-LAB-001', 'KTV. Hoàng Văn Nghiệm', 'MALE', '1994-02-28', '0956789012', 'Khoa Cận lâm sàng & Xét nghiệm vi nấm Da liễu', '2023-01-10', 'ACTIVE', NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 4. BẢNG HỒ SƠ BÁC SĨ (doctor_profiles)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `doctor_profiles` (`doctor_id`, `specialization`, `qualification_summary`, `license_number`, `biography`, `profile_image_url`, `is_active`, `created_at`, `updated_at`) VALUES
(204, 'Da liễu tổng quát & Thẩm mỹ da', 'Bác sĩ Chuyên khoa II Da liễu, Nguyên giảng viên Đại học Y Dược', 'CCHN-DALIEU-001928', 'Chuyên gia điều trị viêm da cơ địa, vảy nến, mụn trứng cá nặng và phục hồi màng bảo vệ da hư tổn.', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d', 1, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 5. BẢNG NGƯỜI BỆNH (patients)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `patients` (`patient_id`, `user_account_id`, `patient_code`, `full_name`, `gender`, `date_of_birth`, `phone`, `contact_email`, `address`, `emergency_contact_name`, `emergency_contact_phone`, `created_at`, `updated_at`) VALUES
(301, 106, 'PAT-2026-0001', 'Nguyễn Hoàng Yến', 'FEMALE', '1998-03-24', '0987654321', 'yen.nguyen@example.com', '152/4 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM', 'Nguyễn Văn Hùng (Bố)', '0903112233', NOW(6), NOW(6)),
(302, 107, 'PAT-2026-0002', 'Trần Mạnh Hùng', 'MALE', '1992-09-15', '0978123456', 'hung.tran@example.com', '45 Lê Hồng Phong, Phường 2, Quận 5, TP.HCM', 'Trần Thị Mai (Vợ)', '0908889999', NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 6. DANH MỤC DỊCH VỤ Y TẾ DA LIỄU (medical_services)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `medical_services` (`medical_service_id`, `service_code`, `service_name`, `description`, `base_price`, `estimated_duration_minutes`, `result_requirements`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SRV-EXAM-GEN', 'Khám chuyên khoa Da liễu (Ban đầu)', 'Khám lâm sàng đánh giá thương tổn da, kê đơn hoặc chỉ định cận lâm sàng', 280000.00, 20, 'Phiếu chẩn đoán lâm sàng & phác đồ', 1, NOW(6), NOW(6)),
(2, 'SRV-SOIDAVITHE', 'Soi da vi thể quang học (Dermoscopy 3D)', 'Chụp phóng đại cấu trúc vi mạch, nang lông, sắc tố và tầm soát khối u da', 350000.00, 15, 'Hình ảnh Dermoscopy độ phân giải cao', 1, NOW(6), NOW(6)),
(3, 'SRV-XETNGHIEMNAM', 'Soi tươi tìm sợi nấm / Ký sinh trùng Demodex', 'Cạo vảy thương tổn da hoặc bã nhờn nang lông soi kính hiển vi quang học', 180000.00, 25, 'Báo cáo định danh nấm / mật độ Demodex/cm2', 1, NOW(6), NOW(6)),
(4, 'SRV-PEEL-AHA', 'Thay da sinh học AHA điều trị mụn & thâm', 'Thủ thuật thoa dung dịch acid hữu cơ tẩy tế bào chết và thông thoáng nang lông', 650000.00, 45, 'Biên bản thực hiện thủ thuật chăm sóc da', 1, NOW(6), NOW(6)),
(5, 'SRV-LASER-CO2', 'Laser CO2 Fractional trị sẹo rỗ', 'Bắn vi điểm kích thích tăng sinh collagen tái tạo bề mặt da', 150000.00, 60, 'Hình ảnh trước và sau liệu trình', 1, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 7. QUY ĐỊNH ĐẶT LỊCH (appointment_rules)
-- Quy định: Hủy hẹn >= 24h (1440 phút), Đổi lịch >= 24h (1440 phút), Đặt trước ít nhất 60 phút
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointment_rules` (`appointment_rule_id`, `rule_code`, `rule_name`, `slot_duration_minutes`, `default_slot_capacity`, `min_booking_notice_minutes`, `max_booking_days_ahead`, `cancellation_notice_minutes`, `reschedule_notice_minutes`, `no_show_grace_minutes`, `is_active`, `updated_by_staff_id`, `created_at`, `updated_at`) VALUES
(1, 'RULE-DEFAULT', 'Quy định đặt lịch chuẩn Bệnh viện Da liễu DERMACARE', 30, 3, 60, 30, 1440, 1440, 45, 1, 201, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 8. MẪU CA LÀM VIỆC (shift_templates)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `shift_templates` (`shift_template_id`, `shift_code`, `shift_name`, `start_time`, `end_time`, `end_day_offset`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'SHIFT-MORNING', 'Ca Sáng (08:00 - 12:00)', '08:00:00', '12:00:00', 0, 1, NOW(6), NOW(6)),
(2, 'SHIFT-AFTERNOON', 'Ca Chiều (13:30 - 17:30)', '13:30:00', '17:30:00', 0, 1, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 9. CA TRỰC CỦA BÁC SĨ (work_schedules)
-- Lịch trực hôm nay (sáng/chiều) và ngày mai của Bác sĩ BSCKII. Vũ Minh Tuấn (staff_id = 204)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `work_schedules` (`work_schedule_id`, `staff_id`, `shift_template_id`, `starts_at`, `ends_at`, `status`, `assigned_by_staff_id`, `note`, `row_version`, `created_at`, `updated_at`) VALUES
(501, 204, 1, DATE_ADD(CURDATE(), INTERVAL 8 HOUR), DATE_ADD(CURDATE(), INTERVAL 12 HOUR), 'SCHEDULED', 202, 'Ca khám sáng thường quy hôm nay', 0, NOW(6), NOW(6)),
(502, 204, 2, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 13 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 17 HOUR), INTERVAL 30 MINUTE), 'SCHEDULED', 202, 'Ca khám chiều thường quy hôm nay', 0, NOW(6), NOW(6)),
(503, 204, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 12 HOUR), 'SCHEDULED', 202, 'Ca khám sáng ngày mai (+24h để test Đổi/Hủy)', 0, NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 10. KHUNG GIỜ KHÁM (appointment_slots)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointment_slots` (`appointment_slot_id`, `work_schedule_id`, `appointment_rule_id`, `starts_at`, `ends_at`, `capacity`, `status`, `created_at`, `updated_at`) VALUES
-- Ca sáng hôm nay
(601, 501, 1, DATE_ADD(CURDATE(), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 8 HOUR), INTERVAL 30 MINUTE), 3, 'OPEN', NOW(6), NOW(6)),
(602, 501, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 8 HOUR), INTERVAL 30 MINUTE), DATE_ADD(CURDATE(), INTERVAL 9 HOUR), 3, 'OPEN', NOW(6), NOW(6)),
(603, 501, 1, DATE_ADD(CURDATE(), INTERVAL 9 HOUR), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 9 HOUR), INTERVAL 30 MINUTE), 3, 'OPEN', NOW(6), NOW(6)),
(604, 501, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 9 HOUR), INTERVAL 30 MINUTE), DATE_ADD(CURDATE(), INTERVAL 10 HOUR), 3, 'OPEN', NOW(6), NOW(6)),
-- Ca sáng ngày mai (dùng để test Đổi lịch & Hủy lịch thỏa điều kiện >= 24h)
(605, 503, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), DATE_ADD(DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), INTERVAL 30 MINUTE), 3, 'OPEN', NOW(6), NOW(6)),
(606, 503, 1, DATE_ADD(DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 8 HOUR), INTERVAL 30 MINUTE), DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), 3, 'OPEN', NOW(6), NOW(6)),
(607, 503, 1, DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), DATE_ADD(DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 9 HOUR), INTERVAL 30 MINUTE), 3, 'OPEN', NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 11. CÁC CUỘC HẸN KHÁM BỆNH (appointments)
-- Đầy đủ các trạng thái thực tế:
--   - 701: 'BOOKED' (Ca sáng hôm nay, chờ tiếp đón)
--   - 702: 'CHECKED_IN' (Ca sáng hôm nay, đã check-in, đang chờ vào khám)
--   - 703: 'BOOKED' (Ca sáng ngày mai, thỏa mãn điều kiện hủy/đổi lịch >= 24h)
--   - 704: 'CANCELLED' (Đã hủy)
--   - 705: 'NO_SHOW' (Bệnh nhân vắng mặt quá ca khám)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `appointments` (
  `appointment_id`, `appointment_code`, `patient_id`, `appointment_slot_id`,
  `booking_source`, `status`, `reason`, `note`, `created_by_account_id`,
  `checked_in_at`, `checked_in_by_staff_id`, `cancelled_at`, `cancelled_by_account_id`,
  `cancellation_reason`, `no_show_marked_at`, `created_at`, `updated_at`
) VALUES
-- 1. Lịch hẹn BOOKED hôm nay
(701, 'APPT-DEMO-001', 301, 601, 'ONLINE', 'BOOKED', 'Khám viêm da cơ địa và mẩn ngứa vùng mặt', 'Bệnh nhân có tiền sử dị ứng mỹ phẩm', 106, NULL, NULL, NULL, NULL, NULL, NULL, NOW(6), NOW(6)),

-- 2. Lịch hẹn CHECKED_IN hôm nay (Đã tiếp đón bởi Tiếp tân 203)
(702, 'APPT-DEMO-002', 301, 602, 'ONLINE', 'CHECKED_IN', 'Tái khám mụn trứng cá bọc và thâm sẹo', 'Đã chụp hình ảnh thương tổn ban đầu', 106, NOW(6), 203, NULL, NULL, NULL, NULL, NOW(6), NOW(6)),

-- 3. Lịch hẹn ngày mai (dùng để test hủy/đổi lịch >= 24h)
(703, 'APPT-DEMO-003', 301, 605, 'ONLINE', 'BOOKED', 'Kiểm tra nốt ruồi bất thường và sắc tố da', 'Yêu cầu soi Dermoscopy quang học', 106, NULL, NULL, NULL, NULL, NULL, NULL, NOW(6), NOW(6)),

-- 4. Lịch hẹn đã HỦY (CANCELLED)
(704, 'APPT-DEMO-004', 302, 603, 'ONLINE', 'CANCELLED', 'Khám vảy nến da đầu', 'Bệnh nhân xin hủy trước 24h', 107, NULL, NULL, NOW(6), 107, 'Bận lịch công tác đột xuất', NULL, NOW(6), NOW(6)),

-- 5. Lịch hẹn VẮNG MẶT (NO_SHOW)
(705, 'APPT-DEMO-005', 302, 604, 'ONLINE', 'NO_SHOW', 'Khám rụng tóc từng mảng', 'Quá giờ khám 45 phút không đến quầy', 107, NULL, NULL, NULL, NULL, NULL, NOW(6), NOW(6), NOW(6));

-- ----------------------------------------------------------------------------------------------------
-- 12. GIAO DỊCH THANH TOÁN ONLINE (payments)
-- Thanh toán trước tiền khám qua payOS VietQR (NAPAS247)
-- ----------------------------------------------------------------------------------------------------
INSERT INTO `payments` (`payment_id`, `payment_reference`, `provider`, `provider_transaction_id`, `amount`, `status`, `initiated_by_account_id`, `initiated_at`, `completed_at`, `invoice_id`) VALUES
(801, 'PAY-APPT-701', 'payOS', 'POS-TX-990011', 280000.00, 'SUCCEEDED', 106, NOW(6), NOW(6), NULL),
(802, 'PAY-APPT-702', 'payOS', 'POS-TX-990022', 280000.00, 'SUCCEEDED', 106, NOW(6), NOW(6), NULL),
(803, 'PAY-APPT-703', 'payOS', 'POS-TX-990033', 280000.00, 'SUCCEEDED', 106, NOW(6), NOW(6), NULL);

-- Hoàn tất seed data
COMMIT;
