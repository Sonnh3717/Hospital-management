# CHI TIẾT CÁC THAY ĐỔI VÀ MÃ NGUỒN BACKEND
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System)

---

## 📌 Tổng quan các file Backend

Trong quá trình triển khai, các file Backend (Java / Spring Boot) sau đã được tạo mới hoặc cập nhật để đáp ứng các yêu cầu:

| Đường dẫn file | Trạng thái | Mô tả chức năng |
| :--- | :---: | :--- |
| `controller/reception/ReceptionAppointmentController.java` | **MỚI (NEW)** | Controller REST API cho Lễ tân quản lý lịch hẹn (check-in, undo check-in, hủy, đổi lịch, tìm kiếm). |
| `controller/reception/ReceptionPatientController.java` | **MỚI (NEW)** | Controller REST API cho Lễ tân quản lý bệnh nhân (CRUD, Active/Deactivate). |
| `controller/patient/PatientController.java` | **CẬP NHẬT (MODIFIED)** | Bổ sung API hoàn tất hồ sơ bệnh nhân 2 bước (`/complete-profile`). |
| `controller/appointment/AppointmentController.java` | **CẬP NHẬT (MODIFIED)** | Thêm API lấy khung giờ trống (`/appointments/available-slots`) và vá lỗ hổng IDOR cho lịch hẹn của bệnh nhân. |
| `service/ReceptionPatientService.java` | **MỚI (NEW)** | Interface định nghĩa các nghiệp vụ quản lý bệnh nhân của Lễ tân. |
| `service/impl/ReceptionPatientServiceImpl.java` | **MỚI (NEW)** | Cài đặt nghiệp vụ Lễ tân quản lý bệnh nhân với Spring Data JPA Specification. |
| `service/PatientRegistrationService.java` | **CẬP NHẬT (MODIFIED)** | Bổ sung phương thức `completeProfile` và DTO `CompletedProfileView`. |
| `service/impl/PatientRegistrationServiceImpl.java` | **CẬP NHẬT (MODIFIED)** | Cài đặt logic lưu hồ sơ bệnh nhân bước 2, kiểm tra cổng OTP, kích hoạt tài khoản `ACTIVE`. |
| `service/AppointmentService.java` & `AppointmentServiceImpl.java` | **CẬP NHẬT (MODIFIED)** | Cài đặt hàm `getAvailableSlots` tìm kiếm các khung giờ khám còn chỗ. |
| `dto/request/ReceptionPatientRequests.java` | **MỚI (NEW)** | Các Request DTO (Java Records) phục vụ Lễ tân tạo/sửa/cập nhật trạng thái bệnh nhân. |
| `dto/response/ReceptionPatientViews.java` | **MỚI (NEW)** | Các Response DTO (Java Records) hiển thị danh sách và chi tiết bệnh nhân. |
| `dto/request/RegistrationCommands.java` | **CẬP NHẬT (MODIFIED)** | Bổ sung Request DTO `CompleteProfile` với các validation annotations. |
| `security/SecurityConfig.java` | **CẬP NHẬT (MODIFIED)** | Cấu hình phân quyền URL `/api/reception/**`, `/api/patient/**`, `/api/doctor/**`. |
| `security/SessionAuthenticationFilter.java` | **CẬP NHẬT (MODIFIED)** | Xử lý lan truyền ngữ cảnh Spring Security 6 (`SecurityContextHolder`), chặn tài khoản bị vô hiệu hóa. |

---

## 🔍 Chi tiết từng file, Function và Biến số

---

### 1. `ReceptionAppointmentController.java` (NEW)
- **Gói (Package)**: `com.example.swd.controller.reception`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`
- **Phân quyền**: `@PreAuthorize("hasRole('RECEPTIONIST')")`, Base Path: `/api/reception`
- **Biến thành viên (Fields)**:
  - `private final ReceptionAppointmentService reception;` (Service điều phối nghiệp vụ lịch hẹn của lễ tân).

#### Danh sách hàm (Methods):
1. **`appointments`**:
   - **Endpoint**: `GET /api/reception/appointments`
   - **Tham số (Parameters)**:
     - `@AuthenticationPrincipal StaffPrincipal actor`: Thông tin nhân viên lễ tân đang đăng nhập.
     - `@RequestParam(required = false) LocalDate date`: Ngày khám cần lọc.
     - `@RequestParam(required = false) Long doctorId`: ID bác sĩ cần lọc.
     - `@RequestParam(required = false) Appointment.Status status`: Trạng thái lịch hẹn cần lọc (`PENDING`, `CONFIRMED`, `CHECKED_IN`, `CANCELLED`,...).
     - `@RequestParam(required = false) String search`: Từ khóa tìm kiếm (tên bệnh nhân, mã hẹn, SĐT).
     - `@RequestParam(defaultValue = "0") int page`: Số trang (mặc định 0).
     - `@RequestParam(defaultValue = "20") int size`: Số bản ghi mỗi trang (mặc định 20).
   - **Giá trị trả về**: `PageView<AppointmentView>` (Danh sách phân trang cuộc hẹn).
   - **Mục đích**: Phục vụ màn hình Quản lý lịch hẹn toàn viện của Lễ tân.

2. **`detail`**:
   - **Endpoint**: `GET /api/reception/appointments/{id}`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id` (ID cuộc hẹn).
   - **Giá trị trả về**: `AppointmentView` (Thông tin chi tiết cuộc hẹn, bác sĩ, khung giờ, bệnh nhân).

