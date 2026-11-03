# Handoff Report: Milestone 3 Patient Portal Adversarial Challenge

**Challenger**: `challenger_m3_1_gen2`  
**Role**: Patient Portal Adversarial Challenger  
**Date**: 2026-11-02T22:09:00Z  
**Target Milestone**: Milestone 3 (R4 Patient Portal, R5 Receptionist Portal, R6 Doctor View)  
**Parent Orchestrator ID**: `57be1812-6fc7-41d3-9fd8-655dc3f13abb`  
**Verdict**: **`APPROVE`**  
**Target File**: `c:\Users\AD\OneDrive\Desktop\FPT\Fall_2026\SWD392\CourseProject\Hospital-management\.agents\teamwork\challenger_m3_1_gen2\handoff.md`

---

## 1. Observation

### 1.1 Direct Source Observations

1. **Backend 24-Hour Notice Enforcement**:
   - In `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`:
     - Cancellation guard (Lines 155–161):
       ```java
       if (isPatient) {
           Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
           if (duration.toMinutes() < 1440) {
               throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                       "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ");
           }
       }
       ```
     - Rescheduling guard (Lines 189–195):
       ```java
       if (isPatient) {
           Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
           if (duration.toMinutes() < 1440) {
               throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                       "Chỉ được phép đổi lịch hẹn trước giờ khám tối thiểu 24 giờ");
           }
       }
       ```
     - Verbatim behavior: When `isPatient == true`, any appointment slot starting within less than 1,440 minutes (< 24 hours) immediately aborts transaction with HTTP 400 Bad Request, code `"DEADLINE_EXCEEDED"`.

2. **Backend State Transition Guards**:
   - In `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`:
     - Cancellation status guard (Lines 145–148):
       ```java
       if (appointment.getStatus() != Appointment.Status.BOOKED) {
           throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                   "Lịch hẹn không ở trạng thái có thể hủy");
       }
       ```
     - Rescheduling status guard (Lines 179–182):
       ```java
       if (appointment.getStatus() != Appointment.Status.BOOKED) {
           throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_STATUS",
                   "Lịch hẹn không ở trạng thái có thể đổi lịch");
       }
       ```
     - Verbatim behavior: Appointments in `CHECKED_IN`, `CANCELLED`, `COMPLETED`, or `NO_SHOW` status cannot be cancelled or rescheduled. They are rejected with HTTP 400 Bad Request, code `"INVALID_STATUS"`.

3. **Backend Rescheduling Payload Contract & Deserialization**:
   - In `backend/swd/src/main/java/com/example/swd/dto/request/RescheduleRequest.java`:
     - Lines 9–14:
       ```java
       public class RescheduleRequest {
           @NotNull(message = "Khung giờ khám mới không được để trống")
           private Long newAppointmentSlotId;

           private String reason;
       }
       ```
   - In `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`:
     - Line 197: `AppointmentSlot newSlot = appointmentSlotRepository.lockById(request.getNewAppointmentSlotId())`
     - Line 216: `appointment.setAppointmentSlot(newSlot);`
     - Line 217: `appointment.setLastRescheduledAt(LocalDateTime.now());`
     - Line 218: `appointment.setLastRescheduledByAccount(currentAccount);`
   - In `frontend/src/services/api.js`:
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
     - Verbatim behavior: The client passes both `newAppointmentSlotId` and legacy `newSlotId`, satisfying the `@NotNull` validator and binding cleanly.

4. **Frontend UI State Guards & 24h Calculation**:
   - In `frontend/src/pages/patient/PatientAppointmentsPage.jsx`:
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
     - Lines 517–535:
       ```jsx
       {isBooked && (
         <>
           <button onClick={() => handleOpenReschedule(appt)}>Đổi lịch</button>
           <button onClick={() => handleOpenCancel(appt)}>Hủy hẹn</button>
         </>
       )}
       ```
     - Verbatim behavior: Only appointments with `status === 'BOOKED'` display the "Đổi lịch" and "Hủy hẹn" action buttons. If an appointment is `CHECKED_IN` or `CANCELLED`, the action buttons are suppressed from the patient view.

### 1.2 Automated Verification Tool Outputs

