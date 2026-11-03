package com.example.swd.repository;

import com.example.swd.entity.identity.RegistrationVerification;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RegistrationVerificationRepository extends JpaRepository<RegistrationVerification, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select v from RegistrationVerification v where v.id = :id")
    Optional<RegistrationVerification> lockByAccountId(@Param("id") Long id);
}
