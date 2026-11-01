# Đặc Tả Tính Năng: Hoàn Thành Buổi Khám Lâm Sàng (Complete Encounter)

## 1. Thông Tin Chung
- **Mã Use Case**: UC46 - Complete Encounter (Tương ứng UC 3.3.9 trong SRS)
- **Tác Nhân (Actors)**: Bác sĩ chịu trách nhiệm khám (Responsible Doctor)
- **Mô Tả**:
  Sau khi hoàn tất quá trình thăm khám lâm sàng cho bệnh nhân, ghi nhận đầy đủ lý do khám (`chief_complaint`), triệu chứng (`symptoms`), kết quả khám lâm sàng (`clinical_findings`), chẩn đoán bệnh (`EncounterDiagnosis`), quyết định điều trị (`TreatmentDecision`), đơn thuốc hoặc các chỉ định dịch vụ y tế kèm theo, Bác sĩ thực hiện thao tác **Hoàn Thành Ca Khám (Complete Encounter)**. Hệ thống cập nhật trạng thái của `Encounter` thành `COMPLETED`, đồng thời **tự động chuyển trạng thái của Lịch hẹn (`Appointment`) từ `CHECKED_IN` sang `COMPLETED`**, chính thức khép lại vòng đời của cuộc hẹn khám.

---

## 2. Tiền Điều Kiện & Hậu Điều Kiện
- **Tiền điều kiện (Preconditions)**:
  - Bác sĩ đã đăng nhập vào hệ thống và được phân công phụ trách ca khám này (`responsibleDoctorId` khớp với hồ sơ bác sĩ đang đăng nhập).
  - Lịch hẹn đang ở trạng thái `CHECKED_IN`.
  - Buổi khám lâm sàng (`Encounter`) đang ở trạng thái `IN_PROGRESS`.
  - Bác sĩ đã hoàn tất việc ghi nhận đầy đủ các thông tin bắt buộc: Bệnh sử/Triệu chứng, Khám thực thể lâm sàng, Chẩn đoán xác định (mã ICD / tên bệnh) và Quyết định điều trị.
  - Mọi yêu cầu dịch vụ y tế (xét nghiệm, soi da, sinh thiết,...) được chỉ định trong ca khám này phải đã hoàn tất có kết quả (`COMPLETED`) và Bác sĩ đã xác nhận xử lý kết quả, hoặc đã bị bác sĩ hủy bỏ trước đó (không được để dịch vụ ở trạng thái dở dang `ORDERED` hoặc `IN_PROGRESS`).
- **Hậu điều kiện (Postconditions)**:
  - Trạng thái của Encounter: `Encounter.status = 'COMPLETED'`.
  - Cập nhật thời điểm hoàn thành khám: `Encounter.completed_at = NOW()`.
  - **Đồng bộ trạng thái Lịch hẹn**: `Appointment.status` chuyển từ `CHECKED_IN` sang `COMPLETED`.
  - Bệnh nhân hoàn tất lượt khám tại phòng bác sĩ; chuyển tiếp sang bước thanh toán/lĩnh thuốc (nếu có hóa đơn phát sinh) hoặc ra về.

---

## 3. Quy Tắc Nghiệp Vụ (Business Rules)
- **Quy tắc chuyển trạng thái Appointment**: Theo kiến trúc nghiệp vụ đã thống nhất:
  > **Lịch hẹn (`Appointment`) dừng ở trạng thái `CHECKED_IN` trong suốt quá trình bệnh nhân chờ và đang khám; khi Bác sĩ hoàn thành `Encounter` (`Encounter.status = COMPLETED`), thì `Appointment.status` cũng sẽ được tự động cập nhật sang `COMPLETED`**.
- **BR-26**: Chỉ Bác sĩ chịu trách nhiệm ca khám (`Responsible Doctor`) mới có quyền xác nhận Hoàn thành lượt khám (`Complete Encounter`). Việc hoàn thành buổi khám sẽ bị chặn nếu:
  - Còn dịch vụ y tế chỉ định trong ca chưa hoàn thành kết quả (`status != COMPLETED` và `!= CANCELLED`).
  - Còn kết quả dịch vụ y tế đã có nhưng Bác sĩ chưa xem và xác nhận xử lý lâm sàng.
  - Thiếu tài liệu chẩn đoán hoặc quyết định điều trị bắt buộc theo quy định bệnh án Da liễu.
- **BR-32 & BR-33**: Hồ sơ khám bệnh, chẩn đoán và quyết định điều trị chỉ được ghi nhận và chỉnh sửa khi `Encounter` đang ở trạng thái hoạt động (`IN_PROGRESS`). Khi `Encounter` đã chuyển sang `COMPLETED`, hồ sơ bị khóa (Read-only) để đảm bảo tính pháp lý của bệnh án.
- **BR-27**: Việc chỉnh sửa kết quả dịch vụ phát sinh sau đó không tự động mở lại một `Encounter` đã hoàn tất.

