# Backend Controllers & Services Exploration Report (Milestone 1)

## 1. Observation

### Observation 1.1: Missing `ReceptionAppointmentController` & Root Cause in Git History
- Directly observed file system: `backend/swd/src/main/java/com/example/swd/controller/reception` directory is empty.
- Git commit log reveals:
  ```
  commit 41bd23c01214771742d4a5689ecf1681443e9ef5
  Author: nam <namnguyen170681@gmail.com>
  Date:   Mon Nov 2 22:49:20 2026 +0700
  Fix : duplicate url on undo check-in, delete all frontend code to refresh
  ```
- Git show (`git show 41bd23c^:backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`) shows that `ReceptionAppointmentController.java` existed prior to commit `41bd23c` with mapping `@RequestMapping("/api/reception")`, providing endpoints:
  - `@GetMapping("/appointments")`
  - `@GetMapping("/appointments/{id}")`
  - `@GetMapping("/options")`
  - `@GetMapping("/patients")`
  - `@PostMapping("/appointments")`
  - `@PostMapping("/appointments/{id}/check-in")`
  - `@PostMapping("/appointments/{id}/undo-check-in")`
  - `@PostMapping("/appointments/{id}/cancel")`
  - `@PostMapping("/appointments/{id}/reschedule")`
- Concurrently, in `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java` (lines 82–104):
  ```java
  @PostMapping("/reception/appointments/{id}/check-in")
  @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
  public ResponseEntity<ApiResponse<AppointmentResponse>> checkIn(...)

  @PostMapping("/reception/appointments/{id}/undo-check-in")
  @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
  public ResponseEntity<ApiResponse<AppointmentResponse>> undoCheckIn(...)
  ```
- Because `AppointmentController` has `@RequestMapping("/api")`, both controllers mapped `/api/reception/appointments/{id}/check-in` and `/api/reception/appointments/{id}/undo-check-in`, causing an `AmbiguousHandlerMappingException` during Spring application context startup. The commit author resolved this by deleting `ReceptionAppointmentController.java`.

### Observation 1.2: Missing Staff ID in `SessionAuthenticationFilter`
- In `backend/swd/src/main/java/com/example/swd/security/SessionAuthenticationFilter.java` (lines 47–54):
  ```java
  UserAccount account = session.getUserAccount();
  String roleName = "ROLE_" + account.getRole().getRoleCode().name();
  StaffPrincipal principal = new StaffPrincipal(
          account.getId(),
          null, // staffId is hardcoded to null!
          account.getUsername(),
          account.getUsername(),
          account.getRole().getRoleCode().name());
  ```
- In `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`:
  - Line 185: `appointment.setCheckedInByStaff(staff.getReferenceById(actor.staffId()));`
  - Line 199: `appointment.setLastCheckInReversedByStaff(staff.getReferenceById(actor.staffId()));`
- Calling `staff.getReferenceById(null)` will immediately trigger `IllegalArgumentException: The given id must not be null`.

### Observation 1.3: `AppointmentController.getPatientAppointments` Queries by User Account ID Instead of Patient ID
- In `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java` (lines 149–157):
  ```java
  @GetMapping("/patient/appointments")
  @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
  public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(
          @RequestParam(required = false) Long patientId,
          @AuthenticationPrincipal StaffPrincipal principal) {
      Long targetPatientId = patientId != null ? patientId : principal.accountId();
      List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
      return ResponseEntity.ok(ApiResponse.ok(list));
  }
  ```
- In `backend/swd/src/main/java/com/example/swd/service/impl/AppointmentServiceImpl.java` (lines 226–229):
  ```java
  @Transactional(readOnly = true)
  public List<AppointmentResponse> getAppointmentsByPatient(Long patientId) {
      return appointmentRepository.findByPatient_IdOrderByAppointmentSlot_StartsAtDesc(patientId)
              .stream().map(this::mapToResponse).collect(Collectors.toList());
  }
  ```
- When `patientId` query param is null, `targetPatientId` is assigned `principal.accountId()` (the primary key in `user_accounts`), which does NOT match `patient.patient_id` (the primary key in `patients`). As a result, logged-in patients see empty lists or appointments of completely different patients.

