package com.example.swd.repository;
import com.example.swd.entity.encounter.EncounterDiagnosis;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface EncounterDiagnosisRepository extends JpaRepository<EncounterDiagnosis,Long> {
    List<EncounterDiagnosis> findByEncounter_IdOrderByIdAsc(Long encounterId);
}
