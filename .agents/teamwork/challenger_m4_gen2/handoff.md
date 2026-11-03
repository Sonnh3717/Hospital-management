# Phase 2 Tier 5 Adversarial Coverage Hardening Report

**Milestone**: Milestone 4 (Final Milestone: E2E Verification & Adversarial Hardening)  
**Author**: `challenger_m4_gen2`  
**Role**: Tier 5 Adversarial Coverage Hardening Challenger  
**Date**: 2026-11-02T22:36:00Z  
**Verdict**: **`APPROVE`** (No Critical Coverage Gaps or Security Vulnerabilities Found)

---

## 1. Observation

### 1.1 Direct Test Suite Execution Results

1. **E2E Requirement Showcase Suite (`node tests/e2e_showcase_suite.mjs`)**:
   - Command: `node tests/e2e_showcase_suite.mjs`
   - Exit Code: `0`
   - Test Results: `46 tests run, 46 passed, 0 failed, 0 skipped`
   - Output log excerpt:
     ```
     ============================================================
                      E2E TEST EXECUTION SUMMARY                 
     ============================================================
     Total Tests Run:  46
     Passed:           46
     Failed:           0
     Skipped:          0
     Total Duration:   17ms
     ============================================================
     ```

2. **Tier 5 Adversarial Coverage Hardening Suite (`node tests/tier5_adversarial_coverage.mjs`)**:
   - Command: `node tests/tier5_adversarial_coverage.mjs`
   - Exit Code: `0`
   - Test Results: `23 stress tests run, 23 passed, 0 failed`
   - Output log excerpt:
     ```
     ======================================================================
                TIER 5 ADVERSARIAL STRESS EXECUTION SUMMARY                
     ======================================================================
     Total Stress Tests:  23
     Passed:              23
     Failed:              0
     Duration:            9ms
     ======================================================================
     TIER 5 ADVERSARIAL COVERAGE HARDENING PASSED: 100% of adversarial stress assertions satisfied.
     ```

3. **Backend Unit, Integration, and Challenger Suites (`mvn test`)**:
   - Command:
     ```powershell
     mvn.cmd test -pl backend/swd "-Dtest=Challenger*,Reception*,AppointmentLifecycle*,AppointmentAvailableSlots*,PatientRegistration*,RegistrationEmail*,SessionAuth*,PatientController*" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
     ```
   - Exit Code: `0` (`BUILD SUCCESS`)
   - Test Results: `117 tests run, 117 passed, 0 failures, 0 errors, 0 skipped`
   - Suite breakdown:
     - `Challenger M1-1: Patient Registration Profile Completion Edge Cases`: 10 tests, 0 failures.
     - `Challenger M1-1: Reception Patient Service Edge Cases & Security Probing`: 8 tests, 0 failures.
     - `Challenger M1-1: Web MVC Validation & Role Security Probing`: 16 tests, 0 failures.
     - `PatientControllerTest`: 4 tests, 0 failures.
     - `SessionAuthenticationFilterTest`: 6 tests, 0 failures.
     - `AppointmentAvailableSlotsTest`: 3 tests, 0 failures.
     - `AppointmentLifecycleChallengerTest`: 31 tests, 0 failures.
     - `PatientRegistrationServiceTest`: 21 tests, 0 failures.
     - `ReceptionAppointmentServiceStaffResolutionTest`: 7 tests, 0 failures.
     - `ReceptionPatientServiceTest`: 8 tests, 0 failures.
     - `RegistrationEmailServiceTest`: 3 tests, 0 failures.

4. **Frontend Production Compilation (`npm run build`)**:
   - Command: `cd frontend; npm run build`
   - Exit Code: `0`
   - Output excerpt:
     ```
     ✓ 97 modules transformed.
     dist/index.html                   0.73 kB │ gzip:   0.46 kB
     dist/assets/index-CLqZYiYN.css   49.46 kB │ gzip:   8.15 kB
     dist/assets/index-DEMcz9lT.js   410.17 kB │ gzip: 104.71 kB
     ✓ built in 2.45s
     ```

---

### 1.2 White-Box Code Observations & Exact Verbatim Excerpts

#### A. RBAC & Security Filter Chain (`backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`)
- **Stateless Session & Exception Handlers** (lines 44–50):
  ```java
  .sessionManagement(session -> session
          .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
  .exceptionHandling(errors -> errors
          .authenticationEntryPoint((request, response,
                          exception) -> SecurityResponses.unauthorized(response))
          .accessDeniedHandler((request, response, exception) -> SecurityResponses
                          .forbidden(response)))
  ```