### Observation 1.4: Existing Registration Step 1 & Missing Step 2 (`complete-profile`)
- In `backend/swd/src/main/java/com/example/swd/controller/patient/PatientController.java`:
  Only `/register`, `/send-otp`, `/verify-otp`, and `/check-username` are currently mapped.
- In `backend/swd/src/main/java/com/example/swd/service/impl/PatientRegistrationServiceImpl.java`:
  `register` creates an `INACTIVE` account and a minimal `Patient` record, then sends OTP.
  `verifyOtp` verifies the OTP and sets `account.setStatus(ActiveStatus.ACTIVE)` (line 142).
- There is currently no endpoint `/api/patients/complete-profile` to receive the detailed patient demographic form (Step 2) as required by `ORIGINAL_REQUEST §R2` and `PROJECT.md §1`.
- In `backend/swd/src/main/java/com/example/swd/security/SecurityConfig.java` (lines 47–48):
  ```java
  .requestMatchers(HttpMethod.POST, "/api/patients/register", "/api/patients/send-otp", "/api/patients/verify-otp").permitAll()
  .requestMatchers(HttpMethod.GET, "/api/patients/check-username").permitAll()
  ```
  Endpoint `/api/patients/complete-profile` is not yet permitted for unauthenticated clients completing registration.

### Observation 1.5: Missing Reception Patient Management CRUD & Available Slots
- No `ReceptionPatientController` or `ReceptionPatientService` exists for receptionist patient management (`GET /api/reception/patients`, `GET /api/reception/patients/{id}`, `POST /api/reception/patients`, `PUT /api/reception/patients/{id}`, `PUT /api/reception/patients/{id}/status`).
- No public or patient-facing endpoint `GET /api/appointments/available-slots` exists for querying available appointment slots during booking or rescheduling.

---

## 2. Logic Chain

1. **Re-instantiating `ReceptionAppointmentController`:**
   - From Observation 1.1, `ReceptionAppointmentServiceImpl` already contains all 7 required receptionist methods: `list`, `detail`, `options`, `create`, `checkIn`, `undoCheckIn`, `cancel`, `reschedule`.
   - Creating `ReceptionAppointmentController` under `com.example.swd.controller.reception` with `@RequestMapping("/api/reception")` and `@PreAuthorize("hasRole('RECEPTIONIST')")` directly restores these endpoints.
   - However, because lines 82–104 in `AppointmentController` map `/reception/appointments/{id}/check-in` and `/undo-check-in`, leaving them in place will cause an immediate `AmbiguousHandlerMappingException` during startup.
   - **Resolution:** Remove lines 82–104 from `AppointmentController`. Reception appointment operations belong strictly in `ReceptionAppointmentController`.
   - From Observation 1.2, `actor.staffId()` is null in `StaffPrincipal`. In `ReceptionAppointmentServiceImpl.java`, `actor.staffId()` must have a fallback:
     `Long staffId = actor.staffId() != null ? actor.staffId() : staff.findByUserAccount_Id(actor.accountId()).map(HospitalStaff::getId).orElseThrow(() -> missing("Nhân viên y tế"));`
     Additionally, `SessionAuthenticationFilter` should be updated to look up and populate `staffId` and `patientId`.

2. **Reception Patient Management (`ReceptionPatientController` & `ReceptionPatientService`):**
   - Requirement `ORIGINAL_REQUEST §R5` and `PROJECT.md §3` specify:
     - `GET /api/reception/patients` (paginated list/search by code, name, phone, email, with user account status)
     - `GET /api/reception/patients/{id}` (full detail with demographics, emergency contact, account status)
     - `POST /api/reception/patients` (create patient, auto-generating patient code `PT-...`)
     - `PUT /api/reception/patients/{id}` (edit patient demographics & emergency contact)
     - `PUT /api/reception/patients/{id}/status` (toggle `userAccount.status` between `ACTIVE` and `INACTIVE`)
   - Notice that previously `ReceptionAppointmentController` had a stub `searchPatients` mapping `@GetMapping("/patients")`. By moving patient management to `ReceptionPatientController`, `GET /api/reception/patients` supports both paginated search for the patient management screen and slot-booking patient lookup, completely eliminating route collisions.

