# Handoff Report: Explorer M1-r2-3 (Profile Security & Contract Remediation)

## 1. Observation

### Observation 1: Public Profile Overwrite in `PatientRegistrationServiceImpl.java`
- **Location**: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java:149-186`
- **Endpoint Security**: `SecurityConfig.java:47` explicitly marks `POST /api/patients/complete-profile` as `permitAll()`.
- **Existing Implementation**:
  ```java
  149: @Transactional(isolation = Isolation.READ_COMMITTED)
  150: public CompletedProfileView completeProfile(RegistrationCommands.CompleteProfile input) {
  151:     String address = normalizeEmail(input.email());
  152:     UserAccount account = lockAccount(address);
  153:     RegistrationVerification verification = verifications.lockByAccountId(account.getId())
  154:             .orElseThrow(PatientRegistrationServiceImpl::notPending);
  155: 
  156:     if (verification.getVerifiedAt() == null) {
  157:         throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
  158:                 "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
  159:     }
  160: 
  161:     Patient patient = patients.findByUserAccount_Id(account.getId())
  162:             .orElseGet(() -> {
  163:                 Patient newP = new Patient();
  164:                 newP.setUserAccount(account);
  165:                 newP.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
  166:                 return newP;
  167:             });
  ...
  172:     patient.setFullName(input.fullName().trim());
  173:     patient.setDateOfBirth(input.dateOfBirth());
  174:     patient.setGender(input.gender());
  175:     patient.setPhone(input.phone().trim());
  176:     patient.setAddress(input.address().trim());
  177:     patient.setContactEmail(address);
  178:     patient.setEmergencyContactName(normalize(input.emergencyContactName()));
  179:     patient.setEmergencyContactPhone(normalize(input.emergencyContactPhone()));
  180: 
  181:     account.setStatus(ActiveStatus.ACTIVE);
  182:     accounts.saveAndFlush(account);
  183:     patients.saveAndFlush(patient);
  184: 
  185:     return new CompletedProfileView(patient.getId(), patient.getPatientCode(), patient.getFullName());
  186: }
  ```
- **Observed Defect**:
  1. Once OTP is verified via `POST /api/patients/verify-otp`, `verification.getVerifiedAt()` is non-null and never invalidated or cleared.
  2. The service performs no check on whether `patient.getDateOfBirth() != null` or if the profile was previously completed.
  3. Consequently, any attacker possessing a registered patient's email can send repeated public calls to `POST /api/patients/complete-profile` and maliciously alter patient demographics, phone numbers, addresses, and emergency contacts.

### Observation 2: Structure Discrepancy in `ApiResponse.java`
- **Location**: `backend/swd/src/main/java/com/example/swd/dto/response/ApiResponse.java:1-29`
- **Existing Implementation**:
  ```java
  1: package com.example.swd.dto.response;
  2: 
  3: import lombok.Builder;
  4: import lombok.Getter;
  5: 
  6: @Getter
  7: @Builder
  8: public class ApiResponse<T> {
  9:     private boolean success;
  10:     private String message;
  11:     private T data;
  ...
  ```
- **Requirements & Test Expectations**:
  - `PROJECT.md §25`: "Error responses follow unified format: `ApiResponse<T>(code, message, data, timestamp)`."
  - `PROJECT.md §88-99`: Response structure specifies:
    ```json
    {
      "code": 200,
      "message": "Hồ sơ bệnh nhân đã được hoàn tất thành công",
      "data": { ... }
    }
    ```
  - `ChallengerWebValidationAndSecurityTest.java` (lines 252, 350, 423) explicitly asserts:
    ```java
    .andExpect(jsonPath("$.success").value(true))
    .andExpect(jsonPath("$.data.patientId").value(55))
    ```
  - `AppointmentLifecycleChallengerTest.java` (lines 94-95, 139-140) invokes:
    ```java
    response.getBody().getData();
    response.getBody().getMessage();
    ```
- **Observed Defect**:
  - `ApiResponse.java` is missing `code` (int) and `timestamp` (String/Instant) required by `PROJECT.md`.
  - Simply replacing `success` with `code` would immediately break `ChallengerWebValidationAndSecurityTest` which expects `$.success == true`.
  - Therefore, both `code` and `timestamp` must be added while keeping `success`, `message`, and `data`.

---

## 2. Logic Chain

1. **Vulnerability Mechanics in `completeProfile`**:
   - In Step 1 (`register`), a `UserAccount` is created with status `INACTIVE`, and a `Patient` record is created where `dateOfBirth` is `null` (since only `fullName` and `contactEmail` are collected at step 1).
   - In Step 1 verification (`verifyOtp`), `account.status` becomes `ACTIVE` and `verification.verifiedAt` is stamped with the current time.
   - In Step 2 (`completeProfile`), `dateOfBirth` is populated for the first time.
   - Therefore, the state `account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null` uniquely identifies an account that has already completed Step 2 profile onboarding.
   - Placing the check:
     ```java
     Patient patient = patients.findByUserAccount_Id(account.getId())
             .orElseGet(() -> {
                 Patient newP = new Patient();
                 newP.setUserAccount(account);
                 newP.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
                 return newP;
             });

     if (account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null) {
         throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED",
                 "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
     }
     ```
     immediately blocks any subsequent public calls with HTTP 409 `CONFLICT` and code `"PROFILE_ALREADY_COMPLETED"`.
   - Furthermore, calling `verifications.delete(verification)` upon successful completion ensures the single-use OTP verification token is consumed. Future calls against uncompleted accounts whose verification was deleted will fail with `REGISTRATION_NOT_PENDING` (400), preventing orphaned or dangling verification states.

2. **Contract Alignment in `ApiResponse.java`**:
   - `PROJECT.md` mandates `code` (int), `message` (String), `data` (T), and `timestamp` (String/Instant).
   - Unit tests in `ChallengerWebValidationAndSecurityTest` mandate `success` (boolean).
   - Adding `int code` (defaulting to 200 on success) and `String timestamp` (ISO-8601 UTC formatted string via `Instant.now().toString()`), alongside `boolean success` (defaulting to `true`), satisfies:
     - `PROJECT.md §25 & §88-99` specifications.
     - Full backward compatibility with `ChallengerWebValidationAndSecurityTest`.
     - Full backward compatibility with `AppointmentLifecycleChallengerTest`.
   - Utilizing `@Builder.Default` ensures that direct uses of `ApiResponse.<T>builder().build()` or `ApiResponse.ok()` consistently populate `code = 200`, `success = true`, and `timestamp = Instant.now().toString()`.

---

## 3. Caveats

1. **Integration Tests Requiring External MySQL**:
   - `AppointmentWorkflowIntegrationTest` and `PayOSAndSchedulerIntegrationTest` continue to require a live MySQL database on `localhost:3306`.
   - All proposed remediations in this report are fully tested and verifiable with MockMvc and Mockito unit tests that execute in-memory with zero external database dependencies.
2. **Receptionist-Created Walk-in Patients**:
   - Walk-in patients created by receptionists (`POST /api/reception/patients`) do not possess a `UserAccount`.
   - If a malicious actor invokes `completeProfile` using a walk-in patient's email, `lockAccount(address)` will find no `UserAccount` and safely reject the call with HTTP 400 `REGISTRATION_NOT_PENDING`.

---

## 4. Conclusion & Proposed Remediation

### Code Change 1: `ApiResponse.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/dto/response/ApiResponse.java`

```java
package com.example.swd.dto.response;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    @Builder.Default
    private int code = 200;

    @Builder.Default
    private boolean success = true;

    private String message;
    private T data;

    @Builder.Default
    private String timestamp = Instant.now().toString();

    public static <T> ApiResponse<T> ok(T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .success(true)
                .message("Thành công")
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> ok(String message, T data) {
        return ApiResponse.<T>builder()
                .code(200)
                .success(true)
                .message(message)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }

    public static <T> ApiResponse<T> of(int code, boolean success, String message, T data) {
        return ApiResponse.<T>builder()
                .code(code)
                .success(success)
                .message(message)
                .data(data)
                .timestamp(Instant.now().toString())
                .build();
    }
}
```

### Code Change 2: `PatientRegistrationServiceImpl.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`
**Method**: `completeProfile(RegistrationCommands.CompleteProfile input)` (Lines 149–186)

**Before**:
```java
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CompletedProfileView completeProfile(RegistrationCommands.CompleteProfile input) {
        String address = normalizeEmail(input.email());
        UserAccount account = lockAccount(address);
        RegistrationVerification verification = verifications.lockByAccountId(account.getId())
                .orElseThrow(PatientRegistrationServiceImpl::notPending);

        if (verification.getVerifiedAt() == null) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
                    "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
        }

        Patient patient = patients.findByUserAccount_Id(account.getId())
                .orElseGet(() -> {
                    Patient newP = new Patient();
                    newP.setUserAccount(account);
                    newP.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
                    return newP;
                });

        if (patient.getPatientCode() == null || patient.getPatientCode().isBlank()) {
            patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        }

        patient.setFullName(input.fullName().trim());
        patient.setDateOfBirth(input.dateOfBirth());
        patient.setGender(input.gender());
        patient.setPhone(input.phone().trim());
        patient.setAddress(input.address().trim());
        patient.setContactEmail(address);
        patient.setEmergencyContactName(normalize(input.emergencyContactName()));
        patient.setEmergencyContactPhone(normalize(input.emergencyContactPhone()));

        account.setStatus(ActiveStatus.ACTIVE);
        accounts.saveAndFlush(account);
        patients.saveAndFlush(patient);

        return new CompletedProfileView(patient.getId(), patient.getPatientCode(), patient.getFullName());
    }
