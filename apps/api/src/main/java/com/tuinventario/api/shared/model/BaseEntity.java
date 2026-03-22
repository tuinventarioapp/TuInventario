package com.tuinventario.api.shared.model;

import jakarta.persistence.Column;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Setter
@MappedSuperclass
public abstract class BaseEntity {

    @Id
    private UUID id;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void touchForCreate() {
        Instant now = Instant.now();
        this.id = this.id == null ? UUID.randomUUID() : this.id;
        this.createdAt = this.createdAt == null ? now : this.createdAt;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void touchForUpdate() {
        this.updatedAt = Instant.now();
    }
}
