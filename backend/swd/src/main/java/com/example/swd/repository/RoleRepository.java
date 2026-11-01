package com.example.swd.repository;

import com.example.swd.entity.identity.Role;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Short> {
    Optional<Role> findByRoleCode(Role.RoleCode roleCode);
}
