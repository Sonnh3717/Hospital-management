# Review & Adversarial Quality Report: Milestone 3 Patient Portal & Frontend Integration (R4)

**Reviewer**: `reviewer_m3_1_gen2`  
**Roles**: Reviewer, Adversarial Critic  
**Date**: 2026-11-02T22:15:00Z  
**Target Milestone**: Milestone 3 (R4 Patient Portal)  
**Parent Orchestrator ID**: `57be1812-6fc7-41d3-9fd8-655dc3f13abb`  
**Verdict**: **APPROVE**

---

## 1. Observation

Direct code and execution observations across the reviewed scope:

### 1.1 Patient Booking Page (`frontend/src/pages/patient/PatientBookingPage.jsx`)
- **Active Development Notice**:
  - Lines 41–51:
    ```jsx
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
      <SparklesIcon className="w-3.5 h-3.5" />
      <span>Phân hệ Đang Nâng Cấp & Chuẩn Hóa</span>
    </div>
    <h2 className="text-xl font-bold text-slate-900">
      Cổng Đặt Lịch Hẹn Trực Tuyến & Cổng Thanh Toán PayOS
    </h2>
    <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
      Hệ thống đặt hẹn tự động tích hợp điều phối ca khám trực tuyến và thanh toán viện phí qua PayOS đang được hoàn thiện. 
      Quý người bệnh vui lòng sử dụng các kênh tiếp nhận nhanh dưới đây để được hỗ trợ đặt lịch khám ngay lập tức.
    </p>
    ```
- **3 Alternative Booking Channels**:
  - Hotline 24/7 (Line 79): `<a href="tel:19006868">` with label `"1900 6868 (Miễn phí)"`.
  - Quầy tiếp đón Tầng 1 (Lines 101–106): Working hours `"07:00 – 17:00 (Thứ 2 – Chủ Nhật)"` at `"Tầng 1, Tòa nhà Khám Đa khoa"`.
  - Email CSKH (Line 125): `<a href="mailto:cskh@hospital.vn">` with label `"cskh@hospital.vn"`.
- **Navigation Shortcut**:
  - Lines 25–31: `<Link to="/patient/appointments">` with text `"Quản lý lịch hẹn của tôi"`.
- **Patient Guidelines**:
  - Lines 137–157: Important notices (arriving 15 min early, bringing chip ID/BHYT, 24h notice rule for cancellation/reschedule).

### 1.2 Patient Appointments Page (`frontend/src/pages/patient/PatientAppointmentsPage.jsx`)
- **Data Fetch & Status Counter**:
  - Lines 51–62: Calls `patientApi.getMyAppointments()`.
  - Lines 119–126: Computes `total`, `booked`, `checkedIn`, `cancelled` metrics.
  - Lines 334–351: Renders 4 summary metric cards.
- **Search & Filter Tabs**:
  - Lines 353–398: Search box matching appointment code, doctor name, specialization, symptoms/reason.
  - Status tabs: `ALL`, `BOOKED`, `CHECKED_IN`, `CANCELLED`.
- **24-Hour Notice Rule Calculation**:
  - Lines 74–84:
    ```javascript
    const check24hNotice = (startsAt) => {
      if (!startsAt) return { isEligible: false, hoursLeft: 0 };
      const now = new Date();
      const start = new Date(startsAt);
      const diffMs = start.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return {
        isEligible: diffHours >= 24,
        hoursLeft: Math.max(0, Math.round(diffHours)),
      };
    };
    ```
  - Lines 449–463: Renders emerald badge `"Đủ điều kiện đổi/hủy (>24h)"` if `isEligible`, or amber badge `"Dưới 24h trước giờ khám"` if `< 24h`.
- **Appointment Detail Modal**:
  - Lines 544–669: Renders Virtual Ticket card, appointment code, status, doctor specialty, time slot, patient phone, booking source, symptom description, doctor notes, check-in history, cancellation notes, and reschedule timestamp.
