package com.tuinventario.api.users;

import com.tuinventario.api.domain.entity.MembershipEntity;
import com.tuinventario.api.domain.entity.RoleEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.MembershipStatus;
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

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final CurrentContextService currentContextService;
    private final MembershipRepository membershipRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public List<UserDtos.UserSummaryResponse> listUsers() {
        return membershipRepository.findByOrganizationId(currentContextService.currentUser().organizationId())
                .stream()
                .map(membership -> new UserDtos.UserSummaryResponse(
                        membership.getUser().getId().toString(),
                        membership.getUser().getFullName(),
                        membership.getUser().getEmail(),
                        membership.getRole().getName(),
                        membership.getUser().getStatus().name()
                ))
                .toList();
    }

    @Transactional
    public UserDtos.UserSummaryResponse createUser(UserDtos.CreateUserRequest request) {
        currentContextService.requireAdmin();
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(user -> {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Ya existe un usuario con ese email.");
        });

        RoleEntity role = roleRepository.findByName(request.role().toUpperCase())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "ROLE_NOT_FOUND", "El rol solicitado no existe."));

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(EntityStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);

        MembershipEntity membership = new MembershipEntity();
        membership.setOrganization(currentContextService.currentOrganizationEntity());
        membership.setUser(user);
        membership.setRole(role);
        membership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(membership);

        return new UserDtos.UserSummaryResponse(user.getId().toString(), user.getFullName(), user.getEmail(), role.getName(), user.getStatus().name());
    }
}