3. **Patient Registration Step 2 (`POST /api/patients/complete-profile`):**
   - Step 1 creates `UserAccount` (INACTIVE), initial `Patient` record, and issues OTP.
   - User verifies OTP via `POST /api/patients/verify-otp`, setting `RegistrationVerification.verifiedAt = now()`.
   - Step 2 calls `POST /api/patients/complete-profile` with `CompleteProfile` payload:
     - Required: `fullName`, `dateOfBirth`, `gender`, `phone`, `address`, `email`.
     - Optional: `emergencyContactName`, `emergencyContactPhone`.
   - Service verifies that `RegistrationVerification.verifiedAt != null` (rejecting unverified callers).
   - Service updates the `Patient` entity, ensures `patientCode` is assigned, updates `UserAccount.status = ACTIVE`, and returns `CompletedProfileView(patientId, patientCode, fullName)` wrapped in `ApiResponse.ok(...)`.
   - `SecurityConfig.java` must include `POST /api/patients/complete-profile` under `permitAll()`.

4. **Patient Appointment Resolution & Slots:**
   - In `AppointmentController.getPatientAppointments`:
     - If `patientId` is provided (e.g., admin inspection), use it.
     - If `patientId` is null, resolve `targetPatientId` via:
       `principal.patientId() != null ? principal.patientId() : patientRepository.findByUserAccount_Id(principal.accountId()).map(Patient::getId).orElse(null)`.
     - If patient has no record, return `ApiResponse.ok(List.of())` (or throw 404).
   - In `AppointmentController`, implement `GET /api/appointments/available-slots`:
     - Accept optional `date` (defaults to today) and optional `doctorId`.
     - Query `appointmentSlotRepository.findForDate(from, to)`.
     - Filter for `status == OPEN`, `endsAt > now()`, `capacity - activeAppointments > 0`.
     - Return `ApiResponse.ok("Danh sách khung giờ khả dụng", slotViews)`.

---

## 3. Detailed Component Designs & Code Blueprints

### Blueprint 1: `ReceptionAppointmentController.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionAppointmentController.java`
```java
package com.example.swd.controller.reception;

import com.example.swd.dto.request.ReceptionRequests.CancelAppointment;
import com.example.swd.dto.request.ReceptionRequests.CreateAppointment;
import com.example.swd.dto.request.ReceptionRequests.RescheduleAppointment;
import com.example.swd.dto.response.WorkflowViews.AppointmentView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.dto.response.WorkflowViews.ReceptionOptions;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionAppointmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reception")
@PreAuthorize("hasRole('RECEPTIONIST')")
@RequiredArgsConstructor
public class ReceptionAppointmentController {

    private final ReceptionAppointmentService reception;

    @GetMapping("/appointments")
    public PageView<AppointmentView> appointments(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) Long doctorId,
            @RequestParam(required = false) Appointment.Status status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return reception.list(actor, date, doctorId, status, search, page, size);
    }

    @GetMapping("/appointments/{id}")
    public AppointmentView detail(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.detail(actor, id);
    }

    @GetMapping("/options")
    public ReceptionOptions options(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return reception.options(actor, date);
    }

    @PostMapping("/appointments")
    public AppointmentView create(
            @AuthenticationPrincipal StaffPrincipal actor,
            @Valid @RequestBody CreateAppointment input) {
        return reception.create(actor, input);
    }

    @PostMapping("/appointments/{id}/check-in")
    public AppointmentView checkIn(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.checkIn(actor, id);
    }

    @PostMapping("/appointments/{id}/undo-check-in")
    public AppointmentView undoCheckIn(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return reception.undoCheckIn(actor, id);
    }

    @PostMapping("/appointments/{id}/cancel")
    public AppointmentView cancel(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelAppointment input) {
        return reception.cancel(actor, id, input == null ? null : input.reason());
    }

    @PostMapping("/appointments/{id}/reschedule")
    public AppointmentView reschedule(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody RescheduleAppointment input) {
        return reception.reschedule(actor, id, input.slotId());
    }
}
```