- **Appointment Cancellation Modal**:
  - Lines 672–776: Shows 24h notice advisory banner, reason preset buttons (`"Bận việc đột xuất"`, `"Sức khỏe đã ổn định"`, etc.) + textarea, calls `appointmentApi.cancel(id, reason)`, handles loading state, and renders backend error message (`cancelError`) on failure.
- **Appointment Reschedule Modal**:
  - Lines 779–918: Shows 24h notice advisory warning, date picker with `min=today`, dynamic slot querying via `appointmentApi.getAvailableSlots(date, doctorId)`, remaining capacity chips (disabling full slots), reason input, and calls `appointmentApi.reschedule(id, selectedSlotId, reason)` with loading state and backend error display.

### 1.3 API Reschedule Endpoint Alignment (`frontend/src/services/api.js`)
- Lines 114–122:
  ```javascript
  reschedule: async (id, newSlotId, reason) => {
    const payload = {
      newAppointmentSlotId: newSlotId,
      newSlotId: newSlotId,
      reason: reason || 'Đổi lịch hẹn qua cổng bệnh nhân',
    };
    const response = await api.put(`/appointments/${id}/reschedule`, payload);
    return response.data;
  },
  ```
- Backend endpoint `AppointmentController.java` line 112: `@PutMapping("/appointments/{id}/reschedule")`.
- Backend DTO `RescheduleRequest.java` line 11: `@NotNull(message = "Khung giờ khám mới không được để trống") private Long newAppointmentSlotId;`.
- The payload passes both `newAppointmentSlotId` and `newSlotId`, ensuring strict compatibility.

### 1.4 Navigation Sidebar (`frontend/src/layouts/WorkspaceLayout.jsx`)
- Lines 29–32:
  ```javascript
  PATIENT: [
    { to: '/patient/book', label: 'Đặt lịch hẹn', icon: CalendarIcon },
    { to: '/patient/appointments', label: 'Quản lý lịch hẹn', icon: ClockIcon },
  ],
  ```
- Displays current user name, role badge ("Bệnh nhân Portal"), and active link styling.

### 1.5 Build & Test Execution
- **Frontend Production Build**:
  - Command: `cd frontend; npm run build`
  - Result: Exit code 0, 97 modules transformed in 2.21s:
    ```
    dist/index.html                   0.73 kB │ gzip:   0.46 kB
    dist/assets/index-CLqZYiYN.css   49.46 kB │ gzip:   8.15 kB
    dist/assets/index-DEMcz9lT.js   410.17 kB │ gzip: 104.71 kB
    ✓ built in 2.21s
    ```
- **Automated Backend Test Suites**:
  - `AppointmentAvailableSlotsTest`: `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0`
  - `AppointmentLifecycleChallengerTest`: `Tests run: 26, Failures: 0, Errors: 0, Skipped: 0`
  - `AppointmentWorkflowIntegrationTest`: `Tests run: 4, Failures: 0, Errors: 0, Skipped: 0`
  - Total: 33/33 tests pass with 0 failures and 0 errors.

---

## 2. Logic Chain

1. **Requirement Conformance**:
   - `ORIGINAL_REQUEST.md` §R4 specifies two sub-features for the Patient Portal:
     1. Form booking placeholder indicating feature is under development.
     2. Appointment management allowing searching, viewing details, cancelling, and rescheduling appointments.
   - `PatientBookingPage.jsx` provides an aesthetic and clear placeholder communicating the ongoing PayOS & scheduling development while offering 3 concrete alternative channels (Hotline 1900 6868, Quầy tiếp đón Tầng 1, Email cskh@hospital.vn), preventing user confusion or dead ends.
   - `PatientAppointmentsPage.jsx` fully covers appointment retrieval, multi-field searching, status filtering, detailed virtual ticket viewing, 24h-aware cancellation, and dynamic slot rescheduling.

2. **24-Hour Notice Rule Defense in Depth**:
   - Client-side: `diffHours = (start - now) / 3600000`. Visual badges and modal banners alert patients whether their appointment qualifies for self-service cancellation/reschedule.
   - Server-side: `AppointmentServiceImpl` strictly enforces `Duration.between(LocalDateTime.now(), slot.getStartsAt()).toMinutes() < 1440` throwing `DEADLINE_EXCEEDED` (HTTP 400).
   - If a patient bypasses the client check or a clock skew occurs, the server rejects the operation safely, and the frontend displays the exact error message from the server inside the modal without crashing.