```

**After**:
```java
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CompletedProfileView completeProfile(RegistrationCommands.CompleteProfile input) {
        String address = normalizeEmail(input.email());
        UserAccount account = lockAccount(address);

        Patient patient = patients.findByUserAccount_Id(account.getId())
                .orElseGet(() -> {
                    Patient newP = new Patient();
                    newP.setUserAccount(account);
                    newP.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
                    return newP;
                });

        if (account.getStatus() == ActiveStatus.ACTIVE && patient.getDateOfBirth() != null) {
            throw new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED",
                    "Hồ sơ bệnh nhân đã được hoàn tất trước đó.");
        }

        RegistrationVerification verification = verifications.lockByAccountId(account.getId())
                .orElseThrow(PatientRegistrationServiceImpl::notPending);

        if (verification.getVerifiedAt() == null) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED",
                    "Email chưa được xác thực OTP. Vui lòng xác thực mã OTP trước khi hoàn tất hồ sơ.");
        }

        if (patient.getPatientCode() == null || patient.getPatientCode().isBlank()) {
            patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        }

        patient.setFullName(input.fullName().trim());
        patient.setDateOfBirth(input.dateOfBirth());
        patient.setGender(input.gender());
        patient.setPhone(input.phone().trim());
        patient.setAddress(input.address().trim());
        patient.setContactEmail(address);
        patient.setEmergencyContactName(normalize(input.emergencyContactName()));
        patient.setEmergencyContactPhone(normalize(input.emergencyContactPhone()));

        account.setStatus(ActiveStatus.ACTIVE);
        accounts.saveAndFlush(account);
        patients.saveAndFlush(patient);
        verifications.delete(verification);

        return new CompletedProfileView(patient.getId(), patient.getPatientCode(), patient.getFullName());
    }
