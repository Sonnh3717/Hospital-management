# Reviewer Handoff Report: Reviewer M1-1 (Backend Code Review & Verification)

## 1. Observation

1. **Test Execution Command & Result for Worker M1 Suite**:
   - Command:
     ```powershell
     cd backend/swd; ./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
     ```
   - Result:
     ```
     [INFO] Tests run: 39, Failures: 0, Errors: 0, Skipped: 0
     [INFO] BUILD SUCCESS
     [INFO] Total time: 12.068 s
     ```
2. **Spring Security Context Defect in `SessionAuthenticationFilter.java` (Line 86)**:
   - Verbatim code in `SessionAuthenticationFilter.java`:
     ```java
     82: UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
     83:         principal,
     84:         sessionId,
     85:         Collections.singletonList(new SimpleGrantedAuthority(roleName)));
     86: SecurityContextHolder.getContext().setAuthentication(authToken);
     ```
   - When executing adversarial mock tests against protected endpoints (`ChallengerWebValidationAndSecurityTest`), all authenticated requests using `Bearer <valid_token>` failed with HTTP 401 `UNAUTHENTICATED`:
     ```
     java.lang.AssertionError: Status expected:<200> but was:<401>
     Body = {"code":"UNAUTHENTICATED","message":"Vui lòng đăng nhập lại.","fieldErrors":{},"blockers":[]}
     ```
   - Trace log observation:
     ```
     TRACE o.s.security.web.FilterChainProxy : Invoking SessionAuthenticationFilter (7/13)
     TRACE o.s.security.web.FilterChainProxy : Invoking AnonymousAuthenticationFilter (10/13)
     TRACE .s.s.w.c.SupplierDeferredSecurityContext : Created SecurityContextImpl [Null authentication]
     TRACE o.s.s.w.a.AnonymousAuthenticationFilter : Set SecurityContextHolder to AnonymousAuthenticationToken [Principal=anonymousUser...]
     TRACE o.s.s.w.a.ExceptionTranslationFilter : Sending AnonymousAuthenticationToken to authentication entry point since access is denied
     ```
