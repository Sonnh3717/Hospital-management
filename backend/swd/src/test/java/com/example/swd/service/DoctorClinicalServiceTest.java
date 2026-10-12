package com.example.swd.service;

import com.example.swd.dto.request.ClinicalCommands.*;
import com.example.swd.entity.appointment.*;
import com.example.swd.entity.encounter.*;
import com.example.swd.entity.medicalservice.*;
import com.example.swd.entity.scheduling.WorkSchedule;
import com.example.swd.entity.staff.*;
import com.example.swd.exception.WorkflowException;
import com.example.swd.repository.*;
import com.example.swd.security.StaffPrincipal;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class DoctorClinicalServiceTest {
    @Mock AppointmentRepository appointments;
    @Mock DoctorProfileRepository doctors;
    @Mock EncounterRepository encounters;
    @Mock EncounterDiagnosisRepository diagnoses;
    @Mock TreatmentDecisionRepository treatments;
    @Mock FollowUpRequestRepository followUps;
    @Mock MedicalServiceRepository services;
    @Mock MedicalServiceRequestRepository requests;
    @Mock MedicalServiceResultRepository results;
    @Mock ServiceResultReviewRepository reviews;
    @Mock ClinicalMapper mapper;
    @Mock ClinicalAttachmentStorage attachments;
    DoctorClinicalService service;
    StaffPrincipal actor=new StaffPrincipal(10L,20L,"doctor","Bác sĩ","DOCTOR");
    DoctorProfile doctor;
    Encounter encounter;

    @BeforeEach void setup() {
        service=new DoctorClinicalService(appointments,doctors,encounters,diagnoses,treatments,followUps,services,requests,results,reviews,mapper,attachments);
        doctor=new DoctorProfile();doctor.setId(20L);
        encounter=new Encounter();encounter.setId(2L);encounter.setResponsibleDoctor(doctor);
    }
    private void authorized() {
        when(doctors.findById(20L)).thenReturn(Optional.of(doctor));
        when(encounters.lockById(2L)).thenReturn(Optional.of(encounter));
    }
    @Test void repeatedStartReturnsOneAuthorizedEncounter() {
        var appointment=new Appointment();appointment.setId(1L);
        when(doctors.findById(20L)).thenReturn(Optional.of(doctor));
        when(appointments.lockById(1L)).thenReturn(Optional.of(appointment));
        when(encounters.findByAppointment_Id(1L)).thenReturn(Optional.of(encounter));
        assertEquals(2L,service.start(actor,1L).encounterId());
        assertEquals(2L,service.start(actor,1L).encounterId());
        verify(encounters,never()).saveAndFlush(any());
    }
    @Test void startRequiresCurrentDoctorAndCheckIn() {
        var employee=new HospitalStaff();employee.setId(20L);var schedule=new WorkSchedule();schedule.setStaff(employee);
        var slot=new AppointmentSlot();slot.setWorkSchedule(schedule);
        var appointment=new Appointment();appointment.setId(1L);appointment.setAppointmentSlot(slot);
        when(doctors.findById(20L)).thenReturn(Optional.of(doctor));
        when(appointments.lockById(1L)).thenReturn(Optional.of(appointment));
        when(encounters.findByAppointment_Id(1L)).thenReturn(Optional.empty());
        assertEquals("NOT_CHECKED_IN",assertThrows(WorkflowException.class,()->service.start(actor,1L)).getCode());
        appointment.setStatus(Appointment.Status.CHECKED_IN);
        when(encounters.saveAndFlush(any())).thenAnswer(call->{((Encounter)call.getArgument(0)).setId(2L);return call.getArgument(0);});
        assertEquals(2L,service.start(actor,1L).encounterId());
        var captured=ArgumentCaptor.forClass(Encounter.class);verify(encounters).saveAndFlush(captured.capture());
        assertEquals(Encounter.Status.IN_PROGRESS,captured.getValue().getStatus());assertNotNull(captured.getValue().getStartedAt());
    }
    @Test void directDoctorServiceCannotBeCalledByReceptionist() {
        var reception=new StaffPrincipal(1L,3L,"r","r","RECEPTIONIST");
        assertEquals("FORBIDDEN",assertThrows(WorkflowException.class,()->service.start(reception,1L)).getCode());
        verifyNoInteractions(doctors,appointments,encounters);
    }
    @Test void anotherDoctorCannotAccessEncounterByUrl() {
        doctor.setId(30L);
        when(doctors.findById(20L)).thenReturn(Optional.of(new DoctorProfile()));
        when(encounters.findById(2L)).thenReturn(Optional.of(encounter));
        assertEquals("FORBIDDEN",assertThrows(WorkflowException.class,()->service.get(actor,2L)).getCode());
        verifyNoInteractions(mapper);
    }
    @Test void completedEncounterCannotSaveExamination() {
        authorized();encounter.setStatus(Encounter.Status.COMPLETED);
        assertEquals("ENCOUNTER_COMPLETED",assertThrows(WorkflowException.class,()->service.examination(actor,2L,new ExaminationInput("reason","symptoms","findings",null,List.of()))).getCode());
        verifyNoInteractions(diagnoses);verify(encounters,never()).saveAndFlush(any());
    }
    @Test void twoPrimaryDiagnosesAreRejectedBeforeWrites() {
        authorized();
        var input=new ExaminationInput(null,null,null,null,List.of(new DiagnosisInput(null,null,"A",true),new DiagnosisInput(null,null,"B",true)));
        assertThrows(WorkflowException.class,()->service.examination(actor,2L,input));
        verifyNoInteractions(diagnoses);
    }
    @Test void switchingPrimaryClearsAndFlushesBeforeReplacement() {
        authorized();var old=new EncounterDiagnosis();old.setId(4L);old.setPrimary(true);
        when(diagnoses.findByEncounter_IdOrderByIdAsc(2L)).thenReturn(List.of(old));
        service.examination(actor,2L,new ExaminationInput(null,null,null,null,List.of(new DiagnosisInput(4L,null,"Old",false),new DiagnosisInput(null,"J00","New",true))));
        var order=inOrder(diagnoses);
        order.verify(diagnoses).findByEncounter_IdOrderByIdAsc(2L);
        order.verify(diagnoses).saveAllAndFlush(List.of(old));
        order.verify(diagnoses).deleteAll(List.of());order.verify(diagnoses).flush();
        order.verify(diagnoses).save(old);order.verify(diagnoses).save(any(EncounterDiagnosis.class));
        assertFalse(old.getPrimary());
    }
    @Test void diagnosisIdFromDifferentEncounterCannotBeUsed() {
        authorized();when(diagnoses.findByEncounter_IdOrderByIdAsc(2L)).thenReturn(List.of());
        var error=assertThrows(WorkflowException.class,()->service.examination(actor,2L,new ExaminationInput(null,null,null,null,List.of(new DiagnosisInput(999L,null,"A",false)))));
        assertTrue(error.getFieldErrors().containsKey("diagnoses"));verify(diagnoses,never()).save(any());
    }
    @Test void acceptedRequestCannotBeEditedAndLocksParentFirst() {
        authorized();var request=new MedicalServiceRequest();request.setEncounter(encounter);request.setStatus(MedicalServiceRequest.Status.ACCEPTED);
        when(requests.lockById(3L)).thenReturn(Optional.of(request));
        assertEquals("REQUEST_ALREADY_ACCEPTED",assertThrows(WorkflowException.class,()->service.editRequest(actor,2L,3L,new RequestEditInput(1L,"ROUTINE",null))).getCode());
        var order=inOrder(encounters,requests);order.verify(encounters).lockById(2L);order.verify(requests).lockById(3L);
        verify(requests,never()).saveAndFlush(any());
    }
    @Test void idempotencyRequestCodeFitsSchemaAndIsAccountScoped() {
        String code=DoctorClinicalService.idempotencyCode(10L,"one");
        assertEquals(40,code.length());assertEquals(code,DoctorClinicalService.idempotencyCode(10L,"one"));
        assertNotEquals(code,DoctorClinicalService.idempotencyCode(11L,"one"));
        assertThrows(WorkflowException.class,()->DoctorClinicalService.idempotencyCode(10L," "));
    }
    @Test void completionReturnsEveryBlockerAndPreservesOpenState() {
        authorized();when(mapper.blockers(encounter)).thenReturn(List.of("Missing diagnosis","Pending service"));
        var error=assertThrows(WorkflowException.class,()->service.complete(actor,2L));
        assertEquals("COMPLETION_BLOCKED",error.getCode());assertEquals(2,error.getBlockers().size());
        assertEquals(Encounter.Status.IN_PROGRESS,encounter.getStatus());assertNull(encounter.getCompletedAt());
        verify(encounters,never()).saveAndFlush(any());
    }
    @Test void completionPersistsStatusAndTimestampAfterRequirementsPass() {
        authorized();when(mapper.blockers(encounter)).thenReturn(List.of());
        service.complete(actor,2L);assertEquals(Encounter.Status.COMPLETED,encounter.getStatus());assertNotNull(encounter.getCompletedAt());
        service.complete(actor,2L);verify(encounters,times(1)).saveAndFlush(encounter);
    }
    @Test void reviewRequiresCompletedResultAndDoesNotCreateForOpenResult() {
        authorized();var request=new MedicalServiceRequest();request.setId(3L);request.setEncounter(encounter);
        var result=new MedicalServiceResult();result.setId(4L);result.setMedicalServiceRequest(request);
        when(results.findById(4L)).thenReturn(Optional.of(result));when(requests.lockById(3L)).thenReturn(Optional.of(request));
        assertEquals("RESULT_NOT_COMPLETED",assertThrows(WorkflowException.class,()->service.review(actor,2L,4L,new ReviewInput("Decision"))).getCode());
        verify(reviews,never()).saveAndFlush(any());
    }
}
