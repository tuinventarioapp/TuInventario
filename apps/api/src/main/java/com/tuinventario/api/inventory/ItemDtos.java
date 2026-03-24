package com.tuinventario.api.inventory;

import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public final class ItemDtos {

    private ItemDtos() {
    }

    public record CreateItemRequest(
            @NotBlank String name,
            @NotBlank String sku,
            String description,
            String imageUrl,
            @NotNull ItemType type,
            String categoryId,
            String unitId,
            String primaryLocationId,
            BigDecimal initialStock,
            BigDecimal minimumStock
    ) {
    }

    public record UpdateItemRequest(
            @NotBlank String name,
            String description,
            String imageUrl,
            @NotNull ItemStatus status,
            String categoryId,
            String unitId,
            String primaryLocationId,
            BigDecimal minimumStock
    ) {
    }

    public record ItemResponse(
            String id,
            String name,
            String sku,
            String description,
            String imageUrl,
            String type,
            String status,
            String categoryId,
            String category,
            String unitId,
            String unit,
            String primaryLocationId,
            String primaryLocation,
            BigDecimal totalStock,
            BigDecimal availableStock,
            BigDecimal reservedStock,
            BigDecimal loanedStock,
            BigDecimal damagedStock,
            BigDecimal minimumStock,
            Instant lastMovementAt
    ) {
    }
}