1. **Automated Unit & Adversarial Test Suite**:
   - File: `backend/swd/src/test/java/com/example/swd/service/AppointmentLifecycleChallengerTest.java`
   - Added Section 4: `PatientAppointmentLifecycleTests` containing 11 adversarial tests:
     - `4.1 cancel_lessThan24hNotice_rejected`: Asserts `<24h` cancellation throws `DEADLINE_EXCEEDED` (HTTP 400).
     - `4.2 reschedule_lessThan24hNotice_rejected`: Asserts `<24h` rescheduling throws `DEADLINE_EXCEEDED` (HTTP 400).
     - `4.3 cancel_moreThan24hNotice_succeeds`: Asserts `>24h` cancellation transitions to `CANCELLED`, sets `cancelledAt` and `cancellationReason`.
     - `4.4 reschedule_moreThan24hNotice_succeeds`: Asserts `>24h` rescheduling updates `appointmentSlot` to new slot ID, sets `lastRescheduledAt`.
     - `4.5 cancel_staffBypasses24hRule`: Asserts counter staff (`isPatient = false`) can cancel `<24h` without deadline exception.
     - `4.6 reschedule_staffBypasses24hRule`: Asserts counter staff (`isPatient = false`) can reschedule `<24h` without deadline exception.
     - `4.7 cancel_failsIfCheckedIn`: Asserts cancellation of `CHECKED_IN` appointment throws `INVALID_STATUS` (HTTP 400).
     - `4.8 cancel_failsIfAlreadyCancelled`: Asserts cancellation of `CANCELLED` appointment throws `INVALID_STATUS` (HTTP 400).
     - `4.9 reschedule_failsIfCheckedIn`: Asserts rescheduling of `CHECKED_IN` appointment throws `INVALID_STATUS` (HTTP 400).
     - `4.10 reschedule_failsIfAlreadyCancelled`: Asserts rescheduling of `CANCELLED` appointment throws `INVALID_STATUS` (HTTP 400).
     - `4.11 rescheduleRequest_dtoIntegrity`: Asserts DTO fields and validation constraints.
   - Command:
     ```powershell
     mvn test -pl backend/swd "-Dtest=AppointmentLifecycleChallengerTest,AppointmentAvailableSlotsTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
     ```
   - Verbatim Output:
     ```
     [INFO] Running com.example.swd.service.AppointmentAvailableSlotsTest
     [INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.307 s -- in com.example.swd.service.AppointmentAvailableSlotsTest
     [INFO] Running com.example.swd.service.AppointmentLifecycleChallengerTest
     [INFO] Running 4. Patient Appointment Lifecycle, 24h Notice & State Guards Tests
     [INFO] Tests run: 11, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.119 s -- in 4. Patient Appointment Lifecycle, 24h Notice & State Guards Tests
     [INFO] Running 3. Receptionist Check-In & Undo Check-In Staff Resolution Tests
     [INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.260 s -- in 3. Receptionist Check-In & Undo Check-In Staff Resolution Tests
     [INFO] Running 1. Patient Appointment Resolution Adversarial Tests
     [INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.236 s -- in 1. Patient Appointment Resolution Adversarial Tests
     [INFO] Running 2. Available Slots Boundary & Filtering Tests
     [INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.057 s -- in 2. Available Slots Boundary & Filtering Tests
     [INFO] 
     [INFO] Results:
     [INFO] 
     [INFO] Tests run: 34, Failures: 0, Errors: 0, Skipped: 0
     [INFO] 
     [INFO] BUILD SUCCESS
     [INFO] Total time: 6.169 s
     ```

2. **Reception Regression Test Suite**:
   - Command:
     ```powershell
     mvn test -pl backend/swd "-Dtest=ReceptionAppointmentServiceStaffResolutionTest,ReceptionPatientServiceTest,ChallengerReceptionPatientServiceTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
     ```
   - Verbatim Output:
     ```
     [INFO] Results:
     [INFO] 
     [INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0
     [INFO] 
     [INFO] BUILD SUCCESS
     [INFO] Total time: 5.788 s
     ```

3. **Frontend Production Build**:
   - Command:
     ```powershell
     cd frontend; npm run build
     ```
   - Verbatim Output:
     ```
     ✓ 97 modules transformed.
     dist/index.html                   0.73 kB │ gzip:   0.46 kB
     dist/assets/index-CLqZYiYN.css   49.46 kB │ gzip:   8.15 kB
     dist/assets/index-DEMcz9lT.js   410.17 kB │ gzip: 104.71 kB
     ✓ built in 2.29s
     ```

