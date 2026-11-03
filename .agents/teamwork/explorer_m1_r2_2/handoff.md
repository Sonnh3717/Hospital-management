# Handoff Report: Explorer M1-r2-2 (IDOR & Appointment Remediation)

## Executive Summary
This report delivers an in-depth investigation and concrete engineering fix designs for two critical appointment workflow defects identified during Milestone 1 Gate Review:
1. **Insecure Direct Object Reference (IDOR)** on `GET /api/patient/appointments` in `AppointmentController.java` (lines 139–157).
2. **Staff Notice Period Constraint Defect** in `ReceptionAppointmentServiceImpl.java` (lines 213, 229), which blocked receptionists from canceling or rescheduling same-day walk-in and counter appointments.
3. **Hidden Test Hazard**: The test `AppointmentLifecycleChallengerTest.explicitPatientId_passesThrough` (line 145) explicitly asserted the vulnerable IDOR passthrough; this test must be updated concurrently with the fix to prevent false test failures during rework.

---

## 1. Observation

### Observation 1: IDOR Vulnerability in `AppointmentController.java` (Lines 139–157)
- **File**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
- **Lines 139–157**:
  ```java
  139: public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(
  140:         @RequestParam(required = false) Long patientId,
  141:         @AuthenticationPrincipal StaffPrincipal principal) {
  142:     Long targetPatientId = patientId;
  143:     if (targetPatientId == null && principal != null) {
  144:         if (principal.patientId() != null) {
  145:             targetPatientId = principal.patientId();
  146:         } else {
  147:             targetPatientId = patientRepository.findByUserAccount_Id(principal.accountId())
  148:                     .map(Patient::getId)
  149:                     .orElse(null);
  150:         }
  151:     }
  152:     if (targetPatientId == null) {
  153:         return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
  154:     }
  155:     List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
  156:     return ResponseEntity.ok(ApiResponse.ok(list));
  157: }
  ```
- **Observed Behavior**:
  - The endpoint allows both `PATIENT` and `ADMIN` callers via `@PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")`.
  - When a caller with role `PATIENT` passes `?patientId=<otherId>`, `targetPatientId` is initialized to `<otherId>` (line 142).
  - Because `targetPatientId != null`, the guard `if (targetPatientId == null && principal != null)` (line 143) is completely bypassed.
  - The controller queries `appointmentService.getAppointmentsByPatient(otherId)` directly, returning other patients' private medical appointment records.

### Observation 2: Test Suite Dependency in `AppointmentLifecycleChallengerTest.java` (Lines 144–156)
- **File**: `backend/swd/src/test/java/com/example/swd/service/AppointmentLifecycleChallengerTest.java`
- **Lines 144–156**:
  ```java
  144: @Test
  145: @DisplayName("1.4 Adversarial probe: when explicit patientId is passed, controller accepts query param")
  146: void explicitPatientId_passesThrough() {
  147:     StaffPrincipal principal = new StaffPrincipal(10L, null, "patient_user", "Nguyen Van An", "PATIENT", 77L);
  148:     when(appointmentService.getAppointmentsByPatient(888L)).thenReturn(List.of());
  149: 
  150:     ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
  151:             controller.getPatientAppointments(888L, principal);
  152: 
  153:     assertEquals(200, response.getStatusCode().value());
  154:     verify(appointmentService).getAppointmentsByPatient(888L);
  155:     // Confirms targetPatientId takes explicit query parameter if passed
  156: }
  ```
- **Observed Behavior**:
  - This unit test was authored as an adversarial probe proving that `patientId=888L` passes through even when `principal` is a `PATIENT` with `patientId=77L`.
  - Running this test currently succeeds:
    ```
    [INFO] Running 1. Patient Appointment Resolution Adversarial Tests
    [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
    ```
  - **Critical Impact**: When the IDOR fix is applied to restrict `targetPatientId` to `77L` for `PATIENT` callers, line 154 (`verify(appointmentService).getAppointmentsByPatient(888L);`) will fail. This test must be updated as part of the remediation.