### Blueprint 2: `ReceptionAppointmentServiceImpl.java` Null-Safety Patch
In `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionAppointmentServiceImpl.java`:
Update line 185 and 199 to resolve `actor.staffId()` safely if null:
```java
// Check-in staff resolution
Long effectiveStaffId = actor.staffId();
if (effectiveStaffId == null) {
    effectiveStaffId = staff.findByUserAccount_Id(actor.accountId())
            .map(s -> s.getId())
            .orElseThrow(() -> new WorkflowException(HttpStatus.FORBIDDEN, "STAFF_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên lễ tân"));
}
appointment.setCheckedInByStaff(staff.getReferenceById(effectiveStaffId));
```

### Blueprint 3: Changes in `AppointmentController.java`
**Target File**: `backend/swd/src/main/java/com/example/swd/controller/appointment/AppointmentController.java`
1. **Remove Duplicate Endpoints**:
   Delete lines 80–104 (`checkIn` and `undoCheckIn` mapped to `/reception/appointments/{id}/...`).
2. **Fix `getPatientAppointments`**:
   ```java
   @GetMapping("/patient/appointments")
   @PreAuthorize("hasAnyRole('PATIENT', 'ADMIN')")
   public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getPatientAppointments(
           @RequestParam(required = false) Long patientId,
           @AuthenticationPrincipal StaffPrincipal principal) {
       Long targetPatientId = patientId;
       if (targetPatientId == null) {
           if (principal.patientId() != null) {
               targetPatientId = principal.patientId();
           } else {
               targetPatientId = patientRepository.findByUserAccount_Id(principal.accountId())
                       .map(Patient::getId)
                       .orElse(null);
           }
       }
       if (targetPatientId == null) {
           return ResponseEntity.ok(ApiResponse.ok("Chưa có hồ sơ bệnh nhân", List.of()));
       }
       List<AppointmentResponse> list = appointmentService.getAppointmentsByPatient(targetPatientId);
       return ResponseEntity.ok(ApiResponse.ok(list));
   }
   ```
3. **Add `available-slots` Endpoint**:
   ```java
   @GetMapping("/appointments/available-slots")
   public ResponseEntity<ApiResponse<List<WorkflowViews.SlotView>>> getAvailableSlots(
           @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
           @RequestParam(required = false) Long doctorId) {
       List<WorkflowViews.SlotView> slots = appointmentService.getAvailableSlots(date, doctorId);
       return ResponseEntity.ok(ApiResponse.ok("Danh sách khung giờ khả dụng", slots));
   }
   ```
4. **Implement `getAvailableSlots` in `AppointmentService` & `AppointmentServiceImpl`**:
   ```java
   @Transactional(readOnly = true)
   public List<WorkflowViews.SlotView> getAvailableSlots(LocalDate date, Long doctorId) {
       ZoneId vietnamZone = ZoneId.of("Asia/Ho_Chi_Minh");
       LocalDate queryDate = date != null ? date : LocalDate.now(vietnamZone);
       LocalDateTime from = queryDate.atStartOfDay(vietnamZone).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
       LocalDateTime to = queryDate.plusDays(1).atStartOfDay(vietnamZone).withZoneSameInstant(ZoneOffset.UTC).toLocalDateTime();
       LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);

       List<AppointmentSlot> slots = appointmentSlotRepository.findForDate(from, to);
       List<WorkflowViews.SlotView> result = new ArrayList<>();

       for (AppointmentSlot slot : slots) {
           if (slot.getStatus() != AppointmentSlot.Status.OPEN || !slot.getEndsAt().isAfter(now)) {
               continue;
           }
           if (doctorId != null && !slot.getWorkSchedule().getStaff().getId().equals(doctorId)) {
               continue;
           }
           int activeCount = (int) appointmentRepository.countActiveBySlotId(slot.getId());
           int remaining = slot.getCapacity() - activeCount;
           if (remaining <= 0) {
               continue;
           }
           var doctorOpt = doctorProfileRepository.findById(slot.getWorkSchedule().getStaff().getId());
           if (doctorOpt.isEmpty()) continue;
           result.add(WorkflowMapper.slot(slot, doctorOpt.get(), remaining));
       }
       return result;
   }
   ```

