package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BorrowerRepository extends JpaRepository<BorrowerEntity, UUID> {
    List<BorrowerEntity> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<BorrowerEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