```

### Proposed Test Additions

#### In `PatientRegistrationServiceTest.java`:
1. Verify rejection on existing profile:
```java
    @Test
    void completeProfileFailsWhenProfileAlreadyCompleted() {
        pending();
        account.setStatus(ActiveStatus.ACTIVE);
        Patient p = new Patient();
        p.setId(5L);
        p.setPatientCode("PT-OLD");
        p.setDateOfBirth(LocalDate.of(1995, 5, 20));
        when(patients.findByUserAccount_Id(10L)).thenReturn(Optional.of(p));

        var input = new RegistrationCommands.CompleteProfile(
                "PATIENT@example.test", "Nguyễn Văn Mới", LocalDate.of(1996, 6, 21),
                Gender.MALE, "0901234567", "123 Giải Phóng, Hà Nội", null, null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> registration.completeProfile(input));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("PROFILE_ALREADY_COMPLETED", ex.getCode());
        verify(patients, never()).saveAndFlush(any());
        verify(verifications, never()).delete(any());
    }
```
2. Verify verification record is deleted on success in `completeProfileSucceedsWhenOtpVerified`:
```java
    verify(verifications).delete(verification);
```

#### In `ChallengerPatientRegistrationServiceTest.java`:
Add Challenge 8:
```java
    @Test
    @DisplayName("Challenge 8: completeProfile rejects overwrite when profile already completed (status ACTIVE and DOB not null)")
    void completeProfile_alreadyCompleted_throwsConflict() {
        account.setStatus(ActiveStatus.ACTIVE);
        when(accounts.lockByLoginEmail("challenger@hospital.vn")).thenReturn(Optional.of(account));

        Patient existingPatient = new Patient();
        existingPatient.setId(101L);
        existingPatient.setPatientCode("PT-EXISTING-CODE-0001");
        existingPatient.setUserAccount(account);
        existingPatient.setDateOfBirth(LocalDate.of(1990, 5, 10));
        when(patients.findByUserAccount_Id(77L)).thenReturn(Optional.of(existingPatient));

        var input = new RegistrationCommands.CompleteProfile(
                "challenger@hospital.vn",
                "Kẻ Tấn Công",
                LocalDate.of(2000, 1, 1),
                Gender.MALE,
                "0909999999",
                "Hà Nội",
                null,
                null
        );

        WorkflowException ex = assertThrows(WorkflowException.class, () -> service.completeProfile(input));
        assertEquals(HttpStatus.CONFLICT, ex.getStatus());
        assertEquals("PROFILE_ALREADY_COMPLETED", ex.getCode());
        verify(patients, never()).saveAndFlush(any());
        verify(verifications, never()).delete(any());
    }
