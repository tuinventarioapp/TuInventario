package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LocationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LocationRepository extends JpaRepository<LocationEntity, UUID> {
    List<LocationEntity> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<LocationEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