3. **`options`**:
   - **Endpoint**: `GET /api/reception/options`
   - **Tham số**: `StaffPrincipal actor`, `@RequestParam(required = false) LocalDate date`.
   - **Giá trị trả về**: `ReceptionOptions` (Danh mục bác sĩ, chuyên khoa, ca khám phục vụ tạo hẹn tại quầy).

4. **`create`**:
   - **Endpoint**: `POST /api/reception/appointments`
   - **Tham số**: `StaffPrincipal actor`, `@Valid @RequestBody CreateAppointment input`.
   - **Giá trị trả về**: `AppointmentView`.
   - **Mục đích**: Lễ tân đặt hẹn khám trực tiếp tại quầy tiếp đón.

5. **`checkIn`**:
   - **Endpoint**: `POST /api/reception/appointments/{id}/check-in`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`.
   - **Giá trị trả về**: `AppointmentView`.
   - **Logic nghiệp vụ**: Chuyển trạng thái lịch hẹn sang `CHECKED_IN`, ghi nhận thời điểm tiếp đón và người thực hiện.

6. **`undoCheckIn`**:
   - **Endpoint**: `POST /api/reception/appointments/{id}/undo-check-in`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`.
   - **Giá trị trả về**: `AppointmentView`.
   - **Logic nghiệp vụ**: Hoàn tác check-in về trạng thái `CONFIRMED` nếu bệnh nhân chưa vào khám trong phòng lâm sàng.

7. **`cancel`**:
   - **Endpoint**: `POST /api/reception/appointments/{id}/cancel`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`, `@RequestBody(required = false) CancelAppointment input` (`reason`: lý do hủy).
   - **Giá trị trả về**: `AppointmentView`.
   - **Logic nghiệp vụ**: Lễ tân hủy hẹn tại quầy (được miễn trừ quy định báo trước 24h của bệnh nhân).

8. **`reschedule`**:
   - **Endpoint**: `POST /api/reception/appointments/{id}/reschedule`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`, `@RequestBody RescheduleAppointment input` (`slotId`: ID khung giờ mới).
   - **Giá trị trả về**: `AppointmentView`.
   - **Logic nghiệp vụ**: Chuyển cuộc hẹn sang khung giờ mới khả dụng.

---

### 2. `ReceptionPatientController.java` (NEW)
- **Gói (Package)**: `com.example.swd.controller.reception`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java`
- **Phân quyền**: `@PreAuthorize("hasRole('RECEPTIONIST')")`, Base Path: `/api/reception/patients`
- **Biến thành viên (Fields)**:
  - `private final ReceptionPatientService patientService;`

#### Danh sách hàm (Methods):
1. **`listPatients`**:
   - **Endpoint**: `GET /api/reception/patients`
   - **Tham số**: `StaffPrincipal actor`, `String search`, `int page`, `int size`.
   - **Giá trị trả về**: `ApiResponse<PageView<PatientListItemView>>`.
   - **Mục đích**: Tìm kiếm và phân trang danh sách bệnh nhân của bệnh viện.

2. **`getPatient`**:
   - **Endpoint**: `GET /api/reception/patients/{id}`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`.
   - **Giá trị trả về**: `ApiResponse<PatientDetailView>`.
   - **Mục đích**: Xem chi tiết hồ sơ bệnh nhân, thông tin liên hệ, tài khoản và ngày khởi tạo.

3. **`createPatient`**:
   - **Endpoint**: `POST /api/reception/patients`
   - **Tham số**: `StaffPrincipal actor`, `@Valid @RequestBody CreatePatientRequest request`.
   - **Giá trị trả về**: `ApiResponse<PatientDetailView>`.
   - **Mục đích**: Tiếp nhận và tạo hồ sơ bệnh nhân mới walk-in tại quầy lễ tân.

