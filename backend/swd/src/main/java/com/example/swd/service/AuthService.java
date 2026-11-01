package com.example.swd.service;

import com.example.swd.dto.request.LoginRequest;
import com.example.swd.dto.response.LoginResponse;
import com.example.swd.dto.response.UserInfoResponse;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.identity.AuthSession;
import com.example.swd.entity.identity.UserAccount;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.AuthSessionRepository;
import com.example.swd.repository.HospitalStaffRepository;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountRepository userAccountRepository;
    private final AuthSessionRepository authSessionRepository;
    private final HospitalStaffRepository hospitalStaffRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String login = request.getUsername().trim();
        UserAccount account = userAccountRepository.findForLogin(login)
                .orElseThrow(() -> new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS",
                        "Tên đăng nhập hoặc mật khẩu không chính xác"));

        if (!passwordEncoder.matches(request.getPassword(), account.getPasswordHash())) {
            throw new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_CREDENTIALS",
                    "Tên đăng nhập hoặc mật khẩu không chính xác");
        }

        if (account.getStatus() != ActiveStatus.ACTIVE) {
            throw new WorkflowException(HttpStatus.FORBIDDEN, "AUTH_ACCOUNT_INACTIVE",
                    "Tài khoản của bạn đã bị khóa hoặc chưa được kích hoạt");
        }

        // Tạo phiên làm việc mới
        AuthSession session = new AuthSession();
        session.setId(UUID.randomUUID().toString());
        session.setUserAccount(account);
        session.setExpiresAt(LocalDateTime.now().plusDays(1)); // 24 giờ
        authSessionRepository.save(session);

        UserInfoResponse userInfo = buildUserInfo(account);
        return LoginResponse.builder()
                .token(session.getId())
                .user(userInfo)
                .build();
    }

    @Transactional(readOnly = true)
    public UserInfoResponse getCurrentUser(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            throw new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_MISSING_SESSION",
                    "Chưa cung cấp phiên đăng nhập");
        }
        AuthSession session = authSessionRepository.findForAuthentication(sessionId)
                .orElseThrow(() -> new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_INVALID_SESSION",
                        "Phiên đăng nhập không tồn tại hoặc đã hết hạn"));

        if (session.getRevokedAt() != null || session.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new WorkflowException(HttpStatus.UNAUTHORIZED, "AUTH_EXPIRED_SESSION", "Phiên đăng nhập đã hết hạn");
        }

        return buildUserInfo(session.getUserAccount());
    }

    @Transactional
    public void logout(String sessionId) {
        if (sessionId == null || sessionId.isBlank())
            return;
        Optional<AuthSession> sessionOpt = authSessionRepository.findById(sessionId);
        if (sessionOpt.isPresent()) {
            AuthSession session = sessionOpt.get();
            session.setRevokedAt(LocalDateTime.now());
            session.setRevocationReason(AuthSession.RevocationReason.LOGOUT);
            authSessionRepository.save(session);
        }
    }

    private UserInfoResponse buildUserInfo(UserAccount account) {
        String roleCode = account.getRole().getRoleCode().name();
        Long staffId = null;
        Long patientId = null;
        String fullName = account.getUsername();

        Optional<HospitalStaff> staff = hospitalStaffRepository.findByUserAccount_Id(account.getId());
        if (staff.isPresent()) {
            staffId = staff.get().getId();
            fullName = staff.get().getFullName();
        } else {
            Optional<Patient> patient = patientRepository.findByUserAccount_Id(account.getId());
            if (patient.isPresent()) {
                patientId = patient.get().getId();
                fullName = patient.get().getFullName();
            }
        }

        return UserInfoResponse.builder()
                .id(account.getId())
                .accountId(account.getId())
                .username(account.getUsername())
                .fullName(fullName)
                .role(roleCode)
                .staffId(staffId)
                .patientId(patientId)
                .build();
    }
}
