package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.AuthCodeEntity;
import com.tuinventario.api.domain.enums.AuthCodePurpose;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AuthCodeRepository extends JpaRepository<AuthCodeEntity, UUID> {

    @EntityGraph(attributePaths = "user")
    Optional<AuthCodeEntity> findTopByUserIdAndPurposeOrderByCreatedAtDesc(UUID userId, AuthCodePurpose purpose);
}
