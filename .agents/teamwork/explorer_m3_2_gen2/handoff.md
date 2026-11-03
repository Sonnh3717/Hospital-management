# Handoff Report: R5 Receptionist Appointments and Walk-in Blueprint

**Agent**: `explorer_m3_2_gen2`  
**Role**: Receptionist Appointments Explorer  
**Milestone**: M3 (Role-Based Dashboards & Management)  
**Target Recipient**: Worker M3 / Parent Orchestrator (`57be1812-6fc7-41d3-9fd8-655dc3f13abb`)  
**Date**: 2026-11-02T21:45:00Z  

---

## 1. Observation

### 1.1. Layout & Route Integration
- **`frontend/src/layouts/WorkspaceLayout.jsx`** (lines 33–37):
  ```javascript
  RECEPTIONIST: [
    { to: '/reception/walk-in', label: 'Tạo hẹn khám walk-in', icon: UserPlusIcon },
    { to: '/reception/appointments', label: 'Quản lý lịch hẹn', icon: CalendarCheckIcon },
    { to: '/reception/patients', label: 'Quản lý bệnh nhân', icon: UserGroupIcon },
  ],
  ```
  The sidebar items strictly match the user specifications in `ORIGINAL_REQUEST.md` §R5.
- **`frontend/src/App.jsx`** (lines 45–52):
  ```javascript
  <Route element={<ProtectedRoute allowedRoles={['RECEPTIONIST', 'ADMIN']} />}>
    <Route element={<WorkspaceLayout role="RECEPTIONIST" />}>
      <Route path="/reception" element={<Navigate to="/reception/appointments" replace />} />
      <Route path="/reception/appointments" element={<ReceptionAppointmentsPage />} />
      <Route path="/reception/patients" element={<ReceptionPatientsPage />} />
      <Route path="/reception/walk-in" element={<ReceptionWalkInPage />} />
    </Route>
  </Route>
  ```
  Routes are configured and guarded for roles `RECEPTIONIST` and `ADMIN`.

### 1.2. Frontend Current State & API Client
- **`frontend/src/pages/reception/ReceptionWalkInPage.jsx`**: Currently a 24-line placeholder card.
- **`frontend/src/pages/reception/ReceptionAppointmentsPage.jsx`**: Currently a 24-line placeholder card.
- **`frontend/src/services/api.js`** (lines 128–182): `receptionApi` is already declared and exported with:
  ```javascript
  export const receptionApi = {
    listAppointments: async (params = {}) => {
      const response = await api.get('/reception/appointments', { params });
      return response.data;
    },
    getAppointmentDetail: async (id) => {
      const response = await api.get(`/reception/appointments/${id}`);
      return response.data;
    },
    getOptions: async (date) => {
      const response = await api.get('/reception/options', { params: { date } });
      return response.data;
    },
    createAppointment: async (data) => {
      const response = await api.post('/reception/appointments', data);
      return response.data;
    },
    checkIn: async (id) => {
      const response = await api.post(`/reception/appointments/${id}/check-in`);
      return response.data;
    },
    undoCheckIn: async (id) => {
      const response = await api.post(`/reception/appointments/${id}/undo-check-in`);
      return response.data;
    },
    cancelAppointment: async (id, reason) => {
      const response = await api.post(`/reception/appointments/${id}/cancel`, { reason });
      return response.data;
    },
    rescheduleAppointment: async (id, slotId) => {
      const response = await api.post(`/reception/appointments/${id}/reschedule`, { slotId });
      return response.data;
    },
    // ... patient CRUD methods
  };
  ```

