# Đặc Tả Tính Năng: Xem Chi Tiết Lịch Hẹn (View Appointment Details)

## 1. Thông Tin Chung
- **Mã Use Case**: UC26 - View Appointment Details (Tương ứng UC 3.2.5 trong SRS)
- **Tác Nhân (Actors)**:
  - Bệnh nhân (Patient)
  - Nhân viên Tiếp tân (Receptionist)
  - Bác sĩ (Doctor)
  - Quản trị viên / Quản lý (Admin / Manager)
- **Mô Tả**:
  Người dùng xem đầy đủ toàn bộ thông tin chi tiết của một cuộc hẹn cụ thể, bao gồm: Mã cuộc hẹn, Mã QR tiếp đón, Thông tin bệnh nhân, Bác sĩ phụ trách, Khung giờ khám, Lịch sử các mốc thời gian (Tạo lịch, Check-in, Hoàn tác check-in, Đổi lịch, Hủy lịch, Khám xong), Lý do khám và thông tin kết quả khám lâm sàng liên quan nếu có.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Người dùng đã đăng nhập vào hệ thống.
  - Lịch hẹn với `appointmentId` hoặc `appointmentCode` chỉ định tồn tại trong CSDL.
  - Người dùng có quyền xem cuộc hẹn (Bệnh nhân chỉ xem lịch của mình; Nhân viên xem theo vai trò).
- **Hậu điều kiện (Postconditions)**:
  - Hệ thống hiển thị toàn diện dữ liệu chi tiết của cuộc hẹn. Không làm biến đổi trạng thái dữ liệu.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **BR-53**: Bệnh nhân chỉ được xem chi tiết lịch hẹn thuộc về tài khoản của mình.
- **BR-65**: Tiếp tân chỉ được xem các trường thông tin hành chính, tiếp đón, số điện thoại, không xem chi tiết bệnh án chuyên sâu nếu chưa được cấp phép.
- **Tính minh bạch lịch sử (Audit Timeline)**: Hiển thị đầy đủ dòng thời gian (Timeline) về các trạng thái mà cuộc hẹn đã trải qua:
  - Thời điểm tạo lịch & người tạo (`createdByAccount`).
  - Thời điểm check-in & nhân viên tiếp đón (`checkedInByStaff`, `checkedInAt`).
  - Lần hoàn tác check-in gần nhất (nếu có: `lastCheckInReversedAt`, `lastCheckInReversedByStaff`).
  - Lần đổi lịch gần nhất (nếu có: `lastRescheduledAt`, `lastRescheduledByAccount`).
  - Thời điểm hủy & người hủy (nếu có: `cancelledAt`, `cancelledByAccount`, `cancellationReason`).
  - Thời điểm hoàn thành khám lâm sàng (khi `Encounter` hoàn tất).

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Người dùng nhấp vào một dòng cuộc hẹn từ danh sách lịch hẹn hoặc quét mã QR tiếp đón.
2. Frontend gửi request `GET /api/v1/appointments/{id}` lên Backend.
3. Backend kiểm tra quyền truy cập (Kiểm tra xem `patient_id` có khớp với `currentUser` nếu là Patient).
4. Backend nạp dữ liệu cuộc hẹn kèm các quan hệ liên quan (`Patient`, `DoctorProfile`, `AppointmentSlot`, `Encounter`, `UserAccount`).
5. Backend trả về `HTTP 200 OK` kèm cấu trúc DTO chi tiết.
6. Frontend hiển thị màn hình Chi tiết lịch hẹn với các khối:
   - Thẻ tóm tắt thông tin & Badge trạng thái.
   - Mã QR tiếp đón lớn (để quét tại quầy).
   - Thông tin cá nhân bệnh nhân.
   - Thông tin chuyên khoa & bác sĩ.
   - Thời gian & địa điểm phòng khám.
   - Timeline lịch sử thao tác.
   - Các nút hành động khả dụng tùy theo trạng thái (Hủy hẹn, Đổi lịch, Check-in, Vào khám).

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **3.a. Không có quyền xem**:
  - Bệnh nhân truy cập trái phép ID lịch hẹn của người khác.
  - Backend trả về `HTTP 403 Forbidden`.
  - Frontend hiển thị thông báo lỗi và điều hướng về trang chủ.
- **4.a. Không tìm thấy lịch hẹn**:
  - ID không tồn tại. Backend trả về `HTTP 404 Not Found`.

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Bố cục màn hình**:
  - **Cột trái (2/3 màn hình)**:
    - **Header**: Tiêu đề *"Chi Tiết Cuộc Hẹn #APPT-XXXXXX"*, kèm Badge trạng thái (`BOOKED`, `CHECKED_IN`, `COMPLETED`, `CANCELLED`, `NO_SHOW`).
    - **Khối thông tin khám**: Dịch vụ khám, Bác sĩ khám, Phòng khám, Khung giờ khám (`09:00 - 09:30, Thứ Ba 03/11/2026`).
    - **Khối lý do khám & ghi chú**: Triệu chứng mô tả ban đầu.
    - **Khối kết quả khám (nếu COMPLETED)**: Tóm tắt chẩn đoán chính, quyết định điều trị, đơn thuốc/dịch vụ chỉ định (nếu có liên kết với `Encounter`).
  - **Cột phải (1/3 màn hình)**:
    - **Mã QR tiếp đón**: Hiển thị ảnh QR Code để bệnh nhân quét tại bàn tiếp đón.
    - **Timeline hành trình cuộc hẹn**:
      - `[Đã đặt lịch]` - 01/11/2026 21:00
      - `[Đã check-in]` - 03/11/2026 08:50 (bởi Tiếp tân Hoa)
      - `[Đã hoàn thành]` - 03/11/2026 09:25 (bởi BS Bình)
    - **Khối nút bấm thao tác**: Đổi lịch / Hủy lịch / Check-in.

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API
- **Endpoint**: `GET /api/v1/appointments/{id}`
- **Quyền truy cập (Auth)**: `@PreAuthorize("isAuthenticated()")`
- **Headers**:
  - `Authorization: Bearer <accessToken>`

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "status": "CHECKED_IN",
    "bookingSource": "ONLINE",
    "reason": "Nổi mẩn đỏ ngứa vùng má",
    "note": "Có tiền sử dị ứng thời tiết",
    "patient": {
      "patientId": 45,
      "fullName": "Lê Hoàng Yến",
      "phoneNumber": "0987654321",
      "gender": "FEMALE",
      "birthDate": "1998-05-12",
      "address": "123 Cầu Giấy, Hà Nội"
    },
    "doctor": {
      "doctorId": 3,
      "fullName": "BSCKII. Trần Văn Bình",
      "specialization": "Da liễu tổng quát",
      "roomNumber": "Phòng 204"
    },
    "slot": {
      "slotId": 128,
      "startsAt": "2026-11-03T09:00:00",
      "endsAt": "2026-11-03T09:30:00"
    },
    "auditTimeline": {
      "createdAt": "2026-11-01T21:00:00",
      "createdBy": "lehoangyen",
      "checkedInAt": "2026-11-03T08:50:15",
      "checkedInByStaff": "Nguyễn Thị Hoa",
      "lastCheckInReversedAt": null,
      "lastRescheduledAt": null,
      "cancelledAt": null,
      "cancellationReason": null
    },
    "encounterSummary": null
  }
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Bệnh nhân sau khi khám xong (COMPLETED) có được phép tải phiếu kết quả khám bệnh hoặc đơn thuốc PDF trực tiếp từ màn hình chi tiết lịch hẹn này không? ]

