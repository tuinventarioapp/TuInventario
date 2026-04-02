package com.tuinventario.api.shared.security;

import java.util.UUID;

public record CurrentUser(
        UUID userId,
        UUID organizationId,
        String role,
        UUID assignedLocationId,
        String assignedLocationName
) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isManagerOrAdmin() {
        return "ADMIN".equals(role) || "MANAGER".equals(role);
    }

    public boolean isBorrower() {
        return "BORROWER".equals(role);
    }

    public boolean isOperator() {
        return "ADMIN".equals(role) || "MANAGER".equals(role) || "COLLABORATOR".equals(role);
    }

    public boolean isScopedToLocation() {
        return !isAdmin();
    }
}
