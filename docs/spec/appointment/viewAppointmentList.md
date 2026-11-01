# Đặc Tả Tính Năng: Xem Danh Sách Lịch Hẹn (View Appointment List)

## 1. Thông Tin Chung
- **Mã Use Case**: UC29 - View Appointment List (và UC24 - View Doctor Appointments)
- **Tác Nhân (Actors)**:
  - Bệnh nhân (Patient)
  - Nhân viên Tiếp tân (Receptionist)
  - Bác sĩ (Doctor)
  - Quản lý / Quản trị viên (Manager / Admin)
- **Mô Tả**:
  Người dùng xem danh sách các cuộc hẹn khám theo phạm vi quyền hạn và bộ lọc nghiệp vụ. Bệnh nhân xem lịch sử và các lịch sắp tới của mình; Bác sĩ xem danh sách bệnh nhân đặt lịch trong ca làm việc; Tiếp tân và Quản lý theo dõi toàn bộ danh sách lịch hẹn trong ngày hoặc khoảng thời gian với các bộ lọc đa dạng (Trạng thái, Bác sĩ, Ngày khám, Mã hẹn).

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng đã đăng nhập vào hệ thống.
  - Có các bản ghi lịch hẹn tồn tại phù hợp với quyền hạn truy xuất.
- **Hậu điều kiện (Postconditions)**:
  - Hệ thống trả về danh sách lịch hẹn đã được phân trang (Pagination), sắp xếp và lọc chính xác.
  - Không có bất kỳ thay đổi dữ liệu nào trong cơ sở dữ liệu.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-53**: Bệnh nhân chỉ được xem các lịch hẹn gắn liền với hồ sơ bệnh nhân của chính mình. Tuyệt đối không để lộ thông tin lịch hẹn của bệnh nhân khác.
- **BR-54**: Lịch hẹn sắp tới (Upcoming Appointments) của bệnh nhân là những lịch có thời gian khám trong tương lai (`startsAt >= NOW()`) và trạng thái là `BOOKED`.
- **BR-65 & BR-66**: Nhân viên tiếp tân và quản trị chỉ được xem các thông tin hành chính, thời gian khám, trạng thái tiếp đón, không xem nội dung bệnh án chuyên sâu.
- **BR-01**: Danh sách bệnh nhân của Bác sĩ chỉ hiển thị những bệnh nhân đã đặt hẹn hoặc check-in thuộc các ca làm việc của Bác sĩ đó.

---

## 4. Phân Quyền & Bộ Lọc Theo Từng Vai Trò

### 4.1. Dành cho Bệnh nhân (`ROLE_PATIENT`)
- **Giao diện**: Tab "Lịch hẹn sắp tới" và "Lịch sử khám bệnh".
- **Dữ liệu**: Mã hẹn, Tên bác sĩ, Chuyên khoa, Ngày & Giờ khám, Trạng thái (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
- **Hành động nhanh**: Xem chi tiết, Hủy lịch hẹn (nếu còn `>= 24h`), Đổi lịch hẹn (nếu còn `>= 24h`).

### 4.2. Dành cho Tiếp tân (`ROLE_RECEPTIONIST`)
- **Giao diện**: Bàn quản lý lịch hẹn tổng thể (`/reception/appointments`).
- **Bộ lọc**:
  - Ngày khám (Hôm nay, Ngày mai, Khoảng ngày tùy chọn).
  - Trạng thái: Tất cả, `BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`.
  - Bác sĩ phụ trách.
  - Từ khóa tìm kiếm: Mã lịch hẹn, Tên bệnh nhân, Số điện thoại, CCCD.
- **Hành động nhanh**: Check-in, Hoàn tác check-in, Xem chi tiết, Đổi lịch, Hủy lịch.

### 4.3. Dành cho Bác sĩ (`ROLE_DOCTOR`)
- **Giao diện**: Danh sách bệnh nhân trong ngày / ca khám (`/doctor/appointments`).
- **Bộ lọc**: Ca sáng / Ca chiều / Theo ngày cụ thể.
- **Dữ liệu**: STT, Giờ hẹn, Tên bệnh nhân, Giới tính, Tuổi, Lý do khám, Trạng thái (`BOOKED`, `CHECKED_IN`, `COMPLETED`).
- **Hành động nhanh**: Bấm "Vào khám" (Bắt đầu `Encounter`).

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Bảng dữ liệu (Data Table)**:
  - Hỗ trợ sắp xếp theo cột (Thời gian khám, Tên bệnh nhân).
  - Phân trang chuẩn (10, 20, 50 dòng/trang).
  - Badge trạng thái trực quan:
    - `BOOKED`: Màu xanh lam (Info).
    - `CHECKED_IN`: Màu cam (Warning / Chờ khám).
    - `COMPLETED`: Màu xanh lá cây (Success).
    - `CANCELLED`: Màu xám gạch ngang.
    - `NO_SHOW`: Màu đỏ (Danger).
  - Thanh tìm kiếm tức thời (Debounced search input).

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API
- **Endpoint**: `GET /api/v1/appointments`
- **Quyền truy cập (Auth)**: Người dùng đã đăng nhập (`isAuthenticated()`).
- **Query Parameters**:
  - `page`: Số trang (mặc định 0).
  - `size`: Kích thước trang (mặc định 10).
  - `status`: Lọc theo trạng thái (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
  - `fromDate`: YYYY-MM-DD.
  - `toDate`: YYYY-MM-DD.
  - `doctorId`: Lọc theo bác sĩ (dành cho Tiếp tân/Quản lý).
  - `patientId`: Tự động gán nếu là Bệnh nhân gọi API.
  - `search`: Từ khóa tìm kiếm (Tên, SĐT, Mã hẹn).

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "data": {
    "content": [
      {
        "appointmentId": 1052,
        "appointmentCode": "APPT-20261102-K9F4",
        "patient": {
          "patientId": 45,
          "fullName": "Lê Hoàng Yến",
          "phoneNumber": "0987654321",
          "gender": "FEMALE"
        },
        "doctor": {
          "doctorId": 3,
          "fullName": "BSCKII. Trần Văn Bình"
        },
        "slot": {
          "slotId": 128,
          "startsAt": "2026-11-03T09:00:00",
          "endsAt": "2026-11-03T09:30:00"
        },
        "bookingSource": "ONLINE",
        "status": "CHECKED_IN",
        "checkedInAt": "2026-11-03T08:50:15",
        "reason": "Khám mụn trứng cá viêm"
      }
    ],
    "page": 0,
    "size": 10,
    "totalElements": 48,
    "totalPages": 5
  }
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Bệnh viện có yêu cầu chức năng xuất file Excel / PDF cho danh sách lịch hẹn hàng ngày tại quầy tiếp tân không? ]
- [ CẦN XÁC NHẬN: Khi xem danh sách lịch hẹn, có cần tính năng hiển thị số thứ tự hàng đợi (Queue order) theo thời gian thực (WebSocket / SSE) không? ]

