# Handoff Report: R4 Patient Portal Investigation & Technical Blueprint

**Explorer**: `explorer_m3_1_gen2`  
**Role**: Patient Portal Explorer  
**Date**: 2026-11-02T21:42:00Z  
**Milestone**: Milestone 3 (R4: Patient Portal)  
**Parent Orchestrator ID**: `57be1812-6fc7-41d3-9fd8-655dc3f13abb`

---

## 1. Observation

### 1.1 Layout & Routing Verification
- **File**: `frontend/src/layouts/WorkspaceLayout.jsx`
  - Lines 29-32:
    ```javascript
    PATIENT: [
      { to: '/patient/book', label: 'Đặt lịch hẹn', icon: CalendarIcon },
      { to: '/patient/appointments', label: 'Quản lý lịch hẹn', icon: ClockIcon },
    ],
    ```
  - Both navigation links `Đặt lịch hẹn` (`/patient/book`) and `Quản lý lịch hẹn` (`/patient/appointments`) are already rendered in the patient sidebar.
- **File**: `frontend/src/App.jsx`
  - Lines 36-42:
    ```javascript
    {/* Protected Patient Portal */}
    <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
      <Route element={<WorkspaceLayout role="PATIENT" />}>
        <Route path="/patient" element={<Navigate to="/patient/appointments" replace />} />
        <Route path="/patient/appointments" element={<PatientAppointmentsPage />} />
        <Route path="/patient/book" element={<PatientBookingPage />} />
      </Route>
    </Route>
    ```
  - Routes `/patient/appointments` and `/patient/book` are protected and mapped to their respective page components.

### 1.2 Current Page Implementations
- **File**: `frontend/src/pages/patient/PatientBookingPage.jsx` (Lines 1-33)
  - Contains minimal skeleton (33 lines) without comprehensive alternative booking instructions (hotline 1900 6868, counter instructions, etc.).
- **File**: `frontend/src/pages/patient/PatientAppointmentsPage.jsx` (Lines 1-34)
  - Contains static placeholder card (34 lines) with no API calls, no search, no status filter, and no modals.

### 1.3 Backend Controller & Endpoints
- **File**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
  1. `GET /api/patient/appointments` (Lines 137-158):
     - Role required: `PATIENT` or `ADMIN`.
     - Automatically resolves `patientId` from `principal.patientId()` or queries `patientRepository.findByUserAccount_Id(principal.accountId())`.
     - Returns `ApiResponse<List<AppointmentResponse>>`.
  2. `GET /api/appointments/{id}` (Lines 127-132):
     - Role required: `isAuthenticated()`.
     - Returns `ApiResponse<AppointmentResponse>`.
  3. `POST /api/appointments/{id}/cancel` (Lines 97-107):
     - Role required: `isAuthenticated()`.
     - Body: `CancelAppointmentRequest` containing `@NotBlank private String reason;`.
     - Passes `isPatient = "PATIENT".equalsIgnoreCase(principal.role())` to service.
  4. `PUT /api/appointments/{id}/reschedule` (Lines 112-122):
     - Role required: `isAuthenticated()`.
     - Body: `RescheduleRequest`.
     - Passes `isPatient = "PATIENT".equalsIgnoreCase(principal.role())` to service.
  5. `GET /api/appointments/available-slots` (Lines 86-92):
     - Publicly accessible via `SecurityConfig.java` line 58 (`permitAll()`).
     - Query parameters: `@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`, `@RequestParam(required = false) Long doctorId`.
     - Returns `ApiResponse<List<WorkflowViews.SlotView>>`.

### 1.4 Critical DTO Schemas & Payload Deserialization Mismatch
- **File**: `backend/swd/src/main/java/com/example/swd/dto/request/RescheduleRequest.java`
  - Lines 8-15:
    ```java
    @Getter
    @Setter
    public class RescheduleRequest {
        @NotNull(message = "Khung giờ khám mới không được để trống")
        private Long newAppointmentSlotId;

        private String reason;
    }
    ```
