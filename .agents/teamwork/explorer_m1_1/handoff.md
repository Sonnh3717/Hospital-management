# Handoff Report: Backend DTOs & Validation Design (Milestone 1)

## 1. Observation
- **Authoritative Requirements**:
  - `ORIGINAL_REQUEST.md` (lines 16-20): R2 specifies a 2-step registration flow: Step 1 (Username, email, password + SMTP OTP); Step 2 (Patient information matching table `patient`, with required fields for the patient and optional fields for others/emergency contacts).
  - `ORIGINAL_REQUEST.md` (lines 36, 64): R5 Receptionist Patient Management mandates searching, viewing patient list, viewing detail, updating details, adding new patients, and activating/deactivating patient account status (`ACTIVE`/`INACTIVE`).
  - `PROJECT.md` (lines 72-99, 126-132): Defines exact API endpoints and contracts:
    - `POST /api/patients/complete-profile`: `PatientProfileInput` with required (`email`, `fullName`, `dateOfBirth`, `gender`, `phone`, `address`) and optional (`emergencyContactName`, `emergencyContactPhone`).
    - `GET /api/reception/patients?search=...&page=0&size=20`: Paginated patient search and list.
    - `GET /api/reception/patients/{id}`: Detailed patient view.
    - `POST /api/reception/patients`: Create patient.
    - `PUT /api/reception/patients/{id}`: Update patient details.
    - `PUT /api/reception/patients/{id}/status`: Toggle active status.
- **Database Schema & Entity Baseline**:
  - `Patient.java` (lines 32-72) and `Hospital_Database_28_Tables_MySQL (1).sql` (lines 80-100):
    - `patient_id`: BIGINT UNSIGNED AUTO_INCREMENT (PK).
    - `user_account_id`: BIGINT UNSIGNED NULL (FK to `user_accounts`, nullable for walk-in patients created by receptionist).
    - `patient_code`: VARCHAR(30) NOT NULL UNIQUE.
    - `full_name`: VARCHAR(150) NOT NULL.
    - `date_of_birth`: DATE NULL (in registration, required for patient).
    - `gender`: ENUM('MALE','FEMALE','OTHER','UNSPECIFIED') NOT NULL DEFAULT 'UNSPECIFIED'.
    - `phone`: VARCHAR(25) NULL.
    - `contact_email`: VARCHAR(254) NULL.
    - `address`: VARCHAR(500) NULL.
    - `emergency_contact_name`: VARCHAR(150) NULL.
    - `emergency_contact_phone`: VARCHAR(25) NULL.
  - `UserAccount.java` (lines 31-58) and `Hospital_Database_28_Tables_MySQL (1).sql` (lines 24-40):
    - `status`: ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE'.
- **Existing DTO & Architecture Patterns**:
  - `RegistrationCommands.java` (lines 10-39): Uses Java records grouped inside final container class with Jakarta validation annotations (`@NotBlank`, `@Size`, `@Email`, `@Pattern`, `@NotNull`, `@AssertTrue`).
  - `ReceptionRequests.java` (lines 14-31): Contains records `NewPatient`, `CreateAppointment`, `CancelAppointment`, `RescheduleAppointment`. Note that `NewPatient` only captures `fullName`, `dateOfBirth`, `gender`, `phone`, `contactEmail`, lacking `address`, `emergencyContactName`, `emergencyContactPhone`.
  - `WorkflowViews.java` (lines 6-18): Contains records `PatientView`, `DoctorView`, `SlotView`, `AppointmentView`, `PageView<T>`, `ReceptionOptions`. `PatientView` does not expose `address`, emergency contacts, or user account status.
  - `GlobalExceptionHandler.java` (lines 33-38): Catches `MethodArgumentNotValidException`, extracts `field` and `defaultMessage`, returning HTTP 400 with `code="VALIDATION_ERROR"` and `fieldErrors: Map<String, String>`. Custom Vietnamese messages in annotations are surfaced directly to client.
  - `ApiResponse.java` (lines 8-28): Standard wrapper `ApiResponse<T>` with `success`, `message`, `data`, and helper `ApiResponse.ok(message, data)`.

---

## 2. Logic Chain
1. **Separation of Patient Profile Fields (R2 Step 2)**:
   - *Premise*: `ORIGINAL_REQUEST.md` §R2 explicitly mandates that fields pertaining to the patient themselves are REQUIRED, whereas fields pertaining to third parties (guardian / emergency contact) are OPTIONAL.
   - *Reasoning*:
     - Patient fields: `fullName` (NotBlank), `dateOfBirth` (NotNull, PastOrPresent), `gender` (NotNull, MALE/FEMALE/OTHER), `phone` (NotBlank, regex matching Vietnam phone formats `0...` or `+84...`), `address` (NotBlank).
     - Third-party fields: `emergencyContactName` (optional, Size <= 150), `emergencyContactPhone` (optional, Size <= 25, regex if present).
     - Linkage: `email` (NotBlank, Email, Size <= 254) links the completed profile to the pending/verified `UserAccount` from Step 1.