### 1.3. Backend Controller & Endpoints
- File: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`
- Base Path: `@RequestMapping("/api/reception")`, `@PreAuthorize("hasRole('RECEPTIONIST')")`
- Endpoints:
  1. `GET /api/reception/appointments`:
     - Parameters:
       - `@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`
       - `@RequestParam(required = false) Long doctorId`
       - `@RequestParam(required = false) Appointment.Status status` (Enum: `BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`)
       - `@RequestParam(required = false) String search` (Matches `appointmentCode`, `patientCode`, `fullName`, `phone` via SQL `LIKE %...%`)
       - `@RequestParam(defaultValue = "0") int page`
       - `@RequestParam(defaultValue = "20") int size` (Range: `1 <= size <= 100`)
     - Return type: `PageView<AppointmentView>`
  2. `GET /api/reception/appointments/{id}`:
     - Return type: `AppointmentView`
  3. `GET /api/reception/options`:
     - Parameters: `@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`
     - Return type: `ReceptionOptions` (`List<DoctorView> doctors`, `List<SlotView> slots`)
  4. `POST /api/reception/appointments/{id}/check-in`:
     - Return type: `AppointmentView`
  5. `POST /api/reception/appointments/{id}/undo-check-in`:
     - Return type: `AppointmentView`
  6. `POST /api/reception/appointments/{id}/cancel`:
     - Request body: `@Valid @RequestBody(required = false) CancelAppointment input` (`reason` string, max 500 chars)
     - Return type: `AppointmentView`
  7. `POST /api/reception/appointments/{id}/reschedule`:
     - Request body: `@Valid @RequestBody RescheduleAppointment input` (`slotId` Long, `@NotNull @Positive`)
     - Return type: `AppointmentView`

### 1.4. Backend Data Models & DTO Structures
- File: `backend/swd/src/main/java/com/example/swd/dto/response/WorkflowViews.java`:
  ```java
  public record PatientView(Long id, String patientCode, String fullName, LocalDate dateOfBirth,
                            String gender, String phone, String contactEmail) {}
  public record DoctorView(Long id, String fullName, String specialization) {}
  public record SlotView(Long id, Long doctorId, String doctorName, String specialization,
                         String startsAt, String endsAt, Integer capacity, int remaining) {}
  public record AppointmentView(Long id, String appointmentCode, PatientView patient, DoctorView doctor,
                                SlotView slot, String bookingSource, String status, String reason,
                                String note, String checkedInAt, Long encounterId, String encounterStatus) {}
  public record PageView<T>(List<T> items, long total, int page, int size) {}
  public record ReceptionOptions(List<DoctorView> doctors, List<SlotView> slots) {}
  ```
- File: `backend/swd/src/main/java/com/example/swd/entity/appointment/Appointment.java`:
  - `Appointment.Status` enum: `BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW` (lines 124–126).
  - `Appointment.BookingSource` enum: `ONLINE`, `ASSISTED`, `WALK_IN` (lines 120–122).
- File: `backend/swd/src/main/java/com/example/swd/entity/encounter/Encounter.java`:
  - `Encounter.Status` enum: `IN_PROGRESS`, `COMPLETED` (lines 72–74).

### 1.5. Automated Verification Results
- Maven test execution:
  - Command: `mvn test -Dtest=ReceptionAppointmentServiceStaffResolutionTest`
  - Output (`backend/swd/target/surefire-reports/com.example.swd.service.ReceptionAppointmentServiceStaffResolutionTest.txt`):
    `Tests run: 7, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.043 s`
- Frontend build execution:
  - Command: `cd frontend; npm run build`
  - Output: `✓ built in 1.95s` (dist/assets/index-*.js: 297.21 kB, zero syntax or bundling errors).

---

## 2. Logic Chain

### 2.1. State Machine & Transition Rules
Directly verified against `ReceptionAppointmentServiceImpl.java`:

```
               [BOOKED] (Chờ tiếp đón)
             /    |    \
 (checkIn)  /     |     \ (cancel)
           v      |      v
     [CHECKED_IN] |   [CANCELLED] (Đã hủy)
           |      |
(undoCheckIn)     | (reschedule to new slot)
           |      |
           v      v
        [BOOKED] -+
           |
     (Encounter Created)
           v
  [IN_PROGRESS] (Đang khám)
           v
   [COMPLETED] (Đã khám xong)