### Blueprint 4: Receptionist Patient Management
#### 4.1 Request & View DTOs
**Target File**: `backend/swd/src/main/java/com/example/swd/dto/request/ReceptionPatientRequests.java`
```java
package com.example.swd.dto.request;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public final class ReceptionPatientRequests {
    private ReceptionPatientRequests() {}

    public record CreatePatientRequest(
            @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
            @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
            String fullName,

            @NotNull(message = "Vui lòng chọn ngày sinh.")
            @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
            LocalDate dateOfBirth,

            @NotNull(message = "Vui lòng chọn giới tính.")
            Gender gender,

            @NotBlank(message = "Vui lòng nhập số điện thoại.")
            @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không hợp lệ.")
            String phone,

            @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String contactEmail,

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            String emergencyContactPhone
    ) {}

    public record UpdatePatientRequest(
            @NotBlank(message = "Vui lòng nhập họ tên bệnh nhân.")
            @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
            String fullName,

            @NotNull(message = "Vui lòng chọn ngày sinh.")
            @PastOrPresent(message = "Ngày sinh không được ở tương lai.")
            LocalDate dateOfBirth,

            @NotNull(message = "Vui lòng chọn giới tính.")
            Gender gender,

            @NotBlank(message = "Vui lòng nhập số điện thoại.")
            @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không hợp lệ.")
            String phone,

            @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String contactEmail,

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            String emergencyContactPhone
    ) {}

    public record UpdateStatusRequest(
            @NotNull(message = "Vui lòng chọn trạng thái tài khoản.")
            ActiveStatus status
    ) {}
}
```

**Target File**: `backend/swd/src/main/java/com/example/swd/dto/response/ReceptionPatientViews.java`
```java
package com.example.swd.dto.response;

import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Gender;
import java.time.LocalDate;

public final class ReceptionPatientViews {
    private ReceptionPatientViews() {}

    public record PatientListItemView(
            Long id,
            String patientCode,
            String fullName,
            LocalDate dateOfBirth,
            Gender gender,
            String phone,
            String contactEmail,
            String address,
            Long userAccountId,
            String username,
            ActiveStatus accountStatus
    ) {}

    public record PatientDetailView(
            Long id,
            String patientCode,
            String fullName,
            LocalDate dateOfBirth,
            Gender gender,
            String phone,
            String contactEmail,
            String address,
            String emergencyContactName,
            String emergencyContactPhone,
            Long userAccountId,
            String username,
            ActiveStatus accountStatus,
            String createdAt,
            String updatedAt
    ) {}
}
```

#### 4.2 Service Interface
**Target File**: `backend/swd/src/main/java/com/example/swd/service/ReceptionPatientService.java`
```java
package com.example.swd.service;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;

public interface ReceptionPatientService {
    PageView<PatientListItemView> list(StaffPrincipal actor, String search, int page, int size);
    PatientDetailView detail(StaffPrincipal actor, Long id);
    PatientDetailView create(StaffPrincipal actor, CreatePatientRequest request);
    PatientDetailView update(StaffPrincipal actor, Long id, UpdatePatientRequest request);
    PatientDetailView updateStatus(StaffPrincipal actor, Long id, UpdateStatusRequest request);
}
```

