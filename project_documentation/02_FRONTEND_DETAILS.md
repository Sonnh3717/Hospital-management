# CHI TIẾT CÁC THAY ĐỔI VÀ MÃ NGUỒN FRONTEND
## Hệ Thống Quản Lý Bệnh Viện (Hospital Management System)

---

## 📌 Tổng quan các file Frontend

Frontend được xây dựng bằng **React 18 + Vite + Tailwind CSS + Axios + React Router DOM v6**. Các file sau đã được tạo mới hoặc cập nhật để phục vụ toàn bộ yêu cầu:

| Đường dẫn file | Trạng thái | Chức năng chính |
| :--- | :---: | :--- |
| `src/App.jsx` | **CẬP NHẬT (MODIFIED)** | Cấu hình toàn bộ định tuyến (Routing), gắn kết `AuthProvider`, `MainLayout`, `WorkspaceLayout` và `ProtectedRoute`. |
| `src/context/AuthContext.jsx` | **MỚI (NEW)** | Context quản lý phiên làm việc toàn cục (User, Token, Role, Login, Logout, Session Verification). |
| `src/services/api.js` | **MỚI (NEW)** | Cấu hình Axios Client, Bearer Token Interceptor, và định nghĩa toàn bộ API Modules (Auth, Patient, Appointment, Reception, Doctor). |
| `src/services/patientApi.js` | **MỚI (NEW)** | Bổ sung API client chuyên biệt cho đăng ký và hoàn thiện hồ sơ bệnh nhân. |
| `src/components/ProtectedRoute.jsx` | **MỚI (NEW)** | Component bảo vệ tuyến đường theo danh sách quyền cho phép (`allowedRoles`). |
| `src/components/common/Icons.jsx` | **MỚI (NEW)** | Thư viện biểu tượng SVG đồng bộ, thẩm mỹ (Lucide icons). |
| `src/layouts/MainLayout.jsx` | **MỚI (NEW)** | Layout công khai với Sticky Topbar (chứa nút Đăng nhập / Đăng ký) và Footer. |
| `src/layouts/WorkspaceLayout.jsx` | **MỚI (NEW)** | Layout bảng điều khiển quản trị với Sidebar điều hướng động theo từng vai trò. |
| `src/pages/HomePage.jsx` | **MỚI (NEW)** | Giao diện Landing Page giới thiệu bệnh viện đẹp mắt (R1). |
| `src/pages/auth/LoginPage.jsx` | **MỚI (NEW)** | Màn hình Đăng nhập đa vai trò (Username/Email + Password), Quên mật khẩu `#`, chuyển sang Đăng ký (R3). |
| `src/pages/auth/RegisterPage.jsx` | **MỚI (NEW)** | Form Đăng ký bệnh nhân 2 bước với xác thực mã OTP email qua SMTP (R2). |
| `src/pages/patient/PatientAppointmentsPage.jsx` | **MỚI (NEW)** | Màn hình Bệnh nhân: Tìm kiếm, xem chi tiết, hủy hẹn (24h), đặt lại lịch hẹn (R4). |
| `src/pages/patient/PatientBookingPage.jsx` | **MỚI (NEW)** | Màn hình Bệnh nhân: Đặt lịch hẹn (Giao diện placeholder) (R4). |
| `src/pages/reception/ReceptionAppointmentsPage.jsx` | **MỚI (NEW)** | Màn hình Lễ tân: Quản lý lịch hẹn toàn viện, Check-in, Undo check-in, Hủy, Đổi lịch (R5). |
| `src/pages/reception/ReceptionPatientsPage.jsx` | **MỚI (NEW)** | Màn hình Lễ tân: Quản lý bệnh nhân CRUD đầy đủ, Active/Deactivate tài khoản (R5). |
| `src/pages/reception/ReceptionWalkInPage.jsx` | **MỚI (NEW)** | Màn hình Lễ tân: Tạo hẹn khám walk-in (Giao diện placeholder) (R5). |
| `src/pages/doctor/DoctorDashboardPage.jsx` | **MỚI (NEW)** | Màn hình Bác sĩ: Layout chào mừng cá nhân hóa và dashboard placeholder (R6). |

---

## 🔍 Chi tiết từng Component, State và Function

---

