package com.example.swd.repository;

import com.example.swd.entity.staff.DoctorProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long> {
    Optional<DoctorProfile> findByStaff_UserAccount_Id(Long accountId);
}
