package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LoanEntity;
import com.tuinventario.api.domain.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<LoanEntity, UUID> {
    List<LoanEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    List<LoanEntity> findByOrganizationIdAndRequestGroupIdOrderByCreatedAtAsc(UUID organizationId, UUID requestGroupId);
    Optional<LoanEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<LoanEntity> findByStatusInAndDueAtBefore(List<LoanStatus> statuses, Instant dueAt);
    boolean existsByBorrowerIdAndOrganizationId(UUID borrowerId, UUID organizationId);
    boolean existsByBorrowerIdAndOrganizationIdAndStatusIn(UUID borrowerId, UUID organizationId, List<LoanStatus> statuses);
    boolean existsByLoanRequest_Item_IdAndOrganizationIdAndStatusIn(UUID itemId, UUID organizationId, List<LoanStatus> statuses);

    @Query("""
            select l from LoanEntity l
            where l.organization.id = :organizationId
              and l.requestGroupId is not null
            order by l.createdAt desc
            """)
    List<LoanEntity> findGroupedByOrganizationId(@Param("organizationId") UUID organizationId);

    @Query("""
            select l from LoanEntity l
            where l.organization.id = :organizationId
              and l.requestGroupId is not null
              and l.borrower.user.id = :userId
            order by l.createdAt desc
            """)
    List<LoanEntity> findGroupedByBorrowerUserId(
            @Param("organizationId") UUID organizationId,
            @Param("userId") UUID userId
    );
}
