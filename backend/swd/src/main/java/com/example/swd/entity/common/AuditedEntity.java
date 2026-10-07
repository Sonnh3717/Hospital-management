package com.example.swd.entity.common;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import java.time.LocalDateTime;

/** MySQL also supplies the update time through ON UPDATE CURRENT_TIMESTAMP(6). */
@Getter
@MappedSuperclass
public abstract class AuditedEntity extends CreatedEntity {

    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false,
            columnDefinition = "DATETIME(6)")
    private LocalDateTime updatedAt;
}
