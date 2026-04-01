package com.tuinventario.api.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public final class AuthDtos {

    private AuthDtos() {
    }

    public record RegisterRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @Size(min = 8) String password,
            @NotBlank String organizationName
    ) {
    }

    public record RegistrationPendingResponse(
            String email,
            String organizationName,
            Instant expiresAt,
            Instant canResendAt,
            String message
    ) {
    }

    public record VerifyEmailRequest(
            @Email @NotBlank String email,
            @Pattern(regexp = "\\d{6}", message = "El codigo debe tener 6 digitos.") String code
    ) {
    }

    public record ResendVerificationRequest(@Email @NotBlank String email) {
    }

    public record LoginRequest(
            @Email @NotBlank String email,
            @NotBlank String password
    ) {
    }

    public record RefreshTokenRequest(@NotBlank String refreshToken) {
    }

    public record ForgotPasswordRequest(@Email @NotBlank String email) {
    }

    public record ResetPasswordRequest(
            @Email @NotBlank String email,
            @Pattern(regexp = "\\d{6}", message = "El codigo debe tener 6 digitos.") String code,
            @Size(min = 8) String newPassword
    ) {
    }

    public record ActionMessageResponse(String message) {
    }

    public record AuthUserResponse(
            String id,
            String fullName,
            String email,
            String role,
            String assignedLocationId,
            String assignedLocationName,
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
