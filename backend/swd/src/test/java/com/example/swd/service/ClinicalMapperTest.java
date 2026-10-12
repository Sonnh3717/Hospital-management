package com.example.swd.service;

import com.example.swd.entity.encounter.*;
import com.example.swd.entity.medicalservice.*;
import com.example.swd.repository.*;
import java.util.*;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClinicalMapperTest {
    @Mock EncounterRepository encounters;
    @Mock EncounterDiagnosisRepository diagnoses;
    @Mock TreatmentDecisionRepository treatments;
    @Mock FollowUpRequestRepository followUps;
    @Mock MedicalServiceRequestRepository requests;
    @Mock MedicalServiceResultRepository results;
    @Mock ServiceResultReviewRepository reviews;
    @Mock DoctorProfileRepository doctors;
    @Mock AppointmentRepository appointments;
    ClinicalMapper mapper;
    Encounter encounter;
    @BeforeEach void setup() {
        mapper=new ClinicalMapper(encounters,diagnoses,treatments,followUps,requests,results,reviews,doctors,appointments);
        encounter=new Encounter();encounter.setId(1L);
    }
    @Test void requiredExamFieldsDiagnosisAndTreatmentProduceSeparateBlockers() {
        var blockers=mapper.blockers(encounter);assertEquals(5,blockers.size());
    }
    @Test void requiredFollowUpAndPendingAndUnreviewedResultsAllBlockCompletion() {
        encounter.setChiefComplaint("Reason");encounter.setSymptoms("Symptoms");encounter.setClinicalFindings("Findings");
        when(diagnoses.findByEncounter_IdOrderByIdAsc(1L)).thenReturn(List.of(new EncounterDiagnosis()));
        var treatment=new TreatmentDecision();treatment.setDecisionText("Treatment");treatment.setFollowUpRequired(true);
        when(treatments.findByEncounter_Id(1L)).thenReturn(Optional.of(treatment));
        var pending=new MedicalServiceRequest();pending.setId(2L);pending.setRequestCode("Pending");
        var completed=new MedicalServiceRequest();completed.setId(3L);completed.setRequestCode("Done");completed.setStatus(MedicalServiceRequest.Status.COMPLETED);
        var unable=new MedicalServiceRequest();unable.setId(4L);unable.setStatus(MedicalServiceRequest.Status.UNABLE_TO_PERFORM);
        when(requests.findByEncounter_IdOrderByRequestedAtAsc(1L)).thenReturn(List.of(pending,completed,unable));
        assertEquals(3,mapper.blockers(encounter).size());
        // The unable exception requires clinical evaluation but never creates a fabricated completed result.
        verify(results,never()).findByMedicalServiceRequest_Id(4L);
    }
}
