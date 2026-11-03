# Handoff Report — Patient CRUD & Doctor View Explorer (spec_miner_m3_3_gen2)

**Timestamp**: 2026-11-02T21:37:00Z  
**Author**: `spec_miner_m3_3_gen2`  
**Role**: Patient CRUD & Doctor View Explorer  
**Working Directory**: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\spec_miner_m3_3_gen2`  
**Recipient Parent**: Orchestrator Gen2 (`57be1812-6fc7-41d3-9fd8-655dc3f13abb`)  

---

## 1. Observation

### 1.1. Existing Backend Source Files & Signatures
Through deep code inspection and test execution, the following backend endpoints and components were verified:

1. **Controller**: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java`
   - Base Route: `@RequestMapping("/api/reception/patients")`
   - Authorization: `@PreAuthorize("hasRole('RECEPTIONIST')")`
   - Actor principal: `@AuthenticationPrincipal StaffPrincipal actor`
   - Endpoints:
     - `GET /api/reception/patients`:
       - Query params: `search` (optional string), `page` (int, default `0`), `size` (int, default `20`).
       - Response: `ApiResponse<PageView<PatientListItemView>>`
     - `GET /api/reception/patients/{id}`:
       - Path variable: `id` (Long).
       - Response: `ApiResponse<PatientDetailView>`
     - `POST /api/reception/patients`:
       - Body: `@Valid @RequestBody CreatePatientRequest request`.
       - Response: `ApiResponse<PatientDetailView>` with message `"Tạo hồ sơ người bệnh thành công"`.
     - `PUT /api/reception/patients/{id}`:
       - Path variable: `id` (Long), Body: `@Valid @RequestBody UpdatePatientRequest request`.
       - Response: `ApiResponse<PatientDetailView>` with message `"Cập nhật thông tin người bệnh thành công"`.
     - `PUT /api/reception/patients/{id}/status`:
       - Path variable: `id` (Long), Body: `@Valid @RequestBody UpdateStatusRequest request`.
       - Response: `ApiResponse<PatientDetailView>` with message `"Cập nhật trạng thái tài khoản thành công"`.

2. **DTO Contracts**:
   - `backend/swd/src/main/java/com/example/swd/dto/request/ReceptionPatientRequests.java`:
     - `CreatePatientRequest`:
       - `fullName`: String (`@NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")`, `@Size(max = 150)`)
       - `dateOfBirth`: LocalDate (`@NotNull(message = "Vui lòng chọn ngày sinh.")`, `@PastOrPresent(message = "Ngày sinh không được ở tương lai.")`)
       - `gender`: Gender enum (`MALE`, `FEMALE`, `OTHER`) (`@NotNull(message = "Vui lòng chọn giới tính.")`)
       - `phone`: String (`@NotBlank(message = "Vui lòng nhập số điện thoại.")`, `@Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")`, `@Size(max = 25)`)
       - `contactEmail`: String (`@Email(message = "Email liên hệ không hợp lệ.")`, `@Size(max = 254)`) — *Optional*
       - `address`: String (`@NotBlank(message = "Vui lòng nhập địa chỉ.")`, `@Size(max = 500)`)
       - `emergencyContactName`: String (`@Size(max = 150)`) — *Optional*
       - `emergencyContactPhone`: String (`@Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")`, `@Size(max = 25)`) — *Optional*
     - `UpdatePatientRequest`: Identical fields and validation annotations to `CreatePatientRequest`.
     - `UpdateStatusRequest`:
       - `status`: ActiveStatus enum (`ACTIVE`, `INACTIVE`) (`@NotNull(message = "Vui lòng chọn trạng thái tài khoản.")`).
   - `backend/swd/src/main/java/com/example/swd/dto/response/ReceptionPatientViews.java`:
     - `PatientListItemView`: `(Long id, String patientCode, String fullName, LocalDate dateOfBirth, Gender gender, String phone, String contactEmail, String address, Long userAccountId, String username, ActiveStatus accountStatus)`
     - `PatientDetailView`: `(Long id, String patientCode, String fullName, LocalDate dateOfBirth, Gender gender, String phone, String contactEmail, String address, String emergencyContactName, String emergencyContactPhone, Long userAccountId, String username, ActiveStatus accountStatus, String createdAt, String updatedAt)`
   - `backend/swd/src/main/java/com/example/swd/dto/response/WorkflowViews.java`:
     - `PageView<T>`: `(List<T> items, long total, int page, int size)`