2. **Receptionist Patient Management DTOs (R5)**:
   - *Premise*: Receptionists need to create new patients (`POST`), update existing patient details (`PUT`), and toggle account status (`PUT /status`).
   - *Reasoning*:
     - `PatientCreateRequest`: Requires all core patient demographics (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`). `contactEmail` and emergency contacts are optional (accommodating elderly or pediatric walk-ins without personal email/guardians present).
     - `PatientUpdateRequest`: Allows receptionist to correct demographics, address, email, or emergency contact info.
     - `PatientStatusRequest`: Carries `status` (`ActiveStatus.ACTIVE` or `ActiveStatus.INACTIVE`) to enable/disable the patient's portal login.
3. **Response Model Extensions**:
   - *Premise*: Existing `WorkflowViews.PatientView` is tailored for appointment dropdowns/search, omitting `address`, `emergencyContactName`, `emergencyContactPhone`, and `status`.
   - *Reasoning*:
     - Receptionist patient management requires a `PatientDetailView` (for `GET /api/reception/patients/{id}`) containing full demographic, emergency contact, and account linkage info (`status`, `username`, `createdAt`, `updatedAt`).
     - A paginated summary `PageView<PatientSummaryView>` (for `GET /api/reception/patients`) requires `id`, `patientCode`, `fullName`, `dateOfBirth`, `gender`, `phone`, `contactEmail`, `address`, `status`, `createdAt`.
4. **Consistency with Framework and Existing Codebase**:
   - Modern Java 17+ `record` types are used throughout (`RegistrationCommands`, `ReceptionRequests`, `WorkflowViews`).
   - Jakarta Bean Validation annotations with user-friendly Vietnamese messages match the error handling in `GlobalExceptionHandler`.

---

## 3. Caveats
1. **Unlinked Patients vs. Status Toggle**:
   - Table `patients.user_account_id` is nullable. Walk-in patients registered exclusively at the desk may not have a `UserAccount`.
   - Invoking `PUT /api/reception/patients/{id}/status` on a patient without a `user_account_id` cannot toggle a non-existent login account. The backend service implementation should either:
     a) Reject with `HttpStatus.BAD_REQUEST` / `PATIENT_NO_ACCOUNT` ("Bệnh nhân này chưa có tài khoản đăng nhập để kích hoạt/vô hiệu hóa."), OR
     b) Auto-generate a login account if requested.
2. **Gender Enum Value Range**:
   - Database enum contains `'MALE'`, `'FEMALE'`, `'OTHER'`, `'UNSPECIFIED'`.
   - On the registration form, patient must select their actual gender (`MALE`, `FEMALE`, or `OTHER`); `'UNSPECIFIED'` is reserved as a legacy or unprovided default.
3. **Emergency Phone Validation on Empty String**:
   - When HTML forms submit empty strings `""` for optional fields, a strict `@Pattern(regexp = "^(0|\\+84)...")` fails unless the pattern permits empty strings (`^$|^(0|\\+84)[0-9]{9,10}$`) or a sanitizing converter trims blank strings to `null`. The pattern recommendation handles both.

---

## 4. Conclusion & Proposed DTO Specifications

### 4.1 Step 2 Patient Registration DTOs

#### Request: `PatientProfileInput` (or `RegistrationCommands.CompleteProfile`)
Package: `com.example.swd.dto.request`
```java
package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PatientProfileInput(
        @NotBlank(message = "Vui lòng cung cấp email tài khoản.")
        @Email(message = "Email không hợp lệ.")
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String email,

        // Required patient personal fields
        @NotBlank(message = "Vui lòng nhập họ và tên bệnh nhân.")
        @Size(max = 150, message = "Họ và tên tối đa 150 ký tự.")
        String fullName,

        @NotNull(message = "Vui lòng chọn ngày sinh.")
        @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
        LocalDate dateOfBirth,

        @NotNull(message = "Vui lòng chọn giới tính.")
        Gender gender,

        @NotBlank(message = "Vui lòng nhập số điện thoại.")
        @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")
        @Size(max = 25, message = "Số điện thoại tối đa 25 ký tự.")
        String phone,

        @NotBlank(message = "Vui lòng nhập địa chỉ.")
        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
        String address,

        // Optional emergency contact / guardian fields
        @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
        String emergencyContactName,

        @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
        @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
        String emergencyContactPhone
) {}
```

#### Response: `PatientProfileResponse`
Package: `com.example.swd.dto.response`
```java
package com.example.swd.dto.response;

public record PatientProfileResponse(
        Long patientId,
        String patientCode,
        String fullName
) {}
```

---

### 4.2 Receptionist Patient Management DTOs

#### Request: `PatientCreateRequest`
Package: `com.example.swd.dto.request` (also addable to `ReceptionRequests.CreatePatient`)
```java
package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PatientCreateRequest(
        @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
        String fullName,

        @NotNull(message = "Vui lòng chọn ngày sinh.")
        @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
        LocalDate dateOfBirth,

        @NotNull(message = "Vui lòng chọn giới tính.")
        Gender gender,

        @NotBlank(message = "Vui lòng nhập số điện thoại.")
        @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")
        @Size(max = 25, message = "Số điện thoại tối đa 25 ký tự.")
        String phone,

        @Email(message = "Email liên hệ không hợp lệ.")
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String contactEmail,

        @NotBlank(message = "Vui lòng nhập địa chỉ.")
        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
        String address,

        @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
        String emergencyContactName,

        @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
        @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
        String emergencyContactPhone
) {}
```

#### Request: `PatientUpdateRequest`
Package: `com.example.swd.dto.request` (also addable to `ReceptionRequests.UpdatePatient`)
```java
package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record PatientUpdateRequest(
        @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
        @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
        String fullName,

        @NotNull(message = "Vui lòng chọn ngày sinh.")
        @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
        LocalDate dateOfBirth,

        @NotNull(message = "Vui lòng chọn giới tính.")
        Gender gender,

        @NotBlank(message = "Vui lòng nhập số điện thoại.")
        @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ (10–11 số, bắt đầu bằng 0 hoặc +84).")
        @Size(max = 25, message = "Số điện thoại tối đa 25 ký tự.")
        String phone,

        @Email(message = "Email liên hệ không hợp lệ.")
        @Size(max = 254, message = "Email tối đa 254 ký tự.")
        String contactEmail,

        @NotBlank(message = "Vui lòng nhập địa chỉ.")
        @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
        String address,

        @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
        String emergencyContactName,

        @Pattern(regexp = "^$|^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
        @Size(max = 25, message = "Số điện thoại người liên hệ khẩn cấp tối đa 25 ký tự.")
        String emergencyContactPhone
) {}
```

#### Request: `PatientStatusRequest`
Package: `com.example.swd.dto.request` (also addable to `ReceptionRequests.UpdatePatientStatus`)
```java
package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.ActiveStatus;
import jakarta.validation.constraints.NotNull;

public record PatientStatusRequest(
        @NotNull(message = "Vui lòng chọn trạng thái tài khoản (ACTIVE hoặc INACTIVE).")
        ActiveStatus status
) {}
```

---

### 4.3 Receptionist Patient Views (Response Models)

#### `PatientSummaryView` (List View)
Package: `com.example.swd.dto.response` (or nested in `WorkflowViews`)
```java
package com.example.swd.dto.response;

import java.time.LocalDate;

public record PatientSummaryView(
        Long id,
        String patientCode,
        String fullName,
        LocalDate dateOfBirth,
        String gender,
        String phone,
        String contactEmail,
        String address,
        Long userAccountId,
        String username,
        String status,
        String createdAt
) {}
```

#### `PatientDetailView` (Detail View)
Package: `com.example.swd.dto.response` (or nested in `WorkflowViews`)
```java
package com.example.swd.dto.response;

import java.time.LocalDate;

public record PatientDetailView(
        Long id,
        String patientCode,
        String fullName,
        LocalDate dateOfBirth,
        String gender,
        String phone,
        String contactEmail,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        Long userAccountId,
        String username,
        String status,
        String createdAt,
        String updatedAt
) {}
```

---

## 5. Verification Method
1. **Compilation & Class Inspection**:
   - Check that all record definitions compile with Maven without syntax errors:
     ```powershell
     cd backend/swd
     mvn clean test-compile
     ```
2. **Bean Validation Unit Test Suite**:
   - Create and execute a unit test (e.g. `PatientValidationTest.java`) utilizing `jakarta.validation.Validation`:
     - Test valid `PatientProfileInput` with optional emergency contact left null -> passes validation.
     - Test invalid `PatientProfileInput` with missing `fullName`, future `dateOfBirth`, or malformed `phone` -> asserts `ConstraintViolation` returns expected Vietnamese messages.
     - Test `PatientStatusRequest` with null `status` -> asserts validation failure.
3. **API Contract Verification**:
   - Verify `POST /api/patients/complete-profile` with payload:
     ```json
     {
       "email": "test@hospital.vn",
       "fullName": "Nguyễn Văn An",
       "dateOfBirth": "1998-10-12",
       "gender": "MALE",
       "phone": "0901234567",
       "address": "123 Giải Phóng, Hà Nội"
     }
     ```
     Verifies successful profile completion and HTTP 200 response with `patientId` and `patientCode`.
4. **Invalidation Conditions**:
   - If database schema adds or removes fields from `patients` table (e.g. `blood_type` or `identification_number`), these DTOs must be updated accordingly.
   - If security configuration alters authentication requirement for `POST /api/patients/complete-profile` (e.g. requiring temporary token header instead of email in body), the email linkage field may become optional or replaced by session principal.
