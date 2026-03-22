package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.StockMovementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovementEntity, UUID> {
    Page<StockMovementEntity> findByOrganizationIdOrderByOccurredAtDesc(UUID organizationId, Pageable pageable);
}