```

1. **`BOOKED` -> `CHECKED_IN`** (`POST /api/reception/appointments/{id}/check-in`):
   - Observation: `ReceptionAppointmentServiceImpl.java` (lines 176–189).
   - Prerequisite 1: `status == BOOKED`.
   - Prerequisite 2: `slot.startsAt` converted to Vietnam timezone (`Asia/Ho_Chi_Minh`) must equal `today()`. Line 181:
     `if (!appointment.getAppointmentSlot().getStartsAt().atOffset(ZoneOffset.UTC).atZoneSameInstant(VIETNAM).toLocalDate().equals(today())) throw state("Chỉ check-in lịch hẹn thuộc ngày tiếp nhận hôm nay.");`
   - Prerequisite 3: No clinical encounter commenced (`encounterId == null`).
   - Effect: Sets `status = CHECKED_IN`, `checkedInAt = now()`, `checkedInByStaff = effectiveStaff`.

2. **`CHECKED_IN` -> `BOOKED`** (`POST /api/reception/appointments/{id}/undo-check-in`):
   - Observation: `ReceptionAppointmentServiceImpl.java` (lines 191–204).
   - Prerequisite 1: `status == CHECKED_IN`.
   - Prerequisite 2: No clinical encounter commenced (`requireNoEncounter`).
   - Effect: Sets `status = BOOKED`, clears `checkedInAt = null`, `checkedInByStaff = null`, records `lastCheckInReversedAt = now()`, `lastCheckInReversedByStaff = effectiveStaff`.

3. **`BOOKED` or `CHECKED_IN` -> `CANCELLED`** (`POST /api/reception/appointments/{id}/cancel`):
   - Observation: `ReceptionAppointmentServiceImpl.java` (lines 206–220).
   - Prerequisite 1: `status == BOOKED` or `status == CHECKED_IN`.
   - Prerequisite 2: No clinical encounter commenced (`requireNoEncounter`).
   - Effect: Sets `status = CANCELLED`, clears check-in if checked in, records `cancelledAt = now()`, `cancelledByAccount = actor.account`, `cancellationReason = reason`.

4. **`BOOKED` -> `BOOKED` (Reschedule)** (`POST /api/reception/appointments/{id}/reschedule`):
   - Observation: `ReceptionAppointmentServiceImpl.java` (lines 223–237).
   - Prerequisite 1: `status == BOOKED`. If `CHECKED_IN`, backend explicitly throws:
     `if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Hoàn tác check-in trước khi đổi lịch.");`
   - Prerequisite 2: No clinical encounter commenced (`requireNoEncounter`).
   - Prerequisite 3: Destination slot is open, ends in future, has remaining capacity, and patient has no duplicate active appointment in that slot.
   - Effect: Updates appointment to destination slot, records `lastRescheduledAt = now()`, `lastRescheduledByAccount = actor.account`.

### 2.2. Counter Privilege Rules (24h Notice Exemption)
- Observation: `ReceptionAppointmentServiceStaffResolutionTest.java` (lines 206–259).
- Patient-facing cancellation and rescheduling in `AppointmentServiceImpl.java` enforce a minimum notice rule (`minNoticeHours = 24`), rejecting same-day changes with `NOTICE_TOO_SHORT`.
- In `ReceptionAppointmentServiceImpl.java`, neither `cancel()` nor `reschedule()` checks notice hours. A receptionist at the hospital desk can cancel or reschedule appointments scheduled 15 minutes away.

### 2.3. Encounter Guard
- Observation: `ReceptionAppointmentServiceImpl.java` (lines 259–261):
  ```java
  private void requireNoEncounter(Appointment appointment, String message) {
      if (encounter(appointment.getId()) != null) throw new WorkflowException(HttpStatus.CONFLICT, "ENCOUNTER_STARTED", message);
  }
  ```
- If a doctor has started the consultation (`encounterId != null`), any attempt by the receptionist to check-in, undo check-in, cancel, or reschedule is strictly rejected with HTTP 409 Conflict (`ENCOUNTER_STARTED`).
- The UI must disable action buttons when `appointment.encounterId != null` or `appointment.encounterStatus != null`.

---

## 3. Caveats

