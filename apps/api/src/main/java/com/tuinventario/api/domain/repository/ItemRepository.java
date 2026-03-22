package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<ItemEntity, UUID> {
    Optional<ItemEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    default Page<ItemEntity> search(UUID organizationId, String query, Pageable pageable) {
        return search(organizationId, query, null, null, null, null, null, null, null, BigDecimal.ONE, pageable);
    }

    @Query("""
            select i from ItemEntity i
            where i.organization.id = :organizationId
              and (:query = '' or lower(i.name) like lower(concat('%', :query, '%')) or lower(i.sku) like lower(concat('%', :query, '%')))
              and (:categoryId is null or i.category.id = :categoryId)
              and (:status is null or i.status = :status)
              and (:type is null or i.type = :type)
              and (:locationId is null or i.primaryLocation.id = :locationId)
              and (:minAvailableStock is null or i.availableStock >= :minAvailableStock)
              and (:maxAvailableStock is null or i.availableStock <= :maxAvailableStock)
              and (
                    :stockFilter is null
                    or (:stockFilter = 'LOW_STOCK' and i.availableStock <= :lowStockThreshold and i.availableStock > 0)
                    or (:stockFilter = 'OUT_OF_STOCK' and i.availableStock <= 0)
                    or (:stockFilter = 'IN_STOCK' and i.availableStock > 0)
                    or (:stockFilter = 'ON_LOAN' and i.loanedStock > 0)
                    or (:stockFilter = 'RESERVED' and i.reservedStock > 0)
                    or (:stockFilter = 'DAMAGED' and i.damagedStock > 0)
                  )
            order by i.updatedAt desc
            """)
    Page<ItemEntity> search(
            @Param("organizationId") UUID organizationId,
            @Param("query") String query,
            @Param("categoryId") UUID categoryId,
            @Param("status") ItemStatus status,
            @Param("type") ItemType type,
            @Param("locationId") UUID locationId,
            @Param("stockFilter") String stockFilter,
            @Param("minAvailableStock") BigDecimal minAvailableStock,
            @Param("maxAvailableStock") BigDecimal maxAvailableStock,
            @Param("lowStockThreshold") BigDecimal lowStockThreshold,
            Pageable pageable
    );
}
