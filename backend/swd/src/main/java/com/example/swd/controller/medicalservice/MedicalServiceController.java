package com.example.swd.controller.medicalservice;

import com.example.swd.dto.request.ClinicalCommands.UnableInput;
import com.example.swd.dto.response.ClinicalViews.QueueView;
import com.example.swd.dto.response.ClinicalViews.RequestView;
import com.example.swd.exception.WorkflowException;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.MedicalServiceWorkflowService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.core.io.Resource;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/services")
@PreAuthorize("hasRole('MEDICAL_SERVICE_STAFF')")
public class MedicalServiceController {
    private final MedicalServiceWorkflowService service;
    public MedicalServiceController(MedicalServiceWorkflowService service) {this.service=service;}
    @GetMapping("/queue")
    QueueView queue(@AuthenticationPrincipal StaffPrincipal actor,@RequestParam(required=false) Long serviceId,
        @RequestParam(required=false) String priority,@RequestParam(required=false) String search) {return service.queue(actor,serviceId,priority,search);}
    @GetMapping("/requests/{id}")
    RequestView get(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return service.get(actor,id);}
    @PostMapping("/requests/{id}/accept")
    RequestView accept(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return service.accept(actor,id);}
    @PostMapping("/requests/{id}/start")
    RequestView start(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {return service.start(actor,id);}
    @PostMapping("/requests/{id}/unable")
    RequestView unable(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,@Valid @RequestBody UnableInput input) {return service.unable(actor,id,input);}
    @PostMapping(value="/requests/{id}/complete",consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    RequestView complete(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id,
        @RequestParam(required=false) String resultSummary,@RequestParam(required=false) String resultContent,
        @RequestPart(name="attachment",required=false) List<MultipartFile> attachments) {
        if(attachments!=null && attachments.size()>1) throw new WorkflowException(HttpStatus.BAD_REQUEST,"INVALID_ATTACHMENT",
            "Chỉ được gửi tối đa một tệp báo cáo.",Map.of("attachment","Chỉ được gửi tối đa một tệp báo cáo."),List.of());
        return service.complete(actor,id,resultSummary,resultContent,attachments==null || attachments.isEmpty()?null:attachments.get(0));
    }
    @GetMapping("/requests/{id}/attachment")
    ResponseEntity<Resource> attachment(@AuthenticationPrincipal StaffPrincipal actor,@PathVariable Long id) {
        var file=service.attachment(actor,id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(file.contentType())).contentLength(file.size())
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment().filename(file.filename()).build().toString())
            .header(HttpHeaders.CACHE_CONTROL,"no-store").body(file.resource());
    }
}
