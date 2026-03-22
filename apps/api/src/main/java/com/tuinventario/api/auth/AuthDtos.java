package com.tuinventario.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @Size(min = 8) String password,
            @NotBlank String organizationName,
            @NotBlank String timezone
    ) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record RefreshTokenRequest(@NotBlank String refreshToken) {
    }

    public record AuthUserResponse(
            String id,
            String fullName,
            String email,
            String role,
            String organizationId,
            String organizationName
    ) {
    }

    public record AuthResponse(
            String accessToken,
            String refreshToken,
            AuthUserResponse user
    ) {
    }
}
