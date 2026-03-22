package com.tuinventario.api.shared.service;

import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.security.AuthenticatedUserService;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CurrentContextService {

    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final MembershipRepository membershipRepository;
    private final LocationRepository locationRepository;

    public CurrentUser currentUser() {
        return authenticatedUserService.getCurrentUser();
    }

    public UserEntity currentActorEntity() {
        return userRepository.findById(currentUser().userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
    }

    public OrganizationEntity currentOrganizationEntity() {
        return organizationRepository.findById(currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORG_NOT_FOUND", "Organizacion no encontrada."));
    }

    public void requireManagerOrAdmin() {
        if (!currentUser().isManagerOrAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "INSUFFICIENT_PERMISSIONS", "No tienes permisos para realizar esta accion.");
        }
    }

    public void requireOperator() {
        if (!currentUser().isOperator()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "INSUFFICIENT_PERMISSIONS", "No tienes permisos para realizar esta accion.");
        }
    }

    public void requireAdmin() {
        if (!currentUser().isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "INSUFFICIENT_PERMISSIONS", "Solo un administrador puede realizar esta accion.");
        }
    }

    public com.tuinventario.api.domain.entity.MembershipEntity currentMembershipEntity() {
        return membershipRepository.findByUserIdAndOrganizationId(currentUser().userId(), currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "MEMBERSHIP_NOT_FOUND", "No existe una membresia activa para el usuario."));
    }

    public UUID effectiveLocationId(UUID requestedLocationId) {
        CurrentUser user = currentUser();
        if (user.isAdmin()) {
            return requestedLocationId;
        }
        if (user.assignedLocationId() == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "LOCATION_SCOPE_REQUIRED", "El usuario debe estar asociado a una ubicacion para operar.");
        }
        return user.assignedLocationId();
    }

    public LocationEntity resolveEffectiveLocationEntity(String requestedLocationId) {
        UUID effectiveLocationId = effectiveLocationId(requestedLocationId == null || requestedLocationId.isBlank() ? null : UUID.fromString(requestedLocationId));
        if (effectiveLocationId == null) {
            return null;
        }
        return locationRepository.findByIdAndOrganizationId(effectiveLocationId, currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
    }

    public LocationEntity assignedLocationOrThrow() {
        UUID assignedLocationId = currentUser().assignedLocationId();
        if (assignedLocationId == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "LOCATION_SCOPE_REQUIRED", "El usuario debe estar asociado a una ubicacion para operar.");
        }
        return locationRepository.findByIdAndOrganizationId(assignedLocationId, currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
    }

    public void ensureAccessibleLocation(UUID locationId) {
        UUID effectiveLocationId = effectiveLocationId(locationId);
        if (effectiveLocationId != null && !effectiveLocationId.equals(locationId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "LOCATION_SCOPE_FORBIDDEN", "No puedes operar sobre otra ubicacion.");
        }
    }
}
