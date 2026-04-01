package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.RefreshTokenEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshTokenEntity, UUID> {
    Optional<RefreshTokenEntity> findByToken(String token);

    List<RefreshTokenEntity> findByUserIdAndRevokedAtIsNull(UUID userId);
}