---

## 4. Luồng Thực Hiện (Flow of Events)

### 4.1. Luồng chính (Normal Flow)
1. Bác sĩ mở màn hình Khám bệnh lâm sàng (`/doctor/encounter/{id}`).
2. Bác sĩ điền đầy đủ thông tin bệnh án:
   - Lý do khám (`chiefComplaint`), Triệu chứng lâm sàng (`symptoms`).
   - Kết quả khám da liễu thực thể (`clinicalFindings`).
   - Chẩn đoán bệnh (Chọn mã bệnh/tên bệnh Da liễu, ví dụ: *L70.0 - Mụn trứng cá thông thường*).
   - Quyết định điều trị (`TreatmentDecision`): Hướng dẫn chăm sóc da, đơn thuốc hoặc hẹn tái khám.
3. Bác sĩ kiểm tra danh sách dịch vụ y tế chỉ định: Tất cả đã có kết quả (`COMPLETED`) và đã được bác sĩ duyệt.
4. Bác sĩ bấm nút "Hoàn Thành Buổi Khám" (Complete Encounter).
5. Giao diện hiển thị Modal xác nhận: Tóm tắt chẩn đoán chính, đơn thuốc, lời dặn bệnh nhân. Bác sĩ bấm "Xác Nhận Hoàn Tất".
6. Frontend gửi request `POST /api/v1/encounters/{id}/complete` đến Backend Spring Boot.
7. Backend mở Transaction:
   - Kiểm tra Bác sĩ đăng nhập có đúng là `responsibleDoctor` không.
   - Kiểm tra xem còn dịch vụ y tế nào dở dang không (Query kiểm tra `medical_service_requests` gắn với `encounter_id`).
   - Cập nhật `Encounter.status = 'COMPLETED'` và `Encounter.completed_at = LocalDateTime.now()`.
   - Tìm kiếm `Appointment` gắn với `Encounter` này, cập nhật: `Appointment.status = 'COMPLETED'`.
   - Sinh hóa đơn khám bệnh (`invoices`) nếu có các dịch vụ y tế phát sinh cần thanh toán sau.
8. Backend trả về `HTTP 200 OK` kèm dữ liệu tổng kết ca khám.
9. Frontend hiển thị thông báo thành công: *"Đã hoàn thành lượt khám bệnh cho bệnh nhân [Tên]"*, khóa chỉnh sửa form bệnh án, và cung cấp tùy chọn "In phiếu kết quả khám / Đơn thuốc".
10. Màn hình điều hướng quay trở lại Danh sách hàng đợi khám của Bác sĩ để đón bệnh nhân tiếp theo.

### 4.2. Luồng ngoại lệ & Luồng phụ (Alternative & Exception Flows)
- **7.a. Còn dịch vụ y tế chưa có kết quả (Chưa hoàn tất)**:
  - Bác sĩ chỉ định Xét nghiệm da liễu nhưng phòng xét nghiệm chưa trả kết quả (`status = IN_PROGRESS`).
  - Backend chặn lại và trả về lỗi `HTTP 400 Bad Request`:
    *"Không thể hoàn tất ca khám: Còn 1 dịch vụ y tế chưa hoàn thành (Xét nghiệm vi nấm soi tươi). Vui lòng đợi kết quả hoặc hủy dịch vụ nếu không thực hiện."*
- **7.b. Chưa nhập chẩn đoán hoặc thông tin bệnh án bắt buộc**:
  - Bác sĩ để trống chẩn đoán bệnh.
  - Backend/Frontend báo lỗi: *"Vui lòng nhập chẩn đoán bệnh trước khi kết thúc ca khám."*
- **7.c. Bác sĩ không có thẩm quyền**:
  - Bác sĩ A cố tình kết thúc ca khám của Bác sĩ B khi chưa bàn giao quyền.
  - Backend trả về `HTTP 403 Forbidden`: *"Bạn không phải bác sĩ chịu trách nhiệm chính của lượt khám này."*

---

## 5. Đặc Tả Giao Diện Người Dùng (UI/UX - ReactJS)
- **Màn hình Khám lâm sàng (`/doctor/encounter/{id}`)**:
  - **Khu vực trên cùng**: Tên bệnh nhân, Tuổi, Giới tính, Dị ứng, Tiền sử bệnh.
  - **Tabs chức năng**:
    - *Tab 1: Bệnh án lâm sàng* (Lý do khám, Triệu chứng, Tổn thương da cơ bản).
    - *Tab 2: Cận lâm sàng & Dịch vụ* (Danh sách dịch vụ đã chỉ định, trạng thái, xem kết quả hình ảnh/soi da).
    - *Tab 3: Chẩn đoán & Kê đơn* (Chẩn đoán chính, chẩn đoán phân biệt, toa thuốc, dặn dò).
  - **Thanh tác vụ cố định bên dưới (Action Footer)**:
    - Nút phụ: *"Lưu nháp"* (Draft save).
    - Nút phụ: *"Yêu cầu dịch vụ mới"*.
    - Nút chính nổi bật (Màu xanh đậm): *"Hoàn Thành Buổi Khám"* (Complete Encounter).
