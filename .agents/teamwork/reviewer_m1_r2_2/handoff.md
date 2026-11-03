# Review & Adversarial Critic Report: Milestone 1 Round 2 (API & Security)

## 1. Observation

1. **SessionAuthenticationFilter & SecurityConfig**:
   - Location: `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java` (lines 57-61, 94-97)
   - Code Inspection:
     ```java
     57: if (session.getRevokedAt() == null
     58:         && session.getExpiresAt().isAfter(LocalDateTime.now())
     59:         && session.getUserAccount() != null
     60:         && session.getUserAccount().getStatus() == ActiveStatus.ACTIVE) {
     ...
     94:     SecurityContext context = SecurityContextHolder.createEmptyContext();
     95:     context.setAuthentication(authToken);
     96:     SecurityContextHolder.setContext(context);
     97:     securityContextRepository.saveContext(context, request, response);
     ```
   - In `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java` (lines 31-37):
     ```java
     31: @Bean
     32: public FilterRegistrationBean<SessionAuthenticationFilter> sessionAuthenticationFilterRegistration(
     33:                 SessionAuthenticationFilter filter) {
     34:         FilterRegistrationBean<SessionAuthenticationFilter> registration = new FilterRegistrationBean<>(filter);
     35:         registration.setEnabled(false);
     36:         return registration;
     37: }
     ```
   - Observation: Inactive accounts (`status != ActiveStatus.ACTIVE`) are strictly excluded from authentication token creation. The deferred security context is created fresh, populated, set into `SecurityContextHolder`, and saved into `securityContextRepository`. Outer servlet container duplicate registration is disabled via `FilterRegistrationBean.setEnabled(false)`.

2. **AppointmentController IDOR & Isolation**:
   - Location: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java` (lines 137-158)
   - Code Inspection:
     ```java
     142: Long targetPatientId = patientId;
     143: boolean isAdmin = principal != null && ("ADMIN".equalsIgnoreCase(principal.role()) || "ROLE_ADMIN".equalsIgnoreCase(principal.role()));
     144: 
     145: if (!isAdmin) {
     146:     targetPatientId = principal != null && principal.patientId() != null
     147:             ? principal.patientId()
     148:             : (principal != null && principal.accountId() != null
     149:                     ? patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)
     150:                     : null);
     151: }
     152: 
     153: if (targetPatientId == null) {
     154:     return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
     155: }
     156: List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
     157: return ResponseEntity.ok(ApiResponse.ok(list));
     ```
   - Observation: For any non-admin caller, any incoming query parameter `?patientId=...` is overwritten with the authenticated caller's own patient identity. If unprofiled, an empty list is safely returned.

3. **ReceptionAppointmentServiceImpl Notice Period & Encounter Guard**:
   - Location: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java` (lines 205-237)
   - Code Inspection:
     - `cancel` (lines 208-212):
       ```java
       if (appointment.getStatus() == Appointment.Status.CANCELLED) return view(appointment);
       requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể hủy lịch.");
       if (appointment.getStatus() != Appointment.Status.BOOKED && appointment.getStatus() != Appointment.Status.CHECKED_IN) {
           throw state("Lịch hẹn không còn được phép hủy.");
       }
       ```
     - `reschedule` (lines 224-227):
       ```java
       requireNoEncounter(appointment, "Bệnh nhân đã bắt đầu khám, không thể đổi lịch.");
       if (appointment.getStatus() != Appointment.Status.BOOKED) throw state("Hoàn tác check-in trước khi đổi lịch.");
       if (appointment.getAppointmentSlot().getId().equals(destinationId)) return view(appointment);
       ```
   - Observation: `requireNotice` has been completely removed from both `cancel` and `reschedule`. Front desk receptionists can cancel and reschedule same-day appointments without the 24h constraint, while `requireNoEncounter` is strictly enforced to protect in-flight clinical consultations.

4. **PatientRegistrationServiceImpl Complete Profile Overwrite & Single-Use OTP**:
   - Location: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java` (lines 149-198)
   - Code Inspection:
     ```java
     153: Patient patient = null;
     154: if (account.getStatus() == ActiveStatus.ACTIVE) {
     155:     patient = patients.findByUserAccount_Id(account.getId()).orElse(null);
     156:     if (patient != null && patient.getDateOfBirth() != null) {
     157:         throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED",
     158:                 "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
     159:     }
     160: }
     161: 
     162: RegistrationVerification verification = verifications.lockByAccountId(account.getId())
     163:         .orElseThrow(PatientRegistrationServiceImpl::notPending);
     164: 
     165: if (verification.getVerifiedAt() == null) {
     166:     throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
     167:             "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
     168: }
     ...
     196: verifications.delete(verification);
     ```
   - Observation: `completeProfile` rejects already completed profiles with HTTP 409 `PROFILE_ALREADY_COMPLETED`. It requires prior OTP verification (`verifiedAt != null`), and upon completion permanently deletes the verification token (`verifications.delete(verification)`), preventing replay attacks.

5. **ApiResponse Contract Fidelity**:
   - Location: `backend/swd/src/main/java/com/example/swd/dto/response/ApiResponse.java` (lines 13-25)
   - Code Inspection:
     ```java
     13: public class ApiResponse<T> {
     14:     @Builder.Default
     15:     private int code = 200;
     16: 
     17:     @Builder.Default
     18:     private boolean success = true;
     19: 
     20:     private String message;
     21:     private T data;
     22: 
     23:     @Builder.Default
     24:     private String timestamp = Instant.now().toString();
     ```
   - Observation: `ApiResponse` defines `code` (int), `success` (boolean), `message` (String), `data` (T), and `timestamp` (String). Full Lombok annotations (`@Getter`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`) guarantee complete Jackson JSON serializability.

