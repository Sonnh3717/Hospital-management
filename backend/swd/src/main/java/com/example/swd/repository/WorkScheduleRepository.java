package com.example.swd.repository;

import com.example.swd.entity.scheduling.WorkSchedule;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {}