- **File**: `frontend/src/services/api.js`
  - Lines 114-117:
    ```javascript
    reschedule: async (id, newSlotId, reason) => {
      const response = await api.put(`/appointments/${id}/reschedule`, { newSlotId, reason });
      return response.data;
    },
    ```
  - **CRITICAL MISMATCH OBSERVED**: `frontend/src/services/api.js` sends `{ newSlotId, reason }`, but backend `RescheduleRequest.java` expects field name `newAppointmentSlotId`. Without passing `newAppointmentSlotId`, Jackson deserializes `newAppointmentSlotId` as `null`, causing validation failure with HTTP 400: `"Khung giờ khám mới không được để trống"`.
  - Fix: Frontend payload must supply `newAppointmentSlotId: newSlotId`.

- **File**: `backend/swd/src/main/java/com/example/swd/dto/request/CancelAppointmentRequest.java`
  - Lines 8-13:
    ```java
    @Getter
    @Setter
    public class CancelAppointmentRequest {
        @NotBlank(message = "Lý do hủy lịch không được để trống")
        private String reason;
    }
    ```
  - Matches `{ reason }` sent by `appointmentApi.cancel(id, reason)`.

- **File**: `backend/swd/src/main/java/com/example/swd/dto/response/AppointmentResponse.java`
  - Fields available:
    - `id`: Long
    - `appointmentCode`: String (e.g. `APT-BOOKED-20261102`)
    - `status`: String (`BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`)
    - `bookingSource`: String (`ONLINE`, `ASSISTED`, `WALK_IN`)
    - `reason`: String (Chief complaint/symptoms)
    - `note`: String
    - `patientId`: Long, `patientName`: String, `patientPhone`: String, `patientGender`: String
    - `slotId`: Long, `startsAt`: LocalDateTime, `endsAt`: LocalDateTime
    - `doctorId`: Long, `doctorName`: String, `specialization`: String
    - `checkedInAt`: LocalDateTime, `checkedInByStaffName`: String
    - `cancelledAt`: LocalDateTime, `cancellationReason`: String
    - `lastRescheduledAt`: LocalDateTime, `lastCheckInReversedAt`: LocalDateTime

- **File**: `backend/swd/src/main/java/com/example/swd/dto/response/WorkflowViews.java`
  - Line 11:
    ```java
    public record SlotView(Long id, Long doctorId, String doctorName, String specialization,
                           String startsAt, String endsAt, Integer capacity, int remaining) {}
    ```

### 1.5 24-Hour Notice Rule & Business Rules in Service
- **File**: `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`
  - In `cancelAppointment` (Lines 145-161):
    - Status must be `Appointment.Status.BOOKED`. If not, throws `WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS", "Lịch hẹn không ở trạng thái có thể hủy")`.
    - If `isPatient == true`:
      ```java
      Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
      if (duration.toMinutes() < 1440) {
          throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                  "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ");
      }
      ```
  - In `rescheduleAppointment` (Lines 179-195):
    - Status must be `Appointment.Status.BOOKED`.
    - If `isPatient == true`:
      ```java
      Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
      if (duration.toMinutes() < 1440) {
          throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                  "Chỉ được phép đổi lịch hẹn trước giờ khám tối thiểu 24 giờ");
      }
      ```
    - New slot validation (Lines 197-214):
      - Slot must exist (`SLOT_NOT_FOUND`)
      - Status must be `OPEN` (`SLOT_NOT_OPEN`)
      - Capacity not exceeded (`SLOT_FULL`)
      - No duplicate active booking for patient in target slot (`DUPLICATE_BOOKING`).

