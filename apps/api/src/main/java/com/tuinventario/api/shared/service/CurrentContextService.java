package com.tuinventario.api.shared.service;

import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.security.AuthenticatedUserService;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentContextService {

    private final AuthenticatedUserService authenticatedUserService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

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

    public void requireAdmin() {
        if (!currentUser().isAdmin()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "INSUFFICIENT_PERMISSIONS", "Solo un administrador puede realizar esta accion.");
        }
    }
}
