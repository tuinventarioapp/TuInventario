package com.tuinventario.api.users;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class UserDtos {

    private UserDtos() {
    }

    public record UserSummaryResponse(
            String id,
            String fullName,
            String email,
            String role,
            String status
    ) {
    }

    public record CreateUserRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @Size(min = 8) String password,
            @NotBlank String role
    ) {
    }

    public record UpdateUserRequest(
            @NotBlank String fullName,
            @Email @NotBlank String email,
            @NotBlank String role,
            @NotBlank String status
    ) {
    }
}
