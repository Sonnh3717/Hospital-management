# Review Report: Reviewer M1-2 — API Interface & Security Conformance Review

## 1. Observation

1. **Compilation and Dispatched Unit Test Suite**:
   - Commands executed:
     ```powershell
     cd backend/swd
     ./mvnw test-compile
     ./mvnw test "-Dtest=PatientRegistrationServiceTest,ReceptionPatientServiceTest,PatientControllerTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
     ```
   - Verbatim compilation output:
     ```
     [INFO] Compiling swd 0.0.1-SNAPSHOT
     [INFO] BUILD SUCCESS (2.593 s)
     ```
   - Verbatim test output:
     ```
     [INFO] Running com.example.swd.controller.patient.PatientControllerTest
     [INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
     [INFO] Running com.example.swd.service.PatientRegistrationServiceTest
     [INFO] Tests run: 20, Failures: 0, Errors: 0, Skipped: 0
     [INFO] Running com.example.swd.service.ReceptionPatientServiceTest
     [INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
     [INFO] Results:
     [INFO] Tests run: 32, Failures: 0, Errors: 0, Skipped: 0
     [INFO] BUILD SUCCESS
     ```

2. **Step 2 Registration Endpoint & OTP Verification Gate (`PatientController.java` & `PatientRegistrationServiceImpl.java`)**:
   - In `PatientController.java` (lines 38–42):
     ```java
     @PostMapping("/complete-profile")
     public ApiResponse<PatientRegistrationService.CompletedProfileView> completeProfile(
             @Valid @RequestBody RegistrationCommands.CompleteProfile input) {
         return ApiResponse.ok("Hồ sơ bệnh nhân đã được hoàn tất thành công", registration.completeProfile(input));
     }
     ```
   - In `RegistrationCommands.java` (lines 43–77):
     Required fields: `email` (@NotBlank, @Email), `fullName` (@NotBlank), `dateOfBirth` (@NotNull, @PastOrPresent), `gender` (@NotNull), `phone` (@NotBlank, Vietnamese pattern), `address` (@NotBlank).
     Optional fields: `emergencyContactName` (max 150), `emergencyContactPhone` (regex allowing blank or valid phone).
   - In `PatientRegistrationServiceImpl.java` (lines 149–186):
     ```java
     String address = normalizeEmail(input.email());
     UserAccount account = lockAccount(address);
     RegistrationVerification verification = verifications.lockByAccountId(account.getId())
             .orElseThrow(PatientRegistrationServiceImpl::notPending);

     if (verification.getVerifiedAt() == null) {
         throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
                 "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
     }
     ```
   - *Adversarial Observation*: Once verified, `verification.getVerifiedAt()` remains permanently non-null. The endpoint `POST /api/patients/complete-profile` is public (`permitAll()` in `SecurityConfig.java:47`) and does not verify whether the patient profile has already been completed (`account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null`). Anyone with the patient's email address can repeatedly call `complete-profile` to overwrite demographics and emergency contact information in the database.

3. **Protection of Receptionist Endpoints (`/api/reception/**`)**:
   - `ReceptionPatientController.java` (line 20) and `ReceptionAppointmentController.java` (line 23) both specify class-level:
     `@PreAuthorize("hasRole('RECEPTIONIST')")`
   - `SecurityConfig.java` (line 51) specifies:
     `.requestMatchers("/api/reception/**").hasRole("RECEPTIONIST")`
   - `ReceptionPatientServiceImpl.java` (lines 37, 50, 60, 77, 98) programmatic check:
     ```java
     private void requireReceptionist(StaffPrincipal actor) {
         if (actor == null || !"RECEPTIONIST".equalsIgnoreCase(actor.role())) {
             throw new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chức năng chỉ dành cho nhân viên tiếp đón/lễ tân.");
         }
     }
     ```