3. **Service Logic & Edge Cases**:
   - File: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionPatientServiceImpl.java`
     - Role restriction: lines 141-145 `requireReceptionist(actor)` enforces `RECEPTIONIST` or `ADMIN`. Any other role throws HTTP 403 `FORBIDDEN`.
     - Pagination boundary check: line 38 `page < 0 || size < 1 || size > 100` throws HTTP 400 `INVALID_PAGE`.
     - Search normalization: lines 43-52 searches `patientCode`, `fullName`, `phone`, `contactEmail` using case-insensitive LIKE with proper escaping.
     - Auto-generated patient code: line 71 `patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));` (27 characters total).
     - Walk-in / Direct creation has `userAccount = null` (lines 70-80).
     - Missing patient check: lines 62, 89, 107 throw HTTP 404 `PATIENT_NOT_FOUND`.
     - Status toggle validation: lines 108-110:
       ```java
       if (patient.getUserAccount() == null) {
           throw new WorkflowException(HttpStatus.BAD_REQUEST, "NO_USER_ACCOUNT",
               "Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa");
       }
       ```
     - Deactivation impact: `AuthServiceImpl.java:49-52` checks `if (account.getStatus() != ActiveStatus.ACTIVE)` and throws HTTP 403 `AUTH_ACCOUNT_INACTIVE` ("Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt").

4. **Verified Unit & Challenger Tests**:
   - `backend/swd/src/test/java/com/example/swd/service/ReceptionPatientServiceTest.java`: 8/8 tests pass.
   - `backend/swd/src/test/java/com/example/swd/challenger/ChallengerReceptionPatientServiceTest.java`: 8/8 tests pass.
   - Total: 16 tests passing, 0 failures, 0 errors.

### 1.2. Frontend Current State
1. **Routes & Layouts**:
   - `frontend/src/App.jsx`:
     - Line 49: `<Route path="/reception/patients" element={<ReceptionPatientsPage />} />` under `<WorkspaceLayout role="RECEPTIONIST" />`.
     - Line 57: `<Route path="/doctor" element={<DoctorDashboardPage />} />` under `<WorkspaceLayout role="DOCTOR" />`.
   - `frontend/src/layouts/WorkspaceLayout.jsx`:
     - Line 36: Sidebar item `{ to: '/reception/patients', label: 'Quản lý bệnh nhân', icon: UserGroupIcon }`.
     - Line 39: Sidebar item `{ to: '/doctor', label: 'Bàn làm việc Bác sĩ', icon: StethoscopeIcon }`.
     - Topbar displays user avatar and full name dynamically (`user?.fullName || user?.username`).
2. **Current Page Implementations**:
   - `frontend/src/pages/reception/ReceptionPatientsPage.jsx`: Currently a static placeholder card (24 lines).
   - `frontend/src/pages/doctor/DoctorDashboardPage.jsx`: Currently a static placeholder card (24 lines).
3. **Frontend API Client**:
   - `frontend/src/services/api.js`:
     - `receptionApi`:
       - `listPatients: async (params = {}) => api.get('/reception/patients', { params })`
       - `getPatientDetail: async (id) => api.get('/reception/patients/${id}')`
       - `createPatient: async (patientData) => api.post('/reception/patients', patientData)`
       - `updatePatient: async (id, patientData) => api.put('/reception/patients/${id}', patientData)`
       - `updatePatientStatus: async (id, status) => api.put('/reception/patients/${id}/status', { status })`
     - Ready for direct import into `ReceptionPatientsPage.jsx`.

---

## 2. Logic Chain

### 2.1. Receptionist Patient Management UI Workflow (`ReceptionPatientsPage.jsx`)
1. **Search & Status Filtering Logic**:
   - The receptionist types into the search box (searching across Patient Code, Full Name, Phone, Email).
   - Calling `receptionApi.listPatients({ search: query.trim(), page, size })` sends the query to the backend.
   - A client-side status filter (`ALL`, `ACTIVE`, `INACTIVE`, `NO_ACCOUNT`) allows instant filtering on the returned dataset:
     - `ACTIVE`: `item.accountStatus === 'ACTIVE'`
     - `INACTIVE`: `item.accountStatus === 'INACTIVE'`
     - `NO_ACCOUNT`: `item.userAccountId == null` (Walk-in offline patients)
2. **Patient Data Table Display**:
   - Columns:
     1. **Mã bệnh nhân**: Displayed with mono font in a styled pill tag (e.g. `PT-SHOWCASE001`).
     2. **Họ và tên**: Displayed in bold with an avatar circular badge showing initials.
     3. **Ngày sinh & Giới tính**: Formatted date (`DD/MM/YYYY`) with gender badges:
        - `MALE` / `Nam`: Sky badge
        - `FEMALE` / `Nữ`: Rose/Pink badge
        - `OTHER` / `Khác`: Slate badge
     4. **Thông tin liên hệ**: Phone number (highlighted) and email address (slate-500).
     5. **Địa chỉ**: Truncated with ellipsis and tooltip for full view.
     6. **Trạng thái tài khoản**:
        - `ACTIVE`: Emerald green badge ("Hoạt động" with active dot).
        - `INACTIVE`: Rose red badge ("Đã khóa" with lock icon).
        - `null` / No account: Amber/Slate badge ("Chưa có TK online" / "Vãng lai").
     7. **Thao tác**:
        - **Xem chi tiết** (Eye icon): Opens `PatientDetailModal`.
        - **Chỉnh sửa** (Pencil/Edit icon): Opens `PatientEditModal` with pre-filled inputs.
        - **Khóa/Kích hoạt** (Lock/Unlock toggle icon):
          - If `userAccountId != null`: Active button. When clicked, opens a confirmation dialog stating the consequences of locking or unlocking.
          - If `userAccountId == null`: Disabled button with tooltip explaining that the patient does not have an online account.
3. **Modal Dialogs**:
   - **Create Patient Modal**:
     - Fields: `fullName`, `dateOfBirth`, `gender`, `phone`, `address` (Required); `contactEmail`, `emergencyContactName`, `emergencyContactPhone` (Optional).
     - Validation: Phone regex `^(0|\+84)[0-9]{9,10}$`, DOB not in future, required checks.
     - On submit: Calls `receptionApi.createPatient(payload)`. On success, shows a success toast, closes modal, and refreshes the patient list.
   - **Edit Patient Modal**:
     - Pre-fills with the selected patient's demographic data.
     - On submit: Calls `receptionApi.updatePatient(patientId, payload)`. Refreshes list.
   - **Detail Modal**:
     - Comprehensive card view with Demographics, Contact Info, Emergency Contact, and Account Credentials status.
   - **Status Toggle Confirmation Modal**:
     - Clear warning dialog:
       - Locking: *"Bạn có chắc chắn muốn khóa tài khoản này? Người bệnh sẽ không thể đăng nhập hoặc đặt lịch hẹn trực tuyến."*
       - Unlocking: *"Bạn có chắc chắn muốn kích hoạt lại tài khoản này?"*
     - On confirm: Calls `receptionApi.updatePatientStatus(id, newStatus)` (`ACTIVE` or `INACTIVE`).

### 2.2. Doctor Dashboard UI Workflow (`DoctorDashboardPage.jsx`)
1. **Dynamic Greeting Banner Logic**:
   - The Doctor portal resolves user information from `useAuth()`:
     ```javascript
     const { user } = useAuth();
     const doctorName = user?.fullName || user?.username || 'Bác sĩ';
     ```
   - Dynamic banner renders:
     ```
     Chào mừng Bác sĩ, {doctorName}!
     ```
     (For demo account `doctor`, this resolves to *"Chào mừng Bác sĩ, BS.CKII Trần Văn Minh!"*).
   - Subtitle: *"Chúc Bác sĩ một ca trực làm việc thuận lợi và hiệu quả."* with real-time current date format.
   - Doctor Specialty Badge: *"Chuyên khoa Da liễu & Laser Thẩm mỹ"* (or fallback *"Bác sĩ chuyên khoa"*).
2. **Quick Metrics Overview**:
   - Metric cards:
     - "Ca trực hôm nay": 04 lịch hẹn.
     - "Bệnh nhân chờ khám": 01 ca đã check-in tại quầy tiếp đón.
     - "Đã hoàn thành": 00 ca khám.
     - "Lịch hẹn ngày mai": 03 lịch hẹn đã xác nhận.
3. **Clinical Dashboard Feature Placeholder Card**:
   - Prominently showcases upcoming clinical capabilities:
     - Doctor Worklist & Patient Queue.
     - Clinical Examination & ICD-10 Diagnosis.
     - E-Prescription & Pharmacy Integration.
     - Paraclinical / Laboratory Orders.
   - Clear banner stating: *"Phân hệ Bàn khám & Hồ sơ bệnh án điện tử đang được hoàn thiện theo lộ trình Milestone 3."*

---

## 3. Caveats

1. **Walk-in Patients without Online User Accounts**:
   - Patients created directly at the hospital reception desk (`POST /api/reception/patients`) do NOT possess a `user_account` record (`userAccountId = null`).
   - Calling `PUT /api/reception/patients/{id}/status` on these patients will return HTTP 400 with code `NO_USER_ACCOUNT`.
   - The frontend table MUST visually distinguish online registered accounts (`ACTIVE`/`INACTIVE`) from offline walk-in patients ("Chưa có TK online"), and disable the status toggle button for walk-in patients with a clear tooltip.
2. **Search Parameters vs Status Filters**:
   - The backend `GET /api/reception/patients` endpoint accepts `search`, `page`, and `size`. It does NOT accept a backend `status` parameter.
   - Status filtering ("Tất cả", "Hoạt động", "Đã khóa", "Chưa có TK") should be handled client-side over the fetched page items, while textual search is forwarded to the backend.
3. **Doctor Profile Information**:
   - The `/auth/me` endpoint returns `UserInfoResponse` which provides `fullName`, `username`, `role`, and `staffId`. Specialty information (`Chuyên khoa Da liễu & Laser Thẩm mỹ`) can be displayed from the demo seed data or formatted title prefix (`BS.CKII`).

---

## 4. Conclusion

Both R5 Receptionist Patient Management and R6 Doctor Dashboard have mature, rock-solid backend foundations ready for UI presentation.
- **R5 Receptionist Patient Management**:
  - Backend controller `ReceptionPatientController` provides full CRUD and status toggles.
  - All 16 unit and challenger tests pass 100%.
  - Worker M3 should replace `ReceptionPatientsPage.jsx` with a full-featured component providing search, status filter, data table with badges, Create modal, Edit modal, Detail modal, and Status toggle confirmation.
- **R6 Doctor Dashboard**:
  - `WorkspaceLayout.jsx` already integrates the Doctor sidebar link pointing to `/doctor`.
  - Worker M3 should replace `DoctorDashboardPage.jsx` with the dynamic welcome banner greeting `user?.fullName` (*"Chào mừng Bác sĩ [Họ và tên]"*), department badge, quick metrics cards, and clinical feature placeholder card.

---

## 5. Verification Method

### 5.1. Backend Automated Verification
Run the complete unit and challenger test suite:
```powershell
cd backend/swd
mvn test "-Dtest=ReceptionPatientServiceTest,ChallengerReceptionPatientServiceTest"
```
**Expected Result**: All 16 tests pass with 0 failures and 0 errors.

### 5.2. Frontend Build Verification
Verify clean build without syntax or bundling errors:
```powershell
cd frontend
npm run build
```
**Expected Result**: Exit code 0, bundle generated successfully.

### 5.3. End-to-End UI Verification Steps
1. **Receptionist Patient Management**:
   - Log in as `receptionist` / `Password123!`.
   - Navigate to `/reception/patients` ("Quản lý bệnh nhân" in sidebar).
   - Observe patient table displaying seeded patients (`PT-SHOWCASE001` - Nguyễn Văn Bệnh Nhân, `PT-SHOWCASE002` - Trần Thị Lan).
   - Test search box with "Bệnh Nhân", "0901234567", or "PT-SHOWCASE001".
   - Test "Thêm mới bệnh nhân": fill modal form and submit; verify new patient appears in table with generated `PT-...` code.
   - Test "Xem chi tiết": click eye icon on a patient; verify complete demographic and emergency contact modal appears.
   - Test "Chỉnh sửa": click pencil icon, modify address or emergency contact; submit and verify update.
   - Test "Khóa/Kích hoạt": click lock icon on `PT-SHOWCASE001` (Active); confirm dialog; verify status badge turns red ("Đã khóa"). Attempt login as `patient` / `Password123!` and verify error "Tài khoản của bạn đã bị khóa". Then unlock again as receptionist.
   - Test walk-in patient status toggle: verify toggle is disabled or shows informative badge "Chưa có TK online" on `PT-SHOWCASE002`.
2. **Doctor Dashboard**:
   - Log in as `doctor` / `Password123!`.
   - Observe redirection to `/doctor`.
   - Verify greeting banner displays: *"Chào mừng Bác sĩ BS.CKII Trần Văn Minh"*.
   - Verify clinical dashboard placeholder card and metric cards are rendered cleanly.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R5 Patient Management | List & Search Patients | Hospital-wide patient directory with pagination and multi-field keyword search | `search` (string), `page` (int >= 0), `size` (int 1..100) | `PageView<PatientListItemView>` with items, total, page, size | HTTP 400 `INVALID_PAGE` if page < 0 or size not in 1..100; HTTP 403 `FORBIDDEN` if not RECEPTIONIST/ADMIN | `ReceptionPatientController.java:27-33` |
| 2 | R5 Patient Management | Get Patient Detail | Retrieves comprehensive patient demographic profile, emergency contact, and account status | `id` (Long) | `PatientDetailView` including timestamps and emergency contacts | HTTP 404 `PATIENT_NOT_FOUND` if id does not exist; HTTP 403 `FORBIDDEN` if not RECEPTIONIST/ADMIN | `ReceptionPatientController.java:35-40` |
| 3 | R5 Patient Management | Create Walk-in Patient | Creates new patient record with auto-generated code `PT-...` and no initial online account | `CreatePatientRequest` (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`, optional `contactEmail`, `emergencyContactName`, `emergencyContactPhone`) | `PatientDetailView` with generated `patientCode` (27 chars) | HTTP 400 Validation error if required fields blank or phone invalid; HTTP 403 `FORBIDDEN` | `ReceptionPatientController.java:42-47` |
| 4 | R5 Patient Management | Update Patient Info | Updates demographic details and emergency contact of an existing patient | `id` (Long), `UpdatePatientRequest` | Updated `PatientDetailView` | HTTP 404 `PATIENT_NOT_FOUND`; HTTP 400 Validation error; HTTP 403 `FORBIDDEN` | `ReceptionPatientController.java:49-55` |
| 5 | R5 Patient Management | Update Account Status | Toggles linked user account status between `ACTIVE` and `INACTIVE` | `id` (Long), `UpdateStatusRequest` (`status`: `ACTIVE` \| `INACTIVE`) | `PatientDetailView` with updated `accountStatus` | HTTP 400 `NO_USER_ACCOUNT` if patient has no online account; HTTP 404 `PATIENT_NOT_FOUND`; HTTP 403 `FORBIDDEN` | `ReceptionPatientController.java:57-63` |
| 6 | R5 Security & Auth | Account Lockout Enforcement | Prevents inactive patient accounts from logging into the portal | User credentials | Rejection on login | HTTP 403 `AUTH_ACCOUNT_INACTIVE` ("Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt") | `AuthServiceImpl.java:49-52` |
| 7 | R6 Doctor Dashboard | Dynamic Greeting Banner | Renders personalized welcome message greeting doctor by full name | `user.fullName` from `AuthContext` | Greeting: *"Chào mừng Bác sĩ [Họ và tên]"* | Fallback to username or "Bác sĩ" if fullName is missing | `ORIGINAL_REQUEST.md §R6`, `DISPATCH.md §2` |
| 8 | R6 Doctor Dashboard | Clinical Placeholder Card | Informs doctor that examination, e-prescription, and history features are in active development | None | Formatted clinical status card with feature roadmap | N/A | `ORIGINAL_REQUEST.md §R6`, `DISPATCH.md §2` |
| 9 | R6 Doctor Layout | Doctor Sidebar Navigation | Sidebar menu option for Doctor role in `WorkspaceLayout` | Role `DOCTOR` | Navigation link "Bàn làm việc Bác sĩ" (`/doctor`) with `StethoscopeIcon` | N/A | `WorkspaceLayout.jsx:38-40` |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | Status Toggle on Walk-in Patient | `PUT /api/reception/patients/{id}/status` where `user_account_id == null` | Throws HTTP 400 `NO_USER_ACCOUNT` ("Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa"). Frontend must disable toggle button for walk-in patients. |
| 2 | Pagination Boundary Check | `page = -1`, `size = 0`, or `size = 101` | Throws HTTP 400 `INVALID_PAGE` ("Phân trang không hợp lệ (1-100)"). Frontend should constrain size to 1..100. |
| 3 | Access by Non-Receptionist | Call `/api/reception/patients/**` with `PATIENT` or `DOCTOR` token | Throws HTTP 403 `FORBIDDEN` ("Chức năng chỉ dành cho nhân viên lễ tân"). |
| 4 | Operations on Non-Existent Patient | Call `GET/PUT` on patient ID `99999` | Throws HTTP 404 `PATIENT_NOT_FOUND` ("Hồ sơ bệnh nhân không tồn tại"). |
| 5 | Login Attempt by Deactivated Patient | Patient with `accountStatus == 'INACTIVE'` attempts login | Throws HTTP 403 `AUTH_ACCOUNT_INACTIVE`. Login form displays account locked message. |
| 6 | Truncated Address & Emergency Phone | Patient with long address (up to 500 chars) or null emergency contact | Table layout truncates address cleanly; detail view and modals handle null optional emergency contacts safely without NPE. |
| 7 | Doctor Name Fallback | Doctor user object where `fullName` is null | UI safely falls back: `user?.fullName || user?.username || 'Bác sĩ'`. |
