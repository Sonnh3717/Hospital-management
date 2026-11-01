package com.example.swd.repository;

import com.example.swd.entity.scheduling.ShiftTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ShiftTemplateRepository extends JpaRepository<ShiftTemplate, Long> {
    Optional<ShiftTemplate> findByShiftCode(String shiftCode);
}
