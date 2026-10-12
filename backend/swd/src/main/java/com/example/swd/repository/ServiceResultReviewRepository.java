package com.example.swd.repository;
import com.example.swd.entity.medicalservice.ServiceResultReview;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
public interface ServiceResultReviewRepository extends JpaRepository<ServiceResultReview,Long> {
    Optional<ServiceResultReview> findByMedicalServiceResult_Id(Long resultId);
}
