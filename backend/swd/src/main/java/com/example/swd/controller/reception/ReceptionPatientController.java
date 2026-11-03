package com.example.swd.controller.reception;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ApiResponse;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;
import com.example.swd.service.ReceptionPatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reception/patients")
@PreAuthorize("hasRole('RECEPTIONIST')")
@RequiredArgsConstructor
public class ReceptionPatientController {

    private final ReceptionPatientService patientService;

    @GetMapping
    public ApiResponse<PageView<PatientListItemView>> listPatients(
            @AuthenticationPrincipal StaffPrincipal actor,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(patientService.list(actor, search, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<PatientDetailView> getPatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id) {
        return ApiResponse.ok(patientService.detail(actor, id));
    }

    @PostMapping
    public ApiResponse<PatientDetailView> createPatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @Valid @RequestBody CreatePatientRequest request) {
        return ApiResponse.ok("Tạo hồ sơ người bệnh thành công", patientService.create(actor, request));
    }

    @PutMapping("/{id}")
    public ApiResponse<PatientDetailView> updatePatient(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePatientRequest request) {
        return ApiResponse.ok("Cập nhật thông tin người bệnh thành công", patientService.update(actor, id, request));
    }

    @PutMapping("/{id}/status")
    public ApiResponse<PatientDetailView> updateStatus(
            @AuthenticationPrincipal StaffPrincipal actor,
            @PathVariable Long id,
            @Valid @RequestBody UpdateStatusRequest request) {
        return ApiResponse.ok("Cập nhật trạng thái tài khoản thành công", patientService.updateStatus(actor, id, request));
    }
}
