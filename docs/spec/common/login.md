# Đặc Tả Tính Năng: Đăng Nhập (Login)

## 1. Thông Tin Chung
- **Mã Use Case**: UC01 - Sign In
- **Tác Nhân (Actors)**:
  - Khách (Guest) / Người dùng chưa xác thực
  - Tất cả các vai trò nội bộ & bệnh nhân: Patient, Receptionist, Doctor, Medical Service Staff, Manager, Admin.
- **Mô Tả**:
  Người dùng cung cấp thông tin định danh (Username/Email/Số điện thoại) và mật khẩu để xác thực vào hệ thống. Hệ thống kiểm tra thông tin, cấp quyền tương ứng với vai trò (Role-based Access Control) và trả về phiên làm việc hợp lệ (JWT Token / Session Cookie), sau đó điều hướng người dùng đến trang chủ/bảng điều khiển tương ứng.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng có tài khoản đã được kích hoạt trong hệ thống (`is_active = true` trong bảng `user_accounts`).
  - Người dùng hiện tại chưa đăng nhập hoặc phiên làm việc trước đó đã hết hạn.
- **Hậu điều kiện (Postconditions)**:
  - Nếu thành công: Một phiên làm việc mới được tạo (`auth_sessions`), hệ thống trả về JWT Token (hoặc HttpOnly Cookie), cập nhật `last_login_at`, và người dùng được chuyển hướng vào giao diện phù hợp với Role.
  - Nếu thất bại: Hệ thống ghi nhận số lần thất bại (nếu có cơ chế khóa tài khoản), trả về thông báo lỗi chung chung để bảo mật, không tạo phiên làm việc mới.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-42**: Đăng nhập yêu cầu thông tin xác thực hợp lệ và tài khoản được phép truy cập hệ thống. Đăng nhập thành công chỉ cấp các quyền được gán cho tài khoản đó.
- **BR-88**: Định danh đăng nhập (Username / Email / Số điện thoại) phải là duy nhất trong toàn hệ thống.
- **Bảo mật mật khẩu**: Mật khẩu lưu trữ trong CSDL phải được băm an toàn bằng thuật toán `BCrypt`. Không bao giờ trả về trường `password_hash` trong bất kỳ response nào.
- **Phân luồng chuyển hướng sau đăng nhập**:
  - `PATIENT` -> `/portal` hoặc `/my-appointments` (Trang cá nhân của bệnh nhân)
  - `RECEPTIONIST` -> `/reception/queue` hoặc `/reception/appointments` (Bàn tiếp đón)
  - `DOCTOR` -> `/doctor/worklist` (Danh sách bệnh nhân ca khám)
  - `MEDICAL_SERVICE_STAFF` -> `/services/queue` (Hàng đợi thực hiện dịch vụ y tế)
  - `MANAGER` -> `/manager/dashboard` (Báo cáo & điều phối ca)
  - `ADMIN` -> `/admin/users` (Quản trị hệ thống)

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Người dùng truy cập trang Đăng nhập (`/login`).
2. Giao diện hiển thị form nhập: Tên đăng nhập (Username/Email) và Mật khẩu.
3. Người dùng nhập thông tin và nhấn nút "Đăng nhập".
4. Frontend validate sơ bộ: Các trường không được để trống.
5. Frontend gửi request `POST /api/v1/auth/login` kèm payload đến Backend Spring Boot.
6. Backend tìm kiếm tài khoản theo `identifier` trong bảng `user_accounts`.
7. Backend kiểm tra tài khoản:
   - Tài khoản có tồn tại không.
   - Tài khoản có đang hoạt động không (`is_active == true`).
   - Mật khẩu nhập vào có khớp với `password_hash` qua `PasswordEncoder.matches()` không.
8. Backend tạo bản ghi phiên đăng nhập mới trong `auth_sessions`:
   - `token_id`, `user_id`, `created_at`, `expires_at`, `ip_address`, `user_agent`.
