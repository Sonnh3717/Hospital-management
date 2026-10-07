package com.example.swd.entity.identity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "roles", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t01_01", columnNames = "role_code")
})
@Getter
@Setter
@NoArgsConstructor
public class Role {

    @Id
    @Column(name = "role_id", nullable = false, columnDefinition = "TINYINT UNSIGNED")
    private Short id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "role_code", nullable = false, length = 32)
    private RoleCode roleCode;

    @Column(name = "role_name", nullable = false, length = 80)
    private String roleName;

    public enum RoleCode {
        ADMIN,
        MANAGER,
        DOCTOR,
        MEDICAL_SERVICE_STAFF,
        RECEPTIONIST,
        PATIENT
    }
}