3. **Insecure Direct Object Reference (IDOR) in `AppointmentController.java` (Lines 139–156)**:
   - Verbatim code in `AppointmentController.java`:
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
     ```
   - If an authenticated patient passes `?patientId=<otherPatientId>`, `targetPatientId` takes `patientId` directly without verifying whether the caller has `ADMIN` role or owns that `patientId`.
4. **Public Profile Overwrite Risk in `PatientRegistrationServiceImpl.java` (Lines 149–186)**:
   - Endpoint: `POST /api/patients/complete-profile` is permitted unconditionally (`permitAll()`) in `SecurityConfig.java:47`.
   - In `PatientRegistrationServiceImpl.java`:
     ```java
     155: if (verification.getVerifiedAt() == null) {
     156:     throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
     157:             "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
     158: }
     ```
   - Once verified, `verification.getVerifiedAt()` remains permanently non-null. The service never checks whether the patient profile was already completed, nor does it require authentication or invalidate the verification record after completion.
5. **Staff 24-Hour Notice Constraint in `ReceptionAppointmentServiceImpl.java` (Lines 213, 229)**:
   - Reception cancellation and rescheduling enforce:
     ```java
     requireNotice(appointment, appointment.getAppointmentSlot().getAppointmentRule().getCancellationNoticeMinutes(), "hủy lịch");
     ```
   - With standard `cancellationNoticeMinutes = 1440` (24h), receptionists cannot cancel or reschedule same-day walk-in or assisted appointments for patients arriving at the counter.

---

## 2. Logic Chain

1. **Root Cause of Spring Security 401 on Bearer Authentication**:
   - *Observation 2*: Spring Security 6+ uses deferred security context resolution (`SupplierDeferredSecurityContext`).
   - Calling `SecurityContextHolder.getContext().setAuthentication(authToken)` mutates a transient context without updating the deferred supplier installed in the request attributes.
   - When downstream `AnonymousAuthenticationFilter` executes, it invokes `deferredContext.get()`, detects null authentication, and overwrites the security context with `AnonymousAuthenticationToken`.
   - The subsequent `AuthorizationFilter` sees an anonymous user accessing `/api/reception/**` and denies access. Because the user is anonymous, Spring Security delegates to `authenticationEntryPoint` (returning HTTP 401 `UNAUTHENTICATED`), breaking all role-based authorization for Bearer tokens.
2. **Root Cause of IDOR on `GET /api/patient/appointments`**:
   - *Observation 3*: The fallback logic was correctly changed from `principal.accountId()` to `principal.patientId()`. However, the guard only triggers `if (targetPatientId == null)`.
   - If a malicious patient supplies `patientId=2`, `targetPatientId` is non-null, bypassing the fallback and returning the other patient's appointment records.
3. **Root Cause of Unauthenticated Profile Overwrite**:
   - *Observation 4*: Step 2 registration does not expire or consume the OTP verification state upon completion. Any attacker knowing an existing active patient's email can submit `POST /api/patients/complete-profile` with modified phone, full name, or address, which gets persisted to MySQL.

---

## 3. Caveats

1. **Integration Tests Requirement**:
   - Integration tests `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` rely on a live MySQL instance on `localhost:3306`. They were excluded from unit test passes in accordance with Worker M1's documented caveat.
2. **Core Domain Services Quality**:
   - The business logic in `ReceptionPatientServiceImpl` (patient search with SQL escaping, walk-in creation with unique code, demographic updates, account status toggle with `NO_USER_ACCOUNT` guard) is thoroughly implemented and passes all unit tests when tested directly.
   - The removal of route collisions in `AppointmentController` successfully unblocked `ReceptionAppointmentController`.

---

## 4. Quality & Adversarial Review Findings

### [Critical] Finding 1: Spring Security Deferred Context Invalidation in `SessionAuthenticationFilter.java`
- **Location**: `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java:86`
- **What**: `SecurityContextHolder.getContext().setAuthentication(authToken);` fails to propagate authentication to `SecurityContextHolderFilter` / `AnonymousAuthenticationFilter`.
- **Why**: Breaks all authenticated API access across the entire backend when using Bearer tokens. All protected endpoints reject requests with HTTP 401 `UNAUTHENTICATED`.
- **Suggestion**:
  Replace line 86 with:
  ```java
  var context = SecurityContextHolder.createEmptyContext();
  context.setAuthentication(authToken);
  SecurityContextHolder.setContext(context);
  ```

### [Major] Finding 2: Insecure Direct Object Reference (IDOR) on `GET /api/patient/appointments`
- **Location**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java:140-151`
- **What**: Any authenticated patient can supply an arbitrary `patientId` parameter and read other patients' appointments.
- **Why**: Violates medical privacy and patient data segregation.
- **Suggestion**:
  Enforce patient ownership unless caller is an admin:
  ```java
  if (!"ADMIN".equalsIgnoreCase(principal.role())) {
      targetPatientId = principal.patientId() != null ? principal.patientId()
              : patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null);
  }
  ```

### [Major] Finding 3: Unauthenticated Patient Profile Overwrite via `POST /api/patients/complete-profile`
- **Location**: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java:149-186`
- **What**: `completeProfile` allows repeated public calls for any email whose OTP was previously verified.
- **Why**: Allows unauthorized modification of patient demographics and emergency contact information.
- **Suggestion**:
  Verify that the profile has not yet been completed, or invalidate the verification upon profile completion:
  ```java
  if (account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null) {
      throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED", "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
  }
  ```

### [Minor] Finding 4: Inconsistent Notice Period on Reception Reschedule/Cancel
- **Location**: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java:213, 229`
- **What**: `requireNotice` is unconditionally enforced for receptionists, preventing same-day cancellations and reschedules at the front desk.
- **Why**: Front desk staff need flexibility to manage walk-in patients and same-day operational changes.
- **Suggestion**: Allow receptionist actor to bypass or override `requireNotice`.

---

## 5. Verified Claims & Test Matrix

| Claim | Verification Method | Result | Notes |
|---|---|---|---|
| Duplicate endpoints removed from `AppointmentController` | Code inspection of `AppointmentController.java` | PASS | Collisions with `/api/reception/**` eliminated |
| `GET /api/appointments/available-slots` implemented | `AppointmentAvailableSlotsTest` (3 tests) | PASS | Filters capacity, open status, future endsAt |
| Receptionist Patient CRUD implemented | `ReceptionPatientServiceTest` (8 tests) | PASS | Search, detail, create walk-in, edit, status toggle |
| Step 2 profile completion endpoint implemented | `PatientRegistrationServiceTest` (20 tests) | PASS | Enforces OTP gate, required vs optional fields |
| Enriched `StaffPrincipal` resolution | `ReceptionAppointmentServiceStaffResolutionTest` | PASS | Resolves `staffId` via `userAccount.id` |
| Bearer Authentication on Protected Endpoints | `ChallengerWebValidationAndSecurityTest` | **FAIL** | Returns 401 due to Finding 1 |

---

## 6. Conclusion & Gate Verdict

Worker M1 has successfully resolved the routing collisions, implemented the receptionist patient management service, and provided the profile completion flow with thorough unit tests (39/39 passing). However, an objective adversarial evaluation revealed a **Critical security defect** in `SessionAuthenticationFilter.java` that invalidates authentication for all Bearer tokens on protected endpoints, as well as an IDOR vulnerability on patient appointment listing.

Therefore, changes are required before Milestone 1 can be certified for Milestone 2 frontend integration.

Verdict: REQUEST_CHANGES

---

## 7. Verification Method for Rework

To independently verify the fix:
1. Fix `SessionAuthenticationFilter.java:86` by creating an empty context and calling `SecurityContextHolder.setContext(context)`.
2. Fix IDOR in `AppointmentController.java:140-151`.
3. Fix unauthenticated overwrite in `PatientRegistrationServiceImpl.java:149-186`.
4. Re-run:
   ```powershell
   cd backend/swd
   ./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected Result*: All tests pass with 0 failures and 0 errors.
