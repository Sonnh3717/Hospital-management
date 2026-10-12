package com.example.swd.repository;
import com.example.swd.entity.medicalservice.StaffMedicalService;
import com.example.swd.entity.medicalservice.StaffMedicalServiceId;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface StaffMedicalServiceRepository extends JpaRepository<StaffMedicalService,StaffMedicalServiceId> {
    List<StaffMedicalService> findByStaff_IdAndActiveTrue(Long staffId);
    boolean existsByStaff_IdAndMedicalService_IdAndActiveTrue(Long staffId,Long serviceId);
}
