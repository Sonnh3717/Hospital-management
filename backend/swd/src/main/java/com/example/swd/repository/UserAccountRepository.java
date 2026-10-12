package com.example.swd.repository;

import com.example.swd.entity.identity.UserAccount;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {
    @EntityGraph(attributePaths = "role")
    Optional<UserAccount> findByUsername(String username);
    @EntityGraph(attributePaths = "role")
    Optional<UserAccount> findByLoginEmail(String loginEmail);
    default Optional<UserAccount> findForLogin(String login) {
        // Usernames take precedence if another account happens to use that value as its email.
        return findByUsername(login).or(() -> findByLoginEmail(login));
    }
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from UserAccount u where u.id = :id")
    Optional<UserAccount> lockById(Long id);
}
