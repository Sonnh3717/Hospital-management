# Security & WebMvc Challenger Handoff Report: Milestone 1 Round 2

**Agent**: challenger_m1_r2_2 (Security & WebMvc Challenger)  
**Parent Conversation ID**: 2ab79fb8-c072-4bd7-91b7-30b8c9e2bbe7  
**Verdict**: **APPROVE**

---

## 1. Observation

### 1.1 SessionAuthenticationFilter & SecurityConfig Verification
- **Code Inspection: `SecurityConfig.java` (lines 31–37)**:
  ```java
  @Bean
  public FilterRegistrationBean<SessionAuthenticationFilter> sessionAuthenticationFilterRegistration(
                  SessionAuthenticationFilter filter) {
          FilterRegistrationBean<SessionAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
          registration.setEnabled(false);
          return registration;
  }
  ```
  `FilterRegistrationBean<SessionAuthenticationFilter>` is explicitly declared as a bean with `registration.setEnabled(false)`, preventing Tomcat from auto-registering the filter bean at the servlet container level for `/*`. The filter is mounted exclusively inside Spring Security via `http.addFilterBefore(sessionAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)`.

- **Code Inspection: `SessionAuthenticationFilter.java` (lines 54–98)**:
  - Line 57–60: Checks `session.getRevokedAt() == null && session.getExpiresAt().isAfter(LocalDateTime.now()) && session.getUserAccount() != null && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE`.
  - Line 94–97: Creates empty context, binds token, sets context on holder, and explicitly persists to request attributes:
    ```java
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(authToken);
    SecurityContextHolder.setContext(context);
    securityContextRepository.saveContext(context, request, response);
    ```

- **Unit Test Coverage: `SessionAuthenticationFilterTest.java` (lines 61–205)**:
  All 6 filter execution branches are covered:
  1. Valid active receptionist session sets SecurityContext, constructs `StaffPrincipal`, assigns `ROLE_RECEPTIONIST`, and stores `SecurityContext` in `request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME)`.
  2. Deactivated user account (`ActiveStatus.INACTIVE`) is rejected with null authentication and null request attribute.
  3. Expired session (`expiresAt` in the past) is rejected.
  4. Revoked session (`revokedAt != null`) is rejected.
  5. Missing/non-Bearer Authorization header bypasses authentication and invokes `chain.doFilter` without touching `authSessionRepository`.
  6. `shouldNotFilter` correctly identifies public paths (`/api/auth/login`, `/api/health`, `/api/public/**`, and HTTP `OPTIONS`) and returns `false` for protected paths.

### 1.2 WebMvc Validation & IDOR Protection Verification
- **Code Inspection: `AppointmentController.java` (lines 140–158)**:
  ```java
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
  ```
  If a non-admin caller attempts an IDOR probe by supplying `?patientId=<otherId>`, `targetPatientId` is forcefully overridden by the caller's authentic identity (`principal.patientId()` or resolved `findByUserAccount_Id`). If no patient profile is resolved, it returns HTTP 200 with an empty list instead of failing or leaking data. Admin callers retain the ability to inspect arbitrary patient IDs.

- **Challenger Security Test Coverage**:
  - `AppointmentLifecycleChallengerTest.java` (Section 1):
    - Test 1.1: Omitted `patientId` resolves via `principal.patientId()` (77L) without account ID query.
    - Test 1.2: Omitted `patientId` and null `principal.patientId()` falls back to `patientRepository.findByUserAccount_Id`.
    - Test 1.3: Omitted `patientId` with missing profile returns empty list cleanly with message `"Chưa có hồ sơ bệnh nhân"`.
    - Test 1.4: Explicit `patientId` query parameter (888L) is respected when caller is `ADMIN`.
    - Test 1.5: Explicit `patientId` query parameter (888L) is ignored when caller is `PATIENT`; calls `getAppointmentsByPatient(77L)` and never calls `888L`.
  - `ChallengerWebValidationAndSecurityTest.java`:
    - Validates blank name rejection (HTTP 400 `VALIDATION_ERROR`).
    - Validates future date of birth rejection (HTTP 400 `VALIDATION_ERROR`).
    - Validates phone format validations (short and alphabetical strings return HTTP 400 `VALIDATION_ERROR`).
    - Validates optional emergency contact fields (omission returns HTTP 200).
    - Validates unverified OTP rejection (HTTP 400 `OTP_NOT_VERIFIED`).
    - Validates profile overwrite conflict (HTTP 409 `PROFILE_ALREADY_COMPLETED`).
    - Validates role-based route security (`/api/reception/patients` returns 401 for anonymous, 403 for `PATIENT` and `DOCTOR`, 200 for `RECEPTIONIST`).

