# TỪ ĐIỂN CÁC REST API ENDPOINTS
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System)

---

## 📌 Tổng quan các nhóm API

Toàn bộ các RESTful API được thiết kế theo chuẩn JSON API, sử dụng cấu trúc phản hồi chuẩn hóa `ApiResponse<T>` hoặc `PageView<T>`, đồng thời áp dụng Spring Security 6 stateless token authentication (`Authorization: Bearer <token>`).

---

## 🔐 1. Nhóm Xác Thực & Đăng Nhập (Authentication)

### 1.1. Đăng nhập đa vai trò (Multi-Role Login)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/auth/login`
- **Quyền truy cập**: Public (Công khai)
- **Mục đích**: Đăng nhập bằng Email hoặc Username cho cả 3 vai trò (Patient, Receptionist, Doctor).
- **Request Body (JSON)**:
  ```json
  {
    "username": "patient", // Hoặc nhập email: "patient.demo@hospital.test"
    "password": "Password123!"
  }
  ```
- **Response thành công (200 OK)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 10,
      "accountId": 10,
      "username": "patient",
      "fullName": "Nguyễn Văn Bệnh Nhân",
      "role": "PATIENT", // 'PATIENT' | 'RECEPTIONIST' | 'DOCTOR' | 'ADMIN'
      "staffId": null,
      "patientId": 1
    }
  }
  ```

### 1.2. Lấy thông tin phiên hiện tại (Get Current User Profile)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/auth/me`
- **Header**: `Authorization: Bearer <token>`
- **Response thành công (200 OK)**: Trả về thông tin của `user` tương tự response đăng nhập.

### 1.3. Đăng xuất (Logout)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/auth/logout`
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Thu hồi phiên làm việc trên server.

---

## 📝 2. Nhóm Đăng Ký Bệnh Nhân 2 Bước (Patient Registration & OTP)

### 2.1. Kiểm tra tính khả dụng của Tên đăng nhập (Check Username)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/patients/check-username?username=patient01`
- **Quyền truy cập**: Public
- **Response (200 OK)**: `true` (nếu chưa ai dùng, hợp lệ) hoặc `false` (nếu đã tồn tại).

### 2.2. Bước 1: Đăng ký thông tin tài khoản & Gửi mã OTP
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/patients/register`
- **Quyền truy cập**: Public
- **Request Body (JSON)**:
  ```json
  {
    "username": "nguyenvana",
    "fullName": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "agreeTerms": true
  }
  ```
- **Response thành công (200 OK)**:
  ```json
  {
    "message": "Mã xác thực OTP đã được gửi đến email của bạn.",
    "username": "nguyenvana",
    "email": "nguyenvana@gmail.com",
    "otpExpiresAt": "2026-11-03T07:45:00Z",
    "resendAvailableAt": "2026-11-03T07:36:00Z"
  }
  ```

### 2.3. Gửi lại mã OTP (Resend OTP)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/patients/send-otp`
- **Request Body (JSON)**:
  ```json
  {
    "email": "nguyenvana@gmail.com"
  }
  ```

### 2.4. Xác thực mã OTP (Verify OTP)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/patients/verify-otp`
- **Quyền truy cập**: Public
- **Request Body (JSON)**:
  ```json
  {
    "email": "nguyenvana@gmail.com",
    "otp": "123456"
  }
  ```
- **Response thành công (200 OK)**:
  ```json
  {
    "message": "Xác thực email thành công.",
    "username": "nguyenvana",
    "email": "nguyenvana@gmail.com"
  }
  ```

### 2.5. Bước 2: Hoàn tất hồ sơ bệnh nhân (Complete Patient Profile)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/patients/complete-profile`
- **Quyền truy cập**: Public (sau khi đã verify OTP)
- **Request Body (JSON)**:
  ```json
  {
    "email": "nguyenvana@gmail.com",
    "fullName": "Nguyễn Văn A",
    "dateOfBirth": "1998-05-20",
    "gender": "MALE", // 'MALE' | 'FEMALE' | 'OTHER'
    "phone": "0987654321",
    "address": "123 Đường Nguyễn Văn Cừ, Quận 5, TP.HCM",
    "emergencyContactName": "Nguyễn Văn B (Bố)", // Tùy chọn (Optional)
    "emergencyContactPhone": "0912345678"        // Tùy chọn (Optional)
  }
  ```
- **Response thành công (200 OK)**:
  ```json
  {
    "status": "SUCCESS",
    "message": "Hồ sơ bệnh nhân đã được hoàn tất thành công",
    "data": {
      "patientId": 15,
      "patientCode": "PT-a1b2c3d4e5f6789012345678",
      "fullName": "Nguyễn Văn A"
    }
  }
  ```

---

## 🏥 3. Nhóm Phân Hệ Bệnh Nhân (Patient Portal)

