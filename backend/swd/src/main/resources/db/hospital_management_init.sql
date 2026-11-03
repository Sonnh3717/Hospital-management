-- ====================================================================================================
-- HOSPITAL MANAGEMENT SYSTEM - COMPLETE DATABASE DUMP (SCHEMA + DATA)
-- Database: hospital_management (MySQL 8.0+)
--
-- All accounts default password: Password123!
--   - admin / Password123!        (Admin)
--   - manager / Password123!      (Manager)
--   - doctor / Password123!       (Doctor)
--   - receptionist / Password123! (Receptionist)
--   - servicestaff / Password123! (Medical Service Staff)
--   - patient / Password123!      (Patient)
-- ====================================================================================================

CREATE DATABASE IF NOT EXISTS `hospital_management` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `hospital_management`;

-- MySQL dump 10.13  Distrib 8.4.11, for Linux (x86_64)
--
-- Host: localhost    Database: hospital_management
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointment_rules`
--

DROP TABLE IF EXISTS `appointment_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_rules` (
  `appointment_rule_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_active` bit(1) NOT NULL,
  `cancellation_notice_minutes` int unsigned NOT NULL,
  `default_slot_capacity` smallint unsigned NOT NULL,
  `max_booking_days_ahead` smallint unsigned NOT NULL,
  `min_booking_notice_minutes` int unsigned NOT NULL,
  `no_show_grace_minutes` smallint unsigned NOT NULL,
  `reschedule_notice_minutes` int unsigned NOT NULL,
  `rule_code` varchar(30) NOT NULL,
  `rule_name` varchar(150) NOT NULL,
  `slot_duration_minutes` smallint unsigned NOT NULL,
  `updated_by_staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`appointment_rule_id`),
  UNIQUE KEY `uq_t11_01` (`rule_code`),
  KEY `fk_t11_01` (`updated_by_staff_id`),
  CONSTRAINT `fk_t11_01` FOREIGN KEY (`updated_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_rules`
--

LOCK TABLES `appointment_rules` WRITE;
/*!40000 ALTER TABLE `appointment_rules` DISABLE KEYS */;
INSERT INTO `appointment_rules` (`appointment_rule_id`, `created_at`, `updated_at`, `is_active`, `cancellation_notice_minutes`, `default_slot_capacity`, `max_booking_days_ahead`, `min_booking_notice_minutes`, `no_show_grace_minutes`, `reschedule_notice_minutes`, `rule_code`, `rule_name`, `slot_duration_minutes`, `updated_by_staff_id`) VALUES (1,'2026-11-03 01:55:59.962475','2026-11-03 01:55:59.962475',0x01,1440,3,30,60,45,1440,'RULE-DEFAULT','Quy định đặt lịch chuẩn Bệnh viện Da liễu DERMACARE',30,201);
/*!40000 ALTER TABLE `appointment_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointment_slots`
--

DROP TABLE IF EXISTS `appointment_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointment_slots` (
  `appointment_slot_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `capacity` smallint unsigned NOT NULL,
  `ends_at` datetime(6) NOT NULL,
  `starts_at` datetime(6) NOT NULL,
  `status` enum('OPEN','BLOCKED') NOT NULL,
  `appointment_rule_id` bigint unsigned NOT NULL,
  `work_schedule_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`appointment_slot_id`),
  UNIQUE KEY `uq_t12_01` (`work_schedule_id`,`starts_at`),
  KEY `fk_t12_02` (`appointment_rule_id`),
  CONSTRAINT `fk_t12_01` FOREIGN KEY (`work_schedule_id`) REFERENCES `work_schedules` (`work_schedule_id`),
  CONSTRAINT `fk_t12_02` FOREIGN KEY (`appointment_rule_id`) REFERENCES `appointment_rules` (`appointment_rule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=674 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointment_slots`
--

LOCK TABLES `appointment_slots` WRITE;
/*!40000 ALTER TABLE `appointment_slots` DISABLE KEYS */;
INSERT INTO `appointment_slots` (`appointment_slot_id`, `created_at`, `updated_at`, `capacity`, `ends_at`, `starts_at`, `status`, `appointment_rule_id`, `work_schedule_id`) VALUES (601,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-03 08:30:00.000000','2026-11-03 08:00:00.000000','OPEN',1,501),(602,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-03 09:00:00.000000','2026-11-03 08:30:00.000000','OPEN',1,501),(603,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-03 09:30:00.000000','2026-11-03 09:00:00.000000','OPEN',1,501),(604,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-03 10:00:00.000000','2026-11-03 09:30:00.000000','OPEN',1,501),(605,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-04 08:30:00.000000','2026-11-04 08:00:00.000000','OPEN',1,503),(606,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-04 09:00:00.000000','2026-11-04 08:30:00.000000','OPEN',1,503),(607,'2026-11-03 01:55:59.970591','2026-11-03 01:55:59.970591',3,'2026-11-04 09:30:00.000000','2026-11-04 09:00:00.000000','OPEN',1,503);
/*!40000 ALTER TABLE `appointment_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `appointments` (
  `appointment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_slot_id` bigint unsigned DEFAULT NULL,
  `appointment_code` varchar(40) NOT NULL,
  `booking_source` enum('ONLINE','ASSISTED','WALK_IN') NOT NULL,
  `cancellation_reason` varchar(500) DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `checked_in_at` datetime(6) DEFAULT NULL,
  `last_check_in_reversed_at` datetime(6) DEFAULT NULL,
  `last_rescheduled_at` datetime(6) DEFAULT NULL,
  `no_show_marked_at` datetime(6) DEFAULT NULL,
  `note` text,
  `reason` varchar(500) DEFAULT NULL,
  `status` enum('BOOKED','CHECKED_IN','CANCELLED','NO_SHOW') NOT NULL,
  `appointment_slot_id` bigint unsigned NOT NULL,
  `cancelled_by_account_id` bigint unsigned DEFAULT NULL,
  `checked_in_by_staff_id` bigint unsigned DEFAULT NULL,
  `created_by_account_id` bigint unsigned NOT NULL,
  `last_check_in_reversed_by_staff_id` bigint unsigned DEFAULT NULL,
  `last_rescheduled_by_account_id` bigint unsigned DEFAULT NULL,
  `patient_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`appointment_id`),
  UNIQUE KEY `uq_t13_01` (`appointment_code`),
  UNIQUE KEY `uq_t13_02` (`patient_id`,`active_slot_id`),
  KEY `fk_t13_02` (`appointment_slot_id`),
  KEY `fk_t13_06` (`cancelled_by_account_id`),
  KEY `fk_t13_04` (`checked_in_by_staff_id`),
  KEY `fk_t13_03` (`created_by_account_id`),
  KEY `fk_t13_05` (`last_check_in_reversed_by_staff_id`),
  KEY `fk_t13_07` (`last_rescheduled_by_account_id`),
  CONSTRAINT `fk_t13_01` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`patient_id`),
  CONSTRAINT `fk_t13_02` FOREIGN KEY (`appointment_slot_id`) REFERENCES `appointment_slots` (`appointment_slot_id`),
  CONSTRAINT `fk_t13_03` FOREIGN KEY (`created_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `fk_t13_04` FOREIGN KEY (`checked_in_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t13_05` FOREIGN KEY (`last_check_in_reversed_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t13_06` FOREIGN KEY (`cancelled_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `fk_t13_07` FOREIGN KEY (`last_rescheduled_by_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=753 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` (`appointment_id`, `created_at`, `updated_at`, `active_slot_id`, `appointment_code`, `booking_source`, `cancellation_reason`, `cancelled_at`, `checked_in_at`, `last_check_in_reversed_at`, `last_rescheduled_at`, `no_show_marked_at`, `note`, `reason`, `status`, `appointment_slot_id`, `cancelled_by_account_id`, `checked_in_by_staff_id`, `created_by_account_id`, `last_check_in_reversed_by_staff_id`, `last_rescheduled_by_account_id`, `patient_id`) VALUES (701,'2026-11-03 01:55:59.975608','2026-11-03 02:08:23.616031',NULL,'APPT-DEMO-001','ONLINE',NULL,NULL,'2026-11-03 02:08:23.605962',NULL,NULL,NULL,'Bệnh nhân có tiền sử dị ứng mỹ phẩm','Khám viêm da cơ địa và mẩn ngứa vùng mặt','CHECKED_IN',601,NULL,203,106,NULL,NULL,301),(702,'2026-11-03 01:55:59.975608','2026-11-03 02:08:35.623906',NULL,'APPT-DEMO-002','ONLINE',NULL,NULL,NULL,'2026-11-03 02:08:26.947264','2026-11-03 02:08:35.620825',NULL,'Đã chụp hình ảnh thương tổn ban đầu','Tái khám mụn trứng cá bọc và thâm sẹo','BOOKED',604,NULL,NULL,106,203,103,301),(703,'2026-11-03 01:55:59.975608','2026-11-03 01:55:59.975608',NULL,'APPT-DEMO-003','ONLINE',NULL,NULL,NULL,NULL,NULL,NULL,'Yêu cầu soi Dermoscopy quang học','Kiểm tra nốt ruồi bất thường và sắc tố da','BOOKED',605,NULL,NULL,106,NULL,NULL,301),(704,'2026-11-03 01:55:59.975608','2026-11-03 01:55:59.975608',NULL,'APPT-DEMO-004','ONLINE','Bận lịch công tác đột xuất','2026-11-03 01:55:59.975608',NULL,NULL,NULL,NULL,'Bệnh nhân xin hủy trước 24h','Khám vảy nến da đầu','CANCELLED',603,107,NULL,107,NULL,NULL,302),(705,'2026-11-03 01:55:59.975608','2026-11-03 01:55:59.975608',NULL,'APPT-DEMO-005','ONLINE',NULL,NULL,NULL,NULL,NULL,'2026-11-03 01:55:59.975608','Quá giờ khám 45 phút không đến quầy','Khám rụng tóc từng mảng','NO_SHOW',604,NULL,NULL,107,NULL,NULL,302),(706,'2026-11-03 02:30:09.167232','2026-11-03 02:30:09.167232',NULL,'APPT-73009162','ONLINE',NULL,NULL,NULL,NULL,NULL,NULL,'[Đặt cho bản thân] - Dịch vụ: Khám chuyên khoa Da liễu (Ban đầu) | Bác sĩ: Ths. BS LÊ THỊ MAI | Nhận chỉ dẫn mỹ phẩm: Không','Da em xấu lắm bác sĩ ơiiii','BOOKED',607,NULL,NULL,106,NULL,NULL,301),(717,'2026-11-03 03:07:27.848674','2026-11-03 03:07:27.848674',NULL,'APPT-75247838','ONLINE',NULL,NULL,NULL,NULL,NULL,NULL,'[Đặt cho bản thân] - Dịch vụ: Khám chuyên khoa Da liễu (Ban đầu) | Bác sĩ: BS. CKI VŨ MINH TUẤN | Nhận chỉ dẫn mỹ phẩm: Có','Em ngu quá bác sĩ ơi','BOOKED',606,NULL,NULL,106,NULL,NULL,301);
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_sessions` (
  `session_id` char(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_at` datetime(6) NOT NULL,
  `revocation_reason` enum('ACCOUNT_DISABLED','LOGOUT','PASSWORD_RESET') DEFAULT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `user_account_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`session_id`),
  KEY `FKpgr9yclmi5hih8kmo4qsxqi8l` (`user_account_id`),
  CONSTRAINT `FKpgr9yclmi5hih8kmo4qsxqi8l` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

LOCK TABLES `auth_sessions` WRITE;
/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
INSERT INTO `auth_sessions` (`session_id`, `created_at`, `expires_at`, `revocation_reason`, `revoked_at`, `user_account_id`) VALUES ('1115e009-1a58-4aa1-888b-b06992c88d9e','2026-11-03 04:17:19.856434','2026-11-04 11:17:19.816687','LOGOUT','2026-11-03 11:17:22.162762',106),('1f0168a0-e21c-4b4d-9a2f-7edfc29b450b','2026-11-03 02:03:39.874602','2026-11-04 09:03:39.865407','LOGOUT','2026-11-03 09:04:52.991099',103),('21e17a8f-f5a7-4603-b3a3-13a3542a5356','2026-11-03 02:01:15.821783','2026-11-04 09:01:15.815119',NULL,NULL,104),('29af10c3-cb2b-4636-aba8-8b65e7a1ef5a','2026-11-03 02:19:56.583333','2026-11-04 09:19:56.567700','LOGOUT','2026-11-03 10:05:32.922154',106),('2c3c4954-73bc-4dbd-88b2-53f1e56fe4c7','2026-11-03 04:18:30.551145','2026-11-04 11:18:30.531187','LOGOUT','2026-11-03 11:18:35.106423',103),('44ecb05a-1800-486b-900d-988c0236bf1c','2026-11-03 03:25:40.103034','2026-11-04 10:25:40.054021','LOGOUT','2026-11-03 10:27:20.278304',103),('4beef7a4-2041-4b5d-9b7d-69c6f4511f75','2026-11-03 04:18:23.985723','2026-11-04 11:18:23.968123','LOGOUT','2026-11-03 11:18:27.572256',106),('5a08fd75-2201-44d0-bab5-c07687e31096','2026-11-03 04:18:38.080130','2026-11-04 11:18:38.056736','LOGOUT','2026-11-03 11:24:45.469637',104),('5fb0d43a-c7ec-423b-b2b2-171bcea7f99c','2026-11-03 04:25:37.672663','2026-11-04 11:25:37.654912',NULL,NULL,106),('69a8d2ed-5544-4481-acef-cc71b84c5241','2026-11-03 02:33:46.806690','2026-11-04 09:33:46.791449',NULL,NULL,103),('85cd958e-8ec7-4d8c-bc42-891fb1f8c818','2026-11-03 03:05:36.518088','2026-11-04 10:05:36.455013','LOGOUT','2026-11-03 10:25:35.042504',106),('875d0ef7-804a-40dd-8951-c552aa1d84fa','2026-11-03 02:46:07.517858','2026-11-04 09:46:07.460151',NULL,NULL,106),('8ccab159-30fb-4c73-a9fb-00a7ab55d50e','2026-11-03 02:03:35.526930','2026-11-04 09:03:35.517478','LOGOUT','2026-11-03 09:03:38.027088',104),('8d07b7d8-3b8c-4840-8439-91a97586a9eb','2026-11-03 04:17:07.018673','2026-11-04 11:17:06.867774','LOGOUT','2026-11-03 11:17:12.429018',103),('8f3aa5d8-be49-4dd2-963b-ce4807a6da8a','2026-11-03 02:28:46.936652','2026-11-04 09:28:46.877962','LOGOUT','2026-11-03 09:33:44.721356',106),('91988255-c21d-496b-9d8f-60c854dd0d87','2026-11-03 02:03:24.658876','2026-11-04 09:03:24.607075','LOGOUT','2026-11-03 09:03:27.709564',106),('9b18f311-cbe0-46c0-94b4-92df0afde5ff','2026-11-03 02:03:29.495378','2026-11-04 09:03:29.487954','LOGOUT','2026-11-03 09:03:32.866369',103),('9cfeb74a-53c2-4ac5-bdb9-936e620d4c4a','2026-11-03 02:08:16.605892','2026-11-04 09:08:16.555210','LOGOUT','2026-11-03 09:19:53.667285',103),('d1df7dc6-925a-439e-97bb-ff6e52263a0d','2026-11-03 02:05:59.635321','2026-11-04 09:05:59.627237','LOGOUT','2026-11-03 09:06:03.715502',108),('d2e4677a-b725-44f2-8e53-cd5f92a68b16','2026-11-03 02:06:09.072038','2026-11-04 09:06:09.063914',NULL,NULL,106),('ff3e6679-5879-4319-ae4b-6f01d428ae42','2026-11-03 04:24:48.487889','2026-11-04 11:24:48.470824','LOGOUT','2026-11-03 11:25:34.474273',103);
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_profiles`
--

DROP TABLE IF EXISTS `doctor_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `doctor_profiles` (
  `doctor_id` bigint unsigned NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `biography` text,
  `is_active` bit(1) NOT NULL,
  `license_number` varchar(60) NOT NULL,
  `profile_image_url` varchar(1024) DEFAULT NULL,
  `qualification_summary` text,
  `specialization` varchar(150) NOT NULL,
  PRIMARY KEY (`doctor_id`),
  UNIQUE KEY `uq_t04_01` (`license_number`),
  CONSTRAINT `fk_t04_01` FOREIGN KEY (`doctor_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_profiles`
--

LOCK TABLES `doctor_profiles` WRITE;
/*!40000 ALTER TABLE `doctor_profiles` DISABLE KEYS */;
INSERT INTO `doctor_profiles` (`doctor_id`, `created_at`, `updated_at`, `biography`, `is_active`, `license_number`, `profile_image_url`, `qualification_summary`, `specialization`) VALUES (204,'2026-11-03 01:55:59.953617','2026-11-03 01:55:59.953617','Chuyên gia điều trị viêm da cơ địa, vảy nến, mụn trứng cá nặng và phục hồi màng bảo vệ da hư tổn.',0x01,'CCHN-DALIEU-001928','https://images.unsplash.com/photo-1622253692010-333f2da6031d','Bác sĩ Chuyên khoa II Da liễu, Nguyên giảng viên Đại học Y Dược','Da liễu tổng quát & Thẩm mỹ da');
/*!40000 ALTER TABLE `doctor_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encounter_diagnoses`
--

DROP TABLE IF EXISTS `encounter_diagnoses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encounter_diagnoses` (
  `encounter_diagnosis_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `diagnosis_code` varchar(30) DEFAULT NULL,
  `diagnosis_text` varchar(1000) NOT NULL,
  `is_primary` bit(1) NOT NULL,
  `primary_encounter_id` bigint unsigned DEFAULT NULL,
  `encounter_id` bigint unsigned NOT NULL,
  `recorded_by_doctor_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`encounter_diagnosis_id`),
  UNIQUE KEY `uq_t15_01` (`primary_encounter_id`),
  KEY `fk_t15_01` (`encounter_id`),
  KEY `fk_t15_02` (`recorded_by_doctor_id`),
  CONSTRAINT `fk_t15_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t15_02` FOREIGN KEY (`recorded_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encounter_diagnoses`
--

LOCK TABLES `encounter_diagnoses` WRITE;
/*!40000 ALTER TABLE `encounter_diagnoses` DISABLE KEYS */;
INSERT INTO `encounter_diagnoses` (`encounter_diagnosis_id`, `created_at`, `updated_at`, `diagnosis_code`, `diagnosis_text`, `is_primary`, `primary_encounter_id`, `encounter_id`, `recorded_by_doctor_id`) VALUES (5,'2026-11-03 04:20:58.578807','2026-11-03 04:24:25.714378',NULL,'Sức khỏe bình thường',0x01,NULL,16,204);
/*!40000 ALTER TABLE `encounter_diagnoses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `encounters`
--

DROP TABLE IF EXISTS `encounters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `encounters` (
  `encounter_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `chief_complaint` text,
  `clinical_findings` text,
  `clinical_notes` text,
  `completed_at` datetime(6) DEFAULT NULL,
  `started_at` datetime(6) NOT NULL,
  `status` enum('IN_PROGRESS','COMPLETED') NOT NULL,
  `symptoms` text,
  `appointment_id` bigint unsigned NOT NULL,
  `responsible_doctor_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`encounter_id`),
  UNIQUE KEY `uq_t14_01` (`appointment_id`),
  KEY `fk_t14_02` (`responsible_doctor_id`),
  CONSTRAINT `fk_t14_01` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`),
  CONSTRAINT `fk_t14_02` FOREIGN KEY (`responsible_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `encounters`
--

LOCK TABLES `encounters` WRITE;
/*!40000 ALTER TABLE `encounters` DISABLE KEYS */;
INSERT INTO `encounters` (`encounter_id`, `created_at`, `updated_at`, `chief_complaint`, `clinical_findings`, `clinical_notes`, `completed_at`, `started_at`, `status`, `symptoms`, `appointment_id`, `responsible_doctor_id`) VALUES (16,'2026-11-03 04:18:43.333113','2026-11-03 04:24:38.637233','đẹp trai quá','không bị gì cả',NULL,'2026-11-03 04:24:38.633671','2026-11-03 04:18:43.313871','COMPLETED','con mèo con',701,204);
/*!40000 ALTER TABLE `encounters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_up_requests`
--

DROP TABLE IF EXISTS `follow_up_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `follow_up_requests` (
  `follow_up_request_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `priority` enum('ROUTINE','URGENT') NOT NULL,
  `reason` text NOT NULL,
  `requested_from_date` date NOT NULL,
  `requested_to_date` date DEFAULT NULL,
  `encounter_id` bigint unsigned NOT NULL,
  `requested_by_doctor_id` bigint unsigned NOT NULL,
  `scheduled_appointment_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`follow_up_request_id`),
  UNIQUE KEY `uq_t17_01` (`scheduled_appointment_id`),
  KEY `fk_t17_01` (`encounter_id`),
  KEY `fk_t17_02` (`requested_by_doctor_id`),
  CONSTRAINT `fk_t17_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t17_02` FOREIGN KEY (`requested_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `fk_t17_03` FOREIGN KEY (`scheduled_appointment_id`) REFERENCES `appointments` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_up_requests`
--

LOCK TABLES `follow_up_requests` WRITE;
/*!40000 ALTER TABLE `follow_up_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `follow_up_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hospital_staff`
--

DROP TABLE IF EXISTS `hospital_staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hospital_staff` (
  `staff_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `address` varchar(500) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `employment_status` enum('ACTIVE','INACTIVE') NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER','UNSPECIFIED') NOT NULL,
  `hire_date` date DEFAULT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `staff_code` varchar(30) NOT NULL,
  `user_account_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`staff_id`),
  UNIQUE KEY `uq_t03_01` (`user_account_id`),
  UNIQUE KEY `uq_t03_02` (`staff_code`),
  CONSTRAINT `fk_t03_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=293 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hospital_staff`
--

LOCK TABLES `hospital_staff` WRITE;
/*!40000 ALTER TABLE `hospital_staff` DISABLE KEYS */;
INSERT INTO `hospital_staff` (`staff_id`, `created_at`, `updated_at`, `address`, `date_of_birth`, `employment_status`, `full_name`, `gender`, `hire_date`, `phone`, `staff_code`, `user_account_id`) VALUES (201,'2026-11-03 01:55:59.951141','2026-11-03 01:55:59.951141','Tòa nhà Hành chính Bệnh viện Da liễu DERMACARE','1985-05-15','ACTIVE','Nguyễn Văn Quản Trị','MALE','2020-01-01','0912345678','STF-ADM-001',101),(202,'2026-11-03 01:55:59.951141','2026-11-03 01:55:59.951141','Phòng Điều hành & Quản lý Chất lượng y tế','1988-08-20','ACTIVE','Trần Thị Giám Đốc','FEMALE','2021-03-15','0923456789','STF-MNG-001',102),(203,'2026-11-03 01:55:59.951141','2026-11-03 01:55:59.951141','Quầy Tiếp đón & Chăm sóc khách hàng sảnh A','1996-11-10','ACTIVE','Lê Thu Hà (Tiếp Tân)','FEMALE','2022-06-01','0934567890','STF-REC-001',103),(204,'2026-11-03 01:55:59.951141','2026-11-03 01:55:59.951141','Khoa Khám Da liễu & Thẩm mỹ Nội khoa','1980-04-12','ACTIVE','BSCKII. Vũ Minh Tuấn','MALE','2018-09-01','0945678901','STF-DOC-001',104),(205,'2026-11-03 01:55:59.951141','2026-11-03 01:55:59.951141','Khoa Cận lâm sàng & Xét nghiệm vi nấm Da liễu','1994-02-28','ACTIVE','KTV. Hoàng Văn Nghiệm','MALE','2023-01-10','0956789012','STF-LAB-001',105);
/*!40000 ALTER TABLE `hospital_staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `invoice_item_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `service_name_at_billing` varchar(180) NOT NULL,
  `unit_price_at_billing` decimal(12,2) NOT NULL,
  `invoice_id` bigint unsigned NOT NULL,
  `medical_service_request_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`invoice_item_id`),
  UNIQUE KEY `uq_t24_01` (`medical_service_request_id`),
  KEY `FK46ae0lhu1oqs7cv91fn6y9n7w` (`invoice_id`),
  CONSTRAINT `FK46ae0lhu1oqs7cv91fn6y9n7w` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`),
  CONSTRAINT `FKsr7se7kpl2b8qgkcceywla7m7` FOREIGN KEY (`medical_service_request_id`) REFERENCES `medical_service_requests` (`medical_service_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `invoice_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `document_status` enum('DRAFT','ISSUED','VOID') NOT NULL,
  `due_at` datetime(6) DEFAULT NULL,
  `invoice_number` varchar(40) NOT NULL,
  `issued_at` datetime(6) DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  `encounter_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `uq_t23_01` (`invoice_number`),
  KEY `FK1e83kn0p0wvhigpgp0e3y3vs9` (`encounter_id`),
  CONSTRAINT `FK1e83kn0p0wvhigpgp0e3y3vs9` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_service_requests`
--

DROP TABLE IF EXISTS `medical_service_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_service_requests` (
  `medical_service_request_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `accepted_at` datetime(6) DEFAULT NULL,
  `cancellation_reason` varchar(500) DEFAULT NULL,
  `cancelled_at` datetime(6) DEFAULT NULL,
  `clinical_indication` text,
  `completed_at` datetime(6) DEFAULT NULL,
  `priority` enum('ROUTINE','URGENT') NOT NULL,
  `request_code` varchar(40) NOT NULL,
  `requested_at` datetime(6) NOT NULL,
  `started_at` datetime(6) DEFAULT NULL,
  `status` enum('ACCEPTED','CANCELLED','COMPLETED','IN_PROGRESS','ORDERED','UNABLE_TO_PERFORM') NOT NULL,
  `unable_at` datetime(6) DEFAULT NULL,
  `unable_reason` text,
  `updated_at` datetime(6) NOT NULL,
  `encounter_id` bigint unsigned NOT NULL,
  `medical_service_id` bigint unsigned NOT NULL,
  `requesting_doctor_id` bigint unsigned NOT NULL,
  `responsible_staff_id` bigint unsigned DEFAULT NULL,
  `unable_recorded_by_staff_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`medical_service_request_id`),
  UNIQUE KEY `uq_t20_01` (`request_code`),
  KEY `FKqeqgnjskegx4jd8wcfy2hb5mf` (`encounter_id`),
  KEY `FK15ox7peyeh96xqih17f2o3oub` (`requesting_doctor_id`),
  KEY `FKjxsegpoq3ytea9sxt9c0jw9rh` (`medical_service_id`,`responsible_staff_id`),
  KEY `FK482rxnt5whjx1derkuv96unet` (`responsible_staff_id`),
  KEY `FKewd5x08axysrbm7utuvo14a4l` (`medical_service_id`,`unable_recorded_by_staff_id`),
  KEY `FKeh3x23d6unslec77jjt1umhd1` (`unable_recorded_by_staff_id`),
  CONSTRAINT `FK15ox7peyeh96xqih17f2o3oub` FOREIGN KEY (`requesting_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`),
  CONSTRAINT `FK482rxnt5whjx1derkuv96unet` FOREIGN KEY (`responsible_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FKdykl0rd348g58f8wj0rg3late` FOREIGN KEY (`medical_service_id`) REFERENCES `medical_services` (`medical_service_id`),
  CONSTRAINT `FKeh3x23d6unslec77jjt1umhd1` FOREIGN KEY (`unable_recorded_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FKewd5x08axysrbm7utuvo14a4l` FOREIGN KEY (`medical_service_id`, `unable_recorded_by_staff_id`) REFERENCES `staff_medical_services` (`medical_service_id`, `staff_id`),
  CONSTRAINT `FKjxsegpoq3ytea9sxt9c0jw9rh` FOREIGN KEY (`medical_service_id`, `responsible_staff_id`) REFERENCES `staff_medical_services` (`medical_service_id`, `staff_id`),
  CONSTRAINT `FKqeqgnjskegx4jd8wcfy2hb5mf` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_service_requests`
--

LOCK TABLES `medical_service_requests` WRITE;
/*!40000 ALTER TABLE `medical_service_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_service_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_service_results`
--

DROP TABLE IF EXISTS `medical_service_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_service_results` (
  `medical_service_result_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `attachment_url` varchar(1024) DEFAULT NULL,
  `finalized_at` datetime(6) NOT NULL,
  `result_content` longtext NOT NULL,
  `result_summary` text NOT NULL,
  `medical_service_request_id` bigint unsigned NOT NULL,
  `recorded_by_staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`medical_service_result_id`),
  UNIQUE KEY `uq_t21_01` (`medical_service_request_id`),
  KEY `FK9w9e38vsc00734pu8wsej99s5` (`recorded_by_staff_id`),
  CONSTRAINT `FK9w9e38vsc00734pu8wsej99s5` FOREIGN KEY (`recorded_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FKptrp146quidoip9xkuonq8g86` FOREIGN KEY (`medical_service_request_id`) REFERENCES `medical_service_requests` (`medical_service_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_service_results`
--

LOCK TABLES `medical_service_results` WRITE;
/*!40000 ALTER TABLE `medical_service_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `medical_service_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `medical_services`
--

DROP TABLE IF EXISTS `medical_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `medical_services` (
  `medical_service_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `is_active` bit(1) NOT NULL,
  `base_price` decimal(12,2) NOT NULL,
  `description` text,
  `estimated_duration_minutes` smallint unsigned DEFAULT NULL,
  `result_requirements` text,
  `service_code` varchar(30) NOT NULL,
  `service_name` varchar(180) NOT NULL,
  PRIMARY KEY (`medical_service_id`),
  UNIQUE KEY `uq_t18_01` (`service_code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `medical_services`
--

LOCK TABLES `medical_services` WRITE;
/*!40000 ALTER TABLE `medical_services` DISABLE KEYS */;
INSERT INTO `medical_services` (`medical_service_id`, `created_at`, `updated_at`, `is_active`, `base_price`, `description`, `estimated_duration_minutes`, `result_requirements`, `service_code`, `service_name`) VALUES (1,'2026-11-03 01:55:59.959014','2026-11-03 01:55:59.959014',0x01,280000.00,'Khám lâm sàng đánh giá thương tổn da, kê đơn hoặc chỉ định cận lâm sàng',20,'Phiếu chẩn đoán lâm sàng & phác đồ','SRV-EXAM-GEN','Khám chuyên khoa Da liễu (Ban đầu)'),(2,'2026-11-03 01:55:59.959014','2026-11-03 01:55:59.959014',0x01,350000.00,'Chụp phóng đại cấu trúc vi mạch, nang lông, sắc tố và tầm soát khối u da',15,'Hình ảnh Dermoscopy độ phân giải cao','SRV-SOIDAVITHE','Soi da vi thể quang học (Dermoscopy 3D)'),(3,'2026-11-03 01:55:59.959014','2026-11-03 01:55:59.959014',0x01,180000.00,'Cạo vảy thương tổn da hoặc bã nhờn nang lông soi kính hiển vi quang học',25,'Báo cáo định danh nấm / mật độ Demodex/cm2','SRV-XETNGHIEMNAM','Soi tươi tìm sợi nấm / Ký sinh trùng Demodex'),(4,'2026-11-03 01:55:59.959014','2026-11-03 01:55:59.959014',0x01,650000.00,'Thủ thuật thoa dung dịch acid hữu cơ tẩy tế bào chết và thông thoáng nang lông',45,'Biên bản thực hiện thủ thuật chăm sóc da','SRV-PEEL-AHA','Thay da sinh học AHA điều trị mụn & thâm'),(5,'2026-11-03 01:55:59.959014','2026-11-03 01:55:59.959014',0x01,150000.00,'Bắn vi điểm kích thích tăng sinh collagen tái tạo bề mặt da',60,'Hình ảnh trước và sau liệu trình','SRV-LASER-CO2','Laser CO2 Fractional trị sẹo rỗ');
/*!40000 ALTER TABLE `medical_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `password_reset_token_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `invalidated_at` datetime(6) DEFAULT NULL,
  `token_hash` binary(32) NOT NULL,
  `used_at` datetime(6) DEFAULT NULL,
  `user_account_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`password_reset_token_id`),
  UNIQUE KEY `uq_t28_01` (`token_hash`),
  KEY `FKd0j8se7q4aahsqkngfrcu1l1r` (`user_account_id`),
  CONSTRAINT `FKd0j8se7q4aahsqkngfrcu1l1r` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_feedback`
--

DROP TABLE IF EXISTS `patient_feedback`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_feedback` (
  `patient_feedback_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `content` text NOT NULL,
  `handling_note` text,
  `handling_status` enum('IN_PROGRESS','NEW','RESOLVED') NOT NULL,
  `handling_updated_at` datetime(6) DEFAULT NULL,
  `rating` tinyint unsigned NOT NULL,
  `appointment_id` bigint unsigned NOT NULL,
  `handled_by_staff_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`patient_feedback_id`),
  UNIQUE KEY `uq_t26_01` (`appointment_id`),
  KEY `FKbd6y9xe5hqy86gw7y6yk69i4s` (`handled_by_staff_id`),
  CONSTRAINT `FKbd6y9xe5hqy86gw7y6yk69i4s` FOREIGN KEY (`handled_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FKidp7jdjws95fgufvp00bnkaoe` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_feedback`
--

LOCK TABLES `patient_feedback` WRITE;
/*!40000 ALTER TABLE `patient_feedback` DISABLE KEYS */;
/*!40000 ALTER TABLE `patient_feedback` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patients`
--

DROP TABLE IF EXISTS `patients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patients` (
  `patient_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `address` varchar(500) DEFAULT NULL,
  `contact_email` varchar(254) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `emergency_contact_name` varchar(150) DEFAULT NULL,
  `emergency_contact_phone` varchar(25) DEFAULT NULL,
  `full_name` varchar(150) NOT NULL,
  `gender` enum('MALE','FEMALE','OTHER','UNSPECIFIED') NOT NULL,
  `patient_code` varchar(30) NOT NULL,
  `phone` varchar(25) DEFAULT NULL,
  `user_account_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`patient_id`),
  UNIQUE KEY `uq_t05_02` (`patient_code`),
  UNIQUE KEY `uq_t05_01` (`user_account_id`),
  CONSTRAINT `fk_t05_01` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=356 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patients`
--

LOCK TABLES `patients` WRITE;
/*!40000 ALTER TABLE `patients` DISABLE KEYS */;
INSERT INTO `patients` (`patient_id`, `created_at`, `updated_at`, `address`, `contact_email`, `date_of_birth`, `emergency_contact_name`, `emergency_contact_phone`, `full_name`, `gender`, `patient_code`, `phone`, `user_account_id`) VALUES (301,'2026-11-03 01:55:59.956230','2026-11-03 01:55:59.956230','152/4 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM','yen.nguyen@example.com','1998-03-24','Nguyễn Văn Hùng (Bố)','0903112233','Nguyễn Hoàng Yến','FEMALE','PAT-2026-0001','0987654321',106),(302,'2026-11-03 01:55:59.956230','2026-11-03 01:55:59.956230','45 Lê Hồng Phong, Phường 2, Quận 5, TP.HCM','hung.tran@example.com','1992-09-15','Trần Thị Mai (Vợ)','0908889999','Trần Mạnh Hùng','MALE','PAT-2026-0002','0978123456',107),(303,'2026-11-03 02:04:36.407218','2026-11-03 02:04:36.407218','dương nội hà đông hà nội',NULL,'2022-05-03',NULL,NULL,'Nguyễn Tuấn Nam','MALE','PT-856bab78533441549405aab2','0982699381',NULL),(304,'2026-11-03 02:05:12.208018','2026-11-03 02:05:54.064282','dương nội hà đông hà nội','emnam2k5@gmail.com','2005-02-11','nam nguyen','0982699382','nam nguyen','MALE','PT-a56fda5325be41aeaf0f7d43','0982699381',108);
/*!40000 ALTER TABLE `patients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `payment_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `amount` decimal(12,2) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `failure_reason` varchar(500) DEFAULT NULL,
  `initiated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `payment_reference` varchar(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `provider` varchar(40) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  `provider_transaction_id` varchar(150) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `status` enum('CANCELLED','FAILED','PENDING','SUCCEEDED') NOT NULL,
  `initiated_by_account_id` bigint unsigned NOT NULL,
  `invoice_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `uq_t25_01` (`payment_reference`),
  UNIQUE KEY `uq_t25_02` (`provider`,`provider_transaction_id`),
  KEY `FKa91h24692g5mgxarr9322tq8s` (`initiated_by_account_id`),
  KEY `FKrbqec6be74wab8iifh8g3i50i` (`invoice_id`),
  CONSTRAINT `FKa91h24692g5mgxarr9322tq8s` FOREIGN KEY (`initiated_by_account_id`) REFERENCES `user_accounts` (`user_account_id`),
  CONSTRAINT `FKrbqec6be74wab8iifh8g3i50i` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`)
) ENGINE=InnoDB AUTO_INCREMENT=811 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
INSERT INTO `payments` (`payment_id`, `amount`, `completed_at`, `failure_reason`, `initiated_at`, `payment_reference`, `provider`, `provider_transaction_id`, `status`, `initiated_by_account_id`, `invoice_id`) VALUES (801,280000.00,'2026-11-03 01:55:59.979431',NULL,'2026-11-03 01:55:59.979431','PAY-APPT-701','payOS','POS-TX-990011','SUCCEEDED',106,NULL),(802,280000.00,'2026-11-03 01:55:59.979431',NULL,'2026-11-03 01:55:59.979431','PAY-APPT-702','payOS','POS-TX-990022','SUCCEEDED',106,NULL),(803,280000.00,'2026-11-03 01:55:59.979431',NULL,'2026-11-03 01:55:59.979431','PAY-APPT-703','payOS','POS-TX-990033','SUCCEEDED',106,NULL),(804,280000.00,'2026-11-03 09:30:21.415854',NULL,'2026-11-03 02:30:09.198286','PAYOS-73009194','PAYOS','73009194','SUCCEEDED',106,NULL),(807,280000.00,'2026-11-03 10:07:45.356837',NULL,'2026-11-03 03:07:27.950134','PAYOS-75247939','PAYOS','75247939','SUCCEEDED',106,NULL);
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration_verifications`
--

DROP TABLE IF EXISTS `registration_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registration_verifications` (
  `user_account_id` bigint unsigned NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `failed_attempts` int unsigned NOT NULL,
  `last_sent_at` datetime(6) NOT NULL,
  `otp_hash` varchar(255) NOT NULL,
  `terms_accepted_at` datetime(6) NOT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`user_account_id`),
  CONSTRAINT `fk_registration_account` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration_verifications`
--

LOCK TABLES `registration_verifications` WRITE;
/*!40000 ALTER TABLE `registration_verifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `registration_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `role_id` tinyint unsigned NOT NULL,
  `role_code` varchar(32) NOT NULL,
  `role_name` varchar(80) NOT NULL,
  PRIMARY KEY (`role_id`),
  UNIQUE KEY `uq_t01_01` (`role_code`),
  CONSTRAINT `roles_chk_1` CHECK ((`role_code` in (_utf8mb4'ADMIN',_utf8mb4'MANAGER',_utf8mb4'DOCTOR',_utf8mb4'MEDICAL_SERVICE_STAFF',_utf8mb4'RECEPTIONIST',_utf8mb4'PATIENT')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` (`role_id`, `role_code`, `role_name`) VALUES (1,'ADMIN','Qu???n tr??? vi??n'),(2,'MANAGER','Qu???n l?? b???nh vi???n'),(3,'RECEPTIONIST','B??c s?? chuy??n khoa'),(4,'DOCTOR','Nh??n vi??n d???ch v??? y t???'),(5,'MEDICAL_SERVICE_STAFF','L??? t??n / Ti???p ????n'),(6,'PATIENT','B???nh nh??n');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule_change_requests`
--

DROP TABLE IF EXISTS `schedule_change_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_change_requests` (
  `schedule_change_request_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `based_on_version` int unsigned NOT NULL,
  `decision_note` text,
  `original_ends_at` datetime(6) NOT NULL,
  `original_starts_at` datetime(6) NOT NULL,
  `processed_at` datetime(6) DEFAULT NULL,
  `reason` text NOT NULL,
  `request_type` enum('LEAVE','RESCHEDULE') NOT NULL,
  `requested_ends_at` datetime(6) DEFAULT NULL,
  `requested_starts_at` datetime(6) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL,
  `submitted_at` datetime(6) NOT NULL,
  `processed_by_staff_id` bigint unsigned DEFAULT NULL,
  `requested_by_staff_id` bigint unsigned NOT NULL,
  `work_schedule_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`schedule_change_request_id`),
  KEY `fk_t09_03` (`processed_by_staff_id`),
  KEY `fk_t09_02` (`requested_by_staff_id`),
  KEY `fk_t09_01` (`work_schedule_id`),
  CONSTRAINT `fk_t09_01` FOREIGN KEY (`work_schedule_id`) REFERENCES `work_schedules` (`work_schedule_id`),
  CONSTRAINT `fk_t09_02` FOREIGN KEY (`requested_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t09_03` FOREIGN KEY (`processed_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_change_requests`
--

LOCK TABLES `schedule_change_requests` WRITE;
/*!40000 ALTER TABLE `schedule_change_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule_change_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule_events`
--

DROP TABLE IF EXISTS `schedule_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_events` (
  `schedule_event_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `blocks_booking` bit(1) NOT NULL,
  `description` text,
  `ends_at` datetime(6) NOT NULL,
  `starts_at` datetime(6) NOT NULL,
  `title` varchar(150) NOT NULL,
  `created_by_staff_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`schedule_event_id`),
  KEY `fk_t10_02` (`created_by_staff_id`),
  KEY `fk_t10_01` (`staff_id`),
  CONSTRAINT `fk_t10_01` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t10_02` FOREIGN KEY (`created_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_events`
--

LOCK TABLES `schedule_events` WRITE;
/*!40000 ALTER TABLE `schedule_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `service_result_reviews`
--

DROP TABLE IF EXISTS `service_result_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `service_result_reviews` (
  `service_result_review_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `handled_at` datetime(6) NOT NULL,
  `handling_decision` text NOT NULL,
  `medical_service_result_id` bigint unsigned NOT NULL,
  `reviewing_doctor_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`service_result_review_id`),
  UNIQUE KEY `uq_t22_01` (`medical_service_result_id`),
  KEY `FKriahrsobj6ot4jhu3dii4ajn2` (`reviewing_doctor_id`),
  CONSTRAINT `FKaaxrbtg0968ivj33oysjb7r5t` FOREIGN KEY (`medical_service_result_id`) REFERENCES `medical_service_results` (`medical_service_result_id`),
  CONSTRAINT `FKriahrsobj6ot4jhu3dii4ajn2` FOREIGN KEY (`reviewing_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `service_result_reviews`
--

LOCK TABLES `service_result_reviews` WRITE;
/*!40000 ALTER TABLE `service_result_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `service_result_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_templates`
--

DROP TABLE IF EXISTS `shift_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_templates` (
  `shift_template_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `end_day_offset` tinyint unsigned NOT NULL,
  `end_time` time NOT NULL,
  `is_active` bit(1) NOT NULL,
  `shift_code` varchar(30) NOT NULL,
  `shift_name` varchar(100) NOT NULL,
  `start_time` time NOT NULL,
  PRIMARY KEY (`shift_template_id`),
  UNIQUE KEY `uq_t06_01` (`shift_code`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_templates`
--

LOCK TABLES `shift_templates` WRITE;
/*!40000 ALTER TABLE `shift_templates` DISABLE KEYS */;
INSERT INTO `shift_templates` (`shift_template_id`, `created_at`, `updated_at`, `end_day_offset`, `end_time`, `is_active`, `shift_code`, `shift_name`, `start_time`) VALUES (1,'2026-11-03 01:55:59.965363','2026-11-03 01:55:59.965363',0,'12:00:00',0x01,'SHIFT-MORNING','Ca Sáng (08:00 - 12:00)','08:00:00'),(2,'2026-11-03 01:55:59.965363','2026-11-03 01:55:59.965363',0,'17:30:00',0x01,'SHIFT-AFTERNOON','Ca Chiều (13:30 - 17:30)','13:30:00');
/*!40000 ALTER TABLE `shift_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_medical_services`
--

DROP TABLE IF EXISTS `staff_medical_services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_medical_services` (
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `is_active` bit(1) NOT NULL,
  `assigned_by_staff_id` bigint unsigned NOT NULL,
  `medical_service_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`medical_service_id`,`staff_id`),
  KEY `FK2noov0trj7q2pxf20gbu1t5tj` (`assigned_by_staff_id`),
  KEY `FK7c6hioap0ct5327318a6votk1` (`staff_id`),
  CONSTRAINT `FK2noov0trj7q2pxf20gbu1t5tj` FOREIGN KEY (`assigned_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FK7c6hioap0ct5327318a6votk1` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `FKnxuy6x0xn2acet388dpk77pdy` FOREIGN KEY (`medical_service_id`) REFERENCES `medical_services` (`medical_service_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_medical_services`
--

LOCK TABLES `staff_medical_services` WRITE;
/*!40000 ALTER TABLE `staff_medical_services` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_medical_services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `treatment_decisions`
--

DROP TABLE IF EXISTS `treatment_decisions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `treatment_decisions` (
  `treatment_decision_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `decision_text` text NOT NULL,
  `follow_up_required` bit(1) NOT NULL,
  `instructions` text,
  `encounter_id` bigint unsigned NOT NULL,
  `recorded_by_doctor_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`treatment_decision_id`),
  UNIQUE KEY `uq_t16_01` (`encounter_id`),
  KEY `fk_t16_02` (`recorded_by_doctor_id`),
  CONSTRAINT `fk_t16_01` FOREIGN KEY (`encounter_id`) REFERENCES `encounters` (`encounter_id`),
  CONSTRAINT `fk_t16_02` FOREIGN KEY (`recorded_by_doctor_id`) REFERENCES `doctor_profiles` (`doctor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `treatment_decisions`
--

LOCK TABLES `treatment_decisions` WRITE;
/*!40000 ALTER TABLE `treatment_decisions` DISABLE KEYS */;
INSERT INTO `treatment_decisions` (`treatment_decision_id`, `created_at`, `updated_at`, `decision_text`, `follow_up_required`, `instructions`, `encounter_id`, `recorded_by_doctor_id`) VALUES (5,'2026-11-03 04:24:34.449270','2026-11-03 04:24:34.449270','Không bị sao cả',0x00,NULL,16,204);
/*!40000 ALTER TABLE `treatment_decisions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_accounts`
--

DROP TABLE IF EXISTS `user_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_accounts` (
  `user_account_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `login_email` varchar(254) NOT NULL,
  `password_changed_at` datetime(6) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('ACTIVE','INACTIVE') NOT NULL,
  `username` varchar(60) NOT NULL,
  `role_id` tinyint unsigned NOT NULL,
  PRIMARY KEY (`user_account_id`),
  UNIQUE KEY `uq_t02_01` (`username`),
  UNIQUE KEY `uq_t02_02` (`login_email`),
  KEY `fk_t02_01` (`role_id`),
  CONSTRAINT `fk_t02_01` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`)
) ENGINE=InnoDB AUTO_INCREMENT=242 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_accounts`
--

LOCK TABLES `user_accounts` WRITE;
/*!40000 ALTER TABLE `user_accounts` DISABLE KEYS */;
INSERT INTO `user_accounts` (`user_account_id`, `created_at`, `updated_at`, `login_email`, `password_changed_at`, `password_hash`, `status`, `username`, `role_id`) VALUES (101,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','admin@hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','admin',1),(102,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','manager@hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','manager',2),(103,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','receptionist@hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','receptionist',3),(104,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','doctor@hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','doctor',4),(105,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','lab@dermacare.hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','servicestaff',5),(106,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','patient@hospital.vn',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','patient',6),(107,'2026-11-03 01:55:59.948279','2026-11-03 04:14:55.360701','hung.tran@example.com',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','patient02',6),(108,'2026-11-03 02:05:12.204584','2026-11-03 04:14:55.360701','emnam2k5@gmail.com',NULL,'$2a$10$1ESQsz5IwHnsHmOb8MEVgudoDo9GhDAeyTALlYjChTvPUiQAS6btu','ACTIVE','Nam',6);
/*!40000 ALTER TABLE `user_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_schedules`
--

DROP TABLE IF EXISTS `work_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_schedules` (
  `work_schedule_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `ends_at` datetime(6) NOT NULL,
  `note` varchar(500) DEFAULT NULL,
  `row_version` int unsigned NOT NULL,
  `starts_at` datetime(6) NOT NULL,
  `status` enum('SCHEDULED','CANCELLED') NOT NULL,
  `assigned_by_staff_id` bigint unsigned NOT NULL,
  `shift_template_id` bigint unsigned NOT NULL,
  `staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`work_schedule_id`),
  KEY `fk_t07_03` (`assigned_by_staff_id`),
  KEY `fk_t07_02` (`shift_template_id`),
  KEY `fk_t07_01` (`staff_id`),
  CONSTRAINT `fk_t07_01` FOREIGN KEY (`staff_id`) REFERENCES `hospital_staff` (`staff_id`),
  CONSTRAINT `fk_t07_02` FOREIGN KEY (`shift_template_id`) REFERENCES `shift_templates` (`shift_template_id`),
  CONSTRAINT `fk_t07_03` FOREIGN KEY (`assigned_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB AUTO_INCREMENT=550 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_schedules`
--

LOCK TABLES `work_schedules` WRITE;
/*!40000 ALTER TABLE `work_schedules` DISABLE KEYS */;
INSERT INTO `work_schedules` (`work_schedule_id`, `created_at`, `updated_at`, `ends_at`, `note`, `row_version`, `starts_at`, `status`, `assigned_by_staff_id`, `shift_template_id`, `staff_id`) VALUES (501,'2026-11-03 01:55:59.967711','2026-11-03 01:55:59.967711','2026-11-03 12:00:00.000000','Ca khám sáng thường quy hôm nay',0,'2026-11-03 08:00:00.000000','SCHEDULED',202,1,204),(502,'2026-11-03 01:55:59.967711','2026-11-03 01:55:59.967711','2026-11-03 17:30:00.000000','Ca khám chiều thường quy hôm nay',0,'2026-11-03 13:30:00.000000','SCHEDULED',202,2,204),(503,'2026-11-03 01:55:59.967711','2026-11-03 01:55:59.967711','2026-11-04 12:00:00.000000','Ca khám sáng ngày mai (+24h để test Đổi/Hủy)',0,'2026-11-04 08:00:00.000000','SCHEDULED',202,1,204);
/*!40000 ALTER TABLE `work_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `work_time_policies`
--

DROP TABLE IF EXISTS `work_time_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `work_time_policies` (
  `work_time_policy_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) NOT NULL,
  `max_daily_work_minutes` smallint unsigned NOT NULL,
  `max_weekly_work_minutes` smallint unsigned NOT NULL,
  `min_rest_minutes` smallint unsigned NOT NULL,
  `schedule_change_notice_days` smallint unsigned NOT NULL,
  `role_id` tinyint unsigned NOT NULL,
  `updated_by_staff_id` bigint unsigned NOT NULL,
  PRIMARY KEY (`work_time_policy_id`),
  UNIQUE KEY `uq_t08_01` (`role_id`),
  KEY `fk_t08_02` (`updated_by_staff_id`),
  CONSTRAINT `fk_t08_01` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`),
  CONSTRAINT `fk_t08_02` FOREIGN KEY (`updated_by_staff_id`) REFERENCES `hospital_staff` (`staff_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `work_time_policies`
--

LOCK TABLES `work_time_policies` WRITE;
/*!40000 ALTER TABLE `work_time_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `work_time_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'hospital_management'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-03  4:31:31
