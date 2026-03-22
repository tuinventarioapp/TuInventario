package com.tuinventario.api.shared.security;

import java.util.UUID;

public record CurrentUser(
        UUID userId,
        UUID organizationId,
        String role
) {

    public boolean isAdmin() {
        return "ADMIN".equals(role);
    }

    public boolean isManagerOrAdmin() {
        return "ADMIN".equals(role) || "MANAGER".equals(role);
    }
}
