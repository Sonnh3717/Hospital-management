package com.example.swd.repository;
import com.example.swd.entity.medicalservice.MedicalServiceRequest;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface MedicalServiceRequestRepository extends JpaRepository<MedicalServiceRequest,Long> {
    List<MedicalServiceRequest> findByEncounter_IdOrderByRequestedAtAsc(Long encounterId);
    Optional<MedicalServiceRequest> findByRequestCode(String code);
    // Obtain the parent ID without loading a potentially stale request into the persistence context.
    @Query("select r.encounter.id from MedicalServiceRequest r where r.id=:id")
    Optional<Long> findEncounterId(@Param("id") Long id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from MedicalServiceRequest r where r.id=:id")
    Optional<MedicalServiceRequest> lockById(@Param("id") Long id);
    @Query("select r from MedicalServiceRequest r where r.status in ('ORDERED','ACCEPTED','IN_PROGRESS') and (r.responsibleStaff.id=:staffId or exists (select a from StaffMedicalService a where a.staff.id=:staffId and a.medicalService.id=r.medicalService.id and a.active=true))")
    List<MedicalServiceRequest> findQueue(@Param("staffId") Long staffId);
}
