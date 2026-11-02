package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.UnableInput;
import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.entity.common.enums.ActiveStatus;
import com.example.swd.entity.common.enums.Priority;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.medicalservice.MedicalServiceRequest;
import com.example.swd.entity.medicalservice.MedicalServiceResult;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.web.multipart.MultipartFile;
import static com.example.swd.service.DoctorClinicalService.*;

@Service
@RequiredArgsConstructor
public class MedicalServiceWorkflowService {
    private final MedicalServiceRequestRepository requests;
    private final EncounterRepository encounters;
    private final MedicalServiceResultRepository results;
    private final StaffMedicalServiceRepository assignments;
    private final HospitalStaffRepository staff;
    private final ClinicalMapper mapper;
    private final ClinicalAttachmentStorage attachments;

    @Transactional(readOnly = true)
    public QueueView queue(StaffPrincipal actor, Long serviceId, String requestedPriority, String search) {
        employee(actor);
        Priority filterPriority = requestedPriority == null ? null : priority(requestedPriority);
        String term = search == null ? "" : search.trim().toLowerCase(Locale.ROOT);
        if (term.length() > 150)
            throw invalid("search", "Từ khóa tìm kiếm quá dài.");
        var rows = requests.findQueue(actor.staffId()).stream()
                .filter(r -> serviceId == null || r.getMedicalService().getId().equals(serviceId))
                .filter(r -> filterPriority == null || r.getPriority() == filterPriority)
                .filter(r -> term.isEmpty() || matches(r, term))
                .sorted(Comparator.comparing((MedicalServiceRequest r) -> r.getPriority() == Priority.URGENT ? 0 : 1)
                        .thenComparing(MedicalServiceRequest::getRequestedAt,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(MedicalServiceRequest::getId))
                .toList();
        var awaiting = new ArrayList<RequestView>();
        var accepted = new ArrayList<RequestView>();
        var inProgress = new ArrayList<RequestView>();
        for (var request : rows) {
            switch (request.getStatus()) {
                case ORDERED -> {
                    if (assigned(actor, request))
                        awaiting.add(mapper.request(request));
                }
                case ACCEPTED -> accepted.add(mapper.request(request));
                case IN_PROGRESS -> {
                    if (owner(actor, request))
                        inProgress.add(mapper.request(request));
                }
                default -> {
                }
            }
        }
        var catalogue = new LinkedHashMap<Long, ServiceView>();
        assignments.findByStaff_IdAndActiveTrue(actor.staffId())
                .forEach(a -> catalogue.put(a.getMedicalService().getId(), mapper.service(a.getMedicalService())));
        // Keep filters for owned unfinished work available after an assignment is
        // deactivated.
        rows.stream().filter(r -> owner(actor, r))
                .forEach(r -> catalogue.put(r.getMedicalService().getId(), mapper.service(r.getMedicalService())));
        return new QueueView(awaiting, accepted, inProgress,
                catalogue.values().stream().sorted(Comparator.comparing(ServiceView::serviceName)).toList());
    }

    @Transactional(readOnly = true)
    public RequestView get(StaffPrincipal actor, Long id) {
        employee(actor);
        var request = requests.findById(id).orElseThrow(() -> missing("Chỉ định"));
        readable(actor, request);
        return mapper.request(request);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RequestView accept(StaffPrincipal actor, Long id) {
        var employee = employee(actor);
        var locked = lock(id);
        var request = locked.request();
        readable(actor, request);
        if (owner(actor, request)
                && Set.of(MedicalServiceRequest.Status.ACCEPTED, MedicalServiceRequest.Status.IN_PROGRESS,
                        MedicalServiceRequest.Status.COMPLETED).contains(request.getStatus()))
            return mapper.request(request);
        open(locked.encounter());
        if (request.getStatus() != MedicalServiceRequest.Status.ORDERED)
            throw conflict("REQUEST_ALREADY_ACCEPTED", "Yêu cầu đã được nhân viên khác tiếp nhận hoặc đã kết thúc.");
        if (!assigned(actor, request))
            throw forbidden();
        request.setResponsibleStaff(employee);
        request.setAcceptedAt(now());
        request.setStatus(MedicalServiceRequest.Status.ACCEPTED);
        requests.saveAndFlush(request);
        return mapper.request(request);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RequestView start(StaffPrincipal actor, Long id) {
        employee(actor);
        var locked = lock(id);
        var request = locked.request();
        readable(actor, request);
        responsible(actor, request);
        if (request.getStatus() == MedicalServiceRequest.Status.IN_PROGRESS
                || request.getStatus() == MedicalServiceRequest.Status.COMPLETED)
            return mapper.request(request);
        open(locked.encounter());
        if (request.getStatus() != MedicalServiceRequest.Status.ACCEPTED)
            throw conflict("REQUEST_NOT_ACCEPTED", "Cần tiếp nhận yêu cầu trước khi bắt đầu dịch vụ.");
        request.setStartedAt(now());
        request.setStatus(MedicalServiceRequest.Status.IN_PROGRESS);
        requests.saveAndFlush(request);
        return mapper.request(request);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RequestView unable(StaffPrincipal actor, Long id, UnableInput input) {
        var employee = employee(actor);
        var locked = lock(id);
        var request = locked.request();
        readable(actor, request);
        if (input == null || ClinicalMapper.blank(input.reason()))
            throw invalid("reason", "Cần nhập lý do không thể thực hiện dịch vụ.");
        String reason = input.reason().trim();
        if (reason.length() > 10000)
            throw invalid("reason", "Lý do không được vượt quá 10.000 ký tự.");
        if (request.getStatus() == MedicalServiceRequest.Status.UNABLE_TO_PERFORM) {
            if (request.getUnableRecordedByStaff() != null
                    && request.getUnableRecordedByStaff().getId().equals(actor.staffId())
                    && reason.equals(request.getUnableReason()))
                return mapper.request(request);
            throw conflict("REQUEST_ALREADY_ENDED", "Yêu cầu đã ghi nhận không thể thực hiện.");
        }
        open(locked.encounter());
        if (request.getStatus() == MedicalServiceRequest.Status.ORDERED) {
            if (!assigned(actor, request))
                throw forbidden();
        } else if (request.getStatus() == MedicalServiceRequest.Status.ACCEPTED
                || request.getStatus() == MedicalServiceRequest.Status.IN_PROGRESS)
            responsible(actor, request);
        else
            throw conflict("REQUEST_ALREADY_ENDED", "Yêu cầu đã kết thúc; không thể ghi ngoại lệ.");
        request.setUnableReason(reason);
        request.setUnableAt(now());
        request.setUnableRecordedByStaff(employee);
        request.setStatus(MedicalServiceRequest.Status.UNABLE_TO_PERFORM);
        requests.saveAndFlush(request);
        return mapper.request(request);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public RequestView complete(StaffPrincipal actor, Long id, String summary, String content,
            MultipartFile attachment) {
        var employee = employee(actor);
        var locked = lock(id);
        var request = locked.request();
        readable(actor, request);
        responsible(actor, request);
        if (ClinicalMapper.blank(summary))
            throw invalid("resultSummary", "Cần nhập tóm tắt kết quả.");
        if (ClinicalMapper.blank(content))
            throw invalid("resultContent", "Cần nhập nội dung báo cáo.");
        if (summary.length() > 10000)
            throw invalid("resultSummary", "Tóm tắt không được vượt quá 10.000 ký tự.");
        if (content.length() > 1000000)
            throw invalid("resultContent", "Nội dung báo cáo không được vượt quá 1.000.000 ký tự.");
        if (request.getStatus() == MedicalServiceRequest.Status.COMPLETED) {
            var saved = results.findByMedicalServiceRequest_Id(id)
                    .orElseThrow(() -> conflict("RESULT_MISSING", "Không tìm thấy kết quả đã chốt."));
            // A repeated command may return the finalized result, but cannot change any
            // content/file.
            if (!summary.trim().equals(saved.getResultSummary()) || !content.trim().equals(saved.getResultContent()))
                throw conflict("RESULT_FINALIZED", "Kết quả đã chốt và chỉ được xem.");
            if (attachment != null && !attachment.isEmpty()
                    && !attachments.matches(saved.getAttachmentUrl(), attachment))
                throw conflict("RESULT_FINALIZED", "Tệp kết quả đã chốt; không thể thay thế.");
            return mapper.request(request);
        }
        open(locked.encounter());
        if (request.getStatus() != MedicalServiceRequest.Status.IN_PROGRESS)
            throw conflict("SERVICE_NOT_STARTED", "Cần bắt đầu dịch vụ trước khi hoàn tất kết quả.");
        if (results.findByMedicalServiceRequest_Id(id).isPresent())
            throw conflict("RESULT_FINALIZED", "Yêu cầu đã có kết quả chính thức.");
        var stored = attachments.store(attachment);
        var result = new MedicalServiceResult();
        result.setMedicalServiceRequest(request);
        result.setRecordedByStaff(employee);
        result.setResultSummary(summary.trim());
        result.setResultContent(content.trim());
        result.setAttachmentUrl(stored == null ? null : stored.key());
        results.saveAndFlush(result);
        request.setCompletedAt(now());
        request.setStatus(MedicalServiceRequest.Status.COMPLETED);
        requests.saveAndFlush(request);
        return mapper.request(request);
    }

    @Transactional(readOnly = true)
    public ClinicalAttachmentStorage.Download attachment(StaffPrincipal actor, Long id) {
        employee(actor);
        var request = requests.findById(id).orElseThrow(() -> missing("Chỉ định"));
        readable(actor, request);
        if (request.getStatus() != MedicalServiceRequest.Status.COMPLETED)
            throw conflict("RESULT_NOT_COMPLETED", "Kết quả chưa hoàn tất.");
        var result = results.findByMedicalServiceRequest_Id(id).orElseThrow(() -> missing("Kết quả"));
        return attachments.download(result.getAttachmentUrl());
    }

    private record LockedRequest(Encounter encounter, MedicalServiceRequest request) {
    }

    private LockedRequest lock(Long id) {
        Long parentId = requests.findEncounterId(id).orElseThrow(() -> missing("Chỉ định"));
        var encounter = encounters.lockById(parentId).orElseThrow(() -> missing("Lượt khám"));
        var request = requests.lockById(id).orElseThrow(() -> missing("Chỉ định"));
        if (!request.getEncounter().getId().equals(parentId))
            throw conflict("REQUEST_CHANGED", "Chỉ định đã thay đổi; hãy tải lại.");
        return new LockedRequest(encounter, request);
    }

    private HospitalStaff employee(StaffPrincipal actor) {
        if (actor == null || !"MEDICAL_SERVICE_STAFF".equals(actor.role()))
            throw forbidden();
        var employee = staff.findById(actor.staffId()).orElseThrow(DoctorClinicalService::forbidden);
        if (employee.getEmploymentStatus() != ActiveStatus.ACTIVE)
            throw forbidden();
        return employee;
    }

    private boolean assigned(StaffPrincipal actor, MedicalServiceRequest request) {
        return assignments.existsByStaff_IdAndMedicalService_IdAndActiveTrue(actor.staffId(),
                request.getMedicalService().getId());
    }

    private static boolean owner(StaffPrincipal actor, MedicalServiceRequest request) {
        return request.getResponsibleStaff() != null && actor.staffId().equals(request.getResponsibleStaff().getId());
    }

    private void readable(StaffPrincipal actor, MedicalServiceRequest request) {
        if (!owner(actor, request) && !assigned(actor, request))
            throw forbidden();
    }

    private static void responsible(StaffPrincipal actor, MedicalServiceRequest request) {
        if (!owner(actor, request))
            throw conflict("REQUEST_OWNED_BY_OTHER", "Chỉ nhân viên phụ trách mới được xử lý yêu cầu này.");
    }

    private static void open(Encounter encounter) {
        if (encounter.getStatus() != Encounter.Status.IN_PROGRESS)
            throw conflict("ENCOUNTER_COMPLETED", "Lượt khám đã hoàn tất và chỉ được xem.");
    }

    private static boolean matches(MedicalServiceRequest request, String term) {
        var patient = request.getEncounter().getAppointment().getPatient();
        return contains(request.getRequestCode(), term) || contains(patient.getPatientCode(), term)
                || contains(patient.getFullName(), term);
    }

    private static boolean contains(String value, String term) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(term);
    }
}
