package com.tuinventario.api.catalog;

import com.tuinventario.api.domain.enums.LocationType;
import jakarta.validation.constraints.NotBlank;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CatalogOptionResponse(String id, String name, String extra, String details) {
    }

    public record CreateCategoryRequest(@NotBlank String name, String description) {
    }

    public record UpdateCategoryRequest(@NotBlank String name, String description) {
    }

    public record CreateUnitRequest(@NotBlank String name, @NotBlank String symbol, boolean allowsDecimal) {
    }

    public record UpdateUnitRequest(@NotBlank String name, @NotBlank String symbol, boolean allowsDecimal) {
    }

    public record CreateLocationRequest(@NotBlank String name, LocationType type, String description) {
    }

    public record UpdateLocationRequest(@NotBlank String name, LocationType type, String description) {
    }

    public record BorrowerRequest(@NotBlank String name, String email, String phone, String notes) {
    }

    public record UpdateBorrowerRequest(@NotBlank String name, String email, String phone, String notes) {
    }

    public record BorrowerResponse(String id, String name, String email, String phone, String notes) {
    }
}