### 1. `src/App.jsx` (MODIFIED)
- **Component**: `App()`
- **Định tuyến (Routing tree)**:
  - `<Route element={<MainLayout />}>`:
    - `/`: `HomePage` (Landing page)
    - `/login`: `LoginPage`
    - `/register`: `RegisterPage`
  - `<Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>`:
    - `/patient`: Chuyển hướng sang `/patient/appointments`
    - `/patient/appointments`: `PatientAppointmentsPage`
    - `/patient/book`: `PatientBookingPage`
  - `<Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>`:
    - `/reception`: Chuyển hướng sang `/reception/appointments`
    - `/reception/appointments`: `ReceptionAppointmentsPage`
    - `/reception/patients`: `ReceptionPatientsPage`
    - `/reception/walk-in`: `ReceptionWalkInPage`
  - `<Route element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} />}>`:
    - `/doctor`: `DoctorDashboardPage`
  - `*`: Chuyển hướng về `/`.

---

### 2. `src/context/AuthContext.jsx` (NEW)
- **Context**: `AuthContext`
- **State variables**:
  - `user` (`object | null`): Thông tin tài khoản người dùng (`id`, `username`, `fullName`, `role`, `staffId`, `patientId`). Khởi tạo từ `localStorage.getItem('auth_user')`.
  - `token` (`string | null`): Session Bearer Token. Khởi tạo từ `localStorage.getItem('token')`.
  - `loading` (`boolean`): Trạng thái xác thực phiên lúc khởi động ứng dụng.
- **Biến suy luận quyền (Derived properties)**:
  - `role`: Vai trò hiện tại của `user`.
  - `isPatient`: `role === 'PATIENT'`
  - `isReceptionist`: `role === 'RECEPTIONIST'`
  - `isDoctor`: `role === 'DOCTOR'`
  - `isAdmin`: `role === 'ADMIN'`
  - `isAuthenticated`: `!!token && !!user`
- **Các hàm xử lý (Methods)**:
  - `verifySession()`: Chạy trong `useEffect` khi mount, gọi `authApi.getMe()` để kiểm tra token sống hay hết hạn.
  - `login(credentials)`: Gọi `authApi.login(credentials)`, lưu token và thông tin user vào localStorage và state.
  - `logout()`: Gọi `authApi.logout()`, xóa token/user khỏi localStorage và reset state về `null`.
  - `hasRole(requiredRole)`: Kiểm tra xem user có đúng vai trò yêu cầu hay không.
  - `hasAnyRole(roles)`: Kiểm tra xem user có thuộc một trong các vai trò trong mảng hay không.
- **Helper function**: `getRoleDashboardPath(role)`: Trả về đường dẫn workspace tương ứng (`/patient`, `/reception`, `/doctor`).
- **Hook**: `useAuth()`: Hook tiện ích giúp các component con truy xuất context.

---

### 3. `src/services/api.js` (NEW)
- **Axios Instance**: `api`
  - Cấu hình `baseURL: import.meta.env.VITE_API_URL || '/api'`.
  - Request Interceptor: Tự động chèn header `Authorization: Bearer ${token}` nếu tìm thấy token trong localStorage.
  - Response Interceptor: Tự động bắt mã `401 Unauthorized` và điều hướng về `/login?session_expired=true` (trừ các trang public).