1. **Status Enum Mapping vs. Display Terminology**:
   - The database entity `Appointment.Status` only defines: `BOOKED`, `CHECKED_IN`, `CANCELLED`, `NO_SHOW`.
   - The user request mentions `CONFIRMED` and `COMPLETED`:
     - `CONFIRMED` corresponds exactly to `BOOKED` in the database. When the user filters for "Chờ tiếp đón / Đã xác nhận", the client MUST send `status=BOOKED`.
     - `COMPLETED` is NOT an enum value in `Appointment.Status`. Visit completion is stored in `encounters.status = COMPLETED`.
     - Sending `status=CONFIRMED` or `status=COMPLETED` in query parameters to `GET /api/reception/appointments` will cause Spring Boot to throw `MethodArgumentTypeMismatchException` (HTTP 400 Bad Request).
   - **Guidance**:
     - Status dropdown filter options:
       - `ALL` (`""`) -> omit `status` param.
       - `BOOKED` (`"BOOKED"`) -> label "Chờ tiếp đón (Đã xác nhận)".
       - `CHECKED_IN` (`"CHECKED_IN"`) -> label "Đã tiếp đón".
       - `CANCELLED` (`"CANCELLED"`) -> label "Đã hủy".
       - `NO_SHOW` (`"NO_SHOW"`) -> label "Vắng mặt".
     - Badge display in table:
       - If `appointment.encounterStatus === 'COMPLETED'` -> render Teal badge "Đã khám" (Completed).
       - If `appointment.encounterStatus === 'IN_PROGRESS'` -> render Purple badge "Đang khám".
       - If `appointment.status === 'CHECKED_IN'` (no encounter) -> render Emerald badge "Đã tiếp đón".
       - If `appointment.status === 'BOOKED'` -> render Sky badge "Chờ tiếp đón".
       - If `appointment.status === 'CANCELLED'` -> render Rose badge "Đã hủy".
       - If `appointment.status === 'NO_SHOW'` -> render Amber badge "Vắng mặt".

2. **Check-in Today Constraint**:
   - Check-in is valid ONLY if the appointment slot falls on today in Vietnam time (`Asia/Ho_Chi_Minh`).
   - If a receptionist clicks "Tiếp đón" on an appointment scheduled for tomorrow, backend returns HTTP 409: "Chỉ check-in lịch hẹn thuộc ngày tiếp nhận hôm nay."
   - **Guidance**: In the table or confirmation modal, check if `appointment.slot.startsAt` matches today's date. If not, show a warning badge or disable the button with tooltip: "Chỉ tiếp đón lịch trong ngày hôm nay".

3. **Reschedule Prerequisite**:
   - An appointment that is already `CHECKED_IN` cannot be rescheduled directly. The receptionist must first click "Hoàn tác tiếp đón" (reverting to `BOOKED`), then click "Đổi lịch".
   - **Guidance**: The UI should only show the "Đổi lịch" button when `appointment.status === 'BOOKED'`.

---

## 4. Conclusion & Implementation Recommendations for Worker M3

### 4.1. File 1: `frontend/src/pages/reception/ReceptionWalkInPage.jsx`
Implement a modern, user-friendly walk-in reception card with counter workflow guidance and quick navigation shortcuts:

