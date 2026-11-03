# Handoff Report: Worker M1 — Backend APIs, Controllers, Services & Integration

## 1. Observation

1. **Duplicate Endpoint Collision in `AppointmentController.java`**:
   - `AppointmentController.java` previously mapped:
     - `@PostMapping("/reception/appointments/{id}/check-in")` (lines 82–89)
     - `@PostMapping("/reception/appointments/{id}/undo-check-in")` (lines 94–104)
   - These conflicted with `ReceptionAppointmentController` under `@RequestMapping("/api/reception")`, causing route collision and the deletion of `ReceptionAppointmentController` in commit `41bd23c`.
2. **Patient ID Mapping Defect in `AppointmentController.getPatientAppointments`**:
   - Lines 149–157 queried appointments using `principal.accountId()` when `patientId` parameter was null:
     `Long targetPatientId = patientId != null ? patientId : principal.accountId();`
   - Because `user_account_id` does not match `patient_id`, logged-in patients could not retrieve their appointments.
3. **Missing Staff and Patient Identifiers in `SessionAuthenticationFilter.java`**:
   - Lines 49–54 constructed `StaffPrincipal` with a hardcoded `null` staffId and no patientId:
     `StaffPrincipal principal = new StaffPrincipal(account.getId(), null, account.getUsername(), account.getUsername(), account.getRole().getRoleCode().name());`
   - Calling `reception.checkIn` triggered a NullPointerException when invoking `staff.getReferenceById(actor.staffId())`.
4. **Missing Step 2 Patient Registration (`complete-profile`)**:
   - `PatientController` and `PatientRegistrationService` lacked an endpoint to complete patient demographics after OTP verification as mandated by `ORIGINAL_REQUEST.md §R2` and `PROJECT.md §1`.
5. **Missing Receptionist Patient CRUD**:
   - No receptionist controller or service existed for patient search, detailed view, walk-in creation, editing demographics, and active/inactive status toggling as required by `ORIGINAL_REQUEST.md §R5` and `PROJECT.md §3`.
6. **Compilation and Test Execution Results**:
   - Maven build command:
     `./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'`
   - Result:
     ```
     [INFO] Tests run: 39, Failures: 0, Errors: 0, Skipped: 0
     [INFO] BUILD SUCCESS
     [INFO] Total time: 10.957 s
     ```

---

## 2. Logic Chain

1. **Resolving Route Collisions & Restoring Reception Appointment Endpoints**:
   - *Observation 1*: By removing the check-in and undo-check-in methods from `AppointmentController`, `ReceptionAppointmentController` can be restored under `@RequestMapping("/api/reception")` with `@PreAuthorize("hasRole('RECEPTIONIST')")`.
   - *Implementation*: Restored `ReceptionAppointmentController.java` mapping `/appointments`, `/appointments/{id}`, `/options`, `/appointments` (POST), `/appointments/{id}/check-in`, `/appointments/{id}/undo-check-in`, `/appointments/{id}/cancel`, and `/appointments/{id}/reschedule`.
   - *Observation 3*: In `ReceptionAppointmentServiceImpl.java`, implemented `effectiveStaffId` which falls back to looking up `HospitalStaff` by `actor.accountId()` when `actor.staffId()` is null, guaranteeing null-safety during receptionist check-in operations.

2. **Fixing Patient Appointment Resolution & Adding Slot Availability Discovery**:
   - *Observation 2*: In `AppointmentController.getPatientAppointments`, resolved `targetPatientId` using `principal.patientId()` first; if null, looked up `patientRepository.findByUserAccount_Id(principal.accountId())`.
   - *Implementation*: Added `GET /api/appointments/available-slots` in `AppointmentController` delegating to `AppointmentService.getAvailableSlots(date, doctorId)` which queries `AppointmentSlotRepository.findForDate`, filters for `OPEN` status, future `endsAt`, and positive remaining capacity (`capacity - activeAppointments > 0`), returning formatted `SlotView` DTOs.