- **Các Module API**:
  - **`authApi`**:
    - `login(credentials)`: Gửi `{ username: credentials.username || credentials.email, password }` đến `POST /api/auth/login`.
    - `getMe()`: `GET /api/auth/me`.
    - `logout()`: `POST /api/auth/logout`.
  - **`patientApi`**:
    - `checkUsername(username)`: `GET /api/patients/check-username`.
    - `register(data)`: `POST /api/patients/register`.
    - `sendOtp(email)`: `POST /api/patients/send-otp`.
    - `verifyOtp(email, otp)`: `POST /api/patients/verify-otp`.
    - `completeProfile(profileData)`: `POST /api/patients/complete-profile`.
    - `getMyAppointments()`: `GET /api/patient/appointments`.
  - **`appointmentApi`**:
    - `getAvailableSlots(date, doctorId)`: `GET /api/appointments/available-slots`.
    - `getDetail(id)`: `GET /api/appointments/{id}`.
    - `cancel(id, reason)`: `POST /api/appointments/{id}/cancel`.
    - `reschedule(id, newSlotId, reason)`: `PUT /api/appointments/{id}/reschedule`.
  - **`receptionApi`**:
    - `listAppointments(params)`: `GET /api/reception/appointments`.
    - `getAppointmentDetail(id)`: `GET /api/reception/appointments/{id}`.
    - `getOptions(date)`: `GET /api/reception/options`.
    - `createAppointment(data)`: `POST /api/reception/appointments`.
    - `checkIn(id)`: `POST /api/reception/appointments/{id}/check-in`.
    - `undoCheckIn(id)`: `POST /api/reception/appointments/{id}/undo-check-in`.
    - `cancelAppointment(id, reason)`: `POST /api/reception/appointments/{id}/cancel`.
    - `rescheduleAppointment(id, slotId)`: `POST /api/reception/appointments/{id}/reschedule`.
    - `listPatients(params)`: `GET /api/reception/patients`.
    - `getPatientDetail(id)`: `GET /api/reception/patients/{id}`.
    - `createPatient(patientData)`: `POST /api/reception/patients`.
    - `updatePatient(id, patientData)`: `PUT /api/reception/patients/{id}`.
    - `updatePatientStatus(id, status)`: `PUT /api/reception/patients/{id}/status`.
  - **`doctorApi`**:
    - `getAppointments(params)`: `GET /api/doctor/appointments`.

---

### 4. `src/layouts/MainLayout.jsx` & `WorkspaceLayout.jsx` (NEW)

#### `MainLayout.jsx`
- **Mục đích**: Khung giao diện công khai cho Landing Page, Đăng nhập, Đăng ký.
- **Topbar**:
  - Logo và tên bệnh viện ("Bệnh viện Đa khoa Quốc tế").
  - Menu liên kết Desktop & Mobile: Trang chủ, Giới thiệu, Chuyên khoa, Dịch vụ, Quy trình, Liên hệ.
  - Nhóm nút hành động:
    - Nếu chưa đăng nhập: Nút **"Đăng nhập"** (`id="nav-btn-login"`) và **"Đăng ký"** (`id="nav-btn-register"`).
    - Nếu đã đăng nhập: Hiển thị tên người dùng kèm vai trò, nút chuyển nhanh vào Dashboard và nút **"Đăng xuất"**.
- **Footer**:
  - Thông tin liên hệ bệnh viện, địa chỉ, tổng đài hỗ trợ 24/7 (`1900 6868`), giấy phép hoạt động y tế.

#### `WorkspaceLayout.jsx`
- **Mục đích**: Khung giao diện quản trị có Sidebar và Header riêng cho từng vai trò.
- **Biến điều hướng Sidebar (`navItems`)**:
  - `PATIENT`:
    - Đặt lịch hẹn (`/patient/book` - Icon `CalendarPlusIcon`)
    - Quản lý lịch hẹn (`/patient/appointments` - Icon `ClockIcon`)
  - `RECEPTIONIST`:
    - Tạo hẹn khám walk-in (`/reception/walk-in` - Icon `UserPlusIcon`)
    - Quản lý lịch hẹn (`/reception/appointments` - Icon `CalendarCheckIcon`)
    - Quản lý bệnh nhân (`/reception/patients` - Icon `UserGroupIcon`)
  - `DOCTOR`:
    - Bàn làm việc Bác sĩ (`/doctor` - Icon `StethoscopeIcon`)
- **Header**:
  - Hiển thị thông tin người dùng đang đăng nhập, badge vai trò tiếng Việt ("Bệnh nhân", "Lễ tân tiếp đón", "Bác sĩ chuyên khoa"), nút đăng xuất nhanh.

---

