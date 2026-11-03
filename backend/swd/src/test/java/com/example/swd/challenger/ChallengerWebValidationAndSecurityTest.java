package com.example.swd.challenger;

import com.example.swd.config.WebConfig;
import com.example.swd.controller.patient.PatientController;
import com.example.swd.controller.reception.ReceptionPatientController;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.GlobalExceptionHandler;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import com.example.swd.security.SecurityConfig;
import com.example.swd.security.SessionAuthenticationFilter;
import com.example.swd.service.PatientRegistrationService;
import com.example.swd.service.PatientRegistrationService.CompletedProfileView;
import com.example.swd.service.ReceptionPatientService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest({PatientController.class, ReceptionPatientController.class})
@Import({SecurityConfig.class, WebConfig.class, GlobalExceptionHandler.class, SessionAuthenticationFilter.class, ChallengerWebValidationAndSecurityTest.FilterDisableConfig.class})
@DisplayName("Challenger M1-1: Web MVC Validation & Role Security Probing")
class ChallengerWebValidationAndSecurityTest {

    @org.springframework.boot.test.context.TestConfiguration
    static class FilterDisableConfig {
        @org.springframework.context.annotation.Bean
        public org.springframework.boot.web.servlet.FilterRegistrationBean<SessionAuthenticationFilter> disableSessionFilterForServlet(SessionAuthenticationFilter filter) {
            org.springframework.boot.web.servlet.FilterRegistrationBean<SessionAuthenticationFilter> reg = new org.springframework.boot.web.servlet.FilterRegistrationBean<>(filter);
            reg.setEnabled(false);
            return reg;
        }
    }

    @Autowired MockMvc mvc;

    @MockitoBean PatientRegistrationService registrationService;
    @MockitoBean ReceptionPatientService receptionPatientService;
    @MockitoBean AuthSessionRepository authSessionRepository;
    @MockitoBean HospitalStaffRepository hospitalStaffRepository;
    @MockitoBean PatientRepository patientRepository;

    private static final String RECEPTION_TOKEN = "session-receptionist-token-123";
    private static final String PATIENT_TOKEN = "session-patient-token-456";
    private static final String DOCTOR_TOKEN = "session-doctor-token-789";

    private AuthSession recSession;
    private AuthSession patSession;
    private AuthSession docSession;

    @BeforeEach
    void setupSessions() {
        // Receptionist session
        UserAccount recUser = new UserAccount();
        recUser.setId(100L);
        recUser.setUsername("rec.demo");
        Role recRole = new Role();
        recRole.setRoleCode(Role.RoleCode.RECEPTIONIST);
        recUser.setRole(recRole);
        recSession = new AuthSession();
        recSession.setUserAccount(recUser);
        recSession.setExpiresAt(LocalDateTime.now().plusHours(2));

        HospitalStaff recStaff = new HospitalStaff();
        recStaff.setId(10L);
        recStaff.setFullName("Lễ Tân Demo");

        // Patient session
        UserAccount patUser = new UserAccount();
        patUser.setId(200L);
        patUser.setUsername("pat.demo");
        Role patRole = new Role();
        patRole.setRoleCode(Role.RoleCode.PATIENT);
        patUser.setRole(patRole);
        patSession = new AuthSession();
        patSession.setUserAccount(patUser);
        patSession.setExpiresAt(LocalDateTime.now().plusHours(2));

        // Doctor session
        UserAccount docUser = new UserAccount();
        docUser.setId(300L);
        docUser.setUsername("doc.demo");
        Role docRole = new Role();
        docRole.setRoleCode(Role.RoleCode.DOCTOR);
        docUser.setRole(docRole);
        docSession = new AuthSession();
        docSession.setUserAccount(docUser);
        docSession.setExpiresAt(LocalDateTime.now().plusHours(2));

        HospitalStaff docStaff = new HospitalStaff();
        docStaff.setId(30L);
        docStaff.setFullName("Bác Sĩ Demo");

        when(hospitalStaffRepository.findByUserAccount_Id(100L)).thenReturn(Optional.of(recStaff));
        when(hospitalStaffRepository.findByUserAccount_Id(200L)).thenReturn(Optional.empty());
        when(hospitalStaffRepository.findByUserAccount_Id(300L)).thenReturn(Optional.of(docStaff));
        when(patientRepository.findByUserAccount_Id(any())).thenReturn(Optional.empty());

        when(authSessionRepository.findForAuthentication(anyString())).thenAnswer(inv -> {
            String token = inv.getArgument(0);
            if (RECEPTION_TOKEN.equals(token)) return Optional.of(recSession);
            if (PATIENT_TOKEN.equals(token)) return Optional.of(patSession);
            if (DOCTOR_TOKEN.equals(token)) return Optional.of(docSession);
            return Optional.empty();
        });
    }