- **Strict Endpoint Authorizations** (lines 59–66):
  ```java
  .requestMatchers("/api/auth/me", "/api/auth/logout").authenticated()
  .requestMatchers("/api/reception/**").hasRole("RECEPTIONIST")
  .requestMatchers("/api/doctor/**").hasRole("DOCTOR")
  .requestMatchers("/api/services/**").hasRole("MEDICAL_SERVICE_STAFF")
  .requestMatchers("/api/admin/**").hasRole("ADMIN")
  .requestMatchers("/api/manager/**").hasRole("MANAGER")
  .requestMatchers("/api/patient/**").hasRole("PATIENT")
  .anyRequest().authenticated()
  ```

#### B. Bearer Authentication & Session Filter (`backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`)
- Lines 52–61:
  ```java
  String authorization = request.getHeader("Authorization");
  if (authorization != null && authorization.startsWith("Bearer ") && authorization.length() > 7) {
      String sessionId = authorization.substring(7).trim();
      Optional<AuthSession> sessionOpt = authSessionRepository.findForAuthentication(sessionId);
      if (sessionOpt.isPresent()) {
          AuthSession session = sessionOpt.get();
          if (session.getRevokedAt() == null
                  && session.getExpiresAt().isAfter(LocalDateTime.now())
                  && session.getUserAccount() != null
                  && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE) {
  ```