### 1.6 Global Exception Serialization
- **File**: `backend/swd/src/main/java/com/example/swd/exception/GlobalExceptionHandler.java`
  - Lines 25-31:
    ```java
    public record ErrorView(String code, String message, Map<String, String> fieldErrors, List<String> blockers) {}

    @ExceptionHandler(WorkflowException.class)
    ResponseEntity<ErrorView> workflow(WorkflowException ex) {
        return ResponseEntity.status(ex.getStatus()).body(new ErrorView(ex.getCode(), ex.getMessage(),
                ex.getFieldErrors(), ex.getBlockers()));
    }
    ```
  - When backend throws `DEADLINE_EXCEEDED`, response is HTTP 400 with JSON:
    `{ "code": "DEADLINE_EXCEEDED", "message": "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ" }`.
  - Frontend Axios catches this in `error.response.data.message`.

### 1.7 Seed Data Available for Testing
- **File**: `backend/swd/src/main/resources/db/showcase_demo_seed.sql`
  - User: `patient` / `patient@hospital.vn` (Password: `Password123!`)
  - Appointment 1: `APT-CHKIN-<today>` (Status: `CHECKED_IN`, doctor staff id 2)
  - Appointment 2: `APT-BOOKED-<today>` (Status: `BOOKED`, starts tomorrow > 24h away, slot 5)
  - Available Slot: Slot 6 tomorrow (08:30 - 09:00, OPEN, capacity 3) ready for rescheduling test.

---

## 2. Logic Chain

1. **Routing & Sidebar Integration**:
   - `WorkspaceLayout.jsx` already renders `Đặt lịch hẹn` (`/patient/book`) and `Quản lý lịch hẹn` (`/patient/appointments`).
   - `App.jsx` already declares these routes inside `ProtectedRoute allowedRoles={['PATIENT']}`.
   - Therefore, no routing structural overhaul is required; the focus is implementing the full UI and behavior inside `PatientBookingPage.jsx` and `PatientAppointmentsPage.jsx`.

2. **Patient Booking Page (`PatientBookingPage.jsx`) Design**:
   - Per §R4 of `ORIGINAL_REQUEST.md`, online booking is a placeholder informing the user that the feature is under development.
   - Per `DISPATCH.md`, this page must present a clean, modern card highlighting active development, while providing alternative booking methods:
     - 24/7 Hotline: **1900 6868**
     - Walk-in / In-person booking at hospital registration counters (Tầng 1 - 07:00 đến 17:00)
     - Customer support email: `cskh@hospital.vn`
     - Quick navigation button back to `/patient/appointments`.

3. **Patient Appointments Management Page (`PatientAppointmentsPage.jsx`) Architecture**:
   - **State Machine**:
     - `appointments`: Array loaded via `patientApi.getMyAppointments()`.
     - `loading`: Boolean for initial fetch and refresh.
     - `searchQuery`: String for filter matching `appointmentCode`, `doctorName`, `specialization`, `reason`.
     - `statusFilter`: Filter value in `['ALL', 'BOOKED', 'CHECKED_IN', 'CANCELLED', 'NO_SHOW']`.
     - `selectedAppointment`: Appointment currently viewed in Detail Modal.
     - `cancellingAppointment`: Appointment targeted for cancellation in Cancel Modal.
     - `reschedulingAppointment`: Appointment targeted for rescheduling in Reschedule Modal.
     - `notification`: Toast / banner message `{ type: 'success' | 'error', message: string }`.

4. **Client-Side 24-Hour Notice Verification**:
   - Calculate notice window:
     ```javascript
     const diffMinutes = Math.floor((new Date(appointment.startsAt).getTime() - Date.now()) / 60000);
     const isNoticeMet = diffMinutes >= 1440; // 24h = 1440 mins
     ```
   - For `status === 'BOOKED'`:
     - If `isNoticeMet === true`: Display badge "Có thể hủy / đổi lịch (>24h)" in green.
     - If `isNoticeMet === false`: Display badge "Không đủ 24h notice" in amber/yellow.
   - For Cancel & Reschedule Modals:
     - Prominently display a warning banner if `!isNoticeMet`.
     - If user proceeds, backend validation is enforced and exact error message (`DEADLINE_EXCEEDED`) is captured and displayed.

