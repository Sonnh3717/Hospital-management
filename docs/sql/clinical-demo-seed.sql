-- DEVELOPMENT ONLY. Synthetic DEMO data; never use these accounts in production.
-- Apply after the original 28-table schema and clinical-workflow-migration.sql.
-- The caller must explicitly select the intended development schema.
-- No data is deleted, no existing row or password is updated, no schema is dropped.
-- Re-running skips existing DEMO records and preserves clinical state.
-- If non-DEMO business data exists, the complete seed is skipped.
-- Plaintext password is intentionally absent; local credentials are in the
-- ignored target/clinical-flow-check/local-demo-access.md generated on this machine.
SET NAMES utf8mb4;
SET time_zone = '+00:00';
SET @demo_password_hash = '$2a$10$C8rD6C91./CaAVd.rvCOZOfczwZBlTe0IY78jYg4jh6FOoTHJEqoi';
SET @demo_today = DATE(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 7 HOUR));
SET @demo_day_start = DATE_SUB(@demo_today, INTERVAL 7 HOUR);
SET @demo_day_end = DATE_ADD(@demo_day_start, INTERVAL 86399 SECOND);
SET @demo_tomorrow_start = DATE_ADD(@demo_day_start, INTERVAL 1 DAY);
SET @demo_slot_start = LEAST(DATE_ADD(UTC_TIMESTAMP(), INTERVAL 15 MINUTE),DATE_ADD(@demo_day_start,INTERVAL 1438 MINUTE));
SET @demo_slot_end = LEAST(DATE_ADD(@demo_slot_start, INTERVAL 15 MINUTE),@demo_day_end);
SET @demo_lock_acquired = GET_LOCK(CONCAT(DATABASE(),':clinical-demo-seed'),10);
START TRANSACTION;
-- Lock existing/empty ranges before deciding whether a business DB is empty.
SELECT user_account_id FROM user_accounts FOR UPDATE;
SELECT staff_id FROM hospital_staff FOR UPDATE;
SELECT patient_id FROM patients FOR UPDATE;
SELECT medical_service_id FROM medical_services FOR UPDATE;
SET @demo_empty_db = (SELECT COUNT(*) FROM user_accounts)=0
  AND (SELECT COUNT(*) FROM hospital_staff)=0 AND (SELECT COUNT(*) FROM patients)=0
  AND (SELECT COUNT(*) FROM appointments)=0 AND (SELECT COUNT(*) FROM encounters)=0
  AND (SELECT COUNT(*) FROM medical_services)=0 AND (SELECT COUNT(*) FROM appointment_rules)=0;
SET @demo_only_db = EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.reception')
  AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username NOT IN ('demo.reception','demo.doctor','demo.service','demo.bootstrap.admin','demo.bootstrap.manager'))
  AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code NOT LIKE 'DEMO-%')
  AND NOT EXISTS(SELECT 1 FROM patients WHERE patient_code NOT LIKE 'DEMO-%')
  AND NOT EXISTS(SELECT 1 FROM medical_services WHERE service_code NOT LIKE 'DEMO-%')
  AND NOT EXISTS(SELECT 1 FROM appointment_rules WHERE rule_code NOT LIKE 'DEMO-%')
  AND NOT EXISTS(SELECT 1 FROM appointments WHERE appointment_code NOT LIKE 'DEMO-%');
