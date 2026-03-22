package com.tuinventario.api.domain.entity;

import com.tuinventario.api.domain.enums.MembershipStatus;
import com.tuinventario.api.shared.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "memberships")
public class MembershipEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id")
    private RoleEntity role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_location_id")
    private LocationEntity assignedLocation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MembershipStatus status;
}
