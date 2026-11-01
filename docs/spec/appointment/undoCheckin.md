# Đặc Tả Tính Năng: Hoàn Tác Check-in (Undo Check-in)

## 1. Thông Tin Chung
- **Mã Use Case**: UC21 - Undo Check-in
- **Tác Nhân (Actors)**: Nhân viên Tiếp tân (Receptionist)
- **Mô Tả**:
  Trong trường hợp nhân viên tiếp tân check-in nhầm bệnh nhân, hoặc bệnh nhân đã check-in nhưng có việc đột xuất phải rời đi trước khi vào phòng khám, tiếp tân thực hiện chức năng Hoàn tác Check-in. Hệ thống sẽ khôi phục trạng thái lịch hẹn trở lại `BOOKED`, xóa bệnh nhân khỏi hàng đợi khám của Bác sĩ, và lưu vết kiểm toán (audit log) về người thực hiện hoàn tác cùng thời điểm đảo ngược check-in.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Nhân viên Tiếp tân đã đăng nhập vào hệ thống với quyền `ROLE_RECEPTIONIST`.
  - Lịch hẹn hiện đang ở trạng thái `CHECKED_IN`.
  - Bác sĩ **CHƯA** bắt đầu buổi khám lâm sàng cho bệnh nhân này (tức là chưa tạo bản ghi `Encounter` hoặc `Encounter.status` chưa bắt đầu khám / khám dở dang).
- **Hậu điều kiện (Postconditions)**:
  - Cột `status` của lịch hẹn được chuyển ngược lại thành `BOOKED`.
  - Cập nhật thời điểm hoàn tác: `last_check_in_reversed_at = NOW()`.
  - Cập nhật nhân viên thực hiện hoàn tác: `last_check_in_reversed_by_staff_id = <currentStaffId>`.
  - Bệnh nhân bị loại khỏi danh sách chờ khám (Queue) của Bác sĩ phụ trách.
  - Các thông tin `checked_in_at` và `checked_in_by_staff_id` có thể được giữ lại hoặc đưa vào bảng lịch sử audit để tra cứu nguyên nhân.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **Ràng buộc trạng thái lâm sàng**: Tuyệt đối **KHÔNG** cho phép hoàn tác check-in nếu Bác sĩ đã mở hồ sơ bệnh án hoặc đã bắt đầu lượt khám lâm sàng (`Encounter` đã được tạo). Nếu muốn hủy ca khám sau khi đã bắt đầu, Bác sĩ phải hủy hoặc kết thúc ca khám theo quy trình chuyên môn.
- **Tính toàn vẹn kiểm toán (Audit Trail)**: Mọi thao tác đảo ngược check-in phải lưu lại thông tin ai là người thực hiện (`lastCheckInReversedByStaff`) và thời gian thực hiện (`lastCheckInReversedAt`), kèm lý do hoàn tác bắt buộc.

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Tiếp tân mở màn hình Danh sách bệnh nhân đã Check-in trong ca hôm nay (`/reception/checked-in-list`).
2. Tiếp tân tìm kiếm bệnh nhân cần hủy check-in.
3. Tiếp tân bấm vào nút "Hoàn tác Check-in" (Undo Check-in) trên dòng tương ứng.
4. Hệ thống hiển thị Modal xác nhận yêu cầu nhập lý do:
   - Lý do mẫu: *"Tiếp tân chọn nhầm bệnh nhân"*, *"Bệnh nhân xin rời đi có việc gấp"*, *"Khác"*.
5. Tiếp tân chọn/nhập lý do và bấm "Xác Nhận Hoàn Tác".
6. Frontend gửi request `POST /api/v1/appointments/{id}/undo-check-in` lên Backend.
7. Backend kiểm tra điều kiện nghiệp vụ:
   - Cuộc hẹn có đúng là `status == 'CHECKED_IN'` không.
   - Kiểm tra bảng `encounters`: Chưa có bản ghi khám lâm sàng nào gắn với `appointment_id` này.
