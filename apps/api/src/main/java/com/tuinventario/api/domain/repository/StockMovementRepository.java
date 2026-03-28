package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.StockMovementEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovementEntity, UUID> {
    java.util.Optional<StockMovementEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    Page<StockMovementEntity> findByOrganizationIdOrderByOccurredAtDesc(UUID organizationId, Pageable pageable);
    List<StockMovementEntity> findByOrganizationIdOrderByOccurredAtDesc(UUID organizationId);
    @Query("""
            select m from StockMovementEntity m
            where m.organization.id = :organizationId
              and (
                    :locationId is null
                    or m.item.primaryLocation.id = :locationId
                    or m.sourceLocation.id = :locationId
                    or m.targetLocation.id = :locationId
                  )
            order by m.occurredAt desc
            """)
    Page<StockMovementEntity> searchByLocation(
            @Param("organizationId") UUID organizationId,
            @Param("locationId") UUID locationId,
            Pageable pageable
    );
    boolean existsByOrganizationIdAndSourceLocationId(UUID organizationId, UUID sourceLocationId);
    boolean existsByOrganizationIdAndTargetLocationId(UUID organizationId, UUID targetLocationId);
}