    @Test
    @DisplayName("ReceptionPatients: Valid RECEPTIONIST session passes security filter and executes controller")
    void receptionPatients_receptionistSession_populatesStaffPrincipal() throws Exception {
        mvc.perform(get("/api/reception/patients")
                .header("Authorization", "Bearer " + RECEPTION_TOKEN))
                .andExpect(status().isOk());
        verify(authSessionRepository).findForAuthentication(RECEPTION_TOKEN);
    }

    // =========================================================================
    // 1. Patient Registration: POST /api/patients/complete-profile
    // =========================================================================

    @Test
    @DisplayName("CompleteProfile: Submitting blank fullName MUST return HTTP 400 with VALIDATION_ERROR on fullName")
    void completeProfile_blankFullName_returns400() throws Exception {
        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@hospital.vn",
                                  "fullName": "   ",
                                  "dateOfBirth": "1995-05-15",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.fullName").exists());

        verifyNoInteractions(registrationService);
    }

    @Test
    @DisplayName("CompleteProfile: Submitting future date of birth MUST return HTTP 400 with VALIDATION_ERROR on dateOfBirth")
    void completeProfile_futureDob_returns400() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {
                                  "email": "test@hospital.vn",
                                  "fullName": "Nguyễn Văn A",
                                  "dateOfBirth": "%s",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """, tomorrow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.dateOfBirth").exists());

        verifyNoInteractions(registrationService);
    }

    @Test
    @DisplayName("CompleteProfile: Submitting invalid phone formats MUST return HTTP 400 with VALIDATION_ERROR on phone")
    void completeProfile_invalidPhone_returns400() throws Exception {
        // Test short phone
        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@hospital.vn",
                                  "fullName": "Nguyễn Văn A",
                                  "dateOfBirth": "1995-05-15",
                                  "gender": "MALE",
                                  "phone": "12345",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.phone").exists());

        // Test non-numeric phone
        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "test@hospital.vn",
                                  "fullName": "Nguyễn Văn A",
                                  "dateOfBirth": "1995-05-15",
                                  "gender": "MALE",
                                  "phone": "abcdefghijk",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.phone").exists());

        verifyNoInteractions(registrationService);
    }

    @Test
    @DisplayName("CompleteProfile: Submitting valid required fields without optional emergency contact MUST return HTTP 200")
    void completeProfile_validWithoutOptionalEmergency_returns200() throws Exception {
        when(registrationService.completeProfile(any())).thenReturn(
                new CompletedProfileView(55L, "PT-CHALLENGER001", "Nguyễn Văn Thử Thách")
        );

        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "challenger@hospital.vn",
                                  "fullName": "Nguyễn Văn Thử Thách",
                                  "dateOfBirth": "1998-10-12",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "123 Giải Phóng, Hà Nội"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(200))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.timestamp").isNotEmpty())
                .andExpect(jsonPath("$.data.patientId").value(55))
                .andExpect(jsonPath("$.data.patientCode").value("PT-CHALLENGER001"))
                .andExpect(jsonPath("$.data.fullName").value("Nguyễn Văn Thử Thách"));

        verify(registrationService).completeProfile(any());
    }

    @Test
    @DisplayName("CompleteProfile: Submitting with invalid emergency contact phone MUST return HTTP 400")
    void completeProfile_invalidEmergencyPhone_returns400() throws Exception {
        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "challenger@hospital.vn",
                                  "fullName": "Nguyễn Văn Thử Thách",
                                  "dateOfBirth": "1998-10-12",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "123 Giải Phóng, Hà Nội",
                                  "emergencyContactName": "Người Thân",
                                  "emergencyContactPhone": "999"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.emergencyContactPhone").exists());

        verifyNoInteractions(registrationService);
    }

    @Test
    @DisplayName("CompleteProfile: Submitting without verified OTP MUST return HTTP 400 with OTP_NOT_VERIFIED")
    void completeProfile_unverifiedOtp_returns400WithWorkflowCode() throws Exception {
        when(registrationService.completeProfile(any())).thenThrow(
                new WorkflowException(HttpStatus.BAD_REQUEST, "OTP_NOT_VERIFIED", "Email chưa được xác thực OTP.")
        );

        mvc.perform(post("/api/patients/complete-profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "unverified@hospital.vn",
                                  "fullName": "Nguyễn Chưa Xác Thực",
                                  "dateOfBirth": "2000-01-01",
                                  "gender": "FEMALE",
                                  "phone": "0911223344",
                                  "address": "Hà Nội"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_NOT_VERIFIED"))
                .andExpect(jsonPath("$.message").value("Email chưa được xác thực OTP."));
    }

    // =========================================================================
    // 2. Reception Patient Endpoints Security & Roles: /api/reception/patients
    // =========================================================================

    @Test
    @DisplayName("ReceptionPatients: Anonymous request MUST return HTTP 401 Unauthorized")
    void receptionPatients_anonymous_returns401() throws Exception {
        mvc.perform(get("/api/reception/patients"))
                .andExpect(status().isUnauthorized());

        verifyNoInteractions(receptionPatientService);
    }

    @Test
    @DisplayName("ReceptionPatients: Request with PATIENT role MUST return HTTP 403 Forbidden")
    void receptionPatients_patientRole_returns403() throws Exception {
        mvc.perform(get("/api/reception/patients")
                        .header("Authorization", "Bearer " + PATIENT_TOKEN))
                .andExpect(status().isForbidden());

        verifyNoInteractions(receptionPatientService);
    }

    @Test
    @DisplayName("ReceptionPatients: Request with DOCTOR role MUST return HTTP 403 Forbidden")
    void receptionPatients_doctorRole_returns403() throws Exception {
        mvc.perform(get("/api/reception/patients")
                        .header("Authorization", "Bearer " + DOCTOR_TOKEN))
                .andExpect(status().isForbidden());

        verifyNoInteractions(receptionPatientService);
    }

    @Test
    @DisplayName("ReceptionPatients: Request with RECEPTIONIST role MUST return HTTP 200 OK")
    void receptionPatients_receptionistRole_returns200() throws Exception {
        when(receptionPatientService.list(any(), any(), eq(0), eq(20)))
                .thenReturn(new PageView<>(List.of(), 0L, 0, 20));

        mvc.perform(get("/api/reception/patients")
                        .header("Authorization", "Bearer " + RECEPTION_TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.items").isArray());
    }

    @Test
    @DisplayName("ReceptionPatients: POST with blank fullName MUST return HTTP 400 VALIDATION_ERROR")
    void receptionPatients_createBlankName_returns400() throws Exception {
        mvc.perform(post("/api/reception/patients")
                        .header("Authorization", "Bearer " + RECEPTION_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "   ",
                                  "dateOfBirth": "1990-01-01",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "Hà Nội"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.fullName").exists());

        verifyNoInteractions(receptionPatientService);
    }

    @Test
    @DisplayName("ReceptionPatients: POST with future DOB MUST return HTTP 400 VALIDATION_ERROR")
    void receptionPatients_createFutureDob_returns400() throws Exception {
        LocalDate tomorrow = LocalDate.now().plusDays(2);
        mvc.perform(post("/api/reception/patients")
                        .header("Authorization", "Bearer " + RECEPTION_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {
                                  "fullName": "Nguyễn Văn Tương Lai",
                                  "dateOfBirth": "%s",
                                  "gender": "MALE",
                                  "phone": "0901234567",
                                  "address": "Hà Nội"
                                }
                                """, tomorrow)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.dateOfBirth").exists());

