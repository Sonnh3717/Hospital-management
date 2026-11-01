package com.example.swd.service;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.DoctorProfileRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.RegistrationVerificationRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final Set<String> WORKFLOW_ROLES = Set.of("RECEPTIONIST", "DOCTOR", "MEDICAL_SERVICE_STAFF");
    private final UserAccountRepository accounts;
    private final AuthSessionRepository sessions;
    private final HospitalStaffRepository staff;
    private final DoctorProfileRepository doctors;
    private final PatientRepository patients;
    private final RegistrationVerificationRepository verifications;
    private final PasswordEncoder encoder;
    private final long sessionHours;
    private final String dummyHash;

    public AuthService(UserAccountRepository accounts, AuthSessionRepository sessions, HospitalStaffRepository staff,
                       DoctorProfileRepository doctors, PatientRepository patients, RegistrationVerificationRepository verifications, PasswordEncoder encoder,
                       @Value("${app.auth.session-hours:8}") long sessionHours) {
        this.accounts = accounts;
        this.sessions = sessions;
        this.staff = staff;
        this.doctors = doctors;
        this.patients = patients;
        this.verifications = verifications;
        this.encoder = encoder;
        if (sessionHours < 1 || sessionHours > 168) throw new IllegalArgumentException("Session hours must be between 1 and 168");
        this.sessionHours = sessionHours;
        this.dummyHash = encoder.encode(UUID.randomUUID().toString());
    }

    public record LoginView(String token, String expiresAt, StaffPrincipal user) {
        @Override public String toString() { return "LoginView[session=REDACTED]"; }
    }

    @Transactional
    public LoginView login(LoginRequest input) {
        if (input.password() == null || input.password().isBlank() || input.password().length() > 128) {
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vui lòng kiểm tra thông tin đã nhập.",
                    Map.of("password", "Vui lòng nhập mật khẩu, tối đa 128 ký tự."), List.of());
        }
        if (input.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new WorkflowException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng.");
        }
        var candidate = accounts.findForLogin(input.username().trim());
        boolean passwordMatches = encoder.matches(input.password(), candidate.map(UserAccount::getPasswordHash).orElse(dummyHash));
        if (!passwordMatches || candidate.isEmpty()) {
            throw new WorkflowException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Tên đăng nhập hoặc mật khẩu không đúng.");
        }
        UserAccount account = candidate.get();
        if (account.getStatus() == ActiveStatus.INACTIVE && account.getRole().getRoleCode().name().equals("PATIENT")
                && verifications.findById(account.getId()).map(v -> v.getVerifiedAt() == null).orElse(false)) {
            throw new WorkflowException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Vui lòng xác thực email bằng mã OTP trước khi đăng nhập.");
        }
        StaffPrincipal principal = principal(account);
        AuthSession session = new AuthSession();
        session.setUserAccount(account);
        session.setExpiresAt(now().plusHours(sessionHours));
        sessions.saveAndFlush(session);
        return new LoginView(session.getId(), WorkflowMapper.timestamp(session.getExpiresAt()), principal);
    }

    @Transactional(readOnly = true)
    public StaffPrincipal authenticate(String token) {
        if (!isCanonicalToken(token)) throw unauthenticated();
        AuthSession session = sessions.findForAuthentication(token).orElseThrow(AuthService::unauthenticated);
        if (session.getRevokedAt() != null || !session.getExpiresAt().isAfter(now())) throw unauthenticated();
        return principal(session.getUserAccount());
    }

    @Transactional
    public void logout(String token, StaffPrincipal actor) {
        AuthSession session = sessions.lockById(token).orElseThrow(AuthService::unauthenticated);
        if (!session.getUserAccount().getId().equals(actor.accountId())) throw unauthenticated();
        if (session.getRevokedAt() == null) {
            session.setRevokedAt(now());
            session.setRevocationReason(AuthSession.RevocationReason.LOGOUT);
        }
    }

    private StaffPrincipal principal(UserAccount account) {
        if (account.getStatus() != ActiveStatus.ACTIVE) throw unauthenticated();
        String role = account.getRole().getRoleCode().name();
        if (role.equals("PATIENT")) {
            var patient = patients.findByUserAccount_Id(account.getId()).orElseThrow(AuthService::unauthenticated);
            return new StaffPrincipal(account.getId(), null, account.getUsername(), patient.getFullName(), role, patient.getId());
        }
        var employee = staff.findByUserAccount_Id(account.getId()).orElseThrow(AuthService::unauthenticated);
        if (employee.getEmploymentStatus() != ActiveStatus.ACTIVE) throw unauthenticated();
        if (!WORKFLOW_ROLES.contains(role)) {
            throw new WorkflowException(HttpStatus.FORBIDDEN, "UNSUPPORTED_ROLE", "Tài khoản không thuộc vai trò trong quy trình khám bệnh.");
        }
        if (role.equals("DOCTOR") && !doctors.findById(employee.getId()).map(d -> Boolean.TRUE.equals(d.getIsActive())).orElse(false)) {
            throw unauthenticated();
        }
        return new StaffPrincipal(account.getId(), employee.getId(), account.getUsername(), employee.getFullName(), role);
    }

    static boolean isCanonicalToken(String token) {
        try { return token != null && UUID.fromString(token).toString().equals(token); }
        catch (IllegalArgumentException ex) { return false; }
    }
    private static LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
    private static WorkflowException unauthenticated() {
        return new WorkflowException(HttpStatus.UNAUTHORIZED, "UNAUTHENTICATED", "Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.");
    }
}
