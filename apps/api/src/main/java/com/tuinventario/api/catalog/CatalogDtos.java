package com.tuinventario.api.catalog;

import jakarta.validation.constraints.NotBlank;

public final class CatalogDtos {

    private CatalogDtos() {
    }

    public record CatalogOptionResponse(String id, String name, String extra, String details, String referenceId) {
    }

    public record CreateCategoryRequest(@NotBlank String name, String description) {
    }

    public record UpdateCategoryRequest(@NotBlank String name, String description) {
    }

    public record CreateUnitRequest(@NotBlank String name, @NotBlank String symbol, boolean allowsDecimal) {
    }

    public record UpdateUnitRequest(@NotBlank String name, @NotBlank String symbol, boolean allowsDecimal) {
    }

    public record CreateLocationCategoryRequest(@NotBlank String name, String description) {
    }

    public record UpdateLocationCategoryRequest(@NotBlank String name, String description) {
    }

    public record CreateLocationRequest(@NotBlank String name, @NotBlank String locationCategoryId, String description) {
    }

    public record UpdateLocationRequest(@NotBlank String name, @NotBlank String locationCategoryId, String description) {
    }

    public record BorrowerRequest(@NotBlank String name, String email, String phone, String notes) {
    }

    public record UpdateBorrowerRequest(@NotBlank String name, String email, String phone, String notes) {
    }

    public record BorrowerResponse(String id, String name, String email, String phone, String notes) {
    }
}
