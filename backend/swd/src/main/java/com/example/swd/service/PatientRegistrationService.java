package com.example.swd.service;

import com.example.swd.dto.request.RegistrationCommands;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.RegistrationVerification;
import com.example.swd.entity.identity.Role;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.RegistrationVerificationRepository;
import com.example.swd.repository.RoleRepository;
import com.example.swd.repository.UserAccountRepository;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PatientRegistrationService {
    public static final int OTP_MINUTES = 5;
    public static final int RESEND_SECONDS = 60;
    public static final int MAX_ATTEMPTS = 5;
    private static final SecureRandom RANDOM = new SecureRandom();
    private final UserAccountRepository accounts;
    private final PatientRepository patients;
    private final RoleRepository roles;
    private final RegistrationVerificationRepository verifications;
    private final PasswordEncoder encoder;
    private final RegistrationEmailService email;
    private final Clock clock;

    public PatientRegistrationService(UserAccountRepository accounts, PatientRepository patients,
            RoleRepository roles, RegistrationVerificationRepository verifications, PasswordEncoder encoder,
            RegistrationEmailService email, Clock clock) {
        this.accounts = accounts;
        this.patients = patients;
        this.roles = roles;
        this.verifications = verifications;
        this.encoder = encoder;
        this.email = email;
        this.clock = clock;
    }

    public record OtpView(String message, String username, String email, String otpExpiresAt, String resendAvailableAt) {}
    public record VerifiedView(String message, String username, String email) {}

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OtpView register(RegistrationCommands.Register input) {
        validate(input);
        String username = input.username().trim();
        String address = normalizeEmail(input.email());
        if (accounts.findByUsername(username).isPresent()) {
            throw field(HttpStatus.CONFLICT, "USERNAME_IN_USE", "Tên đăng nhập đã được sử dụng.", "username");
        }
        if (accounts.findByLoginEmail(address).isPresent()) {
            throw field(HttpStatus.CONFLICT, "EMAIL_IN_USE", "Email đã được sử dụng. Nếu chưa xác thực, hãy gửi lại mã OTP.", "email");
        }
        email.requireConfigured();
        Role patientRole = roles.findByRoleCode(Role.RoleCode.PATIENT).orElseThrow(() ->
                new WorkflowException(HttpStatus.SERVICE_UNAVAILABLE, "REGISTRATION_UNAVAILABLE", "Chức năng đăng ký chưa sẵn sàng. Vui lòng liên hệ hỗ trợ."));
        var account = new UserAccount();
        account.setUsername(username);
        account.setLoginEmail(address);
        account.setRole(patientRole);
        account.setPasswordHash(encoder.encode(input.password()));
        account.setStatus(ActiveStatus.INACTIVE);
        accounts.saveAndFlush(account); // Unique DB constraints resolve concurrent duplicate registration.

        var patient = new Patient();
        patient.setUserAccount(account);
        patient.setPatientCode("PT-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24));
        patient.setFullName(input.fullName().trim());
        patient.setContactEmail(address);
        patients.saveAndFlush(patient);

        var verification = new RegistrationVerification();
        verification.setUserAccount(account);
        verification.setTermsAcceptedAt(now());
        String otp = issue(verification);
        verifications.saveAndFlush(verification);
        // A delivery failure rolls back all three records, so the form can safely retry registration.
        email.sendOtp(address, otp);
        return otpView(account, verification);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OtpView sendOtp(RegistrationCommands.SendOtp input) {
        String address = normalizeEmail(input.email());
        UserAccount account = lockAccount(address);
        RegistrationVerification verification = verifications.lockByAccountId(account.getId()).orElseThrow(PatientRegistrationService::notPending);
        requirePending(account, verification);
        Duration remaining = Duration.between(now(), verification.getLastSentAt().plusSeconds(RESEND_SECONDS));
        if (!remaining.isNegative() && !remaining.isZero()) {
            long wait = remaining.getSeconds() + (remaining.getNano() > 0 ? 1 : 0);
            throw field(HttpStatus.TOO_MANY_REQUESTS, "OTP_RESEND_TOO_SOON", "Vui lòng chờ " + wait + " giây trước khi gửi lại mã OTP.", "email");
        }
        email.requireConfigured();
        String otp = issue(verification);
        email.sendOtp(address, otp); // Failed sending rolls back replacement; the old OTP remains usable.
        return otpView(account, verification);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED, noRollbackFor = OtpRejectedException.class)
    public VerifiedView verifyOtp(RegistrationCommands.VerifyOtp input) {
        if (input.otp() == null || !input.otp().matches("[0-9]{6}")) {
            throw field(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã OTP gồm 6 chữ số.", "otp");
        }
        UserAccount account = lockAccount(normalizeEmail(input.email()));
        RegistrationVerification verification = verifications.lockByAccountId(account.getId()).orElseThrow(PatientRegistrationService::notPending);
        boolean valid = encoder.matches(input.otp(), verification.getOtpHash());
        if (verification.getVerifiedAt() != null) {
            // Retried successful submission is idempotent only for the same OTP before its original expiry.
            if (account.getStatus() == ActiveStatus.ACTIVE && account.getRole().getRoleCode() == Role.RoleCode.PATIENT
                    && valid && verification.getExpiresAt().isAfter(now())) return verifiedView(account);
            throw notPending();
        }
        requirePending(account, verification);
        if (verification.getFailedAttempts() >= MAX_ATTEMPTS) throw attemptsExceeded();
        if (!verification.getExpiresAt().isAfter(now())) {
            throw field(HttpStatus.BAD_REQUEST, "OTP_EXPIRED", "Mã OTP đã hết hạn. Vui lòng gửi lại mã.", "otp");
        }
        if (!valid) {
            verification.setFailedAttempts(verification.getFailedAttempts() + 1);
            // These errors deliberately commit the counter; ordinary errors and SMTP failures still roll back.
            if (verification.getFailedAttempts() >= MAX_ATTEMPTS) throw attemptsExceeded();
            throw new OtpRejectedException(HttpStatus.BAD_REQUEST, "INVALID_OTP", "Mã OTP không đúng. Vui lòng kiểm tra lại.");
        }
        account.setStatus(ActiveStatus.ACTIVE);
        verification.setVerifiedAt(now());
        return verifiedView(account);
    }

    @Transactional(readOnly = true)
    public boolean usernameAvailable(String username) {
        if (username == null || !username.matches("[A-Za-z0-9._-]{3,60}")) {
            throw field(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Tên đăng nhập gồm 3–60 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.", "username");
        }
        return accounts.findByUsername(username).isEmpty();
    }

    private UserAccount lockAccount(String address) {
        // Lock before loading the entity: a preceding unlocked lookup would leave stale managed account status
        // after another verification transaction commits while this request waits for the lock.
        return accounts.lockByLoginEmail(address).orElseThrow(PatientRegistrationService::notPending);
    }

    private static void requirePending(UserAccount account, RegistrationVerification verification) {
        if (account.getRole().getRoleCode() != Role.RoleCode.PATIENT || account.getStatus() != ActiveStatus.INACTIVE
                || verification.getVerifiedAt() != null) throw notPending();
    }

    private String issue(RegistrationVerification verification) {
        String otp = String.format(Locale.ROOT, "%06d", RANDOM.nextInt(1_000_000));
        LocalDateTime now = now();
        verification.setOtpHash(encoder.encode(otp));
        verification.setExpiresAt(now.plusMinutes(OTP_MINUTES));
        verification.setLastSentAt(now);
        verification.setFailedAttempts(0);
        return otp;
    }

    private OtpView otpView(UserAccount account, RegistrationVerification verification) {
        return new OtpView("Mã xác thực đã được gửi. Vui lòng kiểm tra email của bạn.", account.getUsername(), account.getLoginEmail(),
                WorkflowMapper.timestamp(verification.getExpiresAt()), WorkflowMapper.timestamp(verification.getLastSentAt().plusSeconds(RESEND_SECONDS)));
    }
    private static VerifiedView verifiedView(UserAccount account) {
        return new VerifiedView("Email đã được xác thực. Bạn có thể đăng nhập.", account.getUsername(), account.getLoginEmail());
    }
    private LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(), ZoneOffset.UTC); }

    private static String normalizeEmail(String address) {
        if (address == null || address.isBlank() || address.length() > 254 || !address.trim().matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
            throw field(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Email không hợp lệ.", "email");
        }
        return address.trim().toLowerCase(Locale.ROOT);
    }

    private static void validate(RegistrationCommands.Register input) {
        Map<String, String> fields = new LinkedHashMap<>();
        if (input.username() == null || !input.username().matches("[A-Za-z0-9._-]{3,60}")) fields.put("username", "Tên đăng nhập gồm 3–60 ký tự chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        if (input.fullName() == null || input.fullName().isBlank() || input.fullName().length() > 150) fields.put("fullName", "Vui lòng nhập họ tên, tối đa 150 ký tự.");
        if (input.password() == null || input.password().isBlank() || input.password().length() < 8
                || input.password().getBytes(StandardCharsets.UTF_8).length > 72) fields.put("password", "Mật khẩu từ 8 ký tự đến tối đa 72 byte UTF-8.");
        if (input.password() == null || !input.password().equals(input.confirmPassword())) fields.put("confirmPassword", "Mật khẩu xác nhận không khớp.");
        if (!Boolean.TRUE.equals(input.agreeTerms())) fields.put("agreeTerms", "Vui lòng đồng ý với điều khoản sử dụng.");
        if (!fields.isEmpty()) throw new WorkflowException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Vui lòng kiểm tra thông tin đã nhập.", fields, List.of());
        normalizeEmail(input.email());
    }

    private static WorkflowException field(HttpStatus status, String code, String message, String field) {
        return new WorkflowException(status, code, message, Map.of(field, message), List.of());
    }
    private static WorkflowException notPending() {
        return field(HttpStatus.BAD_REQUEST, "REGISTRATION_NOT_PENDING", "Không tìm thấy đăng ký đang chờ xác thực cho email này.", "email");
    }
    private static OtpRejectedException attemptsExceeded() {
        return new OtpRejectedException(HttpStatus.TOO_MANY_REQUESTS, "OTP_ATTEMPTS_EXCEEDED", "Bạn đã nhập sai mã 5 lần. Vui lòng gửi lại mã OTP.");
    }
    private static final class OtpRejectedException extends WorkflowException {
        private OtpRejectedException(HttpStatus status, String code, String message) {
            super(status, code, message, Map.of("otp", message), List.of());
        }
    }
}
