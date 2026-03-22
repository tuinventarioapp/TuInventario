package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {
    List<CategoryEntity> findByOrganizationIdOrderByNameAsc(UUID organizationId);
    Optional<CategoryEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
}
