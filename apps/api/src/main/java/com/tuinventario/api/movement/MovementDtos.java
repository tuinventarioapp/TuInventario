package com.tuinventario.api.movement;

import com.tuinventario.api.domain.enums.MovementType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public final class MovementDtos {

    private MovementDtos() {
    }

    public record CreateMovementRequest(
            @NotNull MovementType movementType,
            @NotBlank String itemId,
            @NotNull BigDecimal quantity,
            String sourceLocationId,
            String targetLocationId,
            @NotBlank String reason,
            String notes
    ) {
    }

    public record MovementResponse(
            String id,
            String movementType,
            String itemId,
            String itemName,
            BigDecimal quantity,
            String sourceLocation,
            String targetLocation,
            String reason,
            String notes,
            String performedBy,
            Instant occurredAt
    ) {
    }
}
