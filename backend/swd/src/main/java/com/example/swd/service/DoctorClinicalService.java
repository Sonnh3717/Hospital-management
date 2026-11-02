package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.common.enums.Priority;
import com.example.swd.entity.encounter.*;
import com.example.swd.entity.medicalservice.*;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.DoctorProfile;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import jakarta.persistence.criteria.Subquery;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

@Service
@RequiredArgsConstructor
public class DoctorClinicalService {
    private final AppointmentRepository appointments;
    private final DoctorProfileRepository doctors;
    private final EncounterRepository encounters;
    private final EncounterDiagnosisRepository diagnoses;
    private final TreatmentDecisionRepository treatments;
    private final FollowUpRequestRepository followUps;
    private final MedicalServiceRepository services;
    private final MedicalServiceRequestRepository requests;
    private final MedicalServiceResultRepository results;
    private final ServiceResultReviewRepository reviews;
    private final ClinicalMapper mapper;
    private final ClinicalAttachmentStorage attachments;
    private static final ZoneId VIETNAM = ZoneId.of("Asia/Ho_Chi_Minh");

    @Transactional(readOnly = true)
    public PageView<WorklistView> worklist(StaffPrincipal actor, LocalDate date, String status, int page, int size) {
        doctor(actor);
        if (page < 0 || size < 1 || size > 100)
            throw invalid("page", "Phân trang không hợp lệ.");
        if (status != null && !Set.of("WAITING", "IN_PROGRESS", "COMPLETED").contains(status))
            throw invalid("status", "Trạng thái xử lý không hợp lệ.");
        LocalDate selected = date == null ? LocalDate.now(VIETNAM) : date;
        LocalDateTime from = LocalDateTime.ofInstant(selected.atStartOfDay(VIETNAM).toInstant(), ZoneOffset.UTC);
        LocalDateTime to = LocalDateTime.ofInstant(selected.plusDays(1).atStartOfDay(VIETNAM).toInstant(),
                ZoneOffset.UTC);
        Specification<Appointment> filter = (root, query, cb) -> {
            Subquery<Long> own = query.subquery(Long.class);
            var encounter = own.from(Encounter.class);
            own.select(encounter.get("id")).where(cb.equal(encounter.get("appointment").get("id"), root.get("id")),
                    cb.equal(encounter.get("responsibleDoctor").get("id"), actor.staffId()));
            Subquery<Long> any = query.subquery(Long.class);
            var existing = any.from(Encounter.class);
            any.select(existing.get("id")).where(cb.equal(existing.get("appointment").get("id"), root.get("id")));
            var waiting = cb.and(cb.equal(root.get("status"), Appointment.Status.CHECKED_IN),
                    cb.equal(root.get("appointmentSlot").get("workSchedule").get("staff").get("id"), actor.staffId()),
                    cb.not(cb.exists(any)));
            var allowed = cb.or(waiting, cb.exists(own));
            var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
            predicates.add(allowed);
            predicates.add(cb.greaterThanOrEqualTo(root.get("appointmentSlot").get("startsAt"), from));
            predicates.add(cb.lessThan(root.get("appointmentSlot").get("startsAt"), to));
            if ("WAITING".equals(status))
                predicates.add(waiting);
            else if (status != null) {
                Subquery<Long> state = query.subquery(Long.class);
                var e = state.from(Encounter.class);
                state.select(e.get("id")).where(cb.equal(e.get("appointment").get("id"), root.get("id")),
                        cb.equal(e.get("responsibleDoctor").get("id"), actor.staffId()),
                        cb.equal(e.get("status"), Encounter.Status.valueOf(status)));
                predicates.add(cb.exists(state));
            }
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        var rows = appointments.findAll(filter,
                PageRequest.of(page, size, Sort.by("appointmentSlot.startsAt").ascending().and(Sort.by("id"))));
        return new PageView<>(rows.getContent().stream().map(mapper::worklist).toList(), rows.getTotalElements(), page,
                size);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public StartView start(StaffPrincipal actor, Long appointmentId) {
        var doctor = doctor(actor);
        var appointment = appointments.lockById(appointmentId).orElseThrow(() -> missing("Lịch hẹn"));
        var existing = encounters.findByAppointment_Id(appointmentId).orElse(null);
        if (existing != null) {
            own(actor, existing);
            return new StartView(existing.getId());
        }
        if (!appointment.getAppointmentSlot().getWorkSchedule().getStaff().getId().equals(actor.staffId()))
            throw forbidden();
        if (appointment.getStatus() != Appointment.Status.CHECKED_IN)
            throw conflict("NOT_CHECKED_IN", "Bệnh nhân chưa được check-in.");
        if (!Boolean.TRUE.equals(doctor.getIsActive()) || appointment.getAppointmentSlot().getWorkSchedule()
                .getStatus() != WorkSchedule.ScheduleStatus.SCHEDULED)
            throw conflict("ASSIGNMENT_UNAVAILABLE", "Phân công khám không còn hiệu lực.");
        var encounter = new Encounter();
        encounter.setAppointment(appointment);
        encounter.setResponsibleDoctor(doctor);
        encounter.setStartedAt(now());
        encounter.setStatus(Encounter.Status.IN_PROGRESS);
        encounters.saveAndFlush(encounter);
        return new StartView(encounter.getId());
    }

    @Transactional(readOnly = true)
    public EncounterView get(StaffPrincipal actor, Long id) {
        return mapper.encounter(authorized(actor, id, false));
    }

    @Transactional(readOnly = true)
    public List<EncounterView> history(StaffPrincipal actor, Long id) {
        var current = authorized(actor, id, false);
        return encounters.findHistoryByPatient(current.getAppointment().getPatient().getId(), PageRequest.of(0, 100))
                .stream()
                .filter(e -> !e.getId().equals(id)).map(e -> mapper.encounter(e, id)).toList();
    }

    @Transactional(readOnly = true)
    public List<ServiceView> catalogue(StaffPrincipal actor) {
        doctor(actor);
        return services.findByActiveTrueOrderByServiceNameAsc().stream().map(mapper::service).toList();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView examination(StaffPrincipal actor, Long id, ExaminationInput input) {
        var encounter = authorized(actor, id, true);
        open(encounter);
        if (input.chiefComplaint() != null)
            encounter.setChiefComplaint(clean(input.chiefComplaint()));
        if (input.symptoms() != null)
            encounter.setSymptoms(clean(input.symptoms()));
        if (input.clinicalFindings() != null)
            encounter.setClinicalFindings(clean(input.clinicalFindings()));
        if (input.clinicalNotes() != null)
            encounter.setClinicalNotes(clean(input.clinicalNotes()));
        if (input.diagnoses() != null)
            saveDiagnoses(actor, encounter, input.diagnoses());
        encounters.saveAndFlush(encounter);
        return mapper.encounter(encounter);
    }

    private void saveDiagnoses(StaffPrincipal actor, Encounter encounter, List<DiagnosisInput> input) {
        if (input.stream().filter(DiagnosisInput::primary).count() > 1)
            throw invalid("diagnoses", "Chỉ được chọn tối đa một chẩn đoán chính.");
        var existing = diagnoses.findByEncounter_IdOrderByIdAsc(encounter.getId());
        var byId = new HashMap<Long, EncounterDiagnosis>();
        existing.forEach(d -> byId.put(d.getId(), d));
        var supplied = new HashSet<Long>();
        for (var row : input) {
            if (ClinicalMapper.blank(row.diagnosisText()))
                throw invalid("diagnoses", "Nội dung chẩn đoán không được để trống.");
            if (row.id() != null && (!byId.containsKey(row.id()) || !supplied.add(row.id())))
                throw invalid("diagnoses", "Chẩn đoán không thuộc lượt khám hoặc bị lặp.");
        }
        existing.forEach(d -> d.setPrimary(false));
        diagnoses.saveAllAndFlush(existing);
        diagnoses.deleteAll(existing.stream().filter(d -> !supplied.contains(d.getId())).toList());
        diagnoses.flush();
        var recordedBy = doctor(actor);
        for (var row : input) {
            var diagnosis = row.id() == null ? new EncounterDiagnosis() : byId.get(row.id());
            diagnosis.setEncounter(encounter);
            diagnosis.setRecordedByDoctor(recordedBy);
            diagnosis.setDiagnosisCode(clean(row.diagnosisCode()));
            diagnosis.setDiagnosisText(row.diagnosisText().trim());
            diagnosis.setPrimary(row.primary());
            diagnoses.save(diagnosis);
        }
        diagnoses.flush();
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView treatment(StaffPrincipal actor, Long id, TreatmentInput input) {
        var encounter = authorized(actor, id, true);
        open(encounter);
        var treatment = treatments.findByEncounter_Id(id).orElseGet(TreatmentDecision::new);
        treatment.setEncounter(encounter);
        treatment.setRecordedByDoctor(doctor(actor));
        treatment.setDecisionText(input.decisionText() == null ? "" : input.decisionText().trim());
        treatment.setInstructions(clean(input.instructions()));
        treatment.setFollowUpRequired(input.followUpRequired());
        if (input.followUp() != null) {
            var value = input.followUp();
            if (ClinicalMapper.blank(value.reason()) || value.requestedFromDate() == null)
                throw invalid("followUp", "Cần lý do và ngày mong muốn tái khám.");
            if (value.requestedToDate() != null && value.requestedToDate().isBefore(value.requestedFromDate()))
                throw invalid("requestedToDate", "Ngày kết thúc không được trước ngày bắt đầu.");
            var followUp = followUps.findByEncounter_IdOrderByIdAsc(id).stream()
                    .filter(f -> f.getScheduledAppointment() == null).findFirst().orElseGet(FollowUpRequest::new);
            followUp.setEncounter(encounter);
            followUp.setRequestedByDoctor(doctor(actor));
            followUp.setReason(value.reason().trim());
            followUp.setRequestedFromDate(value.requestedFromDate());
            followUp.setRequestedToDate(value.requestedToDate());
            followUp.setPriority(priority(value.priority()));
            followUps.save(followUp);
        }
        treatments.saveAndFlush(treatment);
        return mapper.encounter(encounter);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView createRequest(StaffPrincipal actor, Long id, RequestInput input) {
        var encounter = authorized(actor, id, true);
        String code = idempotencyCode(actor.accountId(), input.idempotencyKey());
        var existing = requests.findByRequestCode(code).orElse(null);
        var requestedPriority = priority(input.priority());
        if (existing != null) {
            if (!existing.getEncounter().getId().equals(id)
                    || !existing.getRequestingDoctor().getId().equals(actor.staffId())
                    || !existing.getMedicalService().getId().equals(input.medicalServiceId())
                    || existing.getPriority() != requestedPriority
                    || !Objects.equals(existing.getClinicalIndication(), clean(input.clinicalIndication())))
                throw conflict("IDEMPOTENCY_MISMATCH", "Mã thao tác đã được dùng cho nội dung khác.");
            return mapper.encounter(encounter);
        }
        open(encounter);
        var request = new MedicalServiceRequest();
        request.setRequestCode(code);
        request.setEncounter(encounter);
        request.setRequestingDoctor(doctor(actor));
        request.setMedicalService(activeService(input.medicalServiceId()));
        request.setPriority(requestedPriority);
        request.setClinicalIndication(clean(input.clinicalIndication()));
        request.setStatus(MedicalServiceRequest.Status.ORDERED);
        requests.saveAndFlush(request);
        return mapper.encounter(encounter);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView editRequest(StaffPrincipal actor, Long id, Long requestId, RequestEditInput input) {
        var encounter = authorized(actor, id, true);
        open(encounter);
        var request = request(encounter, requestId);
        ordered(request);
        request.setMedicalService(activeService(input.medicalServiceId()));
        request.setPriority(priority(input.priority()));
        request.setClinicalIndication(clean(input.clinicalIndication()));
        requests.saveAndFlush(request);
        return mapper.encounter(encounter);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView cancelRequest(StaffPrincipal actor, Long id, Long requestId, ReasonInput input) {
        var encounter = authorized(actor, id, true);
        var request = request(encounter, requestId);
        if (request.getStatus() == MedicalServiceRequest.Status.CANCELLED)
            return mapper.encounter(encounter);
        open(encounter);
        ordered(request);
        request.setStatus(MedicalServiceRequest.Status.CANCELLED);
        request.setCancelledAt(now());
        request.setCancellationReason(input == null ? null : clean(input.reason()));
        requests.saveAndFlush(request);
        return mapper.encounter(encounter);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView review(StaffPrincipal actor, Long id, Long resultId, ReviewInput input) {
        var encounter = authorized(actor, id, true);
        if (ClinicalMapper.blank(input.handlingDecision()))
            throw invalid("handlingDecision", "Cần nhập quyết định xử lý kết quả.");
        var result = results.findById(resultId).orElseThrow(() -> missing("Kết quả"));
        if (!result.getMedicalServiceRequest().getEncounter().getId().equals(id))
            throw forbidden();
        var request = request(encounter, result.getMedicalServiceRequest().getId());
        var existing = reviews.findByMedicalServiceResult_Id(resultId).orElse(null);
        if (existing != null) {
            if (!existing.getReviewingDoctor().getId().equals(actor.staffId())
                    || !existing.getHandlingDecision().equals(input.handlingDecision().trim()))
                throw conflict("RESULT_ALREADY_HANDLED", "Kết quả đã được xác nhận xử lý; không sửa trực tiếp.");
            return mapper.encounter(encounter);
        }
        open(encounter);
        if (request.getStatus() != MedicalServiceRequest.Status.COMPLETED)
            throw conflict("RESULT_NOT_COMPLETED", "Kết quả chưa hoàn tất.");
        var review = new ServiceResultReview();
        review.setMedicalServiceResult(result);
        review.setReviewingDoctor(doctor(actor));
        review.setHandlingDecision(input.handlingDecision().trim());
        reviews.saveAndFlush(review);
        return mapper.encounter(encounter);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public EncounterView complete(StaffPrincipal actor, Long id) {
        var encounter = authorized(actor, id, true);
        if (encounter.getStatus() == Encounter.Status.COMPLETED)
            return mapper.encounter(encounter);
        var blockers = mapper.blockers(encounter);
        if (!blockers.isEmpty())
            throw new WorkflowException(HttpStatus.CONFLICT, "COMPLETION_BLOCKED",
                    "Lượt khám còn nội dung cần hoàn thiện.", Map.of(), blockers);
        encounter.setStatus(Encounter.Status.COMPLETED);
        encounter.setCompletedAt(now());
        encounters.saveAndFlush(encounter);
        return mapper.encounter(encounter);
    }

    @Transactional(readOnly = true)
    public ClinicalAttachmentStorage.Download attachment(StaffPrincipal actor, Long id, Long requestId) {
        var encounter = authorized(actor, id, false);
        var request = requests.findById(requestId).orElseThrow(() -> missing("Chỉ định"));
        if (!request.getEncounter().getAppointment().getPatient().getId()
                .equals(encounter.getAppointment().getPatient().getId()))
            throw forbidden();
        var result = results.findByMedicalServiceRequest_Id(requestId).orElseThrow(() -> missing("Kết quả"));
        if (request.getStatus() != MedicalServiceRequest.Status.COMPLETED)
            throw conflict("RESULT_NOT_COMPLETED", "Kết quả chưa hoàn tất.");
        return attachments.download(result.getAttachmentUrl());
    }

    private Encounter authorized(StaffPrincipal actor, Long id, boolean lock) {
        doctor(actor);
        var encounter = (lock ? encounters.lockById(id) : encounters.findById(id))
                .orElseThrow(() -> missing("Lượt khám"));
        own(actor, encounter);
        return encounter;
    }

    private DoctorProfile doctor(StaffPrincipal actor) {
        if (actor == null || !"DOCTOR".equals(actor.role()))
            throw forbidden();
        return doctors.findById(actor.staffId()).orElseThrow(DoctorClinicalService::forbidden);
    }

    private void own(StaffPrincipal actor, Encounter encounter) {
        if (!encounter.getResponsibleDoctor().getId().equals(actor.staffId()))
            throw forbidden();
    }

    private MedicalServiceRequest request(Encounter encounter, Long id) {
        var request = requests.lockById(id).orElseThrow(() -> missing("Chỉ định"));
        if (!request.getEncounter().getId().equals(encounter.getId()))
            throw forbidden();
        return request;
    }

    private MedicalService activeService(Long id) {
        var service = services.findById(id).orElseThrow(() -> missing("Dịch vụ"));
        if (!Boolean.TRUE.equals(service.getActive()))
            throw invalid("medicalServiceId", "Dịch vụ không còn hoạt động.");
        return service;
    }

    private static void open(Encounter encounter) {
        if (encounter.getStatus() != Encounter.Status.IN_PROGRESS)
            throw conflict("ENCOUNTER_COMPLETED", "Lượt khám đã hoàn tất và chỉ được xem.");
    }

    private static void ordered(MedicalServiceRequest request) {
        if (request.getStatus() != MedicalServiceRequest.Status.ORDERED)
            throw conflict("REQUEST_ALREADY_ACCEPTED",
                    "Chỉ định đã được tiếp nhận hoặc kết thúc; hãy tải lại trạng thái.");
    }

    static String idempotencyCode(Long accountId, String key) {
        if (key == null || key.isBlank() || key.length() > 120)
            throw invalid("idempotencyKey", "Mã thao tác không hợp lệ.");
        try {
            var digest = MessageDigest.getInstance("SHA-256")
                    .digest((accountId + ":" + key).getBytes(StandardCharsets.UTF_8));
            return "MSR-" + HexFormat.of().formatHex(digest).substring(0, 36);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException(ex);
        }
    }

    static Priority priority(String value) {
        try {
            return Priority.valueOf(value);
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw invalid("priority", "Mức ưu tiên phải là ROUTINE hoặc URGENT.");
        }
    }

    static LocalDateTime now() {
        return LocalDateTime.now(ZoneOffset.UTC);
    }

    static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    static WorkflowException missing(String name) {
        return new WorkflowException(HttpStatus.NOT_FOUND, "NOT_FOUND", name + " không tồn tại.");
    }

    static WorkflowException forbidden() {
        return new WorkflowException(HttpStatus.FORBIDDEN, "FORBIDDEN", "Bạn không có quyền truy cập dữ liệu này.");
    }

    static WorkflowException conflict(String code, String message) {
        return new WorkflowException(HttpStatus.CONFLICT, code, message);
    }

    static WorkflowException invalid(String field, String message) {
        return new WorkflowException(HttpStatus.BAD_REQUEST, "INVALID_REQUEST", message, Map.of(field, message),
                List.of());
    }
}
