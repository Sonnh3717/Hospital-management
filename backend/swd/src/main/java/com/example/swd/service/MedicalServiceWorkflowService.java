package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.UnableInput;
import com.example.swd.dto.response.ClinicalViews.QueueView;
import com.example.swd.dto.response.ClinicalViews.RequestView;
import com.example.swd.integration.ClinicalAttachmentStorage;
import com.example.swd.security.StaffPrincipal;
import org.springframework.web.multipart.MultipartFile;

public interface MedicalServiceWorkflowService {
    QueueView queue(StaffPrincipal actor, Long serviceId, String requestedPriority, String search);
    RequestView get(StaffPrincipal actor, Long id);
    RequestView accept(StaffPrincipal actor, Long id);
    RequestView start(StaffPrincipal actor, Long id);
    RequestView unable(StaffPrincipal actor, Long id, UnableInput input);
    RequestView complete(StaffPrincipal actor, Long id, String summary, String content, MultipartFile attachment);
    ClinicalAttachmentStorage.Download attachment(StaffPrincipal actor, Long id);
}