4. **`updatePatient`**:
   - **Endpoint**: `PUT /api/reception/patients/{id}`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`, `@Valid @RequestBody UpdatePatientRequest request`.
   - **Giá trị trả về**: `ApiResponse<PatientDetailView>`.
   - **Mục đích**: Chỉnh sửa thông tin nhân khẩu học của bệnh nhân.

5. **`updateStatus`**:
   - **Endpoint**: `PUT /api/reception/patients/{id}/status`
   - **Tham số**: `StaffPrincipal actor`, `@PathVariable Long id`, `@Valid @RequestBody UpdateStatusRequest request` (`ActiveStatus status`).
   - **Giá trị trả về**: `ApiResponse<PatientDetailView>`.
   - **Mục đích**: Kích hoạt hoặc vô hiệu hóa tài khoản bệnh nhân (`ACTIVE` / `INACTIVE`).

---

### 3. `PatientController.java` (MODIFIED)
- **Gói (Package)**: `com.example.swd.controller.patient`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`
- **Hàm mới bổ sung**:
  - **`completeProfile`**:
    - **Endpoint**: `POST /api/patients/complete-profile`
    - **Tham số**: `@Valid @RequestBody RegistrationCommands.CompleteProfile input`.
    - **Giá trị trả về**: `ApiResponse<PatientRegistrationService.CompletedProfileView>`.
    - **Logic**: Bước 2 trong quy trình đăng ký tài khoản. Chỉ cho phép thực hiện khi email đã được xác thực mã OTP ở Bước 1. Lưu các thông tin vào bảng `patient` và kích hoạt tài khoản `ACTIVE`.

---

### 4. `AppointmentController.java` (MODIFIED)
- **Gói (Package)**: `com.example.swd.controller.appointment`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
- **Biến thành viên mới**:
  - `private final PatientRepository patientRepository;`
- **Hàm mới & Hàm chỉnh sửa**:
  1. **`getAvailableSlots` (NEW)**:
     - **Endpoint**: `GET /api/appointments/available-slots`
     - **Tham số**: `@RequestParam(required = false) LocalDate date`, `@RequestParam(required = false) Long doctorId`.
     - **Giá trị trả về**: `ResponseEntity<ApiResponse<List<WorkflowViews.SlotView>>>`.
     - **Mục đích**: Lấy danh sách ca khám trống phục vụ bệnh nhân và lễ tân chọn khung giờ dời lịch hẹn.
  2. **`getPatientAppointments` (MODIFIED - Chống IDOR)**:
     - **Endpoint**: `GET /api/patient/appointments`
     - **Logic sửa đổi**:
       ```java
       Long targetPatientId = patientId;
       boolean isAdmin = principal != null && ("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()));

       if (!isAdmin) {
           targetPatientId = principal != null && principal.patientId() != null
                   ? principal.patientId()
                   : (principal != null && principal.accountId() != null
                           ? patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)
                           : null);
       }
       ```
       *Ý nghĩa*: Ngăn chặn bệnh nhân tự ý truyền `patientId` của người khác để xem trộm lịch hẹn. Nếu không phải Admin, hệ thống luôn ép buộc chỉ truy vấn theo tài khoản của chính người đăng nhập.

---

### 5. `ReceptionPatientServiceImpl.java` (NEW)
- **Gói (Package)**: `com.example.swd.service.impl`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionPatientServiceImpl.java`
- **Biến thành viên (Fields)**:
  - `private final PatientRepository patients;`
  - `private final UserAccountRepository accounts;`

#### Các phương thức chi tiết:
- **`list(StaffPrincipal actor, String search, int page, int size)`**:
  - Kiểm tra quyền `requireReceptionist(actor)`.
  - Validate phân trang `page >= 0`, `1 <= size <= 100`.
  - Sử dụng JPA Specification tạo biểu thức tìm kiếm:
    - Tìm kiếm không phân biệt chữ hoa/thường trên 4 cột: `patientCode`, `fullName`, `phone`, `contactEmail`.
    - Tự động escape các ký tự đặc biệt SQL (`\`, `%`, `_`).
    - Sắp xếp giảm dần theo ID: `Sort.by("id").descending()`.
- **`detail(StaffPrincipal actor, Long id)`**:
  - Lấy bệnh nhân theo ID hoặc ném `WorkflowException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND")`.
- **`create(StaffPrincipal actor, CreatePatientRequest request)`**:
  - Tự động sinh mã bệnh nhân duy nhất: `"PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24)`.
  - Gán các trường: `fullName`, `dateOfBirth`, `gender`, `phone`, `contactEmail`, `address`, `emergencyContactName`, `emergencyContactPhone`.
  - Lưu và flush xuống database.
