package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.config.ClinicalAttachmentStorage;
import com.example.swd.security.StaffPrincipal;
import java.time.LocalDate;
import java.util.List;

public interface DoctorClinicalService {
    PageView<WorklistView> worklist(StaffPrincipal actor, LocalDate date, String status, int page, int size);
    StartView start(StaffPrincipal actor, Long appointmentId);
    EncounterView get(StaffPrincipal actor, Long id);
    List<EncounterView> history(StaffPrincipal actor, Long id);
    List<ServiceView> catalogue(StaffPrincipal actor);
    EncounterView examination(StaffPrincipal actor, Long id, ExaminationInput input);
    EncounterView treatment(StaffPrincipal actor, Long id, TreatmentInput input);
    EncounterView createRequest(StaffPrincipal actor, Long id, RequestInput input);
    EncounterView editRequest(StaffPrincipal actor, Long id, Long requestId, RequestEditInput input);
    EncounterView cancelRequest(StaffPrincipal actor, Long id, Long requestId, ReasonInput input);
    EncounterView review(StaffPrincipal actor, Long id, Long resultId, ReviewInput input);
    EncounterView complete(StaffPrincipal actor, Long id);
    ClinicalAttachmentStorage.Download attachment(StaffPrincipal actor, Long id, Long requestId);
}
