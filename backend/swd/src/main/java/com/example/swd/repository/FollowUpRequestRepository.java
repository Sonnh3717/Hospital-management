package com.example.swd.repository;
import com.example.swd.entity.encounter.FollowUpRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
public interface FollowUpRequestRepository extends JpaRepository<FollowUpRequest,Long> {
    List<FollowUpRequest> findByEncounter_IdOrderByIdAsc(Long encounterId);
}