#### 4.3 Service Implementation
**Target File**: `backend/swd/src/main/java/com/example/swd/service/impl/ReceptionPatientServiceImpl.java`
```java
package com.example.swd.service.impl;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.mapper.WorkflowMapper;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionPatientService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ReceptionPatientServiceImpl implements ReceptionPatientService {

    private final PatientRepository patients;
    private final UserAccountRepository accounts;

    @Override
    public PageView<PatientListItemView> list(StaffPrincipal actor, String search, int page, int size) {
        requireReceptionist(actor);
        if (page < 0 || size < 1 || size > 100) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_PAGE", "Phân trang không hợp lệ (1-100)");
        }
        String keyword = normalize(search);

        Page<Patient> result = patients.findAll((root, query, cb) -> {
            if (keyword == null) return cb.conjunction();
            String pattern = "%" + keyword.toLowerCase().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            return cb.or(
                    cb.like(cb.lower(root.get("patientCode")), pattern, '\\'),
                    cb.like(cb.lower(root.get("fullName")), pattern, '\\'),
                    cb.like(cb.lower(root.get("phone")), pattern, '\\'),
                    cb.like(cb.lower(root.get("contactEmail")), pattern, '\\')
            );
        }, PageRequest.of(page, size, Sort.by("id").descending()));

        var items = result.getContent().stream().map(this::toListItemView).toList();
        return new PageView<>(items, result.getTotalElements(), page, size);
    }

    @Override
    public PatientDetailView detail(StaffPrincipal actor, Long id) {
        requireReceptionist(actor);
        Patient patient = patients.findById(id)
                .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Hồ sơ bệnh nhân không tồn tại"));
        return toDetailView(patient);
    }

    @Override
    @Transactional
    public PatientDetailView create(StaffPrincipal actor, CreatePatientRequest request) {
        requireReceptionist(actor);
        Patient patient = new Patient();
        patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        patient.setFullName(request.fullName().trim());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setPhone(normalize(request.phone()));
        patient.setContactEmail(normalize(request.contactEmail()));
        patient.setAddress(normalize(request.address()));
        patient.setEmergencyContactName(normalize(request.emergencyContactName()));
        patient.setEmergencyContactPhone(normalize(request.emergencyContactPhone()));
        patients.saveAndFlush(patient);
        return toDetailView(patient);
    }

    @Override
    @Transactional
    public PatientDetailView update(StaffPrincipal actor, Long id, UpdatePatientRequest request) {
        requireReceptionist(actor);
        Patient patient = patients.findById(id)
                .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Hồ sơ bệnh nhân không tồn tại"));
        patient.setFullName(request.fullName().trim());
        patient.setDateOfBirth(request.dateOfBirth());
        patient.setGender(request.gender());
        patient.setPhone(normalize(request.phone()));
        patient.setContactEmail(normalize(request.contactEmail()));
        patient.setAddress(normalize(request.address()));
        patient.setEmergencyContactName(normalize(request.emergencyContactName()));
        patient.setEmergencyContactPhone(normalize(request.emergencyContactPhone()));
        patients.flush();
        return toDetailView(patient);
    }

    @Override
    @Transactional
    public PatientDetailView updateStatus(StaffPrincipal actor, Long id, UpdateStatusRequest request) {
        requireReceptionist(actor);
        Patient patient = patients.findById(id)
                .orElseThrow(() -> new WorkflowException(HttpStatus.NOT_FOUND, "PATIENT_NOT_FOUND", "Hồ sơ bệnh nhân không tồn tại"));
        if (patient.getUserAccount() == null) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "NO_USER_ACCOUNT", "Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến");
        }
        patient.getUserAccount().setStatus(request.status());
        accounts.flush();
        return toDetailView(patient);
    }

    private PatientListItemView toListItemView(Patient p) {
        var acc = p.getUserAccount();
        return new PatientListItemView(
                p.getId(), p.getPatientCode(), p.getFullName(), p.getDateOfBirth(),
                p.getGender(), p.getPhone(), p.getContactEmail(), p.getAddress(),
                acc != null ? acc.getId() : null,
                acc != null ? acc.getUsername() : null,
                acc != null ? acc.getStatus() : ActiveStatus.INACTIVE
        );
    }

    private PatientDetailView toDetailView(Patient p) {
        var acc = p.getUserAccount();
        return new PatientDetailView(
                p.getId(), p.getPatientCode(), p.getFullName(), p.getDateOfBirth(),
                p.getGender(), p.getPhone(), p.getContactEmail(), p.getAddress(),
                p.getEmergencyContactName(), p.getEmergencyContactPhone(),
                acc != null ? acc.getId() : null,
                acc != null ? acc.getUsername() : null,
                acc != null ? acc.getStatus() : ActiveStatus.INACTIVE,
                WorkflowMapper.timestamp(p.getCreatedAt()),
                WorkflowMapper.timestamp(p.getUpdatedAt())
        );
    }

    private void requireReceptionist(StaffPrincipal actor) {
        if (actor == null || !"RECEPTIONIST".equals(actor.role())) {
            throw new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chức năng chỉ dành cho nhân viên lễ tân");
        }
    }

    private String normalize(String str) {
        return str == null || str.isBlank() ? null : str.trim();
    }
}
```