6. **Independent Test Execution**:
   - Command:
     ```powershell
     cd backend/swd
     .\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
     ```
   - Verbatim Output:
     ```
     [INFO] Results:
     [INFO] 
     [INFO] Tests run: 100, Failures: 0, Errors: 0, Skipped: 0
     [INFO] 
     [INFO] ------------------------------------------------------------------------
     [INFO] BUILD SUCCESS
     [INFO] ------------------------------------------------------------------------
     [INFO] Total time:  17.343 s
     [INFO] Finished at: 2026-11-03T01:41:53+07:00
     [INFO] ------------------------------------------------------------------------
     ```

---

## 2. Logic Chain

1. **Security Isolation & Context Persistence**:
   - Observation 1 demonstrates that `session.getUserAccount().getStatus() == ActiveStatus.ACTIVE` is required for session authentication. Inactive accounts receive no `Authentication` token in `SecurityContext`, causing downstream secured requests to be rejected (HTTP 401/403).
   - Creating a fresh context with `SecurityContextHolder.createEmptyContext()` and calling `securityContextRepository.saveContext(context, request, response)` persists the context into request attributes, preventing deferred context wipeouts in Spring Security 6.
   - `registration.setEnabled(false)` in `SecurityConfig` guarantees the filter is not registered on the outer servlet container `/*` path, ensuring it executes strictly within `SecurityFilterChain`.

2. **Access Control & IDOR Prevention**:
   - Observation 2 demonstrates that for any caller without admin privileges, `targetPatientId` is forcefully mapped to `principal.patientId()` or resolved from `patientRepository.findByUserAccount_Id(principal.accountId())`.
   - Passing an adversarial query parameter (e.g. `?patientId=999`) has zero effect for patients. Admins retain query capabilities for support and oversight.

3. **Front-Desk Workflow vs Clinical Safety**:
   - Observation 3 shows the removal of `requireNotice` from `ReceptionAppointmentServiceImpl.cancel` and `reschedule`. This permits front-desk staff to handle same-day walk-in cancellations and reschedules without being blocked by 24h notice rules designed for patient self-service.
   - In both methods, `requireNoEncounter(appointment, ...)` is evaluated before state change. If an encounter has begun, HTTP 409 `ENCOUNTER_STARTED` is thrown, guaranteeing clinical safety.

4. **Integrity & Replay Resistance**:
   - Observation 4 confirms that demographic profiles cannot be repeatedly overwritten once active and populated. In addition, `verifications.delete(verification)` permanently consumes the OTP verification, preventing replay attacks.
   - Observation 5 confirms `ApiResponse` conforms to `PROJECT.md` interface specifications.
   - Adversarial analysis confirmed no hardcoded mock results, dummy facades, or shortcuts. All unit and challenger tests assert real business rules and entity states.

---

## 3. Caveats

1. **Integration Tests Requiring External MySQL**:
   - `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` depend on an external running MySQL instance (`localhost:3306`). The full suite of 100 unit, security, and challenger mock tests run entirely in-memory with zero external dependencies.
2. **No Other Caveats**:
   - All code, security boundaries, and API contracts are fully consistent with specifications in `PROJECT.md` and `ORIGINAL_REQUEST.md`.

---

## 4. Conclusion

**Verdict: APPROVE**

The implementation in Milestone 1 Round 2 satisfies all security, API contract, and role boundary requirements without defects or regressions:
- Zero integrity violations detected (real logic implemented, full assertion coverage).
- Inactive accounts strictly denied authentication in `SessionAuthenticationFilter`.
- `FilterRegistrationBean` disables duplicate outer servlet container filter execution.
- IDOR vulnerability eliminated in `AppointmentController.getPatientAppointments`.
- Receptionist cancel and reschedule operations operate without 24h notice restriction while preserving encounter safety.
- Demographic profile overwrites prevented via HTTP 409 `PROFILE_ALREADY_COMPLETED`, and OTP tokens consumed upon completion.
- `ApiResponse` contract enhanced with `code` and `timestamp`.
- 100/100 regression and adversarial tests independently verified passing in 17.34s.

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **Compilation**:
   ```powershell
   cd backend/swd
   .\mvnw.cmd test-compile
   ```

2. **Execute 100-Test Suite**:
   ```powershell
   cd backend/swd
   .\mvnw.cmd test '-Dtest=SessionAuthenticationFilterTest,PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected Outcome*: `Tests run: 100, Failures: 0, Errors: 0, Skipped: 0` and `BUILD SUCCESS`.

3. **Source Inspection**:
   - `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java`
   - `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java`
   - `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
   - `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`
   - `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`
   - `backend/swd/src/main/java/com/example/swd/dto/response/ApiResponse.java`

4. **Invalidation Conditions**:
   - Inactive accounts able to establish an authenticated security context.
   - Non-admin callers able to inspect other patients' appointments via `patientId`.
   - Receptionists blocked from same-day cancellations/reschedules by a 24-hour notice constraint.
   - Cancellation/rescheduling permitted after an encounter has already started.
   - Public callers able to overwrite completed demographic profiles or reuse OTP tokens.
   - Missing fields in `ApiResponse`.
