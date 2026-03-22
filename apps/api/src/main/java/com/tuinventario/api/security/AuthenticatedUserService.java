package com.tuinventario.api.security;

import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticatedUserService {

    private final MembershipRepository membershipRepository;

    public CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AppUserDetails principal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "AUTH_REQUIRED", "Autenticacion requerida.");
        }

        var membership = membershipRepository.findByUserIdAndOrganizationId(principal.userId(), principal.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "MEMBERSHIP_NOT_FOUND", "No existe una membresia activa para el usuario."));

        return new CurrentUser(
                principal.userId(),
                principal.organizationId(),
                membership.getRole().getName(),
                membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getId(),
                membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getName()
        );
    }
}
