package com.tuinventario.api.loan;

import com.tuinventario.api.domain.enums.ReturnCondition;
import jakarta.validation.Valid;
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

    public record BorrowerLoanCartItemPayload(
            @NotBlank String itemId,
            @NotNull BigDecimal quantity
    ) {
    }

    public record BorrowerLoanCartPayload(
            @NotNull @Future Instant dueAt,
            String notes,
            @NotNull java.util.List<@Valid BorrowerLoanCartItemPayload> items
    ) {
    }

    public record BorrowerLoanReviewItemPayload(
            @NotBlank String loanRequestId,
            @NotBlank String decision,
            BigDecimal approvedQuantity,
            String rejectionReason
    ) {
    }

    public record BorrowerLoanReviewPayload(
            String notes,
            @NotNull java.util.List<@Valid BorrowerLoanReviewItemPayload> items
    ) {
    }

    public record BorrowerLoanReturnItemPayload(
            @NotBlank String loanId,
            @NotNull BigDecimal returnedQuantity,
            String notes
    ) {
    }

    public record BorrowerLoanReturnPayload(
            @NotNull java.util.List<@Valid BorrowerLoanReturnItemPayload> items
    ) {
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
            BigDecimal returnedQuantity,
            String notes
    ) {
    }

    public record LoanRequestResponse(
            String id,
            String borrowerName,
            String itemName,
            String categoryId,
            String categoryName,
            String unitSymbol,
            String locationId,
            String locationName,
            BigDecimal quantity,
            String status,
            Instant requestedAt,
            Instant dueAt,
            String notes
    ) {
    }

    public record BorrowerLoanGroupItemResponse(
            String loanRequestId,
            String loanId,
            String itemId,
            String itemName,
            String categoryName,
            String unitSymbol,
            BigDecimal requestedQuantity,
            BigDecimal approvedQuantity,
            BigDecimal returnedQuantity,
            BigDecimal outstandingQuantity,
            String status,
            String rejectionReason
    ) {
    }

    public record BorrowerLoanGroupResponse(
            String id,
            String borrowerName,
            String locationId,
            String locationName,
            String status,
            Instant requestedAt,
            Instant approvedAt,
            Instant dueAt,
            Instant loanedAt,
            Instant returnedAt,
            String notes,
            boolean dueSoon,
            java.util.List<BorrowerLoanGroupItemResponse> items
    ) {
    }

    public record LoanResponse(
            String id,
            String borrowerName,
            String itemName,
            String categoryId,
            String categoryName,
            String unitSymbol,
            String locationId,
            String locationName,
            BigDecimal quantity,
            BigDecimal returnedQuantity,
            BigDecimal outstandingQuantity,
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