9. Backend tạo JWT Access Token (kèm Refresh Token nếu có), đóng gói thông tin người dùng (`userId`, `username`, `fullName`, `roles`) và trả về HTTP 200 OK.
10. Frontend lưu trữ thông tin xác thực (Token vào Cookie HttpOnly hoặc AuthContext trong bộ nhớ), hiển thị thông báo thành công.
11. Hệ thống tự động chuyển hướng người dùng đến Dashboard tương ứng với vai trò của họ.

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **4.a. Bỏ trống trường bắt buộc**:
  - Người dùng để trống Username hoặc Password.
  - Hệ thống hiển thị cảnh báo đỏ ngay dưới input: *"Vui lòng nhập tên đăng nhập/mật khẩu."* (Không gửi request lên server).
- **7.a. Thông tin đăng nhập không chính xác (Sai Username hoặc Sai Mật khẩu)**:
  - Backend trả về mã lỗi HTTP 401 Unauthorized kèm thông báo: *"Tên đăng nhập hoặc mật khẩu không chính xác."*
  - Frontend hiển thị thông báo lỗi lên màn hình để người dùng nhập lại.
- **7.b. Tài khoản bị khóa / vô hiệu hóa**:
  - `is_active == false`.
  - Backend trả về HTTP 403 Forbidden kèm thông báo: *"Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ ban quản trị."*
- **7.c. [Cơ chế khóa sau khi sai nhiều lần]**:
  - [CẦN XÁC NHẬN: Hệ thống có áp dụng cơ chế tự động tạm khóa tài khoản sau 5 lần nhập sai liên tiếp trong vòng 15 phút không, hay chỉ thông báo lỗi thông thường?]

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Màn hình**: Trang đăng nhập gọn gàng, thương hiệu Bệnh viện Da liễu, có logo, tiêu đề *"Hệ Thống Quản Lý Bệnh Viện Da Liễu"*.
- **Các thành phần giao diện**:
  - Input: `Tên đăng nhập / Email / SĐT` (autofocus).
  - Input: `Mật khẩu` (có nút icon mắt để ẩn/hiện mật khẩu).
  - Checkbox: *"Ghi nhớ đăng nhập"*.
  - Link: *"Quên mật khẩu?"* -> chuyển sang luồng khôi phục mật khẩu.
  - Link: *"Chưa có tài khoản? Đăng ký ngay"* (dành cho Bệnh nhân).
  - Button: *"Đăng nhập"* (trạng thái disabled + spinner khi đang gửi API request).
  - Alert Box: Hiển thị lỗi từ server trả về nếu đăng nhập thất bại.

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API
- **Endpoint**: `POST /api/v1/auth/login`
- **Quyền truy cập (Auth)**: Public (`permitAll()`)
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "username": "receptionist_01",
  "password": "SecurePassword@123",
  "rememberMe": false
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 86400,
    "user": {
      "accountId": 12,
      "username": "receptionist_01",
      "fullName": "Nguyễn Thị Hoa",
      "email": "hoa.receptionist@hospital.vn",
      "roles": ["ROLE_RECEPTIONIST"],
      "staffId": 5,
      "patientId": null
    }
  }
}
```

#### Response Body (Thất bại - HTTP 401 Unauthorized)
```json
{
  "success": false,
  "errorCode": "AUTH_INVALID_CREDENTIALS",
  "message": "Tên đăng nhập hoặc mật khẩu không chính xác"
}
```

### 6.2. Mô hình dữ liệu liên quan
- `user_accounts`: `account_id`, `username`, `password_hash`, `email`, `phone_number`, `is_active`, `last_login_at`.
- `auth_sessions`: `session_id`, `account_id`, `token_hash`, `expires_at`, `is_revoked`.
- `roles` & `account_roles`: Tra cứu danh sách quyền hạn gắn với tài khoản.

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Token xác thực sẽ được lưu vào HttpOnly Secure Cookie hay trả về trong Response Body để Frontend lưu trữ trong LocalStorage/Memory? token xác thực lưu vào trong httpOnly cookie ]
- [ CẦN XÁC NHẬN: Bệnh nhân đăng nhập bằng Số điện thoại hay Tên đăng nhập hay Email? Có cần tính năng OTP qua SMS/Email khi đăng nhập không? đăng nhập bằng email]