### 5. `src/pages/HomePage.jsx` (NEW - R1 Landing Page)
- **Thành phần giao diện**:
  - **Sticky Topbar Navigation**: Cung cấp đường dẫn và hiển thị nút Đăng nhập / Đăng ký.
  - **Hero Section**: Tiêu đề banner truyền cảm hứng, giới thiệu bệnh viện tiêu chuẩn quốc tế, nút kêu gọi hành động (CTA) "Đặt lịch khám ngay" và "Xem chuyên khoa".
  - **Thống kê y tế nổi bật**: 50.000+ bệnh nhân, 120+ bác sĩ chuyên khoa, 35+ phòng khám đạt chuẩn, 99.2% tỷ lệ hài lòng.
  - **Danh mục chuyên khoa y tế**:
    - Tim mạch can thiệp
    - Sản phụ khoa & Nhi khoa
    - Cơ xương khớp & Chấn thương chỉnh hình
    - Thần kinh & Đột quỵ
    - Nhãn khoa & Mắt công nghệ cao
    - Tai - Mũi - Họng
  - **Quy trình khám chữa bệnh 4 bước**:
    1. Đặt lịch khám trực tuyến
    2. Tiếp đón & Check-in tại quầy
    3. Thăm khám cùng Bác sĩ chuyên khoa
    4. Nhận kết quả & Đơn thuốc điện tử
  - **Đội ngũ y bác sĩ & Cơ sở vật chất**: Giới thiệu hệ thống chụp MRI 3.0 Tesla, CT đa lát cắt, phòng mổ vô trùng Hybrid.

---

### 6. `src/pages/auth/LoginPage.jsx` (NEW - R3 Đăng nhập)
- **State variables**:
  - `loginIdentifier` (`string`): Tên đăng nhập hoặc Email.
  - `password` (`string`): Mật khẩu.
  - `showPassword` (`boolean`): Trạng thái ẩn/hiện mật khẩu.
  - `loading` (`boolean`): Hiệu ứng spinner khi đang đăng nhập.
  - `errorMessage` (`string`): Thông báo lỗi nếu sai thông tin hoặc bị khóa tài khoản.
  - `successMessage` (`string`): Thông báo thành công nếu vừa đăng ký xong chuyển sang.
  - `forgotModalOpen` (`boolean`): Bật/tắt hộp thoại Quên mật khẩu.
- **Các hàm xử lý (Event Handlers)**:
  - `handleSubmit(e)`:
    - Kiểm tra không để trống tên đăng nhập/email và mật khẩu.
    - Gọi hàm `login({ username: loginIdentifier, password })`.
    - Dựa vào `user.role`, tự động điều hướng:
      - `PATIENT` ➡️ `/patient/appointments`
      - `RECEPTIONIST` / `ADMIN` ➡️ `/reception/appointments`
      - `DOCTOR` ➡️ `/doctor`
  - `handleDemoFill(identifier, demoPassword)`:
    - Bấm 1 chạm để điền nhanh tài khoản mẫu:
      - Bệnh nhân: `patient` / `Password123!`
      - Lễ tân: `receptionist` / `Password123!`
      - Bác sĩ: `doctor` / `Password123!`
  - Liên kết *"Quên mật khẩu"* với `href="#"`: Bấm vào mở `forgotModalOpen` hướng dẫn bệnh nhân liên hệ quầy tiếp đón hoặc gọi hotline 1900 6868 theo đúng yêu cầu không cần implement backend logic.
  - Liên kết chuyển sang trang Đăng ký (`/register`).

---

### 7. `src/pages/auth/RegisterPage.jsx` (NEW - R2 Đăng ký 2 bước OTP)
- **Quy trình Step Wizard**:
  - `currentStep = 1`: Bước 1 - Điền tài khoản User Account.
  - `currentStep = '1_otp'`: Bước 1.5 - Xác thực mã OTP qua Email SMTP.
  - `currentStep = 2`: Bước 2 - Hoàn thiện hồ sơ bệnh nhân (Patient demographics).
  - `currentStep = 3`: Bước 3 - Hoàn tất thành công, tự động đếm ngược chuyển về màn hình Đăng nhập.
- **State variables**:
  - `accountData`:
    - `username`, `fullName`, `email`, `password`, `confirmPassword`, `agreeTerms`.
  - `usernameAvailable`, `isCheckingUsername`: Kiểm tra debounce trùng username với backend.
  - `otpValues` (`array[6]`): 6 ô nhập mã OTP tách rời tự động chuyển focus.
  - `resendCooldown` (`number`), `canResend` (`boolean`): Bộ đếm ngược 60 giây gửi lại mã OTP.
  - `profileData`:
    - **Trường Bắt buộc (Chính bệnh nhân)**: `fullName`, `dateOfBirth`, `gender`, `phone`, `address`.
    - **Trường Tùy chọn (Người khác)**: `emergencyContactName`, `emergencyContactPhone`.
  - `profileErrors`, `accountErrors`: Chứa thông báo lỗi validate form.
