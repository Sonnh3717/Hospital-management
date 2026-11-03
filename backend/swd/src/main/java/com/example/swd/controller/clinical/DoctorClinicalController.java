package com.example.swd.controller.clinical;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.dto.response.ClinicalViews.*;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.DoctorClinicalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/doctor")
@PreAuthorize("hasRole('DOCTOR')")
@RequiredArgsConstructor
public class DoctorClinicalController {

    private final DoctorClinicalService clinicalService;

    @GetMapping("/worklist")
    public PageView<WorklistView> worklist(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return clinicalService.worklist(actor, date, status, page, size);
    }

    @PostMapping("/appointments/{id}/start")
    public StartView start(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return clinicalService.start(actor, id);
    }

    @GetMapping("/encounters/{id}")
    public EncounterView get(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return clinicalService.get(actor, id);
    }

    @GetMapping("/encounters/{id}/history")
    public List<EncounterView> history(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return clinicalService.history(actor, id);
    }

    @GetMapping("/catalogue")
    public List<ServiceView> catalogue(@AuthenticationPrincipal StaffPrincipal actor) {
        return clinicalService.catalogue(actor);
    }

    @PutMapping("/encounters/{id}/examination")
    public EncounterView examination(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody ExaminationInput input) {
        return clinicalService.examination(actor, id, input);
    }

    @PutMapping("/encounters/{id}/treatment")
    public EncounterView treatment(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody TreatmentInput input) {
        return clinicalService.treatment(actor, id, input);
    }

    @PostMapping("/encounters/{id}/requests")
    public EncounterView createRequest(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody RequestInput input) {
        return clinicalService.createRequest(actor, id, input);
    }

    @PutMapping("/encounters/{id}/requests/{requestId}")
    public EncounterView editRequest(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @PathVariable Long requestId,
            @Valid @RequestBody RequestEditInput input) {
        return clinicalService.editRequest(actor, id, requestId, input);
    }

    @PostMapping("/encounters/{id}/requests/{requestId}/cancel")
    public EncounterView cancelRequest(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @PathVariable Long requestId,
            @Valid @RequestBody ReasonInput input) {
        return clinicalService.cancelRequest(actor, id, requestId, input);
    }

    @PostMapping("/encounters/{id}/results/{resultId}/review")
    public EncounterView review(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @PathVariable Long resultId,
            @Valid @RequestBody ReviewInput input) {
        return clinicalService.review(actor, id, resultId, input);
    }

    @PostMapping("/encounters/{id}/complete")
    public EncounterView complete(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return clinicalService.complete(actor, id);
    }

    @GetMapping("/encounters/{id}/requests/{requestId}/attachment")
    public ResponseEntity<Resource> attachment(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @PathVariable Long requestId) {
        var file = clinicalService.attachment(actor, id, requestId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .contentLength(file.size())
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(file.filename()).build().toString())
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(file.resource());
    }
}

