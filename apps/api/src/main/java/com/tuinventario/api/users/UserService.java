package com.tuinventario.api.users;

import com.tuinventario.api.domain.entity.MembershipEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.RoleEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.RoleRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final CurrentContextService currentContextService;
    private final MembershipRepository membershipRepository;
    private final RoleRepository roleRepository;
    private final LocationRepository locationRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDtos.UserSummaryResponse> listUsers() {
        currentContextService.requireAdmin();
        return membershipRepository.findByOrganizationId(currentContextService.currentUser().organizationId())
                .stream()
                .map(this::mapSummary)
                .toList();
    }

    @Transactional
    public UserDtos.UserSummaryResponse createUser(UserDtos.CreateUserRequest request) {
        currentContextService.requireAdmin();
        String normalizedEmail = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail).ifPresent(user -> {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Ya existe un usuario con ese email.");
        });

        RoleEntity role = resolveRole(request.role());

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(EntityStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);

        MembershipEntity membership = new MembershipEntity();
        membership.setOrganization(currentContextService.currentOrganizationEntity());
        membership.setUser(user);
        membership.setRole(role);
        membership.setAssignedLocation(resolveAssignedLocation(request.assignedLocationId(), role.getName()));
        membership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(membership);

        return mapSummary(membership);
    }

    @Transactional
    public UserDtos.UserSummaryResponse updateUser(UUID userId, UserDtos.UpdateUserRequest request) {
        currentContextService.requireAdmin();
        MembershipEntity membership = findMembership(userId);
        UserEntity user = membership.getUser();
        String normalizedEmail = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(normalizedEmail)
                .filter(existing -> !existing.getId().equals(userId))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Ya existe un usuario con ese email.");
                });

        boolean demotingActiveAdmin = "ADMIN".equals(membership.getRole().getName())
                && (!"ADMIN".equalsIgnoreCase(request.role()) || isBlockedStatus(request.status()));
        if (demotingActiveAdmin) {
            ensureAnotherActiveAdminExists(userId);
        }

        if (currentContextService.currentUser().userId().equals(userId) && isBlockedStatus(request.status())) {
            throw new ApiException(HttpStatus.CONFLICT, "SELF_DEACTIVATION_NOT_ALLOWED", "No puedes bloquear tu propio usuario.");
        }

        user.setFullName(request.fullName().trim());
        user.setEmail(normalizedEmail);
        user.setStatus(resolveStatus(request.status()));
        if (user.getStatus() == EntityStatus.BLOCKED) {
            user.setDeletedAt(Instant.now());
        } else {
            user.setDeletedAt(null);
        }
        userRepository.save(user);

        RoleEntity role = resolveRole(request.role());
        membership.setRole(role);
        membership.setAssignedLocation(resolveAssignedLocation(request.assignedLocationId(), role.getName()));
        membership.setStatus(user.getStatus() == EntityStatus.ACTIVE ? MembershipStatus.ACTIVE : MembershipStatus.BLOCKED);
        membershipRepository.save(membership);
        return mapSummary(membership);
    }

    @Transactional
    public void resetPassword(UUID userId, UserDtos.ResetPasswordRequest request) {
        currentContextService.requireAdmin();
        MembershipEntity membership = findMembership(userId);
        membership.getUser().setPasswordHash(passwordEncoder.encode(request.newPassword().trim()));
        userRepository.save(membership.getUser());
    }

    @Transactional
    public void deleteUser(UUID userId) {
        currentContextService.requireAdmin();
        if (currentContextService.currentUser().userId().equals(userId)) {
            throw new ApiException(HttpStatus.CONFLICT, "SELF_DEACTIVATION_NOT_ALLOWED", "No puedes bloquear tu propio usuario.");
        }

        MembershipEntity membership = findMembership(userId);
        if ("ADMIN".equals(membership.getRole().getName())) {
            ensureAnotherActiveAdminExists(userId);
        }

        membership.getUser().setStatus(EntityStatus.BLOCKED);
        membership.getUser().setDeletedAt(Instant.now());
        userRepository.save(membership.getUser());

        membership.setStatus(MembershipStatus.BLOCKED);
        membershipRepository.save(membership);
    }

    private MembershipEntity findMembership(UUID userId) {
        return membershipRepository.findByUserIdAndOrganizationId(userId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado en la organizacion."));
    }

    private void ensureAnotherActiveAdminExists(UUID excludedUserId) {
        long remainingAdmins = membershipRepository.findByOrganizationId(currentContextService.currentUser().organizationId())
                .stream()
                .filter(entry -> !entry.getUser().getId().equals(excludedUserId))
                .filter(entry -> "ADMIN".equals(entry.getRole().getName()))
                .filter(entry -> entry.getStatus() == MembershipStatus.ACTIVE)
                .filter(entry -> entry.getUser().getStatus() == EntityStatus.ACTIVE)
                .count();
        if (remainingAdmins == 0) {
            throw new ApiException(HttpStatus.CONFLICT, "LAST_ADMIN_NOT_ALLOWED", "La organizacion debe conservar al menos un administrador activo.");
        }
    }

    private RoleEntity resolveRole(String roleName) {
        return roleRepository.findByName(roleName.trim().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "El rol solicitado no existe."));
    }

    private EntityStatus resolveStatus(String status) {
        String normalized = status.trim().toUpperCase();
        if ("ACTIVE".equals(normalized)) {
            return EntityStatus.ACTIVE;
        }
        if ("BLOCKED".equals(normalized)) {
            return EntityStatus.BLOCKED;
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "USER_STATUS_INVALID", "El estado del usuario debe ser ACTIVE o BLOCKED.");
    }

    private boolean isBlockedStatus(String status) {
        return "BLOCKED".equalsIgnoreCase(status.trim());
    }

    private UserDtos.UserSummaryResponse mapSummary(MembershipEntity membership) {
        return new UserDtos.UserSummaryResponse(
                membership.getUser().getId().toString(),
                membership.getUser().getFullName(),
                membership.getUser().getEmail(),
                membership.getRole().getName(),
                membership.getUser().getStatus().name(),
                membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getId().toString(),
                membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getName()
        );
    }

    private LocationEntity resolveAssignedLocation(String assignedLocationId, String roleName) {
        if ("ADMIN".equalsIgnoreCase(roleName)) {
            return null;
        }
        if (assignedLocationId == null || assignedLocationId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ASSIGNED_LOCATION_REQUIRED", "Los usuarios operativos deben estar asociados a una ubicacion.");
        }
        return locationRepository.findByIdAndOrganizationId(UUID.fromString(assignedLocationId), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
    }
}