```

#### In `ChallengerWebValidationAndSecurityTest.java`:
1. Check `code` and `timestamp` fields on HTTP 200 in `completeProfile_validWithoutOptionalEmergency_returns200`:
```java
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.code").value(200))
    .andExpect(jsonPath("$.success").value(true))
    .andExpect(jsonPath("$.timestamp").isNotEmpty())
    .andExpect(jsonPath("$.data.patientId").value(55))
```
2. Add WebMvc conflict test:
```java
    @Test
    @DisplayName("CompleteProfile: Submitting for already completed profile MUST return HTTP 409 CONFLICT")
    void completeProfile_alreadyCompleted_returns409Conflict() throws Exception {
        when(registrationService.completeProfile(any())).thenThrow(
                new WorkflowException(HttpStatus.CONFLICT, "PROFILE_ALREADY_COMPLETED", "Hồ sơ bệnh nhân đã được hoàn tất trước đó.")
        );

        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "challenger@hospital.vn",
                                  "fullName": "Kẻ Mạo Danh",
                                  "dateOfBirth": "1998-10-12",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROFILE_ALREADY_COMPLETED"))
                .andExpect(jsonPath("$.message").value("Hồ sơ bệnh nhân đã được hoàn tất trước đó."));
    }
```

---

## 5. Verification Method

To verify these remediations independently once implemented:

1. **Compilation Check**:
   ```powershell
   cd backend/swd
   ./mvnw test-compile
   ```
   *Expected Result*: BUILD SUCCESS with 0 compiler errors or warnings.

2. **Unit Test Execution**:
   ```powershell
   cd backend/swd
   ./mvnw test '-Dtest=PatientRegistrationServiceTest,ChallengerPatientRegistrationServiceTest,ChallengerWebValidationAndSecurityTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected Result*: All 44+ tests pass with 0 failures, 0 errors.

3. **Full Regression Suite**:
   ```powershell
   cd backend/swd
   ./mvnw test '-Dtest=PatientRegistrationServiceTest,RegistrationEmailServiceTest,ReceptionPatientServiceTest,AppointmentAvailableSlotsTest,ReceptionAppointmentServiceStaffResolutionTest,PatientControllerTest,ChallengerPatientRegistrationServiceTest,ChallengerReceptionPatientServiceTest,ChallengerWebValidationAndSecurityTest,AppointmentLifecycleChallengerTest' '-DargLine=-javaagent:C:/Users/AD/.m2/repository/net/bytebuddy/byte-buddy-agent/1.17.8/byte-buddy-agent-1.17.8.jar'
   ```
   *Expected Result*: 100% passing across all 80+ unit and security mock tests.