3. **API Contract Integrity**:
   - `RescheduleRequest.java` requires `newAppointmentSlotId`.
   - `api.js` explicitly includes `newAppointmentSlotId: newSlotId` alongside `newSlotId: newSlotId`, preventing any Jackson deserialization or `@NotNull` validation failure.

4. **Integrity & Anti-Cheating Check**:
   - No mock arrays or hardcoded appointments in component code; data flows directly from `patientApi.getMyAppointments()`.
   - Modals execute real Axios HTTP calls with loading and error states.
   - No dummy façades or fake verification artifacts detected.

---

## 3. Adversarial Challenges & Stress Tests

| # | Challenge Scenario | Attack / Stress Vector | Blast Radius | Mitigation / Verified Behavior | Result |
|---|--------------------|------------------------|--------------|--------------------------------|--------|
| 1 | Client-Server Clock Skew / 24h Boundary | Client calculates 24.1 hours left, but server time is at 23.9 hours | Unauthorized cancellation / inconsistent UI | Server strictly enforces `DEADLINE_EXCEEDED`; frontend catches error and renders `cancelError` alert banner inside modal | **PASS** |
| 2 | Concurrent Slot Booking during Reschedule | Slot has 1 seat remaining; another user books it before submit | Overbooking anomaly | Server acquires pessimistic lock (`lockById`) and validates `countActiveBySlotId >= capacity`, throwing `SLOT_FULL` (HTTP 409). Frontend displays error | **PASS** |
| 3 | IDOR on Patient Appointments | Patient caller passes foreign `patientId` query param | Data leak of other patients' appointments | `AppointmentController.getPatientAppointments` forces caller's `principal.patientId()`, ignoring query param for non-admins | **PASS** |
| 4 | Reschedule to Past Date or Expired Slot | User sets date to yesterday or earlier slot today | Invalid appointment scheduled in past | Date picker has `min=today`; backend `getAvailableSlots` excludes past dates and ended slots; server validates slot | **PASS** |
| 5 | Double Booking in Same Slot | Patient attempts to reschedule into a slot where they already have an appointment | Conflicting patient schedule | Backend verifies `hasActivePatientInSlot` and rejects with `DUPLICATE_BOOKING` (HTTP 400) | **PASS** |

---

## 4. Caveats

1. **PayOS Live Checkout**:
   - Self-booking with online PayOS checkout remains a placeholder per §R4.1 specifications and will be activated once payment gateway credentials and webhooks are linked in future milestones.
2. **Staff Reschedule Privilege**:
   - As designed in the clinical workflow, receptionists can reschedule or cancel appointments without the 24-hour restriction, whereas patients are strictly bound by the 24-hour notice rule.

---

## 5. Conclusion

The R4 Patient Portal implementation and frontend integration meet all requirements from `ORIGINAL_REQUEST.md` (§R4) and `PROJECT.md`. The implementation is robust, adheres to security best practices, correctly handles edge cases, and has zero integrity violations.

**Verdict**: **APPROVE**

---

## 6. Verification Method

To independently verify this implementation:

1. **Frontend Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected Result*: Exit code 0, 97 modules transformed, bundle generated in `dist/`.

2. **Backend Automated Tests**:
   ```powershell
   cd backend/swd
   mvn test "-Dtest=AppointmentAvailableSlotsTest,AppointmentLifecycleChallengerTest,AppointmentWorkflowIntegrationTest"
   ```
   *Expected Result*: 33/33 tests pass with 0 failures and 0 errors.

3. **Manual Browser UI Verification**:
   - Log in as patient (`patient` / `Password123!`).
   - Navigate to `/patient/book`: confirm development notice, hotline 1900 6868, quầy tầng 1, email cskh@hospital.vn, and link back to appointments.
   - Navigate to `/patient/appointments`: confirm metric cards, search box, status tabs, 24h notice badges, detail modal, cancel modal, and reschedule modal.