### 1.3 Targeted Test Execution
Command executed:
```powershell
cd backend/swd
.\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
```
Verbatim Maven output:
```
[INFO] Running Challenger M1-1: Web MVC Validation & Role Security Probing
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 8.833 s -- in Challenger M1-1: Web MVC Validation & Role Security Probing
[INFO] Running Unit Test: SessionAuthenticationFilter
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.264 s -- in Unit Test: SessionAuthenticationFilter
[INFO] Running com.example.swd.service.AppointmentLifecycleChallengerTest
[INFO] Running 3. Receptionist Check-In & Undo Check-In Staff Resolution Tests
[INFO] Tests run: 9, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.686 s -- in 3. Receptionist Check-In & Undo Check-In Staff Resolution Tests
[INFO] Running 1. Patient Appointment Resolution Adversarial Tests
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.297 s -- in 1. Patient Appointment Resolution Adversarial Tests
[INFO] Running 2. Available Slots Boundary & Filtering Tests
[INFO] Tests run: 6, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.250 s -- in 2. Available Slots Boundary & Filtering Tests
[INFO] Tests run: 0, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.270 s -- in com.example.swd.service.AppointmentLifecycleChallengerTest
[INFO] 
[INFO] Results:
[INFO] Tests run: 42, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 1.4 Full Regression Suite Execution
Command executed:
```powershell
cd backend/swd
.\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
```
Verbatim Maven output:
```
[INFO] Results:
[INFO] Tests run: 100, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  18.178 s
```

---

## 2. Logic Chain

1. **Tomcat Servlet Registration Isolation**:
   - Because `SessionAuthenticationFilter` is annotated with `@Component`, Spring Boot registers it as a standard servlet container filter on `/*` unless explicitly disabled.
   - Observation 1.1 proves that `SecurityConfig.java` defines `FilterRegistrationBean<SessionAuthenticationFilter>` with `registration.setEnabled(false)`.
   - Therefore, the filter is executed strictly once per request inside `FilterChainProxy` before `UsernamePasswordAuthenticationFilter`.

2. **Security Context Persistence & Deferred Context**:
   - Spring Security 6 deferred context loading requires explicit context creation and repository persistence.
   - Observation 1.1 proves `SessionAuthenticationFilter` uses `SecurityContextHolder.createEmptyContext()`, binds the authenticated `StaffPrincipal`, and calls `securityContextRepository.saveContext(context, request, response)`.
   - Observation 1.1 and 1.3 prove that `SessionAuthenticationFilterTest` confirms `request.getAttribute(RequestAttributeSecurityContextRepository.DEFAULT_REQUEST_ATTR_NAME)` matches `SecurityContextHolder.getContext()`.

3. **Status and Revocation Enforcement**:
   - Observation 1.1 proves `session.getUserAccount().getStatus() == ActiveStatus.ACTIVE` is required for authentication.
   - Tests `doFilter_inactiveUserAccount_doesNotAuthenticate`, `doFilter_expiredSession_doesNotAuthenticate`, and `doFilter_revokedSession_doesNotAuthenticate` all confirm that inactive, expired, or revoked sessions result in null authentication.

4. **IDOR Mitigation on Patient Appointment Retrieval**:
   - Observation 1.2 proves that `AppointmentController.getPatientAppointments` evaluates whether `principal.role()` is `ADMIN`.
   - For all non-admin callers, `targetPatientId` strictly binds to the caller's own resolved patient ID. Any query parameter `?patientId=X` is ignored.
   - Observation 1.2 and 1.3 prove test 1.5 in `AppointmentLifecycleChallengerTest` verifies that when a patient caller provides `patientId=888`, the service is called with `77L` (the caller's own ID) and never with `888L`.

5. **WebMvc Validation and Error Formats**:
   - Observation 1.2 and 1.3 prove that `ChallengerWebValidationAndSecurityTest` (16 tests) verifies:
     - 400 with `VALIDATION_ERROR` for blank full names, future DOBs, and malformed phone numbers.
     - 400 with `OTP_NOT_VERIFIED` when OTP verification has not occurred.
     - 409 with `PROFILE_ALREADY_COMPLETED` when attempting to overwrite an existing profile.
     - 401 for unauthenticated calls and 403 for unauthorized role accesses.
     - Conformance with the `ApiResponse` schema (`code`, `success`, `message`, `data`, `timestamp`).

---

## 3. Caveats

1. **Integration Tests Requiring Live Database**:
   - As noted in worker handoff, tests requiring an external MySQL instance (`AppointmentWorkflowIntegrationTest`, `PayOSAndSchedulerIntegrationTest`) are separate from the in-memory test suite.
2. **No Unmitigated Flaws**:
   - All 42 targeted security and validation tests and all 100 tests in the full mock/unit suite pass with 0 failures, 0 errors, and 0 warnings.

---

## 4. Conclusion

**Verdict: APPROVE**

The Security and WebMvc layers have been thoroughly verified and stress-tested:
- `SessionAuthenticationFilter` and `SecurityConfig` correctly handle deferred context persistence, inactive accounts, session expiration, revocation, and Tomcat duplicate registration disablement.
- `AppointmentController` strictly prevents IDOR vulnerabilities by enforcing patient identity isolation for non-admin callers.
- WebMvc controllers correctly enforce validation rules, profile overwrite guards, and role-based authorization.
- All 42 targeted tests and all 100 regression tests execute cleanly and pass.

---

## 5. Verification Method

To independently reproduce the empirical findings:

1. **Execute Targeted Test Suite (42 tests)**:
   ```powershell
   cd backend/swd
   .\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected*: `Tests run: 42, Failures: 0, Errors: 0, Skipped: 0` -> `BUILD SUCCESS`.

2. **Execute Full Unit & Mock Test Suite (100 tests)**:
   ```powershell
   cd backend/swd
   .\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected*: `Tests run: 100, Failures: 0, Errors: 0, Skipped: 0` -> `BUILD SUCCESS`.

3. **Invalidation Conditions**:
   - Any test failure in `SessionAuthenticationFilterTest`, `ChallengerWebValidationAndSecurityTest`, or `AppointmentLifecycleChallengerTest`.
   - Removal of `FilterRegistrationBean<SessionAuthenticationFilter>` with `setEnabled(false)` in `SecurityConfig.java`.
   - A non-admin caller successfully retrieving appointments for a different `patientId`.
   - Deactivated user account successfully authenticating with an active session token.
