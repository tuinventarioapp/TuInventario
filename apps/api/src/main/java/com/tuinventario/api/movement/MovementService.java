package com.tuinventario.api.movement;

import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.StockMovementEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.MovementType;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
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
    private final LocationRepository locationRepository;
    private final CurrentContextService currentContextService;
    private final AuditService auditService;
    private final RealtimePublisher realtimePublisher;

    @Transactional(readOnly = true)
    public PageResponse<MovementDtos.MovementResponse> listMovements(int page, int size) {
        var result = stockMovementRepository.findByOrganizationIdOrderByOccurredAtDesc(currentContextService.currentUser().organizationId(), PageRequest.of(page, size))
                .map(this::mapMovement);
        return PageResponse.from(result);
    }

    @Transactional
    public MovementDtos.MovementResponse createMovement(MovementDtos.CreateMovementRequest request) {
        currentContextService.requireManagerOrAdmin();
        QuantityUtils.requirePositive(request.quantity());
        ItemEntity item = itemRepository.findByIdAndOrganizationId(UUID.fromString(request.itemId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));

        LocationEntity sourceLocation = resolveLocation(request.sourceLocationId());
        LocationEntity targetLocation = resolveLocation(request.targetLocationId());
        applyMovement(item, request.movementType(), request.quantity());

        StockMovementEntity entity = new StockMovementEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setItem(item);
        entity.setMovementType(request.movementType());
        entity.setQuantity(request.quantity());
        entity.setSourceLocation(sourceLocation);
        entity.setTargetLocation(targetLocation);
        entity.setReason(request.reason());
        entity.setNotes(request.notes());
        entity.setPerformedBy(currentContextService.currentActorEntity());
        entity.setOccurredAt(Instant.now());
        stockMovementRepository.save(entity);

        item.setLastMovementAt(entity.getOccurredAt());
        itemRepository.save(item);

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

    private void applyMovement(ItemEntity item, MovementType movementType, BigDecimal quantity) {
        switch (movementType) {
            case ENTRY -> {
                item.setTotalStock(item.getTotalStock().add(quantity));
                item.setAvailableStock(item.getAvailableStock().add(quantity));
                item.setStatus(ItemStatus.AVAILABLE);
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
            case TRANSFER -> ensureEnough(item.getAvailableStock(), quantity);
        }
    }

    private void ensureEnough(BigDecimal available, BigDecimal requested) {
        if (available.compareTo(requested) < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "STOCK_INSUFFICIENT", "No hay stock disponible suficiente para completar la operacion.");
        }
    }

    private LocationEntity resolveLocation(String locationId) {
        if (locationId == null || locationId.isBlank()) {
            return null;
        }
        return locationRepository.findByIdAndOrganizationId(UUID.fromString(locationId), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
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
