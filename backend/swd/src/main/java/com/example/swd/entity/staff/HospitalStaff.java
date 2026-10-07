package com.example.swd.entity.staff;

import com.example.swd.entity.common.AuditedEntity;
import com.example.swd.entity.common.enums.ActiveStatus;
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
@Table(name = "hospital_staff", uniqueConstraints = {
        @UniqueConstraint(name = "uq_t03_01", columnNames = "user_account_id"),
        @UniqueConstraint(name = "uq_t03_02", columnNames = "staff_code")
})
@Getter
@Setter
@NoArgsConstructor
public class HospitalStaff extends AuditedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "staff_id", nullable = false, columnDefinition = "BIGINT UNSIGNED")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_account_id", nullable = false, unique = true,
            foreignKey = @ForeignKey(name = "fk_t03_01"))
    private UserAccount userAccount;

    @Column(name = "staff_code", nullable = false, length = 30)
    private String staffCode;

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

    @Column(name = "address", length = 500)
    private String address;

    @Column(name = "hire_date")
    private LocalDate hireDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "employment_status", nullable = false,
            columnDefinition = "ENUM('ACTIVE','INACTIVE')")
    private ActiveStatus employmentStatus = ActiveStatus.ACTIVE;
}
