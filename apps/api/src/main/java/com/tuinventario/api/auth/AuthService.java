package com.tuinventario.api.auth;

import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.LocationCategoryEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.MembershipEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.RefreshTokenEntity;
import com.tuinventario.api.domain.entity.RoleEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.enums.EntityStatus;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.LocationCategoryRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.RefreshTokenRepository;
import com.tuinventario.api.domain.repository.RoleRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import com.tuinventario.api.domain.repository.UserRepository;
import com.tuinventario.api.security.AppUserDetails;
import com.tuinventario.api.security.AuthenticatedUserService;
import com.tuinventario.api.security.JwtService;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.security.CurrentUser;
import com.tuinventario.api.shared.util.SlugUtils;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InternalAuthenticationServiceException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final MembershipRepository membershipRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationCategoryRepository locationCategoryRepository;
    private final LocationRepository locationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticatedUserService authenticatedUserService;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(user -> {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "Ya existe un usuario con ese email.");
        });

        OrganizationEntity organization = new OrganizationEntity();
        organization.setName(request.organizationName());
        organization.setSlug(uniqueSlug(request.organizationName()));
        organization.setTimezone(request.timezone());
        organization.setStatus(EntityStatus.ACTIVE);
        organizationRepository.save(organization);

        UserEntity user = new UserEntity();
        user.setFullName(request.fullName());
        user.setEmail(request.email().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setStatus(EntityStatus.ACTIVE);
        user.setEmailVerified(true);
        userRepository.save(user);

        RoleEntity adminRole = roleRepository.findByName("ADMIN")
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ROLE_NOT_FOUND", "No existe el rol ADMIN."));

        MembershipEntity membership = new MembershipEntity();
        membership.setOrganization(organization);
        membership.setUser(user);
        membership.setRole(adminRole);
        membership.setAssignedLocation(null);
        membership.setStatus(MembershipStatus.ACTIVE);
        membershipRepository.save(membership);

        createDefaultsForOrganization(organization);

        return issueTokens(user, membership);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest request) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        } catch (InternalAuthenticationServiceException exception) {
            if (exception.getCause() instanceof ApiException apiException) {
                throw apiException;
            }
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Credenciales invalidas.");
        } catch (BadCredentialsException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Credenciales invalidas.");
        }
        UserEntity user = userRepository.findByEmailIgnoreCase(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Credenciales invalidas."));
        MembershipEntity membership = membershipRepository.findFirstByUserIdOrderByCreatedAtAsc(user.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "MEMBERSHIP_NOT_FOUND", "No existe una membresia activa."));
        return issueTokens(user, membership);
    }

    @Transactional
    public AuthDtos.AuthResponse refresh(AuthDtos.RefreshTokenRequest request) {
        Claims claims = jwtService.parseRefreshToken(request.refreshToken());
        RefreshTokenEntity storedToken = refreshTokenRepository.findByToken(request.refreshToken())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_REFRESH_TOKEN", "Refresh token invalido."));

        if (storedToken.getRevokedAt() != null || storedToken.getExpiresAt().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED", "El refresh token no es valido.");
        }

        UserEntity user = storedToken.getUser();
        MembershipEntity membership = membershipRepository.findByUserIdAndOrganizationId(user.getId(), storedToken.getOrganization().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "MEMBERSHIP_NOT_FOUND", "No existe una membresia activa."));

        if (!claims.getSubject().equalsIgnoreCase(user.getEmail())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_SUBJECT_MISMATCH", "El refresh token no coincide con el usuario.");
        }

        storedToken.setRevokedAt(Instant.now());
        refreshTokenRepository.save(storedToken);
        return issueTokens(user, membership);
    }

    @Transactional(readOnly = true)
    public AuthDtos.AuthUserResponse me() {
        CurrentUser currentUser = authenticatedUserService.getCurrentUser();
        UserEntity user = userRepository.findById(currentUser.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado."));
        OrganizationEntity organization = organizationRepository.findById(currentUser.organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORG_NOT_FOUND", "Organizacion no encontrada."));
        return new AuthDtos.AuthUserResponse(
                user.getId().toString(),
                user.getFullName(),
                user.getEmail(),
                currentUser.role(),
                currentUser.assignedLocationId() == null ? null : currentUser.assignedLocationId().toString(),
                currentUser.assignedLocationName(),
                organization.getId().toString(),
                organization.getName()
        );
    }

    private AuthDtos.AuthResponse issueTokens(UserEntity user, MembershipEntity membership) {
        String accessToken = jwtService.generateAccessToken(user.getId(), membership.getOrganization().getId(), membership.getRole().getName(), user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), membership.getOrganization().getId(), user.getEmail());

        RefreshTokenEntity refreshTokenEntity = new RefreshTokenEntity();
        refreshTokenEntity.setUser(user);
        refreshTokenEntity.setOrganization(membership.getOrganization());
        refreshTokenEntity.setToken(refreshToken);
        refreshTokenEntity.setExpiresAt(Instant.now().plus(14, ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshTokenEntity);

        return new AuthDtos.AuthResponse(
                accessToken,
                refreshToken,
                new AuthDtos.AuthUserResponse(
                        user.getId().toString(),
                        user.getFullName(),
                        user.getEmail(),
                        membership.getRole().getName(),
                        membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getId().toString(),
                        membership.getAssignedLocation() == null ? null : membership.getAssignedLocation().getName(),
                        membership.getOrganization().getId().toString(),
                        membership.getOrganization().getName()
                )
        );
    }

    private void createDefaultsForOrganization(OrganizationEntity organization) {
        LocationCategoryEntity warehouseCategory = createLocationCategory(organization, "Bodega", "Ubicacion de almacenamiento");
        createLocationCategory(organization, "Oficina", "Puesto o area administrativa");
        createLocationCategory(organization, "Vehiculo", "Unidad movil o camion");
        createLocationCategory(organization, "Sitio del cliente", "Ubicacion externa del cliente");
        createLocationCategory(organization, "Otra", "Otra categoria de ubicacion");

        CategoryEntity category = new CategoryEntity();
        category.setOrganization(organization);
        category.setName("General");
        category.setDescription("Categoria inicial");
        categoryRepository.save(category);

        UnitEntity unit = new UnitEntity();
        unit.setOrganization(organization);
        unit.setName("Unidad");
        unit.setSymbol("und");
        unit.setAllowsDecimal(false);
        unitRepository.save(unit);

        LocationEntity location = new LocationEntity();
        location.setOrganization(organization);
        location.setName("Principal");
        location.setType(LocationType.WAREHOUSE);
        location.setLocationCategory(warehouseCategory);
        location.setDescription("Ubicacion inicial");
        locationRepository.save(location);
    }

    private LocationCategoryEntity createLocationCategory(OrganizationEntity organization, String name, String description) {
        LocationCategoryEntity category = new LocationCategoryEntity();
        category.setOrganization(organization);
        category.setName(name);
        category.setDescription(description);
        return locationCategoryRepository.save(category);
    }

    private String uniqueSlug(String organizationName) {
        String baseSlug = SlugUtils.slugify(organizationName);
        String slug = baseSlug;
        int attempt = 1;
        while (organizationRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + attempt++;
        }
        return slug;
    }
}
