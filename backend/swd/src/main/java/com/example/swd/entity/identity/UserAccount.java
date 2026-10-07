package com.example.swd.entity.identity;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.common.enums.ActiveStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "user_accounts", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t02_01", columnNames = "username"),
        @UniqueConstraint(name = "uq_t02_02", columnNames = "login_email")
})
@Getter
@Setter
@NoArgsConstructor
public class UserAccount extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_account_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_t02_01"))
    private Role role;

    @Column(name = "username", nullable = false, length = 60)
    private String username;

    @Column(name = "login_email", nullable = false, length = 254)
    private String loginEmail;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, columnDefinition = "ENUM('ACTIVE','INACTIVE')")
    private ActiveStatus status = ActiveStatus.ACTIVE;

    @Column(name = "password_changed_at", columnDefinition = "DATETIME(6)")
    private LocalDateTime passwordChangedAt;
}
