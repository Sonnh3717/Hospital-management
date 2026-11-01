package com.example.swd.controller.doctor;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ClinicalAttachmentStorage;
import com.example.swd.service.DoctorClinicalService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/doctor")
@PreAuthorize("hasRole('DOCTOR')")
public class DoctorClinicalController {
    private final DoctorClinicalService doctor;
    public DoctorClinicalController(DoctorClinicalService doctor) {this.doctor=doctor;}
    @GetMapping("/patients")
    PageView<WorklistView> worklist(@AuthenticationPrincipal StaffPrincipal actor,
        @RequestParam(required=false) LocalDate date,@RequestParam(required=false) String status,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return doctor.worklist(actor,date,status,page,size);}
    @PostMapping("/appointments/{id}/start")
    StartView start(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return doctor.start(actor,id);}
    @GetMapping("/encounters/{id}")
    EncounterView get(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return doctor.get(actor,id);}
    @GetMapping("/encounters/{id}/history")
    List<EncounterView> history(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return doctor.history(actor,id);}
    @GetMapping("/services")
    List<ServiceView> services(@AuthenticationPrincipal StaffPrincipal actor) {return doctor.catalogue(actor);}
    @PutMapping("/encounters/{id}/examination")
    EncounterView examination(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@Valid @RequestBody ExaminationInput input) {return doctor.examination(actor,id,input);}
    @PutMapping("/encounters/{id}/treatment")
    EncounterView treatment(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@Valid @RequestBody TreatmentInput input) {return doctor.treatment(actor,id,input);}
    @PostMapping("/encounters/{id}/requests")
    EncounterView request(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@Valid @RequestBody RequestInput input) {return doctor.createRequest(actor,id,input);}
    @PutMapping("/encounters/{id}/requests/{requestId}")
    EncounterView edit(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@PathVariable Long requestId,@Valid @RequestBody RequestEditInput input) {return doctor.editRequest(actor,id,requestId,input);}
    @PostMapping("/encounters/{id}/requests/{requestId}/cancel")
    EncounterView cancel(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@PathVariable Long requestId,@Valid @RequestBody(required=false) ReasonInput input) {return doctor.cancelRequest(actor,id,requestId,input);}
    @PostMapping("/encounters/{id}/results/{resultId}/review")
    EncounterView review(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@PathVariable Long resultId,@Valid @RequestBody ReviewInput input) {return doctor.review(actor,id,resultId,input);}
    @PostMapping("/encounters/{id}/complete")
    EncounterView complete(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return doctor.complete(actor,id);}
    @GetMapping("/encounters/{id}/requests/{requestId}/attachment")
    ResponseEntity<Resource> attachment(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@PathVariable Long requestId) {
        return download(doctor.attachment(actor,id,requestId));
    }
    private static ResponseEntity<Resource> download(ClinicalAttachmentStorage.Download file) {
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType())).contentLength(file.size())
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(file.filename()).build().toString())
            .header(HttpHeaders.CACHE_CONTROL,"no-store").body(file.resource());
    }
}