- **Modal xác nhận hoàn thành**:
  - Hiển thị danh sách kiểm tra (Checklist):
    - [x] Đã ghi nhận lý do & triệu chứng lâm sàng.
    - [x] Đã hoàn thành chẩn đoán bệnh.
    - [x] 100% dịch vụ y tế đã có kết quả.
  - Cảnh báo: *"Sau khi hoàn thành, bệnh án sẽ được khóa và lịch hẹn sẽ được chuyển sang trạng thái COMPLETED."*

---

## 6. Đặc Tả API & Backend (Spring Boot)

### 6.1. Chi tiết API Complete Encounter
- **Endpoint**: `POST /api/v1/encounters/{id}/complete`
- **Quyền truy cập (Auth)**: `@PreAuthorize("hasRole('DOCTOR')")`
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

#### Request Body
```json
{
  "clinicalNotes": "Tổn thương đáp ứng tốt, hướng dẫn bệnh nhân vệ sinh da đúng cách và thoa thuốc đều đặn.",
  "followUpRequired": false
}
```

#### Response Body (Thành công - HTTP 200 OK)
```json
{
  "success": true,
  "message": "Hoàn thành ca khám lâm sàng thành công",
  "data": {
    "encounterId": 801,
    "encounterStatus": "COMPLETED",
    "completedAt": "2026-11-03T09:25:40",
    "appointment": {
      "appointmentId": 1052,
      "appointmentCode": "APPT-20261102-K9F4",
      "status": "COMPLETED"
    },
    "patient": {
      "patientId": 45,
      "fullName": "Lê Hoàng Yến"
    },
    "responsibleDoctor": {
      "doctorId": 3,
      "fullName": "BSCKII. Trần Văn Bình"
    }
  }
}
```

#### Response Body (Lỗi chặn do dịch vụ y tế dở dang - HTTP 400 Bad Request)
```json
{
  "success": false,
  "errorCode": "PENDING_SERVICES_REMAIN",
  "message": "Không thể kết thúc ca khám: Dịch vụ y tế 'Soi da kỹ thuật số' chưa hoàn thành kết quả."
}
```

### 6.2. Triển khai Logic Backend mẫu (Spring Boot Service)
```java
@Transactional
public CompleteEncounterResponse completeEncounter(Long encounterId, CompleteEncounterRequest request, Long currentDoctorId) {
    Encounter encounter = encounterRepository.findById(encounterId)
        .orElseThrow(() -> new ResourceNotFoundException("Encounter không tồn tại"));

    // Kiểm tra quyền bác sĩ
    if (!encounter.getResponsibleDoctor().getId().equals(currentDoctorId)) {
        throw new AccessDeniedException("Bạn không phải bác sĩ phụ trách ca khám này");
    }

    // Kiểm tra các dịch vụ y tế còn dang dở
    boolean hasUnfinishedServices = medicalServiceRequestRepository
        .existsByEncounterIdAndStatusIn(encounterId, List.of(RequestStatus.ORDERED, RequestStatus.IN_PROGRESS));
    if (hasUnfinishedServices) {
        throw new IllegalStateException("Còn dịch vụ y tế chưa hoàn tất kết quả");
    }

    // Cập nhật Encounter
    encounter.setStatus(Encounter.Status.COMPLETED);
    encounter.setCompletedAt(LocalDateTime.now());
    encounter.setClinicalNotes(request.getClinicalNotes());
    encounterRepository.save(encounter);

    // Đồng bộ cập nhật Appointment sang COMPLETED
    Appointment appointment = encounter.getAppointment();
    appointment.setStatus(Appointment.Status.COMPLETED);
    appointmentRepository.save(appointment);

    return CompleteEncounterResponse.from(encounter);
}
```

---

## 7. Các Điểm Cần Xác Nhận / Điền Bổ Sung [ ]
- [ CẦN XÁC NHẬN: Sau khi ca khám hoàn thành, hệ thống có tự động gửi email thông báo kèm tóm tắt toa thuốc/hướng dẫn chăm sóc da đến email bệnh nhân không? ]
- [ CẦN XÁC NHẬN: Trong trường hợp bệnh nhân cần tái khám (Follow-up), bác sĩ có thể trực tiếp tạo luôn một lịch hẹn tái khám mới tại màn hình này không hay chỉ tạo yêu cầu FollowUpRequest để tiếp tân/bệnh nhân đặt sau? ]