4. **Spring Security Context Defect in `SessionAuthenticationFilter.java` (Line 86)**:
   - Verbatim code in `SessionAuthenticationFilter.java` (lines 82–87):
     ```java
     UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
             principal,
             sessionId,
             Collections.singletonList(new SimpleGrantedAuthority(roleName)));
     SecurityContextHolder.getContext().setAuthentication(authToken);
     ```
   - Adversarial execution in `ChallengerWebValidationAndSecurityTest`:
     ```
     DEBUG o.s.s.web.DefaultSecurityFilterChain : Will secure any request with filters: DisableEncodeUrlFilter, WebAsyncManagerIntegrationFilter, SecurityContextHolderFilter, HeaderWriterFilter, CorsFilter, LogoutFilter, SessionAuthenticationFilter, RequestCacheAwareFilter, SecurityContextHolderAwareRequestFilter, AnonymousAuthenticationFilter, SessionManagementFilter, ExceptionTranslationFilter, AuthorizationFilter
     DEBUG o.s.security.web.FilterChainProxy : Securing GET /api/reception/patients
     DEBUG o.s.s.w.a.AnonymousAuthenticationFilter : Set SecurityContextHolder to anonymous SecurityContext
     ...
     Status = 401
     Body = {"code":"UNAUTHENTICATED","message":"Vui lòng đăng nhập lại.","fieldErrors":{},"blockers":[]}
     ```
   - Calling `SecurityContextHolder.getContext().setAuthentication(authToken)` in Spring Security 6+ mutates an existing transient context but fails to update the deferred context supplier installed by `SecurityContextHolderFilter`.
   - When downstream `AnonymousAuthenticationFilter` executes, it evaluates the deferred supplier, finds no authentication, and replaces the context with `AnonymousAuthenticationToken`.
   - As a result, every Bearer authenticated request to protected endpoints (`/api/reception/**`, `/api/doctor/**`, `/api/patient/**`) is treated as anonymous and rejected with HTTP 401 `UNAUTHENTICATED`.

5. **Omission of Account Status Verification in `SessionAuthenticationFilter.java` (Line 53)**:
   - Verbatim check:
     ```java
     if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now())) {
         UserAccount account = session.getUserAccount();
     ```
   - Unlike `AuthServiceImpl.login` (line 49), `SessionAuthenticationFilter` does not check `account.getStatus() == ActiveStatus.ACTIVE`.
   - If a receptionist or administrator deactivates a patient account via `PUT /api/reception/patients/{id}/status`, any active bearer session for that account remains authenticated and continues to have access until natural session expiration.

6. **Insecure Direct Object Reference (IDOR) on Patient Appointments (`AppointmentController.java:140-156`)**:
   - Verbatim code:
     ```java
     Long targetPatientId = patientId;
     if (targetPatientId == null && principal != null) {
         if (principal.patientId() != null) {
             targetPatientId = principal.patientId();
         } else {
             targetPatientId = patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null);
         }
     }
     List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
     ```
   - If an authenticated `PATIENT` caller passes `?patientId=<other_id>`, the parameter `targetPatientId` bypasses the caller's identity check, returning medical appointment records belonging to another patient.

7. **SQL DDL Migration and Seed Scripts**:
   - `database/migration_registration_verifications.sql`: Verified. Defines `registration_verifications` with `user_account_id` PK/FK to `user_accounts`, `otp_hash`, `expires_at`, `last_sent_at`, `failed_attempts`, `verified_at`, `terms_accepted_at`. Accurately mirrors `RegistrationVerification.java`.
   - `database/showcase_demo_seed.sql`: Verified. Idempotent seed inserts demo accounts for all 6 roles (Admin, Manager, Doctor, Medical Service Staff, Receptionist, Patient) with clear text `Password123!` and hash `@demo_password_hash`. Dynamic slots and demo appointments (`CHECKED_IN`, `BOOKED`, `CANCELLED`) match appointment rules and schemas.

8. **Response Structure Mismatch in `ApiResponse.java`**:
   - `PROJECT.md §25 & §88-99` mandates:
     `ApiResponse<T>(code, message, data, timestamp)` where `code` is integer (e.g. `200`).
   - `ApiResponse.java` contains:
     ```java
     public class ApiResponse<T> {
         private boolean success;
         private String message;
         private T data;
     ```
   - Missing fields: `code` (int) and `timestamp` (String/Instant).

---

## 2. Logic Chain

1. **Integrity and Authenticity Assessment**:
   - Observations 1, 2, 3, and 7 demonstrate that Worker M1 did not write facade implementations, hardcode test answers, or fake log artifacts.
   - The DDL migrations match JPA entities, reception service methods execute multi-predicate JPA Specifications, and the OTP verification gate in `PatientRegistrationServiceImpl` strictly blocks unverified requests with HTTP 400 `OTP_NOT_VERIFIED`.
   - Worker M1 passed all 32 dispatched tests and 39 full worker unit tests.
   - The integrity audit is CLEAN.

