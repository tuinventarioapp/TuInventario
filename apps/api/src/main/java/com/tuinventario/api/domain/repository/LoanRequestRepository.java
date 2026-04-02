package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LoanRequestEntity;
import com.tuinventario.api.domain.enums.LoanRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRequestRepository extends JpaRepository<LoanRequestEntity, UUID> {
    List<LoanRequestEntity> findByOrganizationIdOrderByRequestedAtDesc(UUID organizationId);
    List<LoanRequestEntity> findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(UUID organizationId, UUID requestGroupId);
    Optional<LoanRequestEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    boolean existsByBorrowerIdAndOrganizationId(UUID borrowerId, UUID organizationId);
    boolean existsByBorrowerIdAndOrganizationIdAndStatus(UUID borrowerId, UUID organizationId, LoanRequestStatus status);
    boolean existsByItemIdAndOrganizationIdAndStatus(UUID itemId, UUID organizationId, LoanRequestStatus status);

    @Query("""
            select lr from LoanRequestEntity lr
            where lr.organization.id = :organizationId
              and lr.requestGroupId is not null
            order by lr.requestedAt desc, lr.createdAt desc
            """)
    List<LoanRequestEntity> findGroupedByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            select lr from LoanRequestEntity lr
            where lr.organization.id = :organizationId
              and lr.requestedBy.id = :userId
              and lr.requestGroupId is not null
            order by lr.requestedAt desc, lr.createdAt desc
            """)
    List<LoanRequestEntity> findGroupedByRequestedBy(
            @Param("organizationId") UUID organizationId,
            @Param("userId") UUID userId
    );
}
