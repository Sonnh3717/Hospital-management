package com.example.swd.repository;

import com.example.swd.entity.staff.HospitalStaff;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HospitalStaffRepository extends JpaRepository<HospitalStaff, Long> {
    Optional<HospitalStaff> findByUserAccount_Id(Long accountId);
}
