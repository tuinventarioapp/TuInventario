package com.tuinventario.api.security;

import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.shared.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final MembershipRepository membershipRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        var user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        var membership = membershipRepository.findFirstByUserIdOrderByCreatedAtAsc(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "MEMBERSHIP_NOT_FOUND", "No existe una membresia activa para el usuario."));

        if (user.getStatus() == EntityStatus.BLOCKED || membership.getStatus() != MembershipStatus.ACTIVE) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "USER_BLOCKED", "El usuario no se encuentra activo.");
        }

        return new AppUserDetails(
                user.getId(),
                membership.getOrganization().getId(),
                membership.getRole().getName(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus() == EntityStatus.ACTIVE
        );
    }
}