#### C. IDOR Defense in Appointment Listing (`backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`)
- Lines 142–151:
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
  ```

#### D. 24-Hour Notice Constraint (`backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java`)
- Lines 154–161:
  ```java
  // Ràng buộc hủy trước 24 giờ (1440 phút)
  if (isPatient) {
      Duration duration = Duration.between(LocalDateTime.now(), appointment.getAppointmentSlot().getStartsAt());
      if (duration.toMinutes() < 1440) {
          throw new WorkflowException(HttpStatus.BAD_REQUEST, "DEADLINE_EXCEEDED",
                  "Chỉ được phép hủy lịch hẹn trước giờ khám tối thiểu 24 giờ");
      }
  }
  ```

#### E. Two-Step OTP Verification Gate & Anti-Replay (`backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`)
- Lines 154–168 & 196:
  ```java
  if (account.getStatus() == ActiveStatus.ACTIVE) {
      patient = patients.findByUserAccount_Id(account.getId()).orElse(null);
      if (patient != null && patient.getDateOfBirth() != null) {
          throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED",
                  "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
      }
  }

  RegistrationVerification verification = verifications.lockByAccountId(account.getId())
          .orElseThrow(PatientRegistrationServiceImpl::notPending);

  if (verification.getVerifiedAt() == null) {
      throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
              "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
  }
  ...
  verifications.delete(verification); // Single-use token purge
  ```

#### F. Frontend ProtectedRoute & Session Expiration (`frontend/src/components/ProtectedRoute.jsx` & `frontend/src/services/api.js`)
- `ProtectedRoute.jsx` (lines 20–28):
  ```jsx
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const fallbackPath = getRoleDashboardPath(user.role);
    return <Navigate to={fallbackPath} replace />;
  }
  ```
- `api.js` (lines 26–37):
  ```javascript
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
          localStorage.removeItem('token');
          localStorage.removeItem('auth_user');
          window.location.href = '/login?session_expired=true';
        }
      }
      return Promise.reject(error);
    }
  );
  ```

---

## 2. Logic Chain

1. **Unauthenticated Access Denial (Obs 1.1, 1.2-A, 1.2-B)**:
   - When an unauthenticated client requests any protected resource (e.g. `GET /api/reception/patients`, `GET /api/doctor/appointments`, `GET /api/patient/appointments`), `SessionAuthenticationFilter` finds no valid `Authorization: Bearer <token>`.
   - The `SecurityContext` remains unpopulated.
   - Spring Security's `SecurityConfig` evaluates `.anyRequest().authenticated()` and triggers `authenticationEntryPoint`, returning HTTP 401 `{"code":"UNAUTHENTICATED","message":"Vui lòng đăng nhập lại."}`.
   - In frontend routing (`ProtectedRoute.jsx`), unauthenticated visitors are intercepted before rendering and redirected to `/login`.
   - Therefore, unauthenticated access is completely blocked at both backend and frontend layers.

2. **Role-Spoofing & Privilege Separation (Obs 1.1-2, 1.2-A, 1.2-F)**:
   - When a user authenticated as `PATIENT` attempts to access receptionist endpoints (`/api/reception/**`), the principal's authority is `ROLE_PATIENT`.
   - Spring Security checks `.hasRole("RECEPTIONIST")` and triggers `accessDeniedHandler`, returning HTTP 403 `{"code":"FORBIDDEN","message":"Bạn không có quyền truy cập chức năng này."}`.
   - Additionally, controller classes (`ReceptionPatientController`, `ReceptionAppointmentController`) declare `@PreAuthorize("hasRole('RECEPTIONIST')")`, providing dual-layer defense.
   - In frontend (`ProtectedRoute.jsx`), a `PATIENT` navigating to `/reception` or `/doctor` is immediately bounced back to `/patient`.
   - Therefore, cross-role horizontal and vertical privilege escalation is prevented.

3. **IDOR & Parameter Tampering Resilience (Obs 1.1-3, 1.2-C)**:
   - An attacker attempting to view another patient's records might send `GET /api/patient/appointments?patientId=999`.
   - In `AppointmentController.java`, the code checks `if (!isAdmin)` and strictly overrides `targetPatientId` with `principal.patientId()` or queries by `principal.accountId()`.
   - The user-supplied `patientId` parameter is ignored for all non-admin callers.
   - Therefore, patient-to-patient data leakage via IDOR is impossible.

4. **Workflow Invariants & State Machine Enforcement (Obs 1.1-3, 1.2-D, 1.2-E)**:
   - A patient trying to cancel or reschedule within 24 hours of the appointment is blocked by `Duration.between(...) < 1440` and thrown `DEADLINE_EXCEEDED` (HTTP 400).
   - A receptionist has legitimate counter discretion to assist walk-in or urgent patients, correctly bypassing the 24h rule (`isPatient == false`).
   - Checking in an appointment from a different date is rejected with `INVALID_STATE` (HTTP 409).
   - If an encounter has already started with the doctor, check-in and undo check-in are rejected with `ENCOUNTER_STARTED` (HTTP 409).
   - Offline walk-in patient records without online accounts cannot have their account status mutated, throwing `NO_USER_ACCOUNT` (HTTP 400).
   - Therefore, business domain state machine transitions are strictly guarded.

5. **Registration Integrity & Anti-Replay Resistance (Obs 1.1-3, 1.2-E)**:
   - Bypassing Step 1 (OTP verification) by directly posting to `POST /api/patients/complete-profile` fails with `OTP_NOT_VERIFIED` because `verification.getVerifiedAt()` is null.
   - Replaying a completed profile fails with `PROFILE_ALREADY_COMPLETED` (HTTP 409).
   - Single-use verification tokens are removed from the database immediately upon completion (`verifications.delete(verification)`), preventing reuse.

---

## 3. Caveats

- **External SMTP Infrastructure**: Email dispatch during tests uses Mock/Stub implementations (`RegistrationEmailService`) rather than active Gmail servers, which is proper for reproducible automated testing. Production deployment requires valid SMTP environment variables.
- **PayOS Webhook Gateway**: In development integrity mode, PayOS payment redirection uses simulated checkout responses rather than external banking networks.
- **Review-Only Constraint Respected**: As mandated by challenger rules, no production implementation source code was modified during this review. Only test harnesses (`tests/tier5_adversarial_coverage.mjs`) were authored and executed.

---

## 4. Conclusion & Explicit Verdict

The Hospital Management System Showcase exhibits comprehensive, robust, and multi-layered security hardening across both frontend and backend architectures:
- Dual-credential login (Email/Username + Password) functions reliably.
- Two-step OTP registration gate prevents unverified account activation and resists replay attacks.
- Strict RBAC isolation blocks unauthorized cross-role access (HTTP 401/403).
- IDOR vulnerabilities are mitigated by caller principal binding.
- Business rules (24-hour notice, same-day check-in, encounter locks, offline patient safeguards) are enforced at the service layer.
- Frontend routing and interceptors gracefully handle 401 session expiration and unauthorized navigation.

**Verdict: `APPROVE`**  
All 46 E2E showcase tests, all 23 Tier 5 adversarial stress tests, and all 117 backend regression tests pass with 100% success rate. The system is certified production-ready for showcase presentation.

---

## 5. Verification Method

To independently verify all findings and reproduce test results, execute the following commands in the workspace root:

1. **Run Full E2E Showcase Suite (46 Tests)**:
   ```powershell
   node tests/e2e_showcase_suite.mjs
   ```
   *Expected Result*: Exit code 0, 46 passed, 0 failed.

2. **Run Tier 5 Adversarial Coverage Hardening Suite (23 Tests)**:
   ```powershell
   node tests/tier5_adversarial_coverage.mjs
   ```
   *Expected Result*: Exit code 0, 23 passed, 0 failed.

3. **Run Backend Service & Controller Regression Suite (117 Tests)**:
   ```powershell
   mvn.cmd test -pl backend/swd "-Dtest=Challenger*,Reception*,AppointmentLifecycle*,AppointmentAvailableSlots*,PatientRegistration*,RegistrationEmail*,SessionAuth*,PatientController*" "-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar"
   ```
   *Expected Result*: `BUILD SUCCESS`, Tests run: 117, Failures: 0, Errors: 0, Skipped: 0.

4. **Verify Frontend Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   *Expected Result*: Exit code 0, 97 modules transformed, production assets generated in `frontend/dist`.