- **Các hàm xử lý (Handlers)**:
  - `handleAccountSubmit(e)`:
    - Validate độ dài username, định dạng email, mật khẩu khớp nhau.
    - Gọi `patientApi.register(accountData)`: Gửi OTP đến email qua dịch vụ SMTP.
    - Chuyển `currentStep` sang `'1_otp'`.
  - `handleVerifyOtp()`:
    - Ghép chuỗi 6 ký tự OTP: `const code = otpValues.join('')`.
    - Gọi `patientApi.verifyOtp(email, code)`.
    - Nếu thành công, mở khóa chuyển sang `currentStep = 2`.
  - `handleResendOtp()`:
    - Gọi `patientApi.resendOtp(email)`.
    - Đặt lại `resendCooldown = 60`.
  - `handleProfileSubmit(e)`:
    - Kiểm tra tính bắt buộc của các trường cá nhân bệnh nhân (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`).
    - Cho phép bỏ trống thông tin người liên hệ khẩn cấp (`emergencyContactName`, `emergencyContactPhone`).
    - Gọi `patientApi.completeProfile({ ...profileData, email: accountData.email })`.
    - Kích hoạt tài khoản và chuyển sang `currentStep = 3`.

---

### 8. `src/pages/patient/PatientAppointmentsPage.jsx` (NEW - R4 Bệnh nhân)
- **Chức năng**: Quản lý lịch hẹn khám của Bệnh nhân.
- **State variables**:
  - `appointments` (`array`): Danh sách các cuộc hẹn của bệnh nhân.
  - `searchTerm`, `statusFilter`: Tìm kiếm theo mã hẹn/tên bác sĩ và lọc theo trạng thái.
  - `selectedAppointment` (`object | null`): Cuộc hẹn đang xem chi tiết (vé điện tử).
  - `cancelModalOpen` (`boolean`), `cancelTarget` (`object | null`), `cancelReason` (`string`): Quản lý hộp thoại hủy lịch.
  - `rescheduleModalOpen` (`boolean`), `rescheduleTarget` (`object | null`), `availableSlots` (`array`), `selectedSlotId` (`number | null`): Quản lý hộp thoại đặt lại lịch hẹn.
- **Các hàm xử lý**:
  - `loadAppointments()`: Gọi `patientApi.getMyAppointments()`.
  - `check24HourRule(appointment)`:
    - Tính khoảng cách giữa thời gian khám và thời điểm hiện tại.
    - **Quy tắc bắt buộc**: Bệnh nhân chỉ được phép hủy lịch trước giờ khám tối thiểu 24 giờ. Nếu ít hơn 24 giờ, hệ thống hiển thị cảnh báo yêu cầu liên hệ hotline tiếp đón.
  - `handleCancelAppointment()`: Gọi `appointmentApi.cancel(id, cancelReason)`.
  - `handleOpenReschedule(apt)`: Mở modal đổi lịch, gọi `appointmentApi.getAvailableSlots(date, doctorId)` để hiển thị các ca khám còn trống.
  - `handleConfirmReschedule()`: Gọi `appointmentApi.reschedule(id, selectedSlotId)`.

---

### 9. `src/pages/patient/PatientBookingPage.jsx` (NEW - R4 Đặt lịch hẹn)
- **Giao diện Placeholder**:
  - Banner thông báo tính năng đặt hẹn trực tuyến và cổng thanh toán tự động PayOS đang trong lộ trình nâng cấp phiên bản tiếp theo.
  - Cung cấp số điện thoại đường dây nóng (`1900 6868`) và danh sách quầy tiếp đón trực tiếp tại bệnh viện để bệnh nhân liên hệ hỗ trợ.

---

### 10. `src/pages/reception/ReceptionAppointmentsPage.jsx` (NEW - R5 Lễ tân Lịch hẹn)
- **Chức năng**: Quản lý lịch hẹn toàn viện dành cho Lễ tân.
- **State variables**:
  - `appointments` (`array`): Danh sách cuộc hẹn phân trang.
  - `searchKeyword`, `filterDate`, `filterStatus`, `filterDoctor`: Các tiêu chí lọc.
  - `page`, `totalPages`, `totalElements`: Quản lý phân trang.
  - `checkInLoading`, `cancelModalOpen`, `rescheduleModalOpen`, `detailModalOpen`.
- **Các hàm xử lý**:
  - `loadAppointments()`: Gọi `receptionApi.listAppointments({ date, doctorId, status, search, page })`.
  - `handleCheckIn(id)`: Gọi `receptionApi.checkIn(id)` để tiếp nhận bệnh nhân có mặt tại quầy.
  - `handleUndoCheckIn(id)`: Gọi `receptionApi.undoCheckIn(id)` để hoàn tác nếu check-in nhầm.
  - `handleCancelAppointment()`: Gọi `receptionApi.cancelAppointment(id, reason)` (Lễ tân được miễn trừ quy định 24h khi xử lý tại quầy).
  - `handleRescheduleAppointment()`: Gọi `receptionApi.rescheduleAppointment(id, newSlotId)`.

---

### 11. `src/pages/reception/ReceptionPatientsPage.jsx` (NEW - R5 Quản lý Bệnh nhân)
- **Chức năng**: Đầy đủ thao tác CRUD và Active/Deactivate bệnh nhân.
- **State variables**:
  - `patients` (`array`): Danh sách bệnh nhân.
  - `searchKeyword`, `page`, `totalPages`, `totalElements`: Tìm kiếm và phân trang.
  - `detailPatient` (`object | null`): Xem chi tiết hồ sơ bệnh nhân.
  - `createModalOpen` (`boolean`), `newPatientForm` (`object`): Form tạo mới bệnh nhân.
  - `editModalOpen` (`boolean`), `editPatientForm` (`object`): Form chỉnh sửa thông tin.
  - `statusConfirmModal` (`boolean`), `statusTarget` (`object | null`): Hộp thoại xác nhận thay đổi trạng thái tài khoản.
- **Các hàm xử lý**:
  - `loadPatients()`: Gọi `receptionApi.listPatients({ search: searchKeyword, page })`.
  - `handleCreatePatient(e)`:
    - Validate thông tin họ tên, ngày sinh, giới tính, số điện thoại, địa chỉ.
    - Gọi `receptionApi.createPatient(newPatientForm)`.
    - Thêm thành công tự động cập nhật danh sách và hiển thị thông báo.
  - `handleUpdatePatient(e)`:
    - Gọi `receptionApi.updatePatient(patientId, editPatientForm)`.
  - `handleToggleStatus(patient)`:
    - Chuyển đổi qua lại giữa `ACTIVE` và `INACTIVE`.
    - Gọi `receptionApi.updatePatientStatus(patient.id, newStatus)`.
    - Ngăn chặn người dùng bị vô hiệu hóa đăng nhập vào hệ thống.

---

### 12. `src/pages/reception/ReceptionWalkInPage.jsx` (NEW - R5 Tạo hẹn walk-in)
- **Giao diện Placeholder**:
  - Thông báo tính năng in số thứ tự Kiosk tự động tại sảnh bệnh viện đang trong quá trình tích hợp thiết bị phần cứng.
  - Hiển thị quy trình tiếp đón chuẩn (SOP) 5 bước dành cho lễ tân quầy tiếp đón.

---

### 13. `src/pages/doctor/DoctorDashboardPage.jsx` (NEW - R6 Bác sĩ)
- **Chức năng**: Không gian làm việc riêng của Bác sĩ.
- **Thành phần giao diện**:
  - Banner chào mừng cá nhân hóa theo thông tin bác sĩ đăng nhập: *"Chào mừng Bác sĩ, {user.fullName || user.username}!"*.
  - Thẻ thống kê tổng quan ca trực: Tổng số bệnh nhân đăng ký khám trong ngày, số ca đã tiếp đón, số ca đã hoàn thành khám lâm sàng.
  - Khu vực placeholder giới thiệu các tính năng lâm sàng EMR (Hồ sơ bệnh án điện tử, Kê đơn thuốc điện tử, Chỉ định cận lâm sàng).
