package com.example.swd.entity.patient;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.common.enums.Gender;
import com.example.swd.entity.identity.UserAccount;
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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "patients", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t05_01", columnNames = "user_account_id"),
        @UniqueConstraint(name = "uq_t05_02", columnNames = "patient_code")
})
@Getter
@Setter
@NoArgsConstructor
public class Patient extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "patient_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "user_account_id", nullable = true, unique = true,
            foreignKey = @ForeignKey(name = "fk_t05_01"))
    private UserAccount userAccount;

    @Column(name = "patient_code", nullable = false, length = 30)
    private String patientCode;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", nullable = false,
            columnDefinition = "ENUM('MALE','FEMALE','OTHER','UNSPECIFIED')")
    private Gender gender = Gender.UNSPECIFIED;

    @Column(name = "phone", length = 25)
    private String phone;

    @Column(name = "contact_email", length = 254)
    private String contactEmail;

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "emergency_contact_name", length = 150)
    private String emergencyContactName;

    @Column(name = "emergency_contact_phone", length = 25)
    private String emergencyContactPhone;
}
