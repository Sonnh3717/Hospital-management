package com.example.swd.dto.response;
import com.example.swd.dto.response.WorkflowViews.*;
import java.time.LocalDate;
import java.util.List;
public final class ClinicalViews {
    private ClinicalViews() {}
    public record StartView(Long encounterId) {}
    public record StaffView(Long id,String fullName) {}
    public record ServiceView(Long id,String serviceCode,String serviceName,String resultRequirements) {}
    public record DiagnosisView(Long id,String diagnosisCode,String diagnosisText,boolean primary) {}
    public record TreatmentView(String decisionText,String instructions,boolean followUpRequired) {}
    public record FollowUpView(Long id,String reason,LocalDate requestedFromDate,LocalDate requestedToDate,String priority) {}
    public record ReviewView(Long id,String handlingDecision,String handledAt,DoctorView reviewingDoctor) {}
    public record ResultView(Long id,String resultSummary,String resultContent,String attachmentUrl,
        StaffView recordedBy,String finalizedAt,ReviewView review) {}
    public record RequestView(Long id,String requestCode,Long encounterId,ServiceView service,
        PatientView patient,DoctorView requestingDoctor,String priority,String clinicalIndication,
        String status,StaffView responsibleStaff,String requestedAt,String acceptedAt,String startedAt,
        String completedAt,String unableAt,String unableReason,String cancelledAt,String cancellationReason,
        ResultView result) {}
    public record EncounterView(Long id,Long appointmentId,String appointmentCode,PatientView patient,
        DoctorView doctor,String status,String startedAt,String completedAt,String chiefComplaint,
        String symptoms,String clinicalFindings,String clinicalNotes,List<DiagnosisView> diagnoses,
        TreatmentView treatment,List<FollowUpView> followUps,List<RequestView> requests,List<String> completionBlockers) {}
    public record WorklistView(Long appointmentId,String appointmentCode,PatientView patient,
        DoctorView doctor,SlotView slot,String checkedInAt,Long encounterId,String encounterStatus,
        String processingStatus,int pendingServiceCount,int unhandledResultCount,boolean hasUnableService) {}
    public record QueueView(List<RequestView> awaiting,List<RequestView> accepted,
        List<RequestView> inProgress,List<ServiceView> services) {}
}
