package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.UnableInput;
import com.example.swd.entity.common.enums.Priority;
import com.example.swd.entity.encounter.Encounter;
import com.example.swd.entity.medicalservice.*;
import com.example.swd.entity.patient.Patient;
import com.example.swd.entity.appointment.Appointment;
import com.example.swd.entity.staff.HospitalStaff;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class MedicalServiceWorkflowServiceTest {
    @Mock MedicalServiceRequestRepository requests;
    @Mock EncounterRepository encounters;
    @Mock MedicalServiceResultRepository results;
    @Mock StaffMedicalServiceRepository assignments;
    @Mock HospitalStaffRepository staff;
    @Mock ClinicalMapper mapper;
    @Mock ClinicalAttachmentStorage attachments;
    MedicalServiceWorkflowService service;
    StaffPrincipal actor=new StaffPrincipal(10L,20L,"lab","Dịch vụ","MEDICAL_SERVICE_STAFF");
    HospitalStaff employee;
    Encounter encounter;
    MedicalServiceRequest request;
    @BeforeEach void setup() {
        service=new MedicalServiceWorkflowService(requests,encounters,results,assignments,staff,mapper,attachments);
        employee=new HospitalStaff();employee.setId(20L);
        var medicalService=new MedicalService();medicalService.setId(5L);
        encounter=new Encounter();encounter.setId(2L);
        request=new MedicalServiceRequest();request.setId(3L);request.setEncounter(encounter);request.setMedicalService(medicalService);
    }
    private void actorReady() {when(staff.findById(20L)).thenReturn(Optional.of(employee));}
    private void locked() {
        actorReady();when(requests.findEncounterId(3L)).thenReturn(Optional.of(2L));
        when(encounters.lockById(2L)).thenReturn(Optional.of(encounter));
        when(requests.lockById(3L)).thenReturn(Optional.of(request));
    }
    private void assigned() {when(assignments.existsByStaff_IdAndMedicalService_IdAndActiveTrue(20L,5L)).thenReturn(true);}
    private void ownedInProgress() {request.setResponsibleStaff(employee);request.setStatus(MedicalServiceRequest.Status.IN_PROGRESS);}
    @Test void directServiceCallRequiresMedicalServiceRole() {
        var doctor=new StaffPrincipal(1L,1L,"d","d","DOCTOR");
        assertEquals("FORBIDDEN",assertThrows(WorkflowException.class,()->service.accept(doctor,3L)).getCode());
        verifyNoInteractions(requests,encounters,staff);
    }
    @Test void openingDetailDoesNotAcceptOrWriteResult() {
        actorReady();assigned();when(requests.findById(3L)).thenReturn(Optional.of(request));
        service.get(actor,3L);assertEquals(MedicalServiceRequest.Status.ORDERED,request.getStatus());
        assertNull(request.getResponsibleStaff());verify(requests,never()).saveAndFlush(any());verifyNoInteractions(results);
    }
    @Test void unassignedStaffCannotReadByEditedUrl() {
        actorReady();when(requests.findById(3L)).thenReturn(Optional.of(request));
        assertEquals(HttpStatus.FORBIDDEN,assertThrows(WorkflowException.class,()->service.get(actor,3L)).getStatus());
        verifyNoInteractions(mapper);
    }
    @Test void acceptPersistsCurrentActorAndLocksEncounterBeforeRequest() {
        locked();assigned();service.accept(actor,3L);
        assertSame(employee,request.getResponsibleStaff());assertNotNull(request.getAcceptedAt());assertEquals(MedicalServiceRequest.Status.ACCEPTED,request.getStatus());
        var order=inOrder(requests,encounters);order.verify(requests).findEncounterId(3L);order.verify(encounters).lockById(2L);order.verify(requests).lockById(3L);
        verify(requests).saveAndFlush(request);
    }
    @Test void secondStaffCannotAcceptAlreadyOwnedWork() {
        locked();assigned();var other=new HospitalStaff();other.setId(30L);request.setResponsibleStaff(other);request.setStatus(MedicalServiceRequest.Status.ACCEPTED);
        assertEquals("REQUEST_ALREADY_ACCEPTED",assertThrows(WorkflowException.class,()->service.accept(actor,3L)).getCode());
        assertSame(other,request.getResponsibleStaff());verify(requests,never()).saveAndFlush(any());
    }
    @Test void duplicateAcceptDoesNotReplaceOwnershipOrTimestamp() {
        locked();assigned();service.accept(actor,3L);var at=request.getAcceptedAt();service.accept(actor,3L);
        assertEquals(at,request.getAcceptedAt());verify(requests,times(1)).saveAndFlush(request);
    }
    @Test void ownerCanStartAfterAssignmentDeactivation() {
        locked();request.setResponsibleStaff(employee);request.setStatus(MedicalServiceRequest.Status.ACCEPTED);
        service.start(actor,3L);assertEquals(MedicalServiceRequest.Status.IN_PROGRESS,request.getStatus());assertNotNull(request.getStartedAt());
        verifyNoInteractions(assignments);
    }
    @Test void anotherAssignedStaffCanReadButCannotFinishOwnedWork() {
        locked();assigned();var other=new HospitalStaff();other.setId(30L);request.setResponsibleStaff(other);request.setStatus(MedicalServiceRequest.Status.IN_PROGRESS);
        assertEquals("REQUEST_OWNED_BY_OTHER",assertThrows(WorkflowException.class,()->service.complete(actor,3L,"Summary","Report",null)).getCode());
        verifyNoInteractions(results,attachments);
    }
    @Test void unableRequiresReasonAndNeverCreatesFakeResult() {
        locked();assigned();
        assertThrows(WorkflowException.class,()->service.unable(actor,3L,new UnableInput(" ")));
        service.unable(actor,3L,new UnableInput("Máy xét nghiệm hỏng"));
        assertEquals(MedicalServiceRequest.Status.UNABLE_TO_PERFORM,request.getStatus());assertEquals("Máy xét nghiệm hỏng",request.getUnableReason());
        assertSame(employee,request.getUnableRecordedByStaff());assertNull(request.getCompletedAt());verifyNoInteractions(results,attachments);
    }
    @Test void officialResultAndCompletionAreWrittenInSameServiceCommand() {
        locked();ownedInProgress();
        service.complete(actor,3L,"Summary","Report",null);
        var captured=ArgumentCaptor.forClass(MedicalServiceResult.class);verify(results).saveAndFlush(captured.capture());
        assertSame(request,captured.getValue().getMedicalServiceRequest());assertSame(employee,captured.getValue().getRecordedByStaff());
        assertEquals("Summary",captured.getValue().getResultSummary());assertEquals(MedicalServiceRequest.Status.COMPLETED,request.getStatus());assertNotNull(request.getCompletedAt());
        verify(requests).saveAndFlush(request);verifyNoInteractions(assignments);
    }
    @Test void invalidAttachmentLeavesRequestUnfinishedAndNoResult() {
        locked();ownedInProgress();var file=new MockMultipartFile("attachment","bad.exe","application/pdf",new byte[]{1,2});
        when(attachments.store(file)).thenThrow(new WorkflowException(HttpStatus.BAD_REQUEST,"INVALID_ATTACHMENT","Invalid file"));
        assertThrows(WorkflowException.class,()->service.complete(actor,3L,"Summary","Report",file));
        assertEquals(MedicalServiceRequest.Status.IN_PROGRESS,request.getStatus());assertNull(request.getCompletedAt());
        verify(results,never()).saveAndFlush(any());verify(requests,never()).saveAndFlush(any());
    }
    @Test void finalizedResultCannotBeOverwrittenByRetry() {
        locked();request.setResponsibleStaff(employee);request.setStatus(MedicalServiceRequest.Status.COMPLETED);
        var saved=new MedicalServiceResult();saved.setResultSummary("Original");saved.setResultContent("Original report");
        when(results.findByMedicalServiceRequest_Id(3L)).thenReturn(Optional.of(saved));
        assertEquals("RESULT_FINALIZED",assertThrows(WorkflowException.class,()->service.complete(actor,3L,"Changed","Original report",null)).getCode());
        service.complete(actor,3L,"Original","Original report",null);
        verify(results,never()).saveAndFlush(any());verifyNoInteractions(attachments);
    }
    @Test void queuePrioritizesUrgentAndShowsOnlyOwnInProgress() {
        actorReady();assigned();request.setPriority(Priority.ROUTINE);
        var urgent=new MedicalServiceRequest();urgent.setId(4L);urgent.setMedicalService(request.getMedicalService());urgent.setPriority(Priority.URGENT);
        var own=new MedicalServiceRequest();own.setId(6L);own.setMedicalService(request.getMedicalService());own.setResponsibleStaff(employee);own.setStatus(MedicalServiceRequest.Status.IN_PROGRESS);
        var other=new HospitalStaff();other.setId(30L);var otherRequest=new MedicalServiceRequest();otherRequest.setId(7L);otherRequest.setMedicalService(request.getMedicalService());otherRequest.setResponsibleStaff(other);otherRequest.setStatus(MedicalServiceRequest.Status.IN_PROGRESS);
        when(requests.findQueue(20L)).thenReturn(List.of(request,otherRequest,own,urgent));
        var serviceView=new com.example.swd.dto.response.ClinicalViews.ServiceView(5L,"S","Xét nghiệm",null);
        when(mapper.service(any())).thenReturn(serviceView);
        service.queue(actor,null,null,null);
        var order=inOrder(mapper);order.verify(mapper).request(urgent);order.verify(mapper).request(request);order.verify(mapper).request(own);
        verify(mapper,never()).request(otherRequest);
    }
}
