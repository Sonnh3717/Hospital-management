# CƠ SỞ DỮ LIỆU, MIGRATION VÀ SCHEMA
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System)

---

## 📌 Tổng quan kiến trúc Database

Hệ thống sử dụng cơ sở dữ liệu quan hệ **MySQL 8.0+** chuẩn hóa 28 bảng. Để đáp ứng các yêu cầu nghiệp vụ mới về:
1. Xác thực OTP email qua dịch vụ SMTP bảo mật.
2. Quy trình đăng ký bệnh nhân 2 bước (phân chia trường bắt buộc vs tùy chọn).
3. Dữ liệu mẫu (Seed Data) chuẩn mực phục vụ showcase đồ án môn học.

Hai kịch bản SQL đã được bổ sung vào thư mục `backend/swd/src/main/resources/db/`:
- `migration_registration_verifications.sql`: Khởi tạo bảng lưu trữ phiên xác thực mã OTP.
- `showcase_demo_seed.sql`: Nạp dữ liệu mẫu có tính lũy quyền (idempotent), hỗ trợ đăng nhập kiểm thử tức thì.

---

## 🏗️ 1. Bảng `registration_verifications` (Migration DDL)

- **File**: `backend/swd/src/main/resources/db/migration_registration_verifications.sql`
- **Entity Java tương ứng**: `com.example.swd.entity.identity.RegistrationVerification`
- **Mục đích**: Lưu trữ và kiểm soát phiên gửi, xác thực mã OTP qua email cho quy trình đăng ký 2 bước. Đảm bảo mã OTP được hash bằng BCrypt, chống tấn công dò mã (Brute-force) và tự động dọn dẹp sau khi tài khoản kích hoạt.

### Cấu trúc chi tiết các cột:

| Tên cột (Column) | Kiểu dữ liệu | Nullable | Mô tả & Ràng buộc |
| :--- | :--- | :---: | :--- |
| `user_account_id` | `BIGINT UNSIGNED` | **NO** | **Khóa chính (PK)**, đồng thời là **Khóa ngoại (FK)** trỏ đến `user_accounts(user_account_id)` với `ON DELETE CASCADE`. |
| `otp_hash` | `VARCHAR(255)` | **NO** | Chuỗi băm BCrypt của mã OTP 6 chữ số gửi qua email SMTP (không lưu plain-text). |
| `expires_at` | `DATETIME(6)` | **NO** | Thời điểm mã OTP hết hạn (mặc định 10 phút sau khi phát hành), múi giờ UTC. |
| `last_sent_at` | `DATETIME(6)` | **NO** | Thời điểm gửi mã OTP gần nhất, dùng để áp dụng bộ đếm cooldown 60 giây. |
| `failed_attempts` | `INT UNSIGNED` | **NO** | Số lần nhập sai mã OTP liên tiếp (ngưỡng tối đa 5 lần trước khi khóa). Mặc định `0`. |
| `verified_at` | `DATETIME(6)` | YES | Thời điểm xác thực OTP thành công. Ban đầu là `NULL`; chỉ khi trường này có giá trị thì người dùng mới được qua Bước 2. |
| `terms_accepted_at` | `DATETIME(6)` | **NO** | Thời điểm người dùng tích chọn chấp thuận điều khoản đăng ký hệ thống. |

### Các chỉ mục & Ràng buộc kiểm tra (Constraints):
- **Index**: `KEY ix_reg_verif_verified (verified_at, expires_at)`: Tối ưu hóa truy vấn kiểm tra trạng thái xác thực còn hạn.
- **Check Constraint**: `CONSTRAINT ck_reg_verif_attempts CHECK (failed_attempts >= 0)`
- **Check Constraint**: `CONSTRAINT ck_reg_verif_expires CHECK (expires_at >= last_sent_at)`

---

## 📋 2. Đặc tả Bảng `patient` (Quy định Required vs Optional)

Theo đúng yêu cầu nghiệp vụ của đồ án, bảng `patient` trong form đăng ký bước 2 và quản lý của lễ tân được phân định chặt chẽ:

### A. Thông tin của chính Bệnh nhân (BẮT BUỘC - REQUIRED)
Các trường này bắt buộc người dùng phải cung cấp đầy đủ khi hoàn tất đăng ký Bước 2 và khi Lễ tân tạo hồ sơ bệnh nhân:

| Tên trường (Java / DB) | Kiểu dữ liệu | Ràng buộc kiểm tra (Validation Rules) |
| :--- | :--- | :--- |
| **`fullName`** / `full_name` | `VARCHAR(150)` | `@NotBlank`, Tối đa 150 ký tự. Không được để trống. |
| **`dateOfBirth`** / `date_of_birth` | `DATE` | `@NotNull`, `@PastOrPresent`. Ngày sinh trong quá khứ hoặc hiện tại. |
| **`gender`** / `gender` | `ENUM` | `@NotNull`. Nhận một trong các giá trị: `MALE`, `FEMALE`, `OTHER`. |
| **`phone`** / `phone` | `VARCHAR(25)` | `@NotBlank`, Regex `^(0\|\+84)[0-9]{9,10}$`. Số điện thoại Việt Nam hợp lệ (10-11 số). |
| **`address`** / `address` | `VARCHAR(500)` | `@NotBlank`, Tối đa 500 ký tự. Địa chỉ cư trú của bệnh nhân. |

