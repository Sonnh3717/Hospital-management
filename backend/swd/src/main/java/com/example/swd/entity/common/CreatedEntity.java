package com.example.swd.entity.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.LocalDateTime;

/** Creation time supplied by MySQL CURRENT_TIMESTAMP(6), stored in UTC. */
@Getter
@MappedSuperclass
public abstract class CreatedEntity {

    @Generated(event = EventType.INSERT)
    @Column(name = "created_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    private LocalDateTime createdAt;
}
