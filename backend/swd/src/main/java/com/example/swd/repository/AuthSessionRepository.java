package com.example.swd.repository;

import com.example.swd.entity.identity.AuthSession;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface AuthSessionRepository extends JpaRepository<AuthSession, String> {
    @Query("select s from AuthSession s join fetch s.userAccount u join fetch u.role where s.id = :id")
    Optional<AuthSession> findForAuthentication(String id);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from AuthSession s where s.id = :id")
    Optional<AuthSession> lockById(String id);
}
