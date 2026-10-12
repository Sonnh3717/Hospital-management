package com.example.swd.repository;
import com.example.swd.entity.encounter.TreatmentDecision;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface TreatmentDecisionRepository extends JpaRepository<TreatmentDecision,Long> {
    Optional<TreatmentDecision> findByEncounter_Id(Long encounterId);
}
