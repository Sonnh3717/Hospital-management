package com.example.swd.dto.request;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
public final class ClinicalCommands {
    private ClinicalCommands() {}
    public record DiagnosisInput(Long id,@Size(max=30) String diagnosisCode,
        @NotBlank @Size(max=1000) String diagnosisText,boolean primary) {}
    public record ExaminationInput(@Size(max=10000) String chiefComplaint,
        @Size(max=10000) String symptoms,@Size(max=10000) String clinicalFindings,
        @Size(max=10000) String clinicalNotes,@Size(max=100) List<@NotNull @Valid DiagnosisInput> diagnoses) {}
    public record FollowUpInput(@NotBlank @Size(max=10000) String reason,
        @NotNull LocalDate requestedFromDate,LocalDate requestedToDate,@NotNull String priority) {}
    public record TreatmentInput(@Size(max=10000) String decisionText,
        @Size(max=10000) String instructions,boolean followUpRequired,@Valid FollowUpInput followUp) {}
    public record RequestInput(@NotNull Long medicalServiceId,@NotNull String priority,
        @Size(max=10000) String clinicalIndication,@NotBlank @Size(max=120) String idempotencyKey) {}
    public record RequestEditInput(@NotNull Long medicalServiceId,@NotNull String priority,
        @Size(max=10000) String clinicalIndication) {}
    public record ReasonInput(@Size(max=500) String reason) {}
    public record UnableInput(@NotBlank @Size(max=10000) String reason) {}
    public record ReviewInput(@NotBlank @Size(max=10000) String handlingDecision) {}
}
