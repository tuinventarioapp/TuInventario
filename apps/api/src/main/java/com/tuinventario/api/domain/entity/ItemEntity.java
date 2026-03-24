package com.tuinventario.api.domain.entity;

import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import com.tuinventario.api.shared.model.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "items")
public class ItemEntity extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id")
    private CategoryEntity category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "unit_id")
    private UnitEntity unit;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "primary_location_id")
    private LocationEntity primaryLocation;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, length = 80)
    private String sku;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "image_url")
    private String imageUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ItemType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ItemStatus status;

    @Column(name = "is_consumable", nullable = false)
    private boolean consumable;

    @Column(name = "is_lendable", nullable = false)
    private boolean lendable;

    @Column(name = "total_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal totalStock;

    @Column(name = "available_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal availableStock;

    @Column(name = "reserved_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal reservedStock;

    @Column(name = "loaned_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal loanedStock;

    @Column(name = "damaged_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal damagedStock;

    @Column(name = "minimum_stock", nullable = false, precision = 19, scale = 2)
    private BigDecimal minimumStock;

    private Instant lastMovementAt;

    @Version
    private Long version;

    private Instant deletedAt;
}
