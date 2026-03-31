package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LoanRequestEntity;
import com.tuinventario.api.domain.enums.LoanRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRequestRepository extends JpaRepository<LoanRequestEntity, UUID> {
    List<LoanRequestEntity> findByOrganizationIdOrderByRequestedAtDesc(UUID organizationId);
    Optional<LoanRequestEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    boolean existsByBorrowerIdAndOrganizationId(UUID borrowerId, UUID organizationId);
    boolean existsByBorrowerIdAndOrganizationIdAndStatus(UUID borrowerId, UUID organizationId, LoanRequestStatus status);
    boolean existsByItemIdAndOrganizationIdAndStatus(UUID itemId, UUID organizationId, LoanRequestStatus status);
}