#### 4.4 Controller
**Target File**: `backend/swd/src/main/java/com/example/swd/controller/reception/ReceptionPatientController.java`
```java
package com.example.swd.controller.reception;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ApiResponse;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionPatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reception/patients")
@PreAuthorize("hasRole('RECEPTIONIST')")
@RequiredArgsConstructor
public class ReceptionPatientController {

    private final ReceptionPatientService patientService;

    @GetMapping
    public ApiResponse<PageView<PatientListItemView>> listPatients(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(patientService.list(actor, search, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<PatientDetailView> getPatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return ApiResponse.ok(patientService.detail(actor, id));
    }

    @PostMapping
    public ApiResponse<PatientDetailView> createPatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @Valid @RequestBody CreatePatientRequest request) {
        return ApiResponse.ok("Tạo hồ sơ người bệnh thành công", patientService.create(actor, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PatientDetailView> updatePatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePatientRequest request) {
        return ApiResponse.ok("Cập nhật thông tin người bệnh thành công", patientService.update(actor, id, request));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<PatientDetailView> updateStatus(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ApiResponse.ok("Cập nhật trạng thái tài khoản thành công", patientService.updateStatus(actor, id, request));
    }
}
```

### Blueprint 5: Patient Registration Step 2 (`POST /api/patients/complete-profile`)
#### 5.1 DTO Extension in `RegistrationCommands.java`
Append to `backend/swd/src/main/java/com/example/swd/dto/request/RegistrationCommands.java`:
```java
    public record CompleteProfile(
            @NotBlank(message = "Vui lòng nhập email.")
            @Email(message = "Email không hợp lệ.")
            @Size(max = 254, message = "Email tối đa 254 ký tự.")
            String email,

            @NotBlank(message = "Vui lòng nhập họ tên.")
            @Size(max = 150, message = "Họ tên tối đa 150 ký tự.")
            String fullName,

            @NotNull(message = "Vui lòng chọn ngày sinh.")
            @PastOrPresent(message = "Ngày sinh không hợp lệ.")
            LocalDate dateOfBirth,

            @NotNull(message = "Vui lòng chọn giới tính.")
            Gender gender,

            @NotBlank(message = "Vui lòng nhập số điện thoại.")
            @Pattern(regexp = "(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại không hợp lệ.")
            String phone,

            @NotBlank(message = "Vui lòng nhập địa chỉ.")
            @Size(max = 500, message = "Địa chỉ tối đa 500 ký tự.")
            String address,

            @Size(max = 150, message = "Họ tên người liên hệ khẩn cấp tối đa 150 ký tự.")
            String emergencyContactName,

            @Pattern(regexp = "^$|(84|0[3|5|7|8|9])+([0-9]{8})\\b", message = "Số điện thoại người liên hệ khẩn cấp không hợp lệ.")
            String emergencyContactPhone
    ) {}
```

#### 5.2 Method in `PatientRegistrationService.java`
```java
record CompletedProfileView(Long patientId, String patientCode, String fullName) {}
CompletedProfileView completeProfile(RegistrationCommands.CompleteProfile input);
```

#### 5.3 Implementation in `PatientRegistrationServiceImpl.java`
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

#### 5.4 Endpoint in `PatientController.java`
```java
@PostMapping("/complete-profile")
public ApiResponse<PatientRegistrationService.CompletedProfileView> completeProfile(
        @Valid @RequestBody RegistrationCommands.CompleteProfile input) {
    return ApiResponse.ok("Hồ sơ bệnh nhân đã được hoàn tất thành công", registration.completeProfile(input));
}
```

#### 5.5 Permitted in `SecurityConfig.java`
Update line 47:
```java
.requestMatchers(HttpMethod.POST, "/api/patients/register", "/api/patients/send-otp", "/api/patients/verify-otp", "/api/patients/complete-profile").permitAll()
.requestMatchers(HttpMethod.GET, "/api/appointments/available-slots").permitAll()
```

---

## 4. Caveats & Assumptions

