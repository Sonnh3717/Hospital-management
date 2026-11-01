package com.example.swd.repository;

import com.example.swd.entity.identity.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Short> {
    Optional<Role> findByRoleCode(Role.RoleCode roleCode);
}