5. **Detail Modal**:
   - Displays all metadata from `AppointmentResponse`:
     - Patient demographic summary (`fullName`, `phone`, `gender`).
     - Clinical appointment info (`appointmentCode`, `status`, `doctorName`, `specialization`, `startsAt`, `endsAt`, `bookingSource`, `reason`, `note`).
     - Check-in info (`checkedInAt`, `checkedInByStaffName`) if checked in.
     - Cancellation info (`cancelledAt`, `cancellationReason`) if cancelled.
     - Rescheduled info (`lastRescheduledAt`) if rescheduled.
     - Visual appointment ticket representation.

6. **Cancel Modal Flow**:
   - Requires non-empty reason (`@NotBlank` in `CancelAppointmentRequest`).
   - Quick selection buttons + custom textarea.
   - Calls `appointmentApi.cancel(appointment.id, reason)`.
   - On success: refreshes appointment list, closes modal, displays success alert.
   - On failure: catches `error.response?.data?.message` and displays within modal error banner.

7. **Reschedule Modal Flow**:
   - Date picker `<input type="date" min={today} />`.
   - Automatically queries `appointmentApi.getAvailableSlots(date, doctorId)`.
   - Displays clickable slot badges with remaining capacity.
   - Captures optional reason.
   - Calls `appointmentApi.reschedule(appointment.id, selectedSlotId, reason)` sending both `newAppointmentSlotId` and `newSlotId`.
   - On success: refreshes appointment list, closes modal, displays success alert.
   - On failure: catches error response (`DEADLINE_EXCEEDED`, `SLOT_FULL`, etc.) and displays in modal.

---

## 3. Caveats

1. **Non-`BOOKED` Cancellation/Rescheduling**:
   - Backend strictly rejects cancelling or rescheduling appointments whose status is not `BOOKED` (e.g., `CHECKED_IN` or `CANCELLED`) with 400 `INVALID_STATUS`.
   - Action buttons for cancel and reschedule must be disabled/hidden if `appointment.status !== 'BOOKED'`.
2. **Missing Slots on Selected Date**:
   - If a doctor has no scheduled shifts on the selected reschedule date, `available-slots` returns an empty array.
   - Reschedule modal must render a helpful empty state ("Không có ca khám khả dụng ngày này, vui lòng chọn ngày khác").
3. **Payload Key Alignment**:
   - `frontend/src/services/api.js` line 115 must be updated so `reschedule` includes `newAppointmentSlotId: newSlotId`.
4. **Timezone Handling**:
   - Timestamps from backend `AppointmentResponse.startsAt` are LocalDateTime strings without timezone suffix (e.g. `2026-11-04T08:00:00`), whereas `SlotView.startsAt` is UTC with `Z` (e.g. `2026-11-04T01:00:00Z`).
   - Use safe parsing to display hours consistently in Vietnam time (+07:00).

---

## 4. Conclusion & Implementation Blueprint for Worker M3

### Blueprint 4.1: Update `frontend/src/services/api.js`
In `frontend/src/services/api.js`, update `appointmentApi.reschedule` to:
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

### Blueprint 4.2: Replace `frontend/src/pages/patient/PatientBookingPage.jsx`
Replace existing placeholder with a comprehensive, beautifully styled landing card with:
- Top breadcrumbs & back link to `/patient/appointments`
- Main hero banner with hospital logo & status badge
- Development status card explaining PayOS & doctor real-time slot sync
- 3 alternative booking cards (Hotline 1900 6868 24/7, Quầy tiếp đón Tầng 1, Email cskh@hospital.vn)
- Direct link buttons to view appointments.

### Blueprint 4.3: Implement `frontend/src/pages/patient/PatientAppointmentsPage.jsx`
Implement complete production-grade component including:
- Top header with Title and "Đặt lịch khám mới" CTA button.
- Summary metrics bar (Total, Booked, Checked-in, Cancelled).
- Search bar (by doctor, code, specialty, symptoms) + status tabs (ALL, BOOKED, CHECKED_IN, CANCELLED, NO_SHOW) + Refresh button.
- Responsive appointment cards / table with:
  - Appointment Code & status badge
  - 24h Notice compliance indicator
  - Doctor name, specialty, date, and time slot
  - Chief complaint / reason
  - Quick action buttons (Chi tiết, Đổi lịch, Hủy hẹn)