### Observation 3: Inappropriate Notice Period Constraint in `ReceptionAppointmentServiceImpl.java` (Lines 206–240)
- **File**: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`
- **Lines 206–221 (`cancel`)**:
  ```java
  206: public AppointmentView cancel(StaffPrincipal actor, Long id, String reason) {
  207:     Appointment appointment = locked(actor, id);
  208:     if (appointment.getStatus() == Appointment.Status.CANCELLED) return view(appointment);
  209:     requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể hủy lịch.");
  210:     if (appointment.getStatus() != Appointment.Status.BOOKED && appointment.getStatus() != Appointment.Status.CHECKED_IN) {
  211:         throw state("Lịch hẹn không còn được phép hủy.");
  212:     }
  213:     requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getCancellationNoticeMinutes(), "hủy lịch");
  214:     appointment.setStatus(Appointment.Status.CANCELLED);
  ...
  ```
- **Lines 224–239 (`reschedule`)**:
  ```java
  224: public AppointmentView reschedule(StaffPrincipal actor, Long id, Long destinationId) {
  225:     Appointment appointment = locked(actor, id);
  226:     requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể đổi lịch.");
  227:     if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Hoàn tác check-in trước khi đổi lịch.");
  228:     if (appointment.getAppointmentSlot().getId().equals(destinationId)) return view(appointment);
  229:     requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getRescheduleNoticeMinutes(), "đổi lịch");
  230:     AppointmentSlot destination = slots.lockById(destinationId).orElseThrow(() -> missing("Khung giờ"));
  ...
  ```
- **Lines 310–314 (`requireNotice`)**:
  ```java
  310: private void requireNotice(Appointment appointment, long noticeMinutes, String action) {
  311:     if (appointment.getAppointmentSlot().getStartsAt().isBefore(now().plusMinutes(noticeMinutes))) {
  312:         throw new WorkflowException(HttpStatus.CONFLICT, "NOTICE_PERIOD", "Không đủ thời gian báo trước để " + action + " theo quy định.");
  313:     }
  314: }
  ```
- **Observed Behavior**:
  - `AppointmentRule.cancellationNoticeMinutes` and `rescheduleNoticeMinutes` default to `1440` (24 hours).
  - Every receptionist operation calls `receptionist(actor)`, guaranteeing the caller is a hospital staff receptionist.
  - If a patient walks in or calls the counter to cancel or reschedule an appointment on the same day (e.g., 2 hours before the slot), `appointment.getAppointmentSlot().getStartsAt().isBefore(now().plusMinutes(1440))` is `true`.
  - The receptionist is blocked with HTTP 409 `NOTICE_PERIOD`: *"Không đủ thời gian báo trước để hủy lịch theo quy định."*

### Observation 4: Contrast with `AppointmentServiceImpl.java` (Lines 155, 189)
- **File**: `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`
- **Lines 154–161**:
  ```java
  154: // Ràng buộc hủy trước 24 giờ (1440 phút)
  155: if (isPatient) {
  156:     Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
  157:     if (duration.toMinutes() < 1440) {
  158:         throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
  159:                 "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ");
  160:     }
  161: }
  ```
- **Lines 188–195**:
  ```java
  188: // Ràng buộc đổi lịch trước 24 giờ
  189: if (isPatient) {
  190:     Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
  191:     if (duration.toMinutes() < 1440) {
  192:         throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
  193:                 "Chỉ được phép đổi lịch hẹn trước giờ khám tối thiểu 24 giờ");
  194:     }
  195: }
  ```
- **Observed Behavior**:
  - `AppointmentServiceImpl` already recognized that 24-hour advance notice applies **only** to patients (`if (isPatient)`), exempting staff and administrators.
  - `ReceptionAppointmentServiceImpl` mistakenly enforced `requireNotice` unconditionally on lines 213 and 229, despite being a receptionist-only domain service.

---

## 2. Logic Chain

1. **Root Cause of IDOR**:
   - `AppointmentController.getPatientAppointments` accepted `patientId` as an untrusted query parameter without verifying caller role (`ADMIN` vs `PATIENT`).
   - For non-admin callers, allowing arbitrary `patientId` permits horizontal privilege escalation.
   - The security boundary requires that non-admin callers can **only** access appointments associated with their own authenticated patient record.

2. **Remediation Strategy for IDOR**:
   - Inspect `principal.role()`: if it is `"ADMIN"` (or `"ROLE_ADMIN"`), trust the incoming `patientId` query parameter (allowing admins to inspect any patient's appointments).
   - If `principal` does not possess the `ADMIN` role, strictly bind `targetPatientId` to the caller's resolved patient identity:
     `principal.patientId() != null ? principal.patientId() : patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)`.
   - If an unprivileged caller attempts to provide a `patientId` query parameter:
     - **Option B (Recommended / Primary)**: The query parameter is overridden/ignored, ensuring the caller receives only their own records. This matches both Reviewer 1 and Reviewer 2 recommendations line-for-line without breaking frontend query bindings.
     - **Option A (Alternative)**: Throw HTTP 403 `FORBIDDEN` if `patientId != null && !patientId.equals(selfPatientId)`.

3. **Root Cause of Staff Notice Period Defect**:
   - Receptionists manage front desk walk-ins, phone assistance, counter check-ins, and schedule conflicts in real time.
   - By enforcing `requireNotice(1440 minutes)` in `ReceptionAppointmentServiceImpl`, the system applied online patient self-service constraints to front desk hospital personnel.
   - Front desk staff are trusted actors who must have operational discretion to cancel or reschedule appointments on the same day or shortly before slot start, as long as the clinical encounter has not already started.

4. **Remediation Strategy for Notice Period**:
   - In `ReceptionAppointmentServiceImpl.cancel` (line 213): Remove `requireNotice(...)`.
   - In `ReceptionAppointmentServiceImpl.reschedule` (line 229): Remove `requireNotice(...)`.
   - In `ReceptionAppointmentServiceImpl.validateSlot` (lines 280–292): Ensure that when rescheduling, destination slots starting later today are allowed (counter rescheduling to an open slot today should not be blocked by advance booking notice).

5. **Test Hazard Resolution**:
   - In `AppointmentLifecycleChallengerTest`, test 1.4 (`explicitPatientId_passesThrough`) asserts that a `PATIENT` principal passing `888L` causes `appointmentService.getAppointmentsByPatient(888L)` to be invoked.
   - When the IDOR fix binds `targetPatientId` to `77L`, test 1.4 will fail.
   - Test 1.4 must be updated to use an `ADMIN` principal, and an additional test (1.5) must be added to verify that a `PATIENT` principal passing `888L` is restricted to their own `77L` appointments.

---

## 3. Caveats

1. **Role String Case Sensitivity & Prefixes**:
   - `StaffPrincipal.role()` is created via `account.getRole().getRoleCode().name()`, which produces `"ADMIN"`, `"PATIENT"`, `"RECEPTIONIST"`.
   - Spring Security authorities use `"ROLE_ADMIN"`.
   - Recommendation: Check `("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()))` for robust protection.

2. **Null Profile Handling**:
   - If a newly registered user logs in with role `PATIENT` before completing Step 2 profile registration, `principal.patientId()` is `null` and `patientRepository.findByUserAccount_Id` returns empty.
   - In this state, `targetPatientId` evaluates to `null`, correctly returning `ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of())` without throwing NPE.

3. **Notice Check Removal vs Clinical Encounter Guard**:
   - Removing `requireNotice` in `ReceptionAppointmentServiceImpl` does **not** compromise clinical safety because `requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể hủy lịch.")` and `requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể đổi lịch.")` strictly prevent cancelling or rescheduling an appointment once a doctor has initiated the consultation.

---

## 4. Conclusion & Precise Remediation Designs

### Remediation 1: `AppointmentController.java` (IDOR Fix)
**Target File**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`  
**Target Lines**: 139–157  

#### Proposed Replacement (Option B - Verbatim Reviewer Match):
```java
    /**
     * Danh sách lịch hẹn của bệnh nhân
     */
    @GetMapping("/patient/appointments")
    @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(
            @RequestParam(required = false) Long patientId,
            @AuthenticationPrincipal StaffPrincipal principal) {
        Long targetPatientId = patientId;
        boolean isAdmin = principal != null && ("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()));

        if (!isAdmin) {
            targetPatientId = principal != null && principal.patientId() != null
                    ? principal.patientId()
                    : (principal != null && principal.accountId() != null
                            ? patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)
                            : null);
        }

        if (targetPatientId == null) {
            return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
        }
        List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }
```

#### Diff Patch for Implementation:
```diff
--- a/backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java
+++ b/backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java
@@ -141,14 +141,13 @@ public class AppointmentController {
             @AuthenticationPrincipal StaffPrincipal principal) {
         Long targetPatientId = patientId;
-        if (targetPatientId == null && principal != null) {
-            if (principal.patientId() != null) {
-                targetPatientId = principal.patientId();
-            } else {
-                targetPatientId = patientRepository.findByUserAccount_Id(principal.accountId())
-                        .map(Patient::getId)
-                        .orElse(null);
-            }
+        boolean isAdmin = principal != null && ("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()));
+        if (!isAdmin) {
+            targetPatientId = principal != null && principal.patientId() != null
+                    ? principal.patientId()
+                    : (principal != null && principal.accountId() != null
+                            ? patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)
+                            : null);
         }
         if (targetPatientId == null) {
             return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
```

---

### Remediation 2: `ReceptionAppointmentServiceImpl.java` (Notice Period Relaxation)
**Target File**: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`  
**Target Lines**: 213, 229, 310–314  

#### In `cancel` method:
Remove line 213:
```diff
--- a/backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java
+++ b/backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java
@@ -210,7 +210,6 @@ public class ReceptionAppointmentServiceImpl implements com.example.swd.service.
         if (appointment.getStatus() != Appointment.Status.BOOKED && appointment.getStatus() != Appointment.Status.CHECKED_IN) {
             throw state("Lịch hẹn không còn được phép hủy.");
         }
-        requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getCancellationNoticeMinutes(), "hủy lịch");
         appointment.setStatus(Appointment.Status.CANCELLED);
         clearCheckIn(appointment);
         appointment.setCancelledAt(now());
```

#### In `reschedule` method:
Remove line 229:
```diff
@@ -226,7 +225,6 @@ public class ReceptionAppointmentServiceImpl implements com.example.swd.service.
         requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể đổi lịch.");
         if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Hoàn tác check-in trước khi đổi lịch.");
         if (appointment.getAppointmentSlot().getId().equals(destinationId)) return view(appointment);
-        requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getRescheduleNoticeMinutes(), "đổi lịch");
         AppointmentSlot destination = slots.lockById(destinationId).orElseThrow(() -> missing("Khung giờ"));
         validateSlot(destination, appointment.getBookingSource());
```

*(Note: The private helper method `requireNotice` on line 310 can be removed or marked `@Deprecated` to prevent compiler warnings about unused private methods).*

---

### Remediation 3: `AppointmentLifecycleChallengerTest.java` (Test Alignment)
**Target File**: `backend/swd/src/test/java/com/example/swd/service/AppointmentLifecycleChallengerTest.java`  
**Target Lines**: 144–157  

#### Proposed Replacement for Section 1 Tests:
```java
        @Test
        @DisplayName("1.4 Admin caller: explicit patientId query parameter is respected for ADMIN")
        void explicitPatientId_respectedForAdmin() {
            StaffPrincipal adminPrincipal = new StaffPrincipal(1L, null, "admin_user", "Admin", "ADMIN", null);
            when(appointmentService.getAppointmentsByPatient(888L)).thenReturn(List.of());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(888L, adminPrincipal);

            assertEquals(200, response.getStatusCode().value());
            verify(appointmentService).getAppointmentsByPatient(888L);
        }

        @Test
        @DisplayName("1.5 IDOR Prevention: non-admin patient cannot view another patient's appointments via patientId param")
        void nonAdmin_patientCannotViewOtherPatientAppointments() {
            StaffPrincipal patientPrincipal = new StaffPrincipal(10L, null, "patient_user", "Nguyen Van An", "PATIENT", 77L);
            when(appointmentService.getAppointmentsByPatient(77L)).thenReturn(List.of());

            ResponseEntity<ApiResponse<List<AppointmentResponse>>> response =
                    controller.getPatientAppointments(888L, patientPrincipal);

            assertEquals(200, response.getStatusCode().value());
            // Verifies targetPatientId was bound strictly to caller's patientId (77L), ignoring 888L
            verify(appointmentService).getAppointmentsByPatient(77L);
            verify(appointmentService, never()).getAppointmentsByPatient(888L);
        }
```

---

### Remediation 4: Additional Unit Tests for Receptionist Notice Bypass
Add the following tests to `backend/swd/src/test/java/com/example/swd/service/ReceptionAppointmentServiceStaffResolutionTest.java`:

```java
    @Test
    @DisplayName("Receptionist can cancel same-day appointment without 24-hour notice constraint")
    void cancel_sameDayAppointment_bypassesNoticeConstraint() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(801L, Appointment.Status.BOOKED, 25L);
        // Slot starts in 15 minutes
        appt.getAppointmentSlot().setStartsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15));
        appt.getAppointmentSlot().getAppointmentRule().setCancellationNoticeMinutes(1440L);

        when(appointments.lockById(801L)).thenReturn(Optional.of(appt));
        mockNoEncounter();
        UserAccount recAccount = new UserAccount();
        recAccount.setId(101L);
        when(accounts.getReferenceById(101L)).thenReturn(recAccount);
        mockDoctorProfile(25L);

        AppointmentView view = service.cancel(actor, 801L, "Bệnh nhân báo hủy tại quầy");
        assertNotNull(view);
        assertEquals("CANCELLED", view.status());
        assertEquals(Appointment.Status.CANCELLED, appt.getStatus());
        assertNotNull(appt.getCancelledAt());
        assertEquals("Bệnh nhân báo hủy tại quầy", appt.getCancellationReason());
        verify(appointments).flush();
    }

    @Test
    @DisplayName("Receptionist can reschedule same-day appointment without 24-hour notice constraint")
    void reschedule_sameDayAppointment_bypassesNoticeConstraint() {
        StaffPrincipal actor = new StaffPrincipal(101L, 55L, "receptionist_1", "Le Tan 1", "RECEPTIONIST", null);
        Appointment appt = buildTodayAppointment(802L, Appointment.Status.BOOKED, 25L);
        appt.getAppointmentSlot().setStartsAt(LocalDateTime.now(ZoneOffset.UTC).plusMinutes(30));
        appt.getAppointmentSlot().getAppointmentRule().setRescheduleNoticeMinutes(1440L);

        AppointmentSlot destSlot = buildTodayAppointment(802L, Appointment.Status.OPEN, 25L).getAppointmentSlot();
        destSlot.setId(905L);

        when(appointments.lockById(802L)).thenReturn(Optional.of(appt));
        mockNoEncounter();
        when(slots.lockById(905L)).thenReturn(Optional.of(destSlot));
        mockDoctorProfile(25L);
        when(appointments.countActiveBySlotId(905L)).thenReturn(1L);
        when(appointments.hasActivePatientInSlot(appt.getPatient().getId(), 905L, 802L)).thenReturn(false);
        UserAccount recAccount = new UserAccount();
        recAccount.setId(101L);
        when(accounts.getReferenceById(101L)).thenReturn(recAccount);

        AppointmentView view = service.reschedule(actor, 802L, 905L);
        assertNotNull(view);
        assertEquals(destSlot, appt.getAppointmentSlot());
        assertNotNull(appt.getLastRescheduledAt());
        verify(appointments).flush();
    }
```

---

## 5. Verification Method

### Step 1: Clean Compilation Check
```powershell
cd backend/swd
./mvnw clean test-compile
```
*Expected Result*: `BUILD SUCCESS` with zero compilation warnings or errors.

### Step 2: Appointment Lifecycle & IDOR Test Suite
```powershell
cd backend/swd
./mvnw test "-Dtest=AppointmentLifecycleChallengerTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
```
*Expected Result*: 20/20 tests pass (including updated test 1.4 for admin passthrough and test 1.5 for non-admin IDOR prevention).

### Step 3: Receptionist Staff Resolution & Same-Day Operations Test Suite
```powershell
cd backend/swd
./mvnw test "-Dtest=ReceptionAppointmentServiceStaffResolutionTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
```
*Expected Result*: All tests pass, verifying check-in staff resolution, same-day counter cancel, and same-day counter reschedule.

### Step 4: Full Backend Regression Pass
```powershell
cd backend/swd
./mvnw test "-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
```
*Expected Result*: 100% of unit & challenger tests pass (80+ tests) with 0 failures and 0 errors.

### Invalidation Conditions:
- If a caller with role `PATIENT` can query `GET /api/patient/appointments?patientId=<otherId>` and receive `<otherId>`'s appointments, the IDOR fix is INVALID.
- If a receptionist actor is rejected with HTTP 409 `NOTICE_PERIOD` when canceling or rescheduling a same-day appointment for a walk-in patient, the notice relaxation fix is INVALID.
