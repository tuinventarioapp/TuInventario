package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BorrowerRepository extends JpaRepository<BorrowerEntity, UUID> {
    List<BorrowerEntity> findByOrganizationIdAndDeletedAtIsNullOrderByNameAsc(UUID organizationId);
    Optional<BorrowerEntity> findByIdAndOrganizationIdAndDeletedAtIsNull(UUID id, UUID organizationId);
    Optional<BorrowerEntity> findByUserIdAndOrganizationIdAndDeletedAtIsNull(UUID userId, UUID organizationId);

    @Query("""
            select b from BorrowerEntity b
            where b.organization.id = :organizationId
              and b.deletedAt is null
              and (:query = '' or lower(b.name) like lower(concat('%', :query, '%')))
            order by b.name asc
            """)
    List<BorrowerEntity> searchActiveByOrganizationIdAndName(
            @Param("organizationId") UUID organizationId,
            @Param("query") String query
    );
}