2. **Root Cause Analysis of Protected Endpoint Authentication Failure**:
   - In Spring Security 6, `SecurityContextHolderFilter` is the entry point filter that configures deferred loading via `SupplierDeferredSecurityContext`.
   - When `SessionAuthenticationFilter` sets `SecurityContextHolder.getContext().setAuthentication(authToken)` without creating a new context and invoking `SecurityContextHolder.setContext(context)` or updating `SecurityContextRepository`, the deferred supplier on the request is not synchronized.
   - When `AnonymousAuthenticationFilter` executes, it evaluates the deferred supplier, detects null authentication, and overwrites the security context with `AnonymousAuthenticationToken`.
   - When `AuthorizationFilter` evaluates `/api/reception/**`, it sees `AnonymousAuthenticationToken`. Since the user is anonymous, Spring Security delegates to `SecurityResponses.unauthorized` (HTTP 401 `UNAUTHENTICATED`).
   - Consequently, no authenticated user can invoke `/api/reception/**` via standard Bearer tokens in a real HTTP / WebMvc environment.

3. **Demographic Overwrite Vulnerability**:
   - Step 2 `POST /api/patients/complete-profile` is permitted to all callers (`permitAll()`).
   - Because `RegistrationVerification.verifiedAt` is never cleared or transitioned to a terminal `COMPLETED` state, and the method does not verify that the patient profile is uncompleted, an attacker can overwrite verified patient records at will.

4. **Information Disclosure (IDOR)**:
   - Line 142 of `AppointmentController` accepts an untrusted query parameter `patientId` for `PATIENT` callers without ensuring `principal.patientId().equals(patientId)`. This allows horizontal privilege escalation across patient records.

---

## 3. Caveats

1. **Local MySQL Connection for E2E Integration Tests**:
   - Tests `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` require an external running MySQL service on port 3306. Unit tests mock repository layers cleanly and execute in-memory.
2. **Domain Service Completeness**:
   - When tested in isolation without the servlet filter chain, `ReceptionPatientServiceImpl` and `ReceptionAppointmentServiceImpl` execute correctly with complete null safety and boundary validations.

---

## 4. Conclusion & Findings Matrix

| Finding ID | Severity | Location | Summary |
|---|---|---|---|
| **FINDING-1** | **Critical** | `SessionAuthenticationFilter.java:86` | Spring Security 6 deferred context bug: Bearer token authentication is overwritten by `AnonymousAuthenticationFilter`, causing all protected endpoints to return 401 `UNAUTHENTICATED`. |
| **FINDING-2** | **Major** | `AppointmentController.java:140-156` | Insecure Direct Object Reference (IDOR): Authenticated patients can read other patients' appointments via `?patientId=`. |
| **FINDING-3** | **Major** | `PatientRegistrationServiceImpl.java:149-186` | Unauthenticated Demographic Overwrite: `POST /api/patients/complete-profile` lacks completion check, allowing arbitrary repeated updates to active patient profiles. |
| **FINDING-4** | **Major** | `SessionAuthenticationFilter.java:53` | Missing Account Status Verification: Deactivated accounts (`status = INACTIVE`) remain authenticated until session token expiry. |
| **FINDING-5** | **Minor** | `ApiResponse.java` / `PROJECT.md §25` | Interface contract discrepancy: `ApiResponse` defines `success` (boolean) instead of `code` (int) and `timestamp`. |

Because **FINDING-1** critically breaks all authenticated API communication and **FINDING-2** exposes patient appointment records to IDOR, the work product cannot be approved in its current state.

Verdict: REQUEST_CHANGES

---

## 5. Verification Method

To independently reproduce the findings and verify the fixes:

1. **Verify Context Failure in WebMvc**:
   Run the adversarial WebMvc test suite:
   ```powershell
   cd backend/swd
   ./mvnw test "-Dtest=ChallengerWebValidationAndSecurityTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Current Observation*: Requests to `/api/reception/patients` fail with `401 UNAUTHENTICATED` instead of `200` or `403`.

2. **Resolution Required in Worker Rework**:
   - In `SessionAuthenticationFilter.java:86`:
     ```java
     var context = SecurityContextHolder.createEmptyContext();
     context.setAuthentication(authToken);
     SecurityContextHolder.setContext(context);
     ```
   - In `SessionAuthenticationFilter.java:53`:
     ```java
     if (session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now())
             && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE)
     ```
   - In `AppointmentController.java:142-151`:
     ```java
     if (!"ADMIN".equalsIgnoreCase(principal.role())) {
         targetPatientId = principal.patientId() != null ? principal.patientId()
                 : patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null);
     }
     ```
   - In `PatientRegistrationServiceImpl.java:158`:
     ```java
     if (account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null) {
         throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED", "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
     }
     ```
   - In `ApiResponse.java`: Add `code` (int) and `timestamp` (LocalDateTime / String) to match `PROJECT.md`.

3. **Re-run Full Regression Suite**:
   ```powershell
   cd backend/swd
   ./mvnw test "-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: 100% of tests pass (80+ tests) with 0 failures and 0 errors.