### B. Thông tin của người khác / Người liên hệ khẩn cấp (TÙY CHỌN - OPTIONAL)
Các trường này người dùng có thể bỏ trống nếu không có người đi kèm hoặc người giám hộ:

| Tên trường (Java / DB) | Kiểu dữ liệu | Ràng buộc kiểm tra (Validation Rules) |
| :--- | :--- | :--- |
| **`emergencyContactName`** / `emergency_contact_name` | `VARCHAR(150)` | `@Size(max = 150)`. Cho phép `null` hoặc chuỗi rỗng. |
| **`emergencyContactPhone`** / `emergency_contact_phone` | `VARCHAR(25)` | Regex `^$\|^(0\|\+84)[0-9]{9,10}$`. Nếu nhập thì phải đúng định dạng SĐT. |
| **`contactEmail`** / `contact_email` | `VARCHAR(254)` | `@Email`, Cho phép `null`. Mặc định đồng bộ từ email tài khoản Bước 1. |

---

## 👤 3. Bảng `user_accounts` và Phân quyền vai trò

Hỗ trợ đăng nhập đa vai trò và xác thực người dùng:
- `user_account_id`: Khóa chính tự tăng (BIGINT).
- `role_id`: Khóa ngoại trỏ đến bảng `roles` (1 = ADMIN, 2 = MANAGER, 3 = DOCTOR, 5 = RECEPTIONIST, 6 = PATIENT).
- `username`: Tên đăng nhập duy nhất (VARCHAR 60, không dấu, alphanumeric).
- `login_email`: Địa chỉ email đăng nhập duy nhất (VARCHAR 254).
- `password_hash`: Chuỗi băm BCrypt của mật khẩu.
- `status`: Trạng thái tài khoản (`PENDING_VERIFICATION`, `ACTIVE`, `INACTIVE`).
  - *Lưu ý*: Chỉ tài khoản `ACTIVE` mới được phép đăng nhập. Khi Lễ tân deactive một bệnh nhân, trạng thái chuyển sang `INACTIVE` và bộ lọc Spring Security sẽ chặn ngay lập tức.

---

## 🧪 4. Dữ liệu mẫu (Seed Data) cho buổi Showcase

- **File**: `backend/swd/src/main/resources/db/showcase_demo_seed.sql`
- **Đặc tính**: Tự kiểm tra nếu chưa có thì nạp (Idempotent - `ON DUPLICATE KEY UPDATE` / `NOT EXISTS`).
- **Mật khẩu dùng chung cho các tài khoản demo**: `Password123!`
- **BCrypt Hash**: `$2a$10$d8r7mN7KjZq0mE1bO5yI1uQv3z9dM.P1vVzVzG8z6r3vUv9uX4qG`

### Danh sách tài khoản mẫu có sẵn trong hệ thống:

```
1. Tài khoản Bệnh nhân (Patient):
   - Username: patient
   - Email: patient.demo@hospital.test (hoặc patient@hospital.vn)
   - Password: Password123!
   - Trạng thái: ACTIVE
   - Hồ sơ: Nguyễn Văn Bệnh Nhân, Nam, sinh năm 1995, có sẵn 3 lịch hẹn mẫu với các trạng thái khác nhau.

2. Tài khoản Lễ tân (Receptionist):
   - Username: receptionist
   - Email: receptionist.demo@hospital.test (hoặc receptionist@hospital.vn)
   - Password: Password123!
   - Trạng thái: ACTIVE
   - Nhân viên tiếp đón tại Sảnh Tầng 1, toàn quyền quản lý tiếp đón và bệnh nhân.

3. Tài khoản Bác sĩ (Doctor):
   - Username: doctor
   - Email: doctor.demo@hospital.test (hoặc doctor@hospital.vn)
   - Password: Password123!
   - Trạng thái: ACTIVE
   - Chức danh: Bác sĩ CKI Tim Mạch Can Thiệp.

4. Tài khoản Quản trị viên (Admin):
   - Username: admin
   - Email: admin.demo@hospital.test (hoặc admin@hospital.vn)
   - Password: Password123!
   - Trạng thái: ACTIVE
```

### Các dữ liệu phụ trợ được khởi tạo tự động:
- **Khung giờ khám (Appointment Slots)**: Các ca khám phân bổ sáng (08:00 - 11:30) và chiều (13:30 - 17:00) cho ngày hôm nay và ngày mai để phục vụ tính năng đặt lại lịch hẹn (reschedule).
- **Phòng khám & Chuyên khoa**: Chuyên khoa Nội tổng quát, Tim mạch, Nhi khoa, Cơ xương khớp.