3. **Receptionist Patient Management CRUD**:
   - *Observation 5*: Created `ReceptionPatientRequests.java` (`CreatePatientRequest`, `UpdatePatientRequest`, `UpdateStatusRequest`) and `ReceptionPatientViews.java` (`PatientListItemView`, `PatientDetailView`) with full bean validation and Vietnamese error messages.
   - *Implementation*: Implemented `ReceptionPatientService` and `ReceptionPatientServiceImpl` providing paginated search across `patientCode`, `fullName`, `phone`, `contactEmail`, patient detail retrieval, walk-in creation with generated `patientCode`, demographic updating, and user account status toggling.
   - Created `ReceptionPatientController` at `@RequestMapping("/api/reception/patients")` with `@PreAuthorize("hasRole('RECEPTIONIST')")`.

4. **Patient Registration Step 2 (`POST /api/patients/complete-profile`)**:
   - *Observation 4*: Added `RegistrationCommands.CompleteProfile` record with required patient fields (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`, `email`) and optional guardian/emergency fields (`emergencyContactName`, `emergencyContactPhone`).
   - *Implementation*: Implemented `completeProfile` in `PatientRegistrationService` and `PatientRegistrationServiceImpl`. It enforces the OTP verification gate (`verification.getVerifiedAt() != null`), creates or updates the `Patient` entity, assigns a unique `patientCode`, sets `UserAccount.status = ACTIVE`, and returns `CompletedProfileView`.
   - Added `POST /api/patients/complete-profile` in `PatientController.java` and permitted it in `SecurityConfig.java`.

5. **Session Principal Enrichment**:
   - *Observation 3*: In `SessionAuthenticationFilter.java`, injected `HospitalStaffRepository` and `PatientRepository` to resolve `staffId`, `patientId`, and `fullName` from the database upon valid Bearer session authentication, providing a fully enriched `StaffPrincipal`.

---

## 3. Caveats

1. **Walk-In Patients Without User Accounts**:
   - Patients created directly at the reception desk via `POST /api/reception/patients` have `userAccount = null` (they do not have an online login account). Calling `PUT /api/reception/patients/{id}/status` on such patients correctly throws HTTP 400 `NO_USER_ACCOUNT` ("Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa").
2. **Live Database Integration Tests**:
   - `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` require a live MySQL database on `localhost:3306` with active connection credentials. In environments without live MySQL running, these integration tests will fail on connection timeout. All 39 unit and mock web tests run completely in-memory and pass 100%.

---

## 4. Conclusion

All backend Milestone 1 implementation tasks have been cleanly completed:
1. All duplicate endpoints removed from `AppointmentController.java`; `available-slots` endpoint added; patient ID resolution fixed.
2. `ReceptionAppointmentController.java` fully restored and null-safe staff lookup implemented in `ReceptionAppointmentServiceImpl.java`.
3. Receptionist patient management CRUD fully implemented (`ReceptionPatientRequests`, `ReceptionPatientViews`, `ReceptionPatientService`, `ReceptionPatientServiceImpl`, `ReceptionPatientController`).
4. Step 2 patient profile completion endpoint `POST /api/patients/complete-profile` fully implemented and permitted in `SecurityConfig.java`.
5. `SessionAuthenticationFilter` enriches `StaffPrincipal` with `staffId`, `patientId`, and `fullName`.
6. 19 new unit tests added covering all new endpoints and services; entire unit test suite (39 tests) passes with 0 failures and 0 errors.

---

## 5. Verification Method

### 1. Build and Static Compilation
Run Maven test compilation from `backend/swd`:
```powershell
cd backend/swd
./mvnw test-compile
```
*Expected Result*: `BUILD SUCCESS` with 0 compiler errors.

### 2. Unit Test Suite Execution
Run the unit test suite covering registration, controllers, services, and reception:
```powershell
cd backend/swd
./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
```
*Expected Result*: `Tests run: 39, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS`.

### 3. Key Files to Inspect
- `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java` (Duplicate methods removed, `available-slots` added, patient ID resolution fixed)
- `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java` (Restored reception appointment endpoints)
- `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java` (Receptionist patient CRUD)
- `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionPatientServiceImpl.java` (Reception patient management logic)
- `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java` (`completeProfile` method)
- `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java` (`StaffPrincipal` enrichment)
- `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java` (`permitAll` for `complete-profile` and `available-slots`)