- Modals:
  - **Appointment Detail Modal**: Displays full clinical and patient details, check-in history, cancellation reason, and electronic ticket card.
  - **Cancel Appointment Modal**: 24h notice rule check & warning, reason options + custom textarea, submit with loading state, backend error rendering.
  - **Reschedule Appointment Modal**: 24h notice rule warning, date picker, slot loader with remaining capacity chips, optional reason, submit with loading state.

### Blueprint 4.4: Icons Support
Ensure common icons (`SearchIcon`, `FilterIcon`, `RefreshCwIcon`, `CalendarIcon`, `ClockIcon`, `CheckCircleIcon`, `AlertCircleIcon`, `XIcon`, `EyeIcon`, `PhoneIcon`, `MapPinIcon`) are available in `Icons.jsx` or declared cleanly within the component.

---

## 5. Verification Method

### 5.1 Build & Unit Test Verification
1. **Frontend Compilation Check**:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected result*: Exit code 0, 0 compilation errors.
2. **Backend Unit/Integration Tests Check**:
   ```powershell
   cd backend/swd
   ./mvnw test-compile
   ./mvnw test -Dtest=AppointmentWorkflowIntegrationTest,AppointmentLifecycleChallengerTest
   ```
   *Expected result*: Exit code 0, all appointment tests pass.

### 5.2 Manual UI & E2E Scenario Verification
1. **Scenario 1 - Patient Booking Placeholder (R4.1)**:
   - Login as `patient` (Password: `Password123!`).
   - Navigate to `/patient/book`.
   - Verify placeholder card is displayed with notice that online booking is in development.
   - Verify alternative booking methods are prominently visible: Hotline `1900 6868`, Quầy Tiếp đón tầng 1, Email `cskh@hospital.vn`.
   - Click "Quay lại danh sách lịch hẹn" -> verifies redirection to `/patient/appointments`.

2. **Scenario 2 - Appointment List & Search (R4.2)**:
   - Navigate to `/patient/appointments`.
   - Verify list loads appointments from `GET /api/patient/appointments` (`APT-BOOKED-...`, `APT-CHKIN-...`).
   - Type appointment code or doctor name in search box -> verify list filters instantly.
   - Click status filter chips (`BOOKED`, `CHECKED_IN`, `CANCELLED`) -> verify filtering works correctly.

3. **Scenario 3 - Appointment Detail Modal (R4.3)**:
   - Click "Chi tiết" on an appointment.
   - Verify modal opens showing patient demographic info, doctor name, specialization, time slot, appointment code, and reason.
   - Click "Đóng" -> modal closes.

4. **Scenario 4 - Cancel Appointment with 24h Rule (R4.4)**:
   - On appointment `APT-BOOKED-...` (scheduled for tomorrow, > 24h):
     - Click "Hủy hẹn".
     - Verify notice badge indicates appointment is eligible for cancellation (>24h).
     - Select reason "Bận công việc đột xuất", click "Xác nhận hủy hẹn".
     - Verify API returns 200, status changes to `CANCELLED`, and cancellation reason appears.
   - On appointment scheduled < 24h away (e.g. today):
     - Attempt cancellation -> verify warning is shown, backend responds with 400 `DEADLINE_EXCEEDED`, and UI displays error message "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ".

5. **Scenario 5 - Reschedule Appointment (R4.5)**:
   - On a `BOOKED` appointment > 24h away:
     - Click "Đổi lịch".
     - Select tomorrow's date in date picker.
     - Verify available slots are fetched via `GET /api/appointments/available-slots`.
     - Click an available slot chip.
     - Click "Xác nhận đổi lịch".
     - Verify API returns 200, appointment list updates with new time slot.
