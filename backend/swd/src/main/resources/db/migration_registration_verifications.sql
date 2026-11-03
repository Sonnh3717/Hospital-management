-- ====================================================================================================
-- DDL MIGRATION: registration_verifications
-- Project: Hospital Management System Showcase (Milestone 1)
-- Database: hospital_management (MySQL 8.0+)
-- Entity: com.example.swd.entity.identity.RegistrationVerification
-- ====================================================================================================

SET NAMES utf8mb4 COLLATE utf8mb4_0900_ai_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS `registration_verifications` (
  `user_account_id` BIGINT UNSIGNED NOT NULL COMMENT 'Khóa chính đồng thời là khóa ngoại liên kết user_accounts.',
  `otp_hash` VARCHAR(255) NOT NULL COMMENT 'BCrypt hash của mã OTP 6 chữ số gửi qua email.',
  `expires_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm mã OTP hết hạn, UTC.',
  `last_sent_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm gửi mã OTP gần nhất, UTC.',
  `failed_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Số lần xác thực thất bại liên tiếp; ngưỡng khóa là 5 lần.',
  `verified_at` DATETIME(6) NULL COMMENT 'Thời điểm xác thực OTP thành công; NULL khi đang chờ xác thực.',
  `terms_accepted_at` DATETIME(6) NOT NULL COMMENT 'Thời điểm người dùng chấp thuận điều khoản đăng ký, UTC.',
  PRIMARY KEY (`user_account_id`),
  KEY `ix_reg_verif_verified` (`verified_at`, `expires_at`),
  CONSTRAINT `fk_registration_account` FOREIGN KEY (`user_account_id`) REFERENCES `user_accounts` (`user_account_id`) ON DELETE CASCADE,
  CONSTRAINT `ck_reg_verif_attempts` CHECK (`failed_attempts` >= 0),
  CONSTRAINT `ck_reg_verif_expires` CHECK (`expires_at` >= `last_sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Lưu trữ và quản lý phiên xác thực OTP email khi bệnh nhân tự đăng ký tài khoản';