1. **Security Context vs Dual Authorization for Slots:**
   - `GET /api/appointments/available-slots` is marked `permitAll()` to enable both unregistered/public walk-in browsing and authenticated patient rescheduling. If the team prefers restricting slot queries strictly to logged-in users, `@PreAuthorize("isAuthenticated()")` can be substituted without changes to the service layer.
2. **Patient Account Association for Reception-Created Patients:**
   - When a receptionist creates a walk-in patient via `POST /api/reception/patients`, the patient has `userAccount = null` (no login account created). Toggling status on such a record throws `NO_USER_ACCOUNT`. If in later milestones the hospital requires auto-generating accounts for walk-ins, this can be added in `ReceptionPatientServiceImpl.create`.
3. **Session Filter Enrichment:**
   - Adding `HospitalStaffRepository` and `PatientRepository` lookups to `SessionAuthenticationFilter` adds a small DB query per authenticated request. Because sessions are cached or queried anyway, this ensures `StaffPrincipal.staffId` and `StaffPrincipal.patientId` are always populated, completely preventing null-pointer bugs downstream.

---

## 5. Conclusion

1. **Reception Appointment Management is 100% Recoverable**: The service implementation `ReceptionAppointmentServiceImpl` is complete and robust. Re-instantiating `ReceptionAppointmentController` while removing the two duplicate methods from `AppointmentController` restores all receptionist appointment capabilities without startup conflicts.
2. **Reception Patient Management is Fully Specified**: `ReceptionPatientController` and `ReceptionPatientService` provide paginated search, full detail view, new patient creation, demographic editing, and user account status toggling (`ACTIVE`/`INACTIVE`).
3. **Registration Step 2 Completes the Dual-Step Flow**: Adding `POST /api/patients/complete-profile` enforces OTP verification gate while accepting required patient attributes (`fullName`, `dateOfBirth`, `gender`, `phone`, `address`) and optional guardian attributes (`emergencyContactName`, `emergencyContactPhone`), transitioning the account to `ACTIVE`.
4. **Patient Appointment Resolution & Slots are Fixed**: Resolving `targetPatientId` from `patientRepository.findByUserAccount_Id` prevents data mix-ups, and `GET /api/appointments/available-slots` provides available slot discovery for patient rescheduling.

---

## 6. Verification Method

### 6.1 Build & Static Verification
Run maven compilation to verify zero syntax or type mismatches:
```powershell
mvn test-compile -DskipTests
```
Pass condition: `BUILD SUCCESS` with 0 compiler errors.

### 6.2 Endpoint Verification Scenarios

1. **Restored Receptionist Appointments**:
   - `GET /api/reception/appointments?date=2026-11-03` with Receptionist Bearer Token -> HTTP 200 with `{ items: [...], total: N, page: 0, size: 20 }`.
   - `POST /api/reception/appointments/{id}/check-in` -> HTTP 200 with `status: CHECKED_IN`.
   - `POST /api/reception/appointments/{id}/undo-check-in` -> HTTP 200 with `status: BOOKED`.

2. **Receptionist Patient CRUD**:
   - `GET /api/reception/patients?search=Nguyễn` -> HTTP 200 with paginated patient list.
   - `POST /api/reception/patients` with valid demographics -> HTTP 200 with generated `patientCode`.
   - `PUT /api/reception/patients/{id}/status` with `{"status": "INACTIVE"}` -> HTTP 200 with `accountStatus: INACTIVE`.

3. **2-Step Registration**:
   - `POST /api/patients/register` with `{ username, email, password, confirmPassword, agreeTerms: true }` -> HTTP 200, OTP sent to email.
   - `POST /api/patients/verify-otp` with `{ email, otp }` -> HTTP 200.
   - `POST /api/patients/complete-profile` with `{ email, fullName, dateOfBirth, gender, phone, address }` -> HTTP 200, `{ code: 200, data: { patientId: ..., patientCode: ... } }`.
   - `POST /api/auth/login` with newly registered credentials -> HTTP 200 with active session token.

4. **Patient Appointment Resolution**:
   - Log in as patient, call `GET /api/patient/appointments` without query parameters -> HTTP 200 with appointment list belonging specifically to that patient.
   - Call `GET /api/appointments/available-slots?date=2026-11-05` -> HTTP 200 with list of available open slots having remaining capacity > 0.
