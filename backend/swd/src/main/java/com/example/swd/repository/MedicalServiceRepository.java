package com.example.swd.repository;
import com.example.swd.entity.medicalservice.MedicalService;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface MedicalServiceRepository extends JpaRepository<MedicalService,Long> {
    List<MedicalService> findByActiveTrueOrderByServiceNameAsc();
}