SET @demo_required_roles = (SELECT COUNT(*) FROM roles WHERE role_code IN ('ADMIN','MANAGER','DOCTOR','MEDICAL_SERVICE_STAFF','RECEPTIONIST'))=5;
SET @demo_seed_allowed = @demo_lock_acquired=1 AND @demo_required_roles AND (@demo_empty_db OR @demo_only_db);
INSERT INTO user_accounts (role_id,username,login_email,password_hash,status)
SELECT role_id,'demo.bootstrap.admin','demo.bootstrap.admin@example.test',@demo_password_hash,'INACTIVE' FROM roles
WHERE role_code='ADMIN' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.bootstrap.admin');
INSERT INTO user_accounts (role_id,username,login_email,password_hash,status)
SELECT role_id,'demo.bootstrap.manager','demo.bootstrap.manager@example.test',@demo_password_hash,'INACTIVE' FROM roles
WHERE role_code='MANAGER' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.bootstrap.manager');
INSERT INTO user_accounts (role_id,username,login_email,password_hash,status)
SELECT role_id,'demo.reception','demo.reception@example.test',@demo_password_hash,'ACTIVE' FROM roles
WHERE role_code='RECEPTIONIST' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.reception');
INSERT INTO user_accounts (role_id,username,login_email,password_hash,status)
SELECT role_id,'demo.doctor','demo.doctor@example.test',@demo_password_hash,'ACTIVE' FROM roles
WHERE role_code='DOCTOR' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.doctor');
INSERT INTO user_accounts (role_id,username,login_email,password_hash,status)
SELECT role_id,'demo.service','demo.service@example.test',@demo_password_hash,'ACTIVE' FROM roles
WHERE role_code='MEDICAL_SERVICE_STAFF' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM user_accounts WHERE username='demo.service');
INSERT INTO hospital_staff (user_account_id,staff_code,full_name,gender,employment_status)
SELECT user_account_id,'DEMO-ADMIN','DEMO - Quản trị dữ liệu ban đầu','UNSPECIFIED','INACTIVE' FROM user_accounts WHERE username='demo.bootstrap.admin' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code='DEMO-ADMIN');
INSERT INTO hospital_staff (user_account_id,staff_code,full_name,gender,employment_status)
SELECT user_account_id,'DEMO-MANAGER','DEMO - Quản lý lịch ban đầu','UNSPECIFIED','INACTIVE' FROM user_accounts WHERE username='demo.bootstrap.manager' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code='DEMO-MANAGER');
INSERT INTO hospital_staff (user_account_id,staff_code,full_name,gender,employment_status)
SELECT user_account_id,'DEMO-RECEPTION','DEMO - Nguyễn Thu Hà','FEMALE','ACTIVE' FROM user_accounts WHERE username='demo.reception' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code='DEMO-RECEPTION');
INSERT INTO hospital_staff (user_account_id,staff_code,full_name,gender,employment_status)
SELECT user_account_id,'DEMO-DOCTOR','DEMO - Bác sĩ Trần Minh Khang','MALE','ACTIVE' FROM user_accounts WHERE username='demo.doctor' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code='DEMO-DOCTOR');
INSERT INTO hospital_staff (user_account_id,staff_code,full_name,gender,employment_status)
SELECT user_account_id,'DEMO-SERVICE','DEMO - Kỹ thuật viên Phạm Hoàng Anh','MALE','ACTIVE' FROM user_accounts WHERE username='demo.service' AND @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM hospital_staff WHERE staff_code='DEMO-SERVICE');
SET @demo_admin_id=(SELECT staff_id FROM hospital_staff WHERE staff_code='DEMO-ADMIN');
SET @demo_manager_id=(SELECT staff_id FROM hospital_staff WHERE staff_code='DEMO-MANAGER');
SET @demo_reception_account=(SELECT user_account_id FROM user_accounts WHERE username='demo.reception');
SET @demo_doctor_id=(SELECT staff_id FROM hospital_staff WHERE staff_code='DEMO-DOCTOR');
SET @demo_service_staff_id=(SELECT staff_id FROM hospital_staff WHERE staff_code='DEMO-SERVICE');
INSERT INTO doctor_profiles (doctor_id,license_number,specialization,qualification_summary,is_active)
SELECT @demo_doctor_id,'DEMO-LICENSE-001','DEMO - Nội tổng quát','DEMO - Hồ sơ giả lập phục vụ phát triển',1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM doctor_profiles WHERE doctor_id=@demo_doctor_id);
INSERT INTO patients (patient_code,full_name,date_of_birth,gender,phone,contact_email)
SELECT 'DEMO-PT001','DEMO - Nguyễn Minh An','1992-04-12','MALE','0900000001','demo.patient@example.test'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM patients WHERE patient_code='DEMO-PT001');
SET @demo_patient_id=(SELECT patient_id FROM patients WHERE patient_code='DEMO-PT001');
INSERT INTO medical_services (service_code,service_name,description,base_price,estimated_duration_minutes,result_requirements,is_active)
SELECT 'DEMO-CBC','DEMO - Công thức máu','DEMO - Dữ liệu giả lập',150000,20,'Tóm tắt kết quả và các chỉ số huyết học',1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM medical_services WHERE service_code='DEMO-CBC');
INSERT INTO medical_services (service_code,service_name,description,base_price,estimated_duration_minutes,result_requirements,is_active)
SELECT 'DEMO-US','DEMO - Siêu âm bụng','DEMO - Dữ liệu giả lập',250000,30,'Mô tả hình ảnh và kết luận',1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM medical_services WHERE service_code='DEMO-US');
INSERT INTO medical_services (service_code,service_name,description,base_price,estimated_duration_minutes,result_requirements,is_active)
SELECT 'DEMO-ECG','DEMO - Điện tâm đồ','DEMO - Dữ liệu giả lập',180000,15,'Nhịp tim, đánh giá và kết luận',1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM medical_services WHERE service_code='DEMO-ECG');
INSERT INTO staff_medical_services (staff_id,medical_service_id,is_active,assigned_by_staff_id)
SELECT @demo_service_staff_id,ms.medical_service_id,1,@demo_admin_id FROM medical_services ms
WHERE @demo_seed_allowed AND ms.service_code IN ('DEMO-CBC','DEMO-US','DEMO-ECG')
AND NOT EXISTS(SELECT 1 FROM staff_medical_services sms WHERE sms.staff_id=@demo_service_staff_id AND sms.medical_service_id=ms.medical_service_id);
INSERT INTO shift_templates (shift_code,shift_name,start_time,end_time,end_day_offset,is_active)
SELECT 'DEMO-ALLDAY','DEMO - Ca phát triển hôm nay','00:00:00','23:59:59',0,1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM shift_templates WHERE shift_code='DEMO-ALLDAY');
INSERT INTO shift_templates (shift_code,shift_name,start_time,end_time,end_day_offset,is_active)
SELECT 'DEMO-DAY','DEMO - Ca phát triển ngày mai','08:00:00','17:00:00',0,1
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM shift_templates WHERE shift_code='DEMO-DAY');
SET @demo_shift_today=(SELECT shift_template_id FROM shift_templates WHERE shift_code='DEMO-ALLDAY');
SET @demo_shift_tomorrow=(SELECT shift_template_id FROM shift_templates WHERE shift_code='DEMO-DAY');
INSERT INTO appointment_rules (rule_code,rule_name,slot_duration_minutes,default_slot_capacity,min_booking_notice_minutes,max_booking_days_ahead,cancellation_notice_minutes,reschedule_notice_minutes,no_show_grace_minutes,is_active,updated_by_staff_id)
SELECT 'DEMO-RULE','DEMO - Quy tắc phát triển',15,5,0,30,0,0,15,1,@demo_admin_id
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM appointment_rules WHERE rule_code='DEMO-RULE');
SET @demo_rule_id=(SELECT appointment_rule_id FROM appointment_rules WHERE rule_code='DEMO-RULE');
INSERT INTO work_schedules (staff_id,shift_template_id,starts_at,ends_at,status,assigned_by_staff_id,note)
SELECT @demo_doctor_id,@demo_shift_today,@demo_day_start,@demo_day_end,'SCHEDULED',@demo_manager_id,'DEMO - Lịch hôm nay'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM work_schedules WHERE staff_id=@demo_doctor_id AND starts_at=@demo_day_start);
INSERT INTO work_schedules (staff_id,shift_template_id,starts_at,ends_at,status,assigned_by_staff_id,note)
SELECT @demo_doctor_id,@demo_shift_tomorrow,DATE_ADD(@demo_tomorrow_start,INTERVAL 8 HOUR),DATE_ADD(@demo_tomorrow_start,INTERVAL 17 HOUR),'SCHEDULED',@demo_manager_id,'DEMO - Lịch ngày mai'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM work_schedules WHERE staff_id=@demo_doctor_id AND starts_at=DATE_ADD(@demo_tomorrow_start,INTERVAL 8 HOUR));
SET @demo_schedule_today=(SELECT work_schedule_id FROM work_schedules WHERE staff_id=@demo_doctor_id AND starts_at=@demo_day_start LIMIT 1);
SET @demo_schedule_tomorrow=(SELECT work_schedule_id FROM work_schedules WHERE staff_id=@demo_doctor_id AND starts_at=DATE_ADD(@demo_tomorrow_start,INTERVAL 8 HOUR) LIMIT 1);
-- Keep existing current-day slot on repeat, including its clinical lifecycle.
INSERT INTO appointment_slots (work_schedule_id,appointment_rule_id,starts_at,ends_at,capacity,status)
SELECT @demo_schedule_today,@demo_rule_id,@demo_slot_start,@demo_slot_end,5,'OPEN'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM appointment_slots WHERE work_schedule_id=@demo_schedule_today);
INSERT INTO appointment_slots (work_schedule_id,appointment_rule_id,starts_at,ends_at,capacity,status)
SELECT @demo_schedule_tomorrow,@demo_rule_id,DATE_ADD(@demo_tomorrow_start,INTERVAL 8 HOUR),DATE_ADD(@demo_tomorrow_start,INTERVAL 495 MINUTE),5,'OPEN'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM appointment_slots WHERE work_schedule_id=@demo_schedule_tomorrow AND starts_at=DATE_ADD(@demo_tomorrow_start,INTERVAL 8 HOUR));
INSERT INTO appointment_slots (work_schedule_id,appointment_rule_id,starts_at,ends_at,capacity,status)
SELECT @demo_schedule_tomorrow,@demo_rule_id,DATE_ADD(@demo_tomorrow_start,INTERVAL 510 MINUTE),DATE_ADD(@demo_tomorrow_start,INTERVAL 525 MINUTE),5,'OPEN'
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM appointment_slots WHERE work_schedule_id=@demo_schedule_tomorrow AND starts_at=DATE_ADD(@demo_tomorrow_start,INTERVAL 510 MINUTE));
SET @demo_current_slot=(SELECT appointment_slot_id FROM appointment_slots WHERE work_schedule_id=@demo_schedule_today ORDER BY starts_at LIMIT 1);
INSERT INTO appointments (appointment_code,patient_id,appointment_slot_id,booking_source,status,reason,created_by_account_id)
SELECT CONCAT('DEMO-APT-',DATE_FORMAT(@demo_today,'%Y%m%d')),@demo_patient_id,@demo_current_slot,'ASSISTED','BOOKED','DEMO - Đau đầu và mệt mỏi',@demo_reception_account
WHERE @demo_seed_allowed AND NOT EXISTS(SELECT 1 FROM appointments WHERE appointment_code=CONCAT('DEMO-APT-',DATE_FORMAT(@demo_today,'%Y%m%d')));
COMMIT;
SELECT @demo_seed_allowed AS seed_allowed,@demo_empty_db AS initially_empty,@demo_today AS vietnam_date;
SELECT RELEASE_LOCK(CONCAT(DATABASE(),':clinical-demo-seed')) AS lock_released;
