package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.AuditLogEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditLogRepository extends JpaRepository<AuditLogEntity, UUID> {
    Page<AuditLogEntity> findByOrganizationIdOrderByCreatedAtDesc(UUID organizationId, Pageable pageable);
}