- **`update(StaffPrincipal actor, Long id, UpdatePatientRequest request)`**:
  - Tìm bản ghi, cập nhật thông tin nhân khẩu và flush.
- **`updateStatus(StaffPrincipal actor, Long id, UpdateStatusRequest request)`**:
  - Kiểm tra bệnh nhân có liên kết tài khoản `UserAccount` hay không.
  - Cập nhật `ActiveStatus` (`ACTIVE` hoặc `INACTIVE`).
- **`toListItemView(Patient p)` & `toDetailView(Patient p)`**:
  - Hàm chuyển đổi (Mapper) từ Entity sang View DTO an toàn.

---

### 6. `PatientRegistrationServiceImpl.java` (MODIFIED)
- **Gói (Package)**: `com.example.swd.service.impl`
- **Đường dẫn**: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`
- **Phương thức mới `completeProfile(RegistrationCommands.CompleteProfile input)`**:
  - **Annotation**: `@Transactional(isolation = Isolation.READ_COMMITTED)`
  - **Các bước thực hiện**:
    1. Chuẩn hóa email: `String address = normalizeEmail(input.email())`.
    2. Khóa dòng tài khoản: `UserAccount account = lockAccount(address)`.
    3. Kiểm tra xem tài khoản đã có hồ sơ hoàn thiện chưa để chống ghi đè: nếu đã hoàn tất ngày sinh thì quăng ngoại lệ `HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED"`.
    4. Kiểm tra trạng thái xác thực mã OTP: tìm bản ghi trong bảng `registration_verifications`. Nếu `verification.getVerifiedAt() == null` thì quăng ngoại lệ `HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED"`.
    5. Khởi tạo/cập nhật đối tượng `Patient`:
       - Sinh mã `patientCode` nếu chưa có.
       - Gán họ tên, ngày sinh, giới tính, số điện thoại, địa chỉ, email liên hệ.
       - Gán người liên hệ khẩn cấp (nếu người dùng có nhập).
    6. Kích hoạt tài khoản: `account.setStatus(ActiveStatus.ACTIVE)`.
    7. Lưu thực thể: `accounts.saveAndFlush(account); patients.saveAndFlush(patient);`.
    8. Dọn dẹp bảo mật: `verifications.delete(verification)` (xóa bỏ mã OTP dùng 1 lần sau khi hoàn thành).
    9. Trả về `CompletedProfileView(patient.getId(), patient.getPatientCode(), patient.getFullName())`.

---

### 7. DTOs và Data Transfer Objects mới

#### `ReceptionPatientRequests.java` (NEW)
1. **`CreatePatientRequest`**:
   - `String fullName`: Họ tên bệnh nhân (Required, Max 150 ký tự).
   - `LocalDate dateOfBirth`: Ngày sinh (Required, `@PastOrPresent`).
   - `Gender gender`: Giới tính (Required: `MALE`, `FEMALE`, `OTHER`).
   - `String phone`: Số điện thoại (Required, Regex `^(0|\+84)[0-9]{9,10}$`).
   - `String contactEmail`: Email liên hệ (Optional, Max 254).
   - `String address`: Địa chỉ cư trú (Required, Max 500).
   - `String emergencyContactName`: Tên người liên hệ khẩn cấp (Optional, Max 150).
   - `String emergencyContactPhone`: Số điện thoại khẩn cấp (Optional).

2. **`UpdatePatientRequest`**:
   - Cấu trúc tương tự `CreatePatientRequest` dùng khi cập nhật hồ sơ bệnh nhân.

3. **`UpdateStatusRequest`**:
   - `ActiveStatus status`: Trạng thái mới (`ACTIVE` hoặc `INACTIVE`).

#### `ReceptionPatientViews.java` (NEW)
1. **`PatientListItemView`**:
   - `Long id`, `String patientCode`, `String fullName`, `LocalDate dateOfBirth`, `Gender gender`, `String phone`, `String contactEmail`, `String address`, `Long userAccountId`, `String username`, `ActiveStatus accountStatus`.
2. **`PatientDetailView`**:
   - Toàn bộ thông tin trên kèm: `emergencyContactName`, `emergencyContactPhone`, `String createdAt`, `String updatedAt`.

#### `RegistrationCommands.java` (MODIFIED)
- Bổ sung record **`CompleteProfile`**:
  - `String email`, `String fullName`, `LocalDate dateOfBirth`, `Gender gender`, `String phone`, `String address`, `String emergencyContactName`, `String emergencyContactPhone`.
  - Che dấu thông tin nhạy cảm qua `toString()`: `"CompleteProfile[email=REDACTED]"`.
