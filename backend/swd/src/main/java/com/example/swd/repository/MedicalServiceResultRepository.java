package com.example.swd.repository;
import com.example.swd.entity.medicalservice.MedicalServiceResult;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MedicalServiceResultRepository extends JpaRepository<MedicalServiceResult,Long> {
    Optional<MedicalServiceResult> findByMedicalServiceRequest_Id(Long requestId);
}