```jsx
import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlusIcon,
  CalendarCheckIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '../../components/common/Icons';

export default function ReceptionWalkInPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tạo hẹn khám trực tiếp (Walk-in)</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tiếp đón và phân luồng bệnh nhân vãng lai chưa đặt lịch trước tại quầy lễ tân Tầng 1
        </p>
      </div>

      {/* Modern Active Development Announcement */}
      <div className="bg-gradient-to-br from-teal-50 via-sky-50 to-emerald-50 rounded-2xl border border-teal-200/80 p-8 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-teal-600/20">
            <UserPlusIcon className="w-8 h-8" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-semibold">
              <SparklesIcon className="w-3.5 h-3.5" />
              <span>Phân hệ Đang Phát Triển & Chuẩn Hóa Kiosk</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Hệ Thống Đặt Số Khám Tự Động (Walk-in Ticketing)</h2>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              Tính năng cấp số khám tự động tại quầy và tích hợp Kiosk tự phục vụ đang được hoàn thiện. 
              Hiện tại, nhân viên tiếp đón thực hiện theo quy trình chuẩn dưới đây để tra cứu hồ sơ và tiếp đón người bệnh.
            </p>
          </div>
        </div>
      </div>

      {/* Standard Operating Procedure (SOP) Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5 text-sky-600" />
          <span>Quy trình Tiếp đón Khám Trực tiếp tại Quầy</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">1</div>
            <h4 className="font-bold text-slate-800 text-sm">Tra cứu hồ sơ người bệnh</h4>
            <p className="text-xs text-slate-500">
              Kiểm tra thông tin bệnh nhân qua CCCD/SĐT trên hệ thống. Nếu là bệnh nhân mới, tạo mới hồ sơ bệnh nhân.
            </p>
            <Link
              to="/reception/patients"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-1"
            >
              <span>Quản lý bệnh nhân &rarr;</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <h4 className="font-bold text-slate-800 text-sm">Kiểm tra ca khám & Tiếp đón</h4>
            <p className="text-xs text-slate-500">
              Tra cứu danh sách lịch hẹn trong ngày, tiếp đón bệnh nhân đến khám và xác nhận check-in vào hàng chờ.
            </p>
            <Link
              to="/reception/appointments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 pt-1"
            >
              <span>Quản lý lịch hẹn &rarr;</span>
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white text-xs font-bold flex items-center justify-center">3</div>
            <h4 className="font-bold text-slate-800 text-sm">Điều phối vào phòng khám</h4>
            <p className="text-xs text-slate-500">
              Hướng dẫn người bệnh tới sảnh chờ chuyên khoa tương ứng theo số phòng chỉ định trên phiếu khám.
            </p>
            <span className="text-xs text-slate-400 font-medium">Bác sĩ tiếp nhận trên Bàn làm việc</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/reception/appointments"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-sky-300 hover:shadow-sm transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:bg-sky-600 group-hover:text-white transition">
            <CalendarCheckIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition">Quản lý lịch hẹn bệnh viện</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tiếp đón, tra cứu toàn viện, đổi ca và hủy hẹn</p>
          </div>
        </Link>

        <Link
          to="/reception/patients"
          className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition">
            <UserGroupIcon className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 group-hover:text-teal-600 transition">Quản lý hồ sơ bệnh nhân</h4>
            <p className="text-xs text-slate-500 mt-0.5">Thêm mới bệnh nhân, cập nhật thông tin và kích hoạt hồ sơ</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
```

---

### 4.2. File 2: `frontend/src/pages/reception/ReceptionAppointmentsPage.jsx`
Implement full hospital-wide appointment management including Search, Filter, Data Table, Action Buttons, and 5 Interactive Modals:

#### Key Component State Architecture:
1. **Filters & Pagination**:
   - `date`: Defaults to today (`new Date().toISOString().split('T')[0]`).
   - `search`: Keyword string.
   - `status`: `""` (All), `"BOOKED"`, `"CHECKED_IN"`, `"CANCELLED"`, `"NO_SHOW"`.
   - `doctorId`: `""` or doctor ID number.
   - `page`: `0` (0-indexed).
   - `size`: `20`.
2. **Data & Metrics**:
   - `appointments`: Array from `response.items`.
   - `total`: Total elements from `response.total`.
   - `options`: `{ doctors: [], slots: [] }` from `receptionApi.getOptions(date)`.
   - `loading`: Boolean spinner flag.
3. **Modal States**:
   - `detailModal`: Selected appointment object or `null`.
   - `checkInModal`: Selected appointment object or `null`.
   - `undoModal`: Selected appointment object or `null`.
   - `cancelModal`: Selected appointment object or `null`, plus `cancelReason` string.
   - `rescheduleModal`: Selected appointment object or `null`, plus `rescheduleDate`, `rescheduleSlots` array, and `selectedSlotId`.

#### Detailed Action Handlers:
1. **Check-in Action**:
   ```javascript
   const handleConfirmCheckIn = async (appointmentId) => {
     try {
       setActionLoading(true);
       await receptionApi.checkIn(appointmentId);
       setSuccessMessage('Tiếp đón bệnh nhân thành công.');
       setCheckInModal(null);
       loadAppointments();
     } catch (err) {
       setErrorMessage(err.response?.data?.message || 'Không thể tiếp đón bệnh nhân.');
     } finally {
       setActionLoading(false);
     }
   };
   ```

2. **Undo Check-in Action**:
   ```javascript
   const handleConfirmUndoCheckIn = async (appointmentId) => {
     try {
       setActionLoading(true);
       await receptionApi.undoCheckIn(appointmentId);
       setSuccessMessage('Đã hoàn tác tiếp đón bệnh nhân.');
       setUndoModal(null);
       loadAppointments();
     } catch (err) {
       setErrorMessage(err.response?.data?.message || 'Không thể hoàn tác tiếp đón.');
     } finally {
       setActionLoading(false);
     }
   };
   ```

