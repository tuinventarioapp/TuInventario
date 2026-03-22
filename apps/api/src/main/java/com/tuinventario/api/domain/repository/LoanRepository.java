package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.LoanEntity;
import com.tuinventario.api.domain.enums.LoanStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRepository extends JpaRepository<LoanEntity, UUID> {
    List<LoanEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId);
    Optional<LoanEntity> findByIdAndOrganizationId(UUID id, UUID organizationId);
    List<LoanEntity> findByStatusInAndDueAtBefore(List<LoanStatus> statuses, Instant dueAt);
}
