# Đặc Tả Tính Năng: Đổi Lịch Hẹn (Reschedule Appointment)

## 1. Thông Tin Chung
- **Mã Use Case**: UC41 - Reschedule Appointment
- **Tác Nhân (Actors)**:
  - Bệnh nhân (Patient)
  - Nhân viên Tiếp tân (Receptionist)
- **Mô Tả**:
  Người dùng (Bệnh nhân hoặc Tiếp tân đổi giúp) thay đổi ngày khám hoặc khung giờ khám (`AppointmentSlot`) sang một khung giờ mới còn trống. Hệ thống xác thực quy định đổi lịch (phải thực hiện trước giờ khám tối thiểu 24 giờ), cập nhật lại khung giờ hẹn, giải phóng slot cũ, chiếm chỗ slot mới, ghi nhận vết lịch sử đổi lịch, và gửi email xác nhận lịch khám mới kèm mã QR cập nhật cho bệnh nhân.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng có quyền truy cập lịch hẹn (Bệnh nhân sở hữu lịch hẹn hoặc Tiếp tân).
  - Lịch hẹn đang ở trạng thái `BOOKED`. Tuyệt đối không cho phép đổi lịch hẹn đã `CHECKED_IN`, `COMPLETED`, hoặc `CANCELLED`.
  - **Quy tắc thời gian đổi lịch tối thiểu**: Thời điểm thực hiện đổi lịch phải **trước thời điểm bắt đầu của slot hiện tại ít nhất 24 giờ** (`reschedule_notice_minutes >= 1440`).
  - Khung giờ mới (`newAppointmentSlotId`) phải còn trạng thái `OPEN` và số lượng đã đặt chưa vượt quá giới hạn `capacity`.
- **Hậu điều kiện (Postconditions)**:
  - Trường `appointment_slot_id` của cuộc hẹn được trỏ sang slot mới.
  - Cập nhật thời điểm đổi lịch: `last_rescheduled_at = NOW()`.
  - Cập nhật tài khoản thực hiện đổi: `last_rescheduled_by_account_id = <currentAccountId>`.
  - Trạng thái `status` vẫn giữ nguyên là `BOOKED`. Mã cuộc hẹn `appointment_code` được giữ nguyên.
  - Khung giờ cũ được giảm 1 suất (trả lại chỗ trống). Khung giờ mới tăng thêm 1 suất.
  - Hệ thống gửi email thông báo cập nhật lịch khám và gửi kèm mã QR Code mới đến bệnh nhân.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-57**: Bệnh nhân chỉ có thể dời/đổi lịch hẹn khi trạng thái lịch hẹn cho phép dời lịch (`BOOKED`) và **phải trước thời hạn chót quy định (tối thiểu trước 24 giờ so với giờ khám hiện tại)**.
- **BR-58**: Lịch hẹn mới phải được gán vào một khung giờ hợp lệ, không gây xung đột trùng lịch của bác sĩ hoặc vượt quá giới hạn số lượng (`capacity`) của slot đó.
- **BR-59**: Việc dời lịch hẹn phải bảo lưu toàn bộ định danh cuộc hẹn (`appointment_id`, `appointment_code`) và liên kết hồ sơ bệnh nhân (`patient_id`), chỉ cập nhật khung giờ khám mới và lưu vết lịch sử đổi lịch.
- **Quy định 24h**:
  - Nếu khoảng thời gian từ hiện tại đến giờ khám cũ nhỏ hơn 24 giờ, hệ thống từ chối cho phép đổi lịch trực tuyến.

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Người dùng mở chi tiết lịch hẹn tại giao diện cá nhân hoặc danh sách tiếp tân.
2. Người dùng nhấn nút "Đổi Lịch Hẹn" (Reschedule).
3. Hệ thống kiểm tra điều kiện thời gian: Khoảng cách đến giờ khám cũ `>= 24 giờ`.
4. Màn hình hiển thị giao diện chọn lịch mới:
   - Hiển thị bác sĩ hiện tại (hoặc cho phép chọn bác sĩ khác nếu quy định cho phép).
   - Hiển thị Lịch chọn ngày và các khung giờ (`AppointmentSlot`) còn trống.
