# BỘ KIỂM THỬ VÀ KẾT QUẢ NGHIỆM THU HỆ THỐNG
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System)

---

## 📌 Tổng quan độ bao phủ kiểm thử (Test Coverage)

Toàn bộ các tính năng đã được kiểm thử tự động đa tầng với tỷ lệ thành công 100%:
- **Backend Unit & Integration Tests**: 117/117 bài test vượt qua (100% BUILD SUCCESS).
- **E2E Showcase Integration Suite (Tiers 1–4)**: 46/46 bài test vượt qua (100% PASS).
- **Tier 5 Adversarial Coverage Hardening**: 23/23 bài test đối kháng bảo mật vượt qua (100% PASS).
- **Frontend Production Build**: `npm run build` thành công sạch sẽ (0 lỗi, 0 cảnh báo).

---

## ☕ 1. Backend Test Suites (117 Tests)

Các file kiểm thử tự động đặt tại thư mục `backend/swd/src/test/java/com/example/swd/`:

| File kiểm thử (Test File) | Số test | Phạm vi kiểm tra |
| :--- | :---: | :--- |
| `ChallengerPatientRegistrationServiceTest.java` | 24 | Kiểm tra toàn diện luồng OTP email, mã băm BCrypt, thời gian hết hạn, bộ đếm sai 5 lần, và chống ghi đè hồ sơ bệnh nhân. |
| `ChallengerReceptionPatientServiceTest.java` | 18 | Kiểm tra phân quyền Lễ tân, tìm kiếm JPA Specification, tạo bệnh nhân, sửa thông tin và Active/Deactivate. |
| `ChallengerWebValidationAndSecurityTest.java` | 21 | Kiểm tra các annotation `@Valid`, định dạng SĐT Việt Nam, email, độ dài chuỗi, và kiểm tra phân quyền Spring Security. |
| `SessionAuthenticationFilterTest.java` | 12 | Kiểm tra bóc tách Bearer token, xử lý `SecurityContextHolder`, và chặn người dùng có trạng thái `INACTIVE`. |
| `AppointmentAvailableSlotsTest.java` | 8 | Kiểm tra logic tính toán khung giờ khám còn chỗ theo ngày và theo bác sĩ. |
| `AppointmentLifecycleChallengerTest.java` | 19 | Kiểm tra vòng đời lịch hẹn: Tạo mới -> Check-in -> Khám lâm sàng -> Hủy (ràng buộc 24h) -> Đổi lịch (reschedule). |
| `ReceptionAppointmentServiceStaffResolutionTest.java` | 15 | Kiểm tra tính an toàn của `StaffPrincipal`, đảm bảo các thao tác lễ tân không bị lỗi NullPointer. |

### Lệnh chạy kiểm thử Backend:
```powershell
cd backend/swd
.\mvnw.cmd test "-Dtest=Challenger*,Reception*,AppointmentLifecycle*,AppointmentAvailableSlots*,PatientRegistration*,RegistrationEmail*,SessionAuth*,PatientController*" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
```
**Kết quả**: `Tests run: 117, Failures: 0, Errors: 0, Skipped: 0` ➡️ **BUILD SUCCESS**.

---

## 🧪 2. E2E Showcase Test Suite (46 Tests)

- **File thực thi**: `tests/e2e_showcase_suite.mjs`
- **Kết quả lưu tại**: `tests/test-results.json`
- **Lệnh chạy**:
  ```powershell
  node tests/e2e_showcase_suite.mjs
  ```

### Danh mục 4 tầng kiểm thử:

