package com.example.swd.service.impl;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.entity.patient.Patient;
import com.example.swd.exception.WorkflowException;
import com.example.swd.config.WorkflowMapper;
import com.example.swd.repository.PatientRepository;
import com.example.swd.repository.UserAccountRepository;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionPatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
            throw new WorkflowException(HttpStatus.BAD_REQUEST, "NO_USER_ACCOUNT", "Bệnh nhân này chưa có tài khoản đăng nhập trực tuyến để kích hoạt/vô hiệu hóa");
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
                acc != null ? acc.getStatus() : null
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
                acc != null ? acc.getStatus() : null,
                WorkflowMapper.timestamp(p.getCreatedAt()),
                WorkflowMapper.timestamp(p.getUpdatedAt())
        );
    }

    private void requireReceptionist(StaffPrincipal actor) {
        if (actor == null || (!"RECEPTIONIST".equalsIgnoreCase(actor.role()) && !"ADMIN".equalsIgnoreCase(actor.role()))) {
            throw new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Chức năng chỉ dành cho nhân viên lễ tân");
        }
    }

    private String normalize(String str) {
        return str == null || str.isBlank() ? null : str.trim();
    }
}