5. Người dùng chọn Ngày mới và Khung giờ mới mong muốn.
6. Người dùng nhập lý do đổi lịch (tùy chọn) và bấm "Xác Nhận Đổi Lịch".
7. Frontend gửi request `PUT /api/v1/appointments/{id}/reschedule` kèm `newAppointmentSlotId` lên Backend.
8. Backend mở Transaction:
   - Kiểm tra lịch hẹn có `status == 'BOOKED'` không.
   - Kiểm tra hạn 24h đối với slot cũ.
   - Kiểm tra slot mới có đang `OPEN` và còn chỗ (`count < capacity`) không.
   - Kiểm tra bệnh nhân có bị trùng lịch khác ở slot mới không.
   - Cập nhật `appointment_slot_id = newSlotId`.
   - Cập nhật `last_rescheduled_at = LocalDateTime.now()`.
   - Cập nhật `last_rescheduled_by_account_id = currentAccountId`.
9. Backend gửi email thông báo xác nhận lịch hẹn mới qua SMTP.
10. Backend trả về `HTTP 200 OK` kèm thông tin lịch hẹn đã cập nhật.
11. Frontend cập nhật giao diện, hiển thị thẻ giờ khám mới và thông báo: *"Đổi lịch hẹn thành công!"*.

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **3.a. Đổi lịch muộn hơn quy định 24 giờ**:
  - Còn dưới 24h trước giờ hẹn cũ.
  - Nút Đổi lịch bị mờ (disabled) hoặc Backend từ chối: *"Không thể đổi lịch hẹn trong vòng 24 giờ trước thời điểm bắt đầu khám."*
- **8.a. Khung giờ mới vừa hết chỗ (Race condition)**:
  - Backend phát hiện slot mới đã đủ người.
  - Backend trả về `HTTP 409 Conflict`: *"Khung giờ vừa chọn đã hết chỗ. Vui lòng chọn khung giờ khác."*
- **8.b. Trùng lịch khác của cùng bệnh nhân**:
  - Bệnh nhân đã có một lịch khám khác tại đúng khung giờ mới.
  - Backend trả về `HTTP 400 Bad Request`: *"Bạn đã có một lịch khám khác trong khung giờ này."*

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Modal / Màn hình Đổi Lịch Hẹn**:
  - **Khối thông tin hiện tại**: Khung giờ cũ (Màu xám, gạch ngang để biểu thị sẽ thay đổi).
  - **Khối chọn lịch mới**:
    - Calendar chọn ngày mới.
    - Danh sách Slot mới (Hiển thị rõ giờ bắt đầu - kết thúc, số chỗ còn lại).
  - **Khối xác nhận**: Tóm tắt: *"Dời từ [Ngày giờ cũ] sang [Ngày giờ mới]"*.
  - **Nút hành động**: *"Giữ nguyên lịch cũ"*, *"Xác nhận đổi lịch"* (Kèm loading spinner khi submit).

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API Reschedule
- **Endpoint**: `PUT /api/v1/appointments/{id}/reschedule`
- **Quyền truy cập (Auth)**: `@PreAuthorize("hasAnyRole('PATIENT', 'RECEPTIONIST', 'ADMIN')")`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "newAppointmentSlotId": 145,
  "rescheduleReason": "Có việc gia đình đột xuất"
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Đổi lịch hẹn thành công",
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "status": "BOOKED",
    "slot": {
      "slotId": 145,
      "startsAt": "2026-11-05T14:00:00",
      "endsAt": "2026-11-05T14:30:00"
    },
    "lastRescheduledAt": "2026-11-02T09:15:00",
    "doctorName": "BSCKII. Trần Văn Bình"
  }
}
```

#### Response Body (Lỗi vi phạm thời hạn 24h - HTTP 400 Bad Request)
```json
{
  "success": false,
  "errorCode": "RESCHEDULE_DEADLINE_EXCEEDED",
  "message": "Không thể đổi lịch hẹn trong vòng 24 giờ trước thời điểm bắt đầu khám"
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Một lịch hẹn được phép đổi tối đa bao nhiêu lần (ví dụ: tối đa 2 lần để tránh việc giữ chỗ liên tục)? ]
- [ CẦN XÁC NHẬN: Khi đổi lịch hẹn, bệnh nhân có được đổi sang Bác sĩ khác không, hay chỉ được đổi ngày giờ của cùng Bác sĩ đã chọn ban đầu? ]