#### Tầng 1: Feature Coverage (R1 đến R6)
- [x] R1.1: Truy cập trang chủ hiển thị đầy đủ Hero banner, số liệu thống kê y tế và danh mục chuyên khoa.
- [x] R1.2: Topbar hiển thị đúng liên kết Đăng nhập (`#nav-btn-login`) và Đăng ký (`#nav-btn-register`).
- [x] R2.1: Đăng ký Bước 1 gửi mã OTP 6 số qua dịch vụ email SMTP.
- [x] R2.2: Chặn không cho sang Bước 2 nếu chưa xác thực OTP thành công.
- [x] R2.3: Điền Bước 2 kiểm tra tính bắt buộc của thông tin bệnh nhân và tùy chọn của người liên hệ khẩn cấp.
- [x] R3.1: Đăng nhập thành công bằng Username cho 3 vai trò (Patient, Receptionist, Doctor).
- [x] R3.2: Đăng nhập thành công bằng Email cho 3 vai trò.
- [x] R3.3: Màn hình đăng nhập có liên kết "Quên mật khẩu" (`href="#"`) mở modal hướng dẫn hỗ trợ.
- [x] R4.1: Bệnh nhân xem danh sách lịch hẹn của chính mình.
- [x] R4.2: Bệnh nhân hủy cuộc hẹn tuân thủ quy tắc báo trước 24 giờ.
- [x] R4.3: Bệnh nhân đổi lịch hẹn sang khung giờ khả dụng.
- [x] R5.1: Lễ tân tìm kiếm và lọc danh sách lịch hẹn toàn viện.
- [x] R5.2: Lễ tân thực hiện Check-in lịch hẹn tại quầy và hoàn tác check-in.
- [x] R5.3: Lễ tân thực hiện CRUD bệnh nhân và chuyển đổi trạng thái Active/Deactivate.
- [x] R6.1: Bác sĩ đăng nhập vào màn hình làm việc riêng hiển thị banner chào mừng cá nhân hóa.

#### Tầng 2: Boundary & Corner Cases
- [x] Thử nghiệm nhập sai mã OTP 5 lần liên tiếp.
- [x] Thử nghiệm hủy lịch hẹn khi chỉ còn 2 giờ trước khám ➡️ Bị từ chối theo quy định 24h.
- [x] Thử nghiệm đăng ký với ngày sinh ở tương lai ➡️ Bị chặn bởi `@PastOrPresent`.
- [x] Thử nghiệm đăng ký với số điện thoại sai định dạng.

#### Tầng 3: Cross-Feature Journeys (Hành trình người dùng xuyên suốt)
- [x] Luồng liên thông hoàn chỉnh: Người dùng mới vào Landing Page ➡️ Đăng ký nhận OTP qua email ➡️ Xác thực OTP ➡️ Điền hồ sơ bệnh nhân ➡️ Đăng nhập bằng tài khoản mới ➡️ Vào Patient Portal ➡️ Lễ tân tìm thấy hồ sơ bệnh nhân này trong danh sách quản lý.

#### Tầng 4: Real-World Resilience
- [x] Kiểm tra tải đồng thời nhiều phiên đăng nhập.
- [x] Khả năng khôi phục sau khi token hết hạn (tự động điều hướng về màn hình đăng nhập).

---

## 🛡️ 3. Tier 5 Adversarial Coverage Hardening (23 Tests)

- **File thực thi**: `tests/tier5_adversarial_coverage.mjs`
- **Lệnh chạy**:
  ```powershell
  node tests/tier5_adversarial_coverage.mjs
  ```
- **Nội dung kiểm tra an ninh & bảo mật**:
  - Chống tấn công **IDOR**: Bệnh nhân A không thể truy vấn lịch hẹn của Bệnh nhân B bằng cách thay đổi ID trên URL.
  - Chống giả mạo mã OTP (Token Tampering).
  - Khóa tài khoản tức thì: Bệnh nhân bị Lễ tân chuyển sang `INACTIVE` thì mọi request sau đó đều bị Spring Security từ chối ngay lập tức (`403 Forbidden`).
  - Dọn dẹp mã OTP: Token OTP tự động bị hủy vĩnh viễn sau khi hoàn tất hồ sơ, ngăn chặn việc sử dụng lại token cũ.

---

## ⚛️ 4. Kiểm tra Build Production Frontend

- **Lệnh thực thi**:
  ```powershell
  cd frontend
  npm run build
  ```
- **Kết quả biên dịch**:
  ```
  vite v5.4.14 building for production...
  ✓ 97 modules transformed.
  dist/index.html                   0.82 kB │ gzip:  0.44 kB
  dist/assets/index-D2x8J87g.css   24.18 kB │ gzip:  5.12 kB
  dist/assets/index-BLnQ8qKz.js   288.64 kB │ gzip: 89.20 kB
  ✓ built in 420ms
  ```
  ➡️ **Exit code: 0**, không có lỗi TypeScript/ESLint hay lỗi bundle nào.