3. **Cancel Action**:
   ```javascript
   const handleConfirmCancel = async (appointmentId, reason) => {
     try {
       setActionLoading(true);
       await receptionApi.cancelAppointment(appointmentId, reason || 'Bệnh nhân báo hủy tại quầy');
       setSuccessMessage('Hủy lịch hẹn thành công.');
       setCancelModal(null);
       loadAppointments();
     } catch (err) {
       setErrorMessage(err.response?.data?.message || 'Không thể hủy lịch hẹn.');
     } finally {
       setActionLoading(false);
     }
   };
   ```

4. **Reschedule Action**:
   ```javascript
   const handleConfirmReschedule = async (appointmentId, slotId) => {
     if (!slotId) {
       setErrorMessage('Vui lòng chọn khung giờ mới.');
       return;
     }
     try {
       setActionLoading(true);
       await receptionApi.rescheduleAppointment(appointmentId, slotId);
       setSuccessMessage('Đổi lịch hẹn thành công.');
       setRescheduleModal(null);
       loadAppointments();
     } catch (err) {
       setErrorMessage(err.response?.data?.message || 'Không thể đổi lịch hẹn.');
     } finally {
       setActionLoading(false);
     }
   };
   ```

#### Status Badge Renderer:
```javascript
const renderStatusBadge = (appt) => {
  if (appt.encounterStatus === 'COMPLETED') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
        Đã khám xong
      </span>
    );
  }
  if (appt.encounterStatus === 'IN_PROGRESS') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
        Đang khám
      </span>
    );
  }
  if (appt.status === 'CHECKED_IN') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        Đã tiếp đón
      </span>
    );
  }
  if (appt.status === 'BOOKED') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        Chờ tiếp đón
      </span>
    );
  }
  if (appt.status === 'CANCELLED') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        Đã hủy
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
      {appt.status}
    </span>
  );
};
```

---

## 5. Verification Method

To verify the implementation independently:

### 5.1. Backend Unit Tests
Execute the reception appointment test suite verifying staff resolution, same-day cancel/reschedule exemption, and encounter guards:
```bash
mvn test -Dtest=ReceptionAppointmentServiceStaffResolutionTest
```
Expected: `Tests run: 7, Failures: 0, Errors: 0, Skipped: 0`.

### 5.2. Frontend Production Build
Verify that React JSX components and Tailwind classes compile without syntax or asset errors:
```bash
cd frontend
npm run build
```
Expected: `vite build` completes with exit code 0.

### 5.3. End-to-End Browser Showcase Testing
1. Navigate to `/login`.
2. Login with credentials:
   - Username: `receptionist` (or `receptionist@hospital.vn`)
   - Password: `Password123!`
3. Verify automatic redirection to `/reception/appointments`.
4. Check Sidebar:
   - Verify 3 navigation links: "Tạo hẹn khám walk-in", "Quản lý lịch hẹn", "Quản lý bệnh nhân".
5. Test "Tạo hẹn khám walk-in" (`/reception/walk-in`):
   - Verify presence of active development banner, SOP instructions, and quick shortcut buttons.
6. Test "Quản lý lịch hẹn" (`/reception/appointments`):
   - **List & Metrics**: Observe hospital appointments table, metric counters, and doctor dropdown.
   - **Date Filter**: Select today (`2026-11-03`) vs. tomorrow (`2026-11-04`).
   - **Keyword Search**: Type `"An"` or `"090"` or `"APT-"` and verify filtered results.
   - **Detail Modal**: Click "Chi tiết" on any row, verify patient demographics, appointment slot, and status.
   - **Check-in Action**: Find appointment with status `BOOKED` for today, click green "Tiếp đón", confirm modal -> verify status transitions to `CHECKED_IN`.
   - **Undo Check-in Action**: On the checked-in appointment, click yellow "Hoàn tác", confirm modal -> verify status transitions back to `BOOKED`.
   - **Counter Reschedule**: On `BOOKED` appointment, click blue "Đổi lịch", select a new slot, confirm modal -> verify slot updates without 24h notice error.
   - **Counter Cancel**: Click red "Hủy hẹn", enter reason, confirm modal -> verify status transitions to `CANCELLED`.
   - **Encounter Guard**: Check that appointments in consultation (`encounterId != null`) have action buttons disabled.
