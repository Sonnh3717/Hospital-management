# Đặc Tả Tính Năng: Tiếp Đón & Check-in (Check In Appointment)

## 1. Thông Tin Chung
- **Mã Use Case**: UC20 - Check In Appointment
- **Tác Nhân (Actors)**: Nhân viên Tiếp tân (Receptionist)
- **Mô Tả**:
  Khi bệnh nhân đến bệnh viện theo lịch hẹn, Nhân viên tiếp tân tại quầy sử dụng máy quét mã vạch/QR code (hoặc tra cứu thủ công theo mã cuộc hẹn, số điện thoại, CCCD) để xác định lịch hẹn. Tiếp tân đối chiếu thông tin cá nhân của bệnh nhân, xác nhận sự có mặt của bệnh nhân, và thực hiện check-in trên hệ thống. Trạng thái lịch hẹn chuyển từ `BOOKED` sang `CHECKED_IN`, đồng thời bệnh nhân được đưa vào danh sách chờ khám (Queue) của Bác sĩ phụ trách.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Nhân viên Tiếp tân đã đăng nhập vào hệ thống với tài khoản hợp lệ (`ROLE_RECEPTIONIST`).
  - Lịch hẹn khám tồn tại trong hệ thống và đang ở trạng thái `BOOKED`.
  - Ca làm việc và thời điểm check-in hợp lệ (ví dụ: trong ngày hẹn khám và không quá trễ vượt quá thời gian cho phép).
- **Hậu điều kiện (Postconditions)**:
  - Cột `status` của lịch hẹn chuyển thành `CHECKED_IN`.
  - Cập nhật thời điểm check-in thực tế: `checked_in_at = NOW()`.
  - Ghi nhận nhân viên thực hiện check-in: `checked_in_by_staff_id = <currentStaffId>`.
  - Bệnh nhân chính thức xuất hiện trên danh sách bệnh nhân chờ khám của Bác sĩ (`Doctor's Assigned Patient Worklist / Queue`).

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-72**: Một lịch hẹn chỉ được check-in khi nó hợp lệ và đủ điều kiện check-in. Các cuộc hẹn đã bị Hủy (`CANCELLED`), đã Đánh dấu vắng mặt (`NO_SHOW`) hoặc Đã được check-in trước đó (`CHECKED_IN`, `COMPLETED`) tuyệt đối không được phép check-in lại.
- **BR-73**: Mỗi lần check-in thành công phải lưu vết chính xác thời điểm thực hiện (`checked_in_at`) và mã định danh nhân viên tiếp tân thực hiện (`checked_in_by_staff_id`).
- **BR-74**: Việc check-in thành công chỉ xác nhận sự có mặt thực tế của bệnh nhân tại bệnh viện cho cuộc hẹn đó, chứ chưa đồng nghĩa với việc ca khám lâm sàng (`Encounter`) đã bắt đầu.
- **HW-02**: Hệ thống hỗ trợ thiết bị quét mã vạch và QR Code chuẩn USB/HID tại quầy tiếp tân, phản hồi nhanh dưới 500ms khi nhận diện mã.
- **Vòng đời trạng thái**: Lịch hẹn dừng ở trạng thái `CHECKED_IN` cho đến khi Bác sĩ hoàn thành toàn bộ buổi khám lâm sàng (`Encounter.status = COMPLETED`), lúc đó `Appointment.status` mới chuyển sang `COMPLETED`.

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Bệnh nhân đến quầy tiếp tân và đưa mã QR / Barcode trên điện thoại (hoặc phiếu hẹn, đọc Mã hẹn / SĐT / CCCD).
2. Tiếp tân kích hoạt chế độ tiếp đón trên màn hình ReactJS:
   - Dùng đầu đọc quét mã QR (hoặc nhập mã hẹn vào thanh tìm kiếm và bấm Enter).
3. Frontend gửi request `GET /api/v1/appointments/lookup?code=...` lên Backend.
4. Backend kiểm tra và trả về thông tin chi tiết cuộc hẹn: Tên bệnh nhân, Ngày sinh, Bác sĩ, Khung giờ hẹn, Trạng thái hiện tại.
5. Tiếp tân đối chiếu giấy tờ tùy thân của bệnh nhân với thông tin trên màn hình.
6. (Tùy chọn) Tiếp tân kiểm tra tình trạng thu phí khám (nếu có thu tiền khám ban đầu tại quầy).
7. Tiếp tân nhấn nút "Xác Nhận Check-in" (Check In).
8. Frontend gửi request `POST /api/v1/appointments/{id}/check-in` đến Backend.
9. Backend xác thực trạng thái cuộc hẹn:
   - Nếu `status != 'BOOKED'` -> từ chối.
   - Cập nhật `status = 'CHECKED_IN'`, `checked_in_at = LocalDateTime.now()`, `checked_in_by_staff_id = currentStaffId`.
   - Lưu lịch sử thao tác vào CSDL.
