package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.ItemEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ItemRepository extends JpaRepository<ItemEntity, UUID> {
    Optional<ItemEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);

    @Query("""
            select i from ItemEntity i
            where i.organization.id = :organizationId
              and (:query is null or lower(i.name) like lower(concat('%', :query, '%')) or lower(i.sku) like lower(concat('%', :query, '%')))
            order by i.updatedAt desc
            """)
    Page<ItemEntity> search(@Param("organizationId") UUID organizationId, @Param("query") String query, Pageable pageable);
}
