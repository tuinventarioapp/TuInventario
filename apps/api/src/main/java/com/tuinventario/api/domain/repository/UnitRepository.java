package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.UnitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UnitRepository extends JpaRepository<UnitEntity, UUID> {
    List<UnitEntity> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<UnitEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