---

## 2. Logic Chain

1. **24-Hour Notice Constraint**:
   - Observation 1.1(1) and 1.2(1) confirm that `AppointmentServiceImpl` calculates `Duration.between(LocalDateTime.now(), startsAt).toMinutes()`. If `< 1440` (24h) and `isPatient == true`, it throws `WorkflowException` with `DEADLINE_EXCEEDED` (HTTP 400).
   - Tests 4.1 and 4.2 empirically prove that cancellation or rescheduling within 23 hours is rejected with `DEADLINE_EXCEEDED`.
   - Tests 4.3 and 4.4 empirically prove that cancellation or rescheduling 48 hours away succeeds without errors.
   - Tests 4.5 and 4.6 confirm that counter staff (`isPatient == false`) can process exceptions within 2 hours of appointment time, maintaining hospital counter operations.
   - Observation 1.1(4) confirms that the patient UI provides clear, proactive visual cues (`diffHours >= 24` badge) and validates eligibility before modal submission.

2. **State Transition Guards**:
   - Observation 1.1(2) and 1.2(1) confirm that both `cancelAppointment` and `rescheduleAppointment` assert `appointment.getStatus() == BOOKED`.
   - Tests 4.7, 4.8, 4.9, and 4.10 prove that calling cancel or reschedule on an appointment that is `CHECKED_IN` or `CANCELLED` is rejected with `INVALID_STATUS` (HTTP 400).
   - In addition, Observation 1.1(4) demonstrates that the frontend UI defensively hides the cancel and reschedule buttons unless `appt.status === 'BOOKED'`.

3. **Rescheduling Payload Deserialization**:
   - Observation 1.1(3) shows that `RescheduleRequest.java` expects `newAppointmentSlotId` (`@NotNull`).
   - Frontend `api.js` line 114–122 explicitly provides `{ newAppointmentSlotId: newSlotId, newSlotId: newSlotId, reason }`.
   - Tests 4.4 and 4.11 confirm that `request.getNewAppointmentSlotId()` is bound properly, the target slot is locked via `appointmentSlotRepository.lockById(...)`, and the appointment's slot reference is migrated.

4. **Test Suite Integrity & Performance**:
   - All 34 appointment challenger and slot availability tests passed with 0 failures and 0 errors.
   - All 23 reception tests passed with 0 failures and 0 errors.
   - Total backend test coverage for M3: 57 tests passing.
   - Frontend production build succeeded in 2.29s with 0 errors.

---

## 3. Caveats

1. **System Clock Reliance**:
   - The 24-hour calculation in `AppointmentServiceImpl` relies on `LocalDateTime.now()` compared against the slot's `startsAt`. In production multi-server deployments, database and application server clocks must be synchronized via NTP.
2. **Booking Placeholder**:
   - Patient online booking remains an informative placeholder modal/page per §R4.1 until payment gateway (PayOS) is enabled for online self-service.

---

## 4. Conclusion

**Verdict: `APPROVE`**

The implementation of Milestone 3 Patient Portal appointment management adheres strictly to all business rules and contracts:
- The 24-hour notice constraint is enforced on both backend (`DEADLINE_EXCEEDED` HTTP 400) and frontend (eligibility badge & validation).
- State transition guards prohibit cancellation and rescheduling of `CHECKED_IN` and `CANCELLED` appointments at both service and UI layers.
- The rescheduling payload contract is synchronized between `RescheduleRequest.java` and `api.js`.
- All 34 automated unit/adversarial tests pass with 100% success rate, and the frontend builds cleanly.

---

## 5. Verification Method

To independently reproduce the empirical findings of this report:

1. **Run Appointment Lifecycle Challenger Tests**:
   ```powershell
   mvn test -pl backend/swd "-Dtest=AppointmentLifecycleChallengerTest,AppointmentAvailableSlotsTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: 34 tests run, 0 failures, 0 errors, BUILD SUCCESS.

2. **Run Receptionist Portal Tests**:
   ```powershell
   mvn test -pl backend/swd "-Dtest=ReceptionAppointmentServiceStaffResolutionTest,ReceptionPatientServiceTest,ChallengerReceptionPatientServiceTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: 23 tests run, 0 failures, 0 errors, BUILD SUCCESS.

3. **Verify Frontend Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected Result*: Vite builds client environment in `dist/`, exit code 0.