        verifyNoInteractions(receptionPatientService);
    }

    @Test
    @DisplayName("ReceptionPatients: POST with valid data creates walk-in patient and returns HTTP 200")
    void receptionPatients_createValid_returns200() throws Exception {
        when(receptionPatientService.create(any(), any())).thenReturn(
                new PatientDetailView(88L, "PT-WALKIN001", "Trần Khách Lẻ",
                        LocalDate.of(1985, 4, 10), Gender.MALE, "0912345678",
                        "khach@example.com", "Đà Nẵng", null, null,
                        null, null, null, "2026-11-02T12:00:00Z", "2026-11-02T12:00:00Z")
        );

        mvc.perform(post("/api/reception/patients")
                        .header("Authorization", "Bearer " + RECEPTION_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "fullName": "Trần Khách Lẻ",
                                  "dateOfBirth": "1985-04-10",
                                  "gender": "MALE",
                                  "phone": "0912345678",
                                  "contactEmail": "khach@example.com",
                                  "address": "Đà Nẵng"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(88))
                .andExpect(jsonPath("$.data.patientCode").value("PT-WALKIN001"));
    }

    @Test
    @DisplayName("ReceptionPatients: PUT status on walk-in patient without userAccount returns HTTP 400 NO_USER_ACCOUNT")
    void receptionPatients_toggleWalkInStatus_returns400NoUserAccount() throws Exception {
        when(receptionPatientService.updateStatus(any(), eq(88L), any())).thenThrow(
                new WorkflowException(HttpStatus.BAD_REQUEST, "NO_USER_ACCOUNT",
                        "Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa")
        );

        mvc.perform(put("/api/reception/patients/88/status")
                        .header("Authorization", "Bearer " + RECEPTION_TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "status": "INACTIVE"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("NO_USER_ACCOUNT"))
                .andExpect(jsonPath("$.message").value("Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa"));
    }

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
}
