package com.tuinventario.api.domain.repository;

import com.tuinventario.api.domain.entity.MembershipEntity;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<MembershipEntity, UUID> {
    @EntityGraph(attributePaths = {"organization", "role", "user", "assignedLocation"})
    Optional<MembershipEntity> findByUserIdAndOrganizationId(UUID userId, UUID organizationId);

    @EntityGraph(attributePaths = {"organization", "role", "user", "assignedLocation"})
    List<MembershipEntity> findByOrganizationId(UUID organizationId);

    @EntityGraph(attributePaths = {"organization", "role", "user", "assignedLocation"})
    Optional<MembershipEntity> findFirstByUserIdOrderByCreatedAtAsc(UUID userId);

    boolean existsByOrganizationIdAndAssignedLocationId(UUID organizationId, UUID assignedLocationId);
}