8. Backend cập nhật trạng thái `Appointment`:
   - `status = 'BOOKED'`
   - `last_check_in_reversed_at = LocalDateTime.now()`
   - `last_check_in_reversed_by_staff_id = currentStaffId`
   - Ghi lý do vào log / audit.
9. Backend trả về `HTTP 200 OK`.
10. Frontend đóng modal, làm mới danh sách tiếp đón, hiển thị thông báo: *"Đã hoàn tác check-in thành công. Lịch hẹn đã trở về trạng thái BOOKED."*
11. Bảng chờ khám của Bác sĩ tự động cập nhật (loại bỏ bệnh nhân này).

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **7.a. Bác sĩ đã bắt đầu khám bệnh (`Encounter` đã tồn tại)**:
  - Backend phát hiện đã có `Encounter` gắn với cuộc hẹn này.
  - Backend từ chối và trả về lỗi `HTTP 409 Conflict`: *"Không thể hoàn tác check-in vì Bác sĩ đã bắt đầu lượt khám cho bệnh nhân này."*
  - Frontend hiển thị thông báo lỗi nổi bật màu đỏ, ngăn chặn thao tác.
- **7.b. Cuộc hẹn không ở trạng thái CHECKED_IN**:
  - Trạng thái là `BOOKED`, `CANCELLED`, hoặc `NO_SHOW`.
  - Backend trả về lỗi `HTTP 400 Bad Request`: *"Lịch hẹn không ở trạng thái Đã Check-in."*

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Nút hành động**:
  - Đặt tại cột Thao tác trong bảng Check-in của Tiếp tân: Icon `Undo` màu cam / vàng cảnh báo: "Hoàn tác check-in".
- **Hộp thoại xác nhận (Undo Check-in Modal)**:
  - Tiêu đề: *"Xác Nhận Hoàn Tác Check-in"*
  - Cảnh báo: *"Hành động này sẽ đưa lịch hẹn về trạng thái Chưa Tiếp Đón (BOOKED) và xóa bệnh nhân khỏi hàng đợi của bác sĩ."*
  - Tóm tắt thông tin: Tên bệnh nhân, Mã hẹn, Bác sĩ khám.
  - Textarea: *"Lý do hoàn tác check-in (bắt buộc)"*.
  - Nút: *"Hủy bỏ"*, *"Xác nhận Hoàn tác"*.

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API Undo Check-in
- **Endpoint**: `POST /api/v1/appointments/{id}/undo-check-in`
- **Quyền truy cập (Auth)**: `@PreAuthorize("hasRole('RECEPTIONIST')")`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "reason": "Nhầm lẫn với bệnh nhân trùng tên tại bàn tiếp tân 01"
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Hoàn tác check-in thành công",
  "data": {
    "appointmentId": 1052,
    "appointmentCode": "APPT-20261102-K9F4",
    "status": "BOOKED",
    "lastCheckInReversedAt": "2026-11-03T08:58:20",
    "reversedByStaffName": "Nguyễn Thị Hoa"
  }
}
```

#### Response Body (Lỗi xung đột lâm sàng - HTTP 409 Conflict)
```json
{
  "success": false,
  "errorCode": "ENCOUNTER_ALREADY_STARTED",
  "message": "Không thể hoàn tác check-in vì Bác sĩ đã bắt đầu lượt khám cho bệnh nhân."
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Sau khi hoàn tác check-in, số thứ tự (Queue Number) đã cấp cho bệnh nhân có bị hủy bỏ hoàn toàn hay được bảo lưu nếu bệnh nhân check-in lại sau đó trong cùng ca? ]
- [ CẦN XÁC NHẬN: Bác sĩ có quyền thực hiện Hoàn tác check-in từ màn hình của mình không, hay chỉ duy nhất Tiếp tân được phép thao tác? ]

