package com.example.swd.config;

import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.medicalservice.MedicalService;
import com.example.swd.entity.medicalservice.MedicalServiceRequest;
import com.example.swd.entity.medicalservice.MedicalServiceResult;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.repository.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClinicalMapper {
    private final EncounterRepository encounters;
    private final EncounterDiagnosisRepository diagnoses;
    private final TreatmentDecisionRepository treatments;
    private final FollowUpRequestRepository followUps;
    private final MedicalServiceRequestRepository requests;
    private final MedicalServiceResultRepository results;
    private final ServiceResultReviewRepository reviews;
    private final DoctorProfileRepository doctors;
    private final AppointmentRepository appointments;
    private static final Set<MedicalServiceRequest.Status> ACTIVE=Set.of(
        MedicalServiceRequest.Status.ORDERED,MedicalServiceRequest.Status.ACCEPTED,MedicalServiceRequest.Status.IN_PROGRESS);

    public ServiceView service(MedicalService service) {
        return new ServiceView(service.getId(),service.getServiceCode(),service.getServiceName(),service.getResultRequirements());
    }
    public StaffView staff(HospitalStaff staff) {
        return staff==null?null:new StaffView(staff.getId(),staff.getFullName());
    }
    public RequestView request(MedicalServiceRequest request) {return request(request,null);}
    public RequestView request(MedicalServiceRequest request,Long doctorContext) {
        var result=results.findByMedicalServiceRequest_Id(request.getId()).orElse(null);
        return new RequestView(request.getId(),request.getRequestCode(),request.getEncounter().getId(),service(request.getMedicalService()),
            WorkflowMapper.patient(request.getEncounter().getAppointment().getPatient()),WorkflowMapper.doctor(request.getRequestingDoctor()),
            request.getPriority().name(),request.getClinicalIndication(),request.getStatus().name(),staff(request.getResponsibleStaff()),
            WorkflowMapper.timestamp(request.getRequestedAt()),WorkflowMapper.timestamp(request.getAcceptedAt()),WorkflowMapper.timestamp(request.getStartedAt()),
            WorkflowMapper.timestamp(request.getCompletedAt()),WorkflowMapper.timestamp(request.getUnableAt()),request.getUnableReason(),
            WorkflowMapper.timestamp(request.getCancelledAt()),request.getCancellationReason(),result(result,request,doctorContext));
    }
    private ResultView result(MedicalServiceResult result,MedicalServiceRequest request,Long doctorContext) {
        if(result==null) return null;
        var review=reviews.findByMedicalServiceResult_Id(result.getId()).orElse(null);
        ReviewView reviewView=review==null?null:new ReviewView(review.getId(),review.getHandlingDecision(),
            WorkflowMapper.timestamp(review.getHandledAt()),WorkflowMapper.doctor(review.getReviewingDoctor()));
        String url=result.getAttachmentUrl()==null?null:doctorContext==null?
            "/api/services/requests/"+request.getId()+"/attachment":
            "/api/doctor/encounters/"+doctorContext+"/requests/"+request.getId()+"/attachment";
        return new ResultView(result.getId(),result.getResultSummary(),result.getResultContent(),url,
            staff(result.getRecordedByStaff()),WorkflowMapper.timestamp(result.getFinalizedAt()),reviewView);
    }
    public EncounterView encounter(Encounter encounter) {return encounter(encounter,encounter.getId());}
    public EncounterView encounter(Encounter encounter,Long attachmentContext) {
        var appointment=encounter.getAppointment();
        var treatment=treatments.findByEncounter_Id(encounter.getId()).orElse(null);
        var diagnosisViews=diagnoses.findByEncounter_IdOrderByIdAsc(encounter.getId()).stream().map(d->
            new DiagnosisView(d.getId(),d.getDiagnosisCode(),d.getDiagnosisText(),Boolean.TRUE.equals(d.getPrimary()))).toList();
        var followUpViews=followUps.findByEncounter_IdOrderByIdAsc(encounter.getId()).stream().map(f->
            new FollowUpView(f.getId(),f.getReason(),f.getRequestedFromDate(),f.getRequestedToDate(),f.getPriority().name())).toList();
        var requestViews=requests.findByEncounter_IdOrderByRequestedAtAsc(encounter.getId()).stream().map(r->request(r,attachmentContext)).toList();
        return new EncounterView(encounter.getId(),appointment.getId(),appointment.getAppointmentCode(),WorkflowMapper.patient(appointment.getPatient()),
            WorkflowMapper.doctor(encounter.getResponsibleDoctor()),encounter.getStatus().name(),WorkflowMapper.timestamp(encounter.getStartedAt()),
            WorkflowMapper.timestamp(encounter.getCompletedAt()),encounter.getChiefComplaint(),encounter.getSymptoms(),encounter.getClinicalFindings(),encounter.getClinicalNotes(),
            diagnosisViews,treatment==null?null:new TreatmentView(treatment.getDecisionText(),treatment.getInstructions(),Boolean.TRUE.equals(treatment.getFollowUpRequired())),
            followUpViews,requestViews,encounter.getStatus()==Encounter.Status.COMPLETED?List.of():blockers(encounter));
    }
    public List<String> blockers(Encounter encounter) {
        var missing=new ArrayList<String>();
        if(blank(encounter.getChiefComplaint())) missing.add("Chưa lưu lý do khám.");
        if(blank(encounter.getSymptoms())) missing.add("Chưa lưu triệu chứng.");
        if(blank(encounter.getClinicalFindings())) missing.add("Chưa lưu kết quả khám.");
        if(diagnoses.findByEncounter_IdOrderByIdAsc(encounter.getId()).isEmpty()) missing.add("Chưa lưu chẩn đoán.");
        var treatment=treatments.findByEncounter_Id(encounter.getId()).orElse(null);
        if(treatment==null || blank(treatment.getDecisionText())) missing.add("Chưa lưu quyết định điều trị.");
        if(treatment!=null && Boolean.TRUE.equals(treatment.getFollowUpRequired())
                && followUps.findByEncounter_IdOrderByIdAsc(encounter.getId()).isEmpty()) missing.add("Cần lưu yêu cầu tái khám.");
        for(var request:requests.findByEncounter_IdOrderByRequestedAtAsc(encounter.getId())) {
            if(ACTIVE.contains(request.getStatus())) missing.add("Chỉ định "+request.getRequestCode()+" chưa kết thúc.");
            if(request.getStatus()==MedicalServiceRequest.Status.COMPLETED) {
                var result=results.findByMedicalServiceRequest_Id(request.getId()).orElse(null);
                if(result==null || reviews.findByMedicalServiceResult_Id(result.getId()).isEmpty())
                    missing.add("Kết quả của "+request.getRequestCode()+" chưa được xác nhận xử lý.");
            }
        }
        return missing;
    }
    public WorklistView worklist(Appointment appointment) {
        var encounter=encounters.findByAppointment_Id(appointment.getId()).orElse(null);
        var doctor=encounter==null?doctors.findById(appointment.getAppointmentSlot().getWorkSchedule().getStaff().getId()).orElseThrow():encounter.getResponsibleDoctor();
        int pending=0,unhandled=0;boolean unable=false;
        if(encounter!=null) for(var request:requests.findByEncounter_IdOrderByRequestedAtAsc(encounter.getId())) {
            if(ACTIVE.contains(request.getStatus())) pending++;
            if(request.getStatus()==MedicalServiceRequest.Status.UNABLE_TO_PERFORM) unable=true;
            if(request.getStatus()==MedicalServiceRequest.Status.COMPLETED) {
                var result=results.findByMedicalServiceRequest_Id(request.getId()).orElse(null);
                if(result==null || reviews.findByMedicalServiceResult_Id(result.getId()).isEmpty()) unhandled++;
            }
        }
        var slot=appointment.getAppointmentSlot();
        return new WorklistView(appointment.getId(),appointment.getAppointmentCode(),WorkflowMapper.patient(appointment.getPatient()),WorkflowMapper.doctor(doctor),
            WorkflowMapper.slot(slot,doctor,(int)Math.max(0,slot.getCapacity()-appointments.countActiveBySlotId(slot.getId()))),WorkflowMapper.timestamp(appointment.getCheckedInAt()),
            encounter==null?null:encounter.getId(),encounter==null?null:encounter.getStatus().name(),encounter==null?"WAITING":encounter.getStatus().name(),pending,unhandled,unable);
    }
    public static boolean blank(String value) {return value==null || value.isBlank();}
}