### 3.1. Danh sách lịch hẹn của tôi (My Appointments)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/patient/appointments`
- **Header**: `Authorization: Bearer <token>`
- **Phân quyền**: Role `PATIENT` (Có cơ chế chống IDOR, tự động trỏ vào tài khoản đang đăng nhập).
- **Response (200 OK)**:
  ```json
  {
    "status": "SUCCESS",
    "data": [
      {
        "id": 101,
        "appointmentCode": "APT-20261103-001",
        "appointmentDate": "2026-11-04",
        "timeSlot": "08:30 - 09:00",
        "doctorName": "BS. CKI Trần Văn Hùng",
        "specialtyName": "Tim Mạch Can Thiệp",
        "roomNumber": "P.204",
        "status": "CONFIRMED",
        "price": 280000
      }
    ]
  }
  ```

### 3.2. Lấy danh sách khung giờ khám còn trống (Available Slots)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/appointments/available-slots?date=2026-11-04&doctorId=3`
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Danh sách các ca khám chưa đầy chỗ để người dùng chọn khi đặt lại lịch.

### 3.3. Hủy cuộc hẹn (Cancel Appointment)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/appointments/{id}/cancel`
- **Header**: `Authorization: Bearer <token>`
- **Request Body (JSON)**:
  ```json
  {
    "reason": "Tôi bận công tác đột xuất"
  }
  ```
- **Ràng buộc**: Bệnh nhân phải hủy trước giờ khám tối thiểu 24 giờ.

### 3.4. Đặt lại cuộc hẹn (Reschedule Appointment)
- **Phương thức**: `PUT`
- **Đường dẫn**: `/api/appointments/{id}/reschedule`
- **Header**: `Authorization: Bearer <token>`
- **Request Body (JSON)**:
  ```json
  {
    "newSlotId": 24,
    "reason": "Dời sang ca khám buổi chiều"
  }
  ```

---

## 👩‍💼 4. Nhóm Phân Hệ Lễ Tân (Receptionist Portal)

### 4.1. Quản lý lịch hẹn toàn viện (List Hospital Appointments)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/reception/appointments?date=2026-11-03&status=CONFIRMED&search=Nguyen&page=0&size=20`
- **Header**: `Authorization: Bearer <token>`
- **Phân quyền**: Role `RECEPTIONIST` hoặc `ADMIN`.
- **Response (200 OK)**: Phân trang danh sách lịch hẹn toàn viện.

### 4.2. Tiếp đón Check-in tại quầy (Check-in Appointment)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/reception/appointments/{id}/check-in`
- **Header**: `Authorization: Bearer <token>`
- **Mục đích**: Xác nhận bệnh nhân đã có mặt tại sảnh bệnh viện. Chuyển trạng thái sang `CHECKED_IN`.

### 4.3. Hoàn tác Check-in (Undo Check-in)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/reception/appointments/{id}/undo-check-in`
- **Header**: `Authorization: Bearer <token>`
- **Mục đích**: Khôi phục lại trạng thái `CONFIRMED` nếu thao tác check-in nhầm.

### 4.4. Hủy & Đổi lịch tại quầy tiếp đón
- **Hủy hẹn**: `POST /api/reception/appointments/{id}/cancel` (miễn trừ quy định 24h).
- **Đổi lịch**: `POST /api/reception/appointments/{id}/reschedule` với Body `{ "slotId": 28 }`.

### 4.5. Quản lý Bệnh nhân - Danh sách (List Patients)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/reception/patients?search=0987&page=0&size=20`
- **Header**: `Authorization: Bearer <token>`
- **Response (200 OK)**: Danh sách bệnh nhân kèm thông tin tài khoản và trạng thái (`ACTIVE` / `INACTIVE`).

### 4.6. Xem chi tiết bệnh nhân (Get Patient Detail)
- **Phương thức**: `GET`
- **Đường dẫn**: `/api/reception/patients/{id}`

### 4.7. Thêm mới bệnh nhân walk-in tại quầy (Create Patient)
- **Phương thức**: `POST`
- **Đường dẫn**: `/api/reception/patients`
- **Request Body (JSON)**:
  ```json
  {
    "fullName": "Lê Thị Cẩm Tú",
    "dateOfBirth": "1992-10-15",
    "gender": "FEMALE",
    "phone": "0901234567",
    "contactEmail": "camtu@gmail.com",
    "address": "45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    "emergencyContactName": "Lê Văn Hùng (Chồng)",
    "emergencyContactPhone": "0909888777"
  }
  ```

### 4.8. Chỉnh sửa thông tin bệnh nhân (Update Patient)
- **Phương thức**: `PUT`
- **Đường dẫn**: `/api/reception/patients/{id}`

### 4.9. Kích hoạt / Vô hiệu hóa bệnh nhân (Update Patient Status)
- **Phương thức**: `PUT`
- **Đường dẫn**: `/api/reception/patients/{id}/status`
- **Request Body (JSON)**:
  ```json
  {
    "status": "INACTIVE" // 'ACTIVE' hoặc 'INACTIVE'
  }
  ```
