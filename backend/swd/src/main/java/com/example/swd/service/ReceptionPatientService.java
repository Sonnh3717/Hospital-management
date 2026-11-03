package com.example.swd.service;

import com.example.swd.dto.request.ReceptionPatientRequests.CreatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdatePatientRequest;
import com.example.swd.dto.request.ReceptionPatientRequests.UpdateStatusRequest;
import com.example.swd.dto.response.ReceptionPatientViews.PatientDetailView;
import com.example.swd.dto.response.ReceptionPatientViews.PatientListItemView;
import com.example.swd.dto.response.WorkflowViews.PageView;
import com.example.swd.security.StaffPrincipal;

public interface ReceptionPatientService {
    PageView<PatientListItemView> list(StaffPrincipal actor, String search, int page, int size);
    PatientDetailView detail(StaffPrincipal actor, Long id);
    PatientDetailView create(StaffPrincipal actor, CreatePatientRequest request);
    PatientDetailView update(StaffPrincipal actor, Long id, UpdatePatientRequest request);
    PatientDetailView updateStatus(StaffPrincipal actor, Long id, UpdateStatusRequest request);
}