10. Backend trả về `HTTP 200 OK` kèm thông tin số thứ tự khám (Queue Ticket Number) của bệnh nhân.
11. Giao diện tiếp tân hiển thị thông báo check-in thành công và (tùy chọn) in phiếu số thứ tự phòng khám cho bệnh nhân.

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **4.a. Không tìm thấy mã cuộc hẹn**:
  - Mã QR hoặc chuỗi nhập sai cú pháp, không có trong hệ thống.
  - Hệ thống báo: *"Không tìm thấy thông tin lịch hẹn. Vui lòng kiểm tra lại mã hoặc tra cứu bằng Số điện thoại/CCCD."*
- **9.a. Cuộc hẹn đã ở trạng thái CHECKED_IN**:
  - Backend trả về lỗi `HTTP 400 Bad Request`: *"Lịch hẹn này đã được check-in vào lúc [HH:mm:ss] bởi nhân viên [Tên]."*
- **9.b. Cuộc hẹn đã bị HỦY (CANCELLED)**:
  - Hệ thống thông báo lỗi: *"Lịch hẹn này đã bị hủy vào lúc [...] với lý do [...]. Không thể check-in."*
  - Tiếp tân tư vấn bệnh nhân đặt lịch mới (Walk-in).
- **9.c. Bệnh nhân đến quá sớm hoặc quá muộn**:
  - [CẦN XÁC NHẬN: Tiếp tân có được phép check-in trước giờ hẹn tối đa bao nhiêu phút (ví dụ 60 phút)? Nếu bệnh nhân đến muộn sau khi slot đã kết thúc nhưng ca làm việc của Bác sĩ chưa hết, tiếp tân có được check-in trễ không hay phải chuyển sang diện khác?]

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Màn hình Tiếp đón bệnh nhân (`/reception/check-in`)**:
  - **Khu vực tìm kiếm nhanh**:
    - Ô quét Barcode/QR Code (luôn tự động focus để nhận dữ liệu từ máy quét qua cổng USB).
    - Ô tra cứu phụ: SĐT, Họ tên, Mã bệnh nhân, Mã lịch hẹn.
  - **Khối thông tin đối chiếu cuộc hẹn**:
    - Thẻ hiển thị lớn: Mã hẹn, Họ tên bệnh nhân, Giới tính, Năm sinh, CCCD, Bác sĩ khám, Phòng khám số, Giờ hẹn.
    - Huy hiệu trạng thái (Badge): `BOOKED` (Màu xanh dương nổi bật).
  - **Nút bấm chính**:
    - Nút to màu xanh lá cây: *"Xác Nhận Check-in"* (Phím tắt: `F9` hoặc `Enter`).
    - Nút phụ: *"Hủy / Đóng"*.
  - **Bảng danh sách bệnh nhân vừa check-in trong ngày**:
    - Cập nhật thời gian thực (STT, Giờ check-in, Tên bệnh nhân, Bác sĩ, Trạng thái).

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API Check-in
- **Endpoint**: `POST /api/v1/appointments/{id}/check-in`
- **Quyền truy cập (Auth)**: Yêu cầu quyền tiếp tân (`@PreAuthorize("hasRole('RECEPTIONIST')")`)
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "notes": "Bệnh nhân có mặt đúng giờ tại quầy 02"
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Check-in thành công",
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "status": "CHECKED_IN",
    "checkedInAt": "2026-11-03T08:50:15",
    "checkedInByStaff": {
      "staffId": 5,
      "fullName": "Nguyễn Thị Hoa"
    },
    "queueNumber": 12,
    "roomNumber": "P.204 - Da Liễu 1",
    "doctorName": "BSCKII. Trần Văn Bình"
  }
}
```

#### Response Body (Lỗi - HTTP 400 Bad Request)
```json
{
  "success": false,
  "errorCode": "APPOINTMENT_ALREADY_CHECKED_IN",
  "message": "Lịch hẹn đã được check-in trước đó lúc 08:45:10"
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Khi check-in thành công, hệ thống có cần kích hoạt API in số phiếu giấy tự động qua máy in nhiệt POS tại quầy tiếp đón không? ]
- [ CẦN XÁC NHẬN: Bệnh nhân có cần ký xác nhận hoặc chụp ảnh nhận diện tại bàn tiếp tân lúc check-in không? ]

