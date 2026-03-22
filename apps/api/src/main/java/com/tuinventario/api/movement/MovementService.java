package com.tuinventario.api.movement;

import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.StockMovementEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.MovementType;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.StockMovementRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.model.PageResponse;
import com.tuinventario.api.shared.service.AuditService;
import com.tuinventario.api.shared.service.CurrentContextService;
import com.tuinventario.api.shared.service.RealtimePublisher;
import com.tuinventario.api.shared.util.QuantityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MovementService {

    private final StockMovementRepository stockMovementRepository;
    private final ItemRepository itemRepository;
    private final CurrentContextService currentContextService;
    private final AuditService auditService;
    private final RealtimePublisher realtimePublisher;

    @Transactional(readOnly = true)
    public PageResponse<MovementDtos.MovementResponse> listMovements(UUID locationId, int page, int size) {
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        var result = stockMovementRepository.searchByLocation(
                        currentContextService.currentUser().organizationId(),
                        effectiveLocationId,
                        PageRequest.of(page, size)
                )
                .map(this::mapMovement);
        return PageResponse.from(result);
    }

    @Transactional
    public MovementDtos.MovementResponse createMovement(MovementDtos.CreateMovementRequest request) {
        currentContextService.requireManagerOrAdmin();
        QuantityUtils.requirePositive(request.quantity());

        ItemEntity item = findScopedItem(UUID.fromString(request.itemId()));
        Instant occurredAt = Instant.now();
        LocationEntity sourceLocation = item.getPrimaryLocation();
        LocationEntity targetLocation = null;

        if (request.movementType() == MovementType.TRANSFER) {
            if (!currentContextService.currentUser().isAdmin()) {
                throw new ApiException(HttpStatus.FORBIDDEN, "TRANSFER_REQUIRES_ADMIN", "Solo un administrador puede trasladar stock entre ubicaciones.");
            }
            targetLocation = currentContextService.resolveEffectiveLocationEntity(request.targetLocationId());
            if (targetLocation == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "TARGET_LOCATION_REQUIRED", "Debes seleccionar una ubicacion destino.");
            }
            if (targetLocation.getId().equals(sourceLocation.getId())) {
                throw new ApiException(HttpStatus.CONFLICT, "TRANSFER_SAME_LOCATION", "El traslado debe apuntar a una ubicacion distinta.");
            }
            transferStock(item, targetLocation, request.quantity(), occurredAt);
        } else {
            applyMovement(item, request.movementType(), request.quantity());
            item.setLastMovementAt(occurredAt);
            syncItemStatus(item);
            ensureStockIntegrity(item);
            itemRepository.save(item);
            if (request.movementType() == MovementType.ENTRY || request.movementType() == MovementType.ADJUSTMENT) {
                targetLocation = item.getPrimaryLocation();
            } else if (request.movementType() == MovementType.EXIT) {
                sourceLocation = item.getPrimaryLocation();
            }
        }

        StockMovementEntity entity = new StockMovementEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setItem(item);
        entity.setMovementType(request.movementType());
        entity.setQuantity(request.quantity());
        entity.setSourceLocation(sourceLocationFor(request.movementType(), sourceLocation));
        entity.setTargetLocation(targetLocationFor(request.movementType(), targetLocation, item.getPrimaryLocation()));
        entity.setReason(request.reason().trim());
        entity.setNotes(normalizeOptional(request.notes()));
        entity.setPerformedBy(currentContextService.currentActorEntity());
        entity.setOccurredAt(occurredAt);
        stockMovementRepository.save(entity);

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "STOCK_MOVEMENT",
                entity.getId(),
                "MOVEMENT_CREATED",
                Map.of("itemId", item.getId(), "movementType", request.movementType().name(), "quantity", request.quantity())
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "stock.changed", Map.of("itemId", item.getId().toString()));
        return mapMovement(entity);
    }

    private ItemEntity findScopedItem(UUID itemId) {
        ItemEntity item = itemRepository.findByIdAndOrganizationId(itemId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
        currentContextService.ensureAccessibleLocation(item.getPrimaryLocation().getId());
        return item;
    }

    private void applyMovement(ItemEntity item, MovementType movementType, BigDecimal quantity) {
        switch (movementType) {
            case ENTRY -> {
                item.setTotalStock(item.getTotalStock().add(quantity));
                item.setAvailableStock(item.getAvailableStock().add(quantity));
            }
            case EXIT -> {
                ensureEnough(item.getAvailableStock(), quantity);
                item.setTotalStock(item.getTotalStock().subtract(quantity));
                item.setAvailableStock(item.getAvailableStock().subtract(quantity));
            }
            case ADJUSTMENT -> {
                BigDecimal adjusted = item.getAvailableStock().add(quantity);
                if (adjusted.compareTo(BigDecimal.ZERO) < 0) {
                    throw new ApiException(HttpStatus.CONFLICT, "STOCK_NEGATIVE", "El ajuste deja el stock en negativo.");
                }
                item.setTotalStock(item.getTotalStock().add(quantity));
                item.setAvailableStock(adjusted);
            }
            case TRANSFER -> throw new ApiException(HttpStatus.BAD_REQUEST, "TRANSFER_INVALID_STATE", "El traslado se procesa con una logica distinta.");
        }
    }

    private void transferStock(ItemEntity sourceItem, LocationEntity targetLocation, BigDecimal quantity, Instant occurredAt) {
        ensureEnough(sourceItem.getAvailableStock(), quantity);

        sourceItem.setTotalStock(sourceItem.getTotalStock().subtract(quantity));
        sourceItem.setAvailableStock(sourceItem.getAvailableStock().subtract(quantity));
        sourceItem.setLastMovementAt(occurredAt);
        syncItemStatus(sourceItem);
        ensureStockIntegrity(sourceItem);

        ItemEntity targetItem = itemRepository.findByOrganizationIdAndPrimaryLocationIdAndSkuIgnoreCase(
                        currentContextService.currentUser().organizationId(),
                        targetLocation.getId(),
                        sourceItem.getSku()
                )
                .orElseGet(() -> createTransferTarget(sourceItem, targetLocation));

        targetItem.setTotalStock(targetItem.getTotalStock().add(quantity));
        targetItem.setAvailableStock(targetItem.getAvailableStock().add(quantity));
        targetItem.setLastMovementAt(occurredAt);
        syncItemStatus(targetItem);
        ensureStockIntegrity(targetItem);

        itemRepository.save(sourceItem);
        itemRepository.save(targetItem);
    }

    private ItemEntity createTransferTarget(ItemEntity sourceItem, LocationEntity targetLocation) {
        ItemEntity targetItem = new ItemEntity();
        targetItem.setOrganization(sourceItem.getOrganization());
        targetItem.setCategory(sourceItem.getCategory());
        targetItem.setUnit(sourceItem.getUnit());
        targetItem.setPrimaryLocation(targetLocation);
        targetItem.setName(sourceItem.getName());
        targetItem.setSku(sourceItem.getSku());
        targetItem.setDescription(sourceItem.getDescription());
        targetItem.setImageUrl(sourceItem.getImageUrl());
        targetItem.setType(sourceItem.getType());
        targetItem.setConsumable(sourceItem.isConsumable());
        targetItem.setLendable(sourceItem.isLendable());
        targetItem.setStatus(ItemStatus.AVAILABLE);
        targetItem.setTotalStock(BigDecimal.ZERO);
        targetItem.setAvailableStock(BigDecimal.ZERO);
        targetItem.setReservedStock(BigDecimal.ZERO);
        targetItem.setLoanedStock(BigDecimal.ZERO);
        targetItem.setDamagedStock(BigDecimal.ZERO);
        return targetItem;
    }

    private void ensureEnough(BigDecimal available, BigDecimal requested) {
        if (available.compareTo(requested) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_INSUFFICIENT", "No hay stock disponible suficiente para completar la operacion.");
        }
    }

    private void syncItemStatus(ItemEntity item) {
        if (item.getLoanedStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.ON_LOAN);
            return;
        }
        if (item.getReservedStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.RESERVED);
            return;
        }
        if (item.getAvailableStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.AVAILABLE);
            return;
        }
        if (item.getDamagedStock().compareTo(BigDecimal.ZERO) > 0) {
            item.setStatus(ItemStatus.DAMAGED);
            return;
        }
        if (item.getTotalStock().compareTo(BigDecimal.ZERO) <= 0) {
            item.setStatus(ItemStatus.LOST);
            return;
        }
        item.setStatus(ItemStatus.AVAILABLE);
    }

    private void ensureStockIntegrity(ItemEntity item) {
        if (item.getTotalStock().compareTo(BigDecimal.ZERO) < 0
                || item.getAvailableStock().compareTo(BigDecimal.ZERO) < 0
                || item.getReservedStock().compareTo(BigDecimal.ZERO) < 0
                || item.getLoanedStock().compareTo(BigDecimal.ZERO) < 0
                || item.getDamagedStock().compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_NEGATIVE", "La operacion deja el inventario en un estado invalido.");
        }
    }

    private LocationEntity sourceLocationFor(MovementType movementType, LocationEntity sourceLocation) {
        if (movementType == MovementType.ENTRY) {
            return null;
        }
        return sourceLocation;
    }

    private LocationEntity targetLocationFor(MovementType movementType, LocationEntity targetLocation, LocationEntity itemLocation) {
        if (movementType == MovementType.EXIT) {
            return null;
        }
        return targetLocation == null ? itemLocation : targetLocation;
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private MovementDtos.MovementResponse mapMovement(StockMovementEntity entity) {
        return new MovementDtos.MovementResponse(
                entity.getId().toString(),
                entity.getMovementType().name(),
                entity.getItem().getId().toString(),
                entity.getItem().getName(),
                entity.getQuantity(),
                entity.getSourceLocation() == null ? null : entity.getSourceLocation().getName(),
                entity.getTargetLocation() == null ? null : entity.getTargetLocation().getName(),
                entity.getReason(),
                entity.getNotes(),
                entity.getPerformedBy().getFullName(),
                entity.getOccurredAt()
        );
    }
}
