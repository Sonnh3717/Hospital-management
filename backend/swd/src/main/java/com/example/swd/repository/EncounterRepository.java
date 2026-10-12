package com.example.swd.repository;
import com.example.swd.entity.encounter.Encounter;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
public interface EncounterRepository extends JpaRepository<Encounter,Long> {
    Optional<Encounter> findByAppointment_Id(Long appointmentId);
    boolean existsByAppointment_Id(Long appointmentId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Encounter e where e.id=:id")
    Optional<Encounter> lockById(@Param("id") Long id);
    @Query("select e from Encounter e where e.appointment.patient.id=:patientId order by e.startedAt desc")
    List<Encounter> findHistoryByPatient(@Param("patientId") Long patientId, Pageable pageable);
}
