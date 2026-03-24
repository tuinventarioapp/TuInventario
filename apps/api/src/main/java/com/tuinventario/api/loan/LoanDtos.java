package com.tuinventario.api.loan;

import com.tuinventario.api.domain.enums.ReturnCondition;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public final class LoanDtos {

    private LoanDtos() {
    }

    public record LoanRequestPayload(
            @NotBlank String borrowerId,
            @NotBlank String itemId,
            @NotNull BigDecimal quantity,
            @NotNull @Future Instant dueAt,
            String notes
    ) {
    }

    public record PublicLoanRequestPayload(
            @NotBlank String borrowerName,
            String borrowerEmail,
            String borrowerPhone,
            @NotBlank String itemId,
            @NotNull BigDecimal quantity,
            @NotNull @Future Instant dueAt,
            String notes
    ) {
    }

    public record LoanActionPayload(String notes) {
    }

    public record UpdateLoanPayload(
            @NotNull Instant dueAt,
            Instant loanedAt,
            Instant returnedAt,
            String notes,
            String returnNotes
    ) {
    }

    public record ReturnLoanPayload(
            @NotNull BigDecimal returnedGoodQuantity,
            @NotNull BigDecimal returnedDamagedQuantity,
            @NotNull BigDecimal lostQuantity,
            String notes
    ) {
    }

    public record LoanRequestResponse(
            String id,
            String borrowerName,
            String itemName,
            String locationId,
            String locationName,
            BigDecimal quantity,
            String status,
            Instant requestedAt,
            Instant dueAt,
            String notes
    ) {
    }

    public record LoanResponse(
            String id,
            String borrowerName,
            String itemName,
            String locationId,
            String locationName,
            BigDecimal quantity,
            BigDecimal returnedQuantity,
            BigDecimal outstandingQuantity,
            BigDecimal returnedGoodQuantity,
            BigDecimal returnedDamagedQuantity,
            BigDecimal lostQuantity,
            String returnCondition,
            String status,
            Instant requestedAt,
            Instant approvedAt,
            Instant dueAt,
            Instant loanedAt,
            Instant returnedAt,
            String notes,
            String returnNotes,
            String approvedBy,
            String deliveredBy
    ) {
    }
}
