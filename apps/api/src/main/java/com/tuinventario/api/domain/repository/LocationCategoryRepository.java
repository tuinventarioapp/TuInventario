package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LocationCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LocationCategoryRepository extends JpaRepository<LocationCategoryEntity, UUID> {
    List<LocationCategoryEntity> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<LocationCategoryEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    boolean existsByOrganizationIdAndNameIgnoreCase(UUID organizationId, String name);
}
