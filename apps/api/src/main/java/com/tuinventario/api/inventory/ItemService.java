package com.tuinventario.api.inventory;

import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.StockMovementEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import com.tuinventario.api.domain.enums.MovementType;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.StockMovementRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
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
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationRepository locationRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CurrentContextService currentContextService;
    private final AuditService auditService;
    private final RealtimePublisher realtimePublisher;

    @Transactional(readOnly = true)
    public PageResponse<ItemDtos.ItemResponse> listItems(
            String query,
            UUID categoryId,
            ItemStatus status,
            ItemType type,
            UUID locationId,
            String stockFilter,
            BigDecimal minAvailableStock,
            BigDecimal maxAvailableStock,
            int page,
            int size
    ) {
        String safeQuery = query == null ? "" : query.trim();
        String safeStockFilter = stockFilter == null || stockFilter.isBlank() ? null : stockFilter.trim().toUpperCase();
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        var result = itemRepository.search(
                        currentContextService.currentUser().organizationId(),
                        safeQuery,
                        categoryId,
                        status,
                        type,
                        effectiveLocationId,
                        safeStockFilter,
                        minAvailableStock,
                        maxAvailableStock,
                        BigDecimal.ONE,
                        PageRequest.of(page, size)
                )
                .map(this::mapItem);
        return PageResponse.from(result);
    }

    @Transactional(readOnly = true)
    public ItemDtos.ItemResponse getItem(UUID id) {
        return mapItem(findItem(id));
    }

    @Transactional
    public ItemDtos.ItemResponse createItem(ItemDtos.CreateItemRequest request) {
        currentContextService.requireManagerOrAdmin();

        CategoryEntity category = categoryRepository.findByIdAndOrganizationId(UUID.fromString(request.categoryId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Categoria no encontrada."));
        UnitEntity unit = unitRepository.findByIdAndOrganizationId(UUID.fromString(request.unitId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "UNIT_NOT_FOUND", "Unidad no encontrada."));
        LocationEntity location = currentContextService.resolveEffectiveLocationEntity(request.primaryLocationId());
        if (location == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_REQUIRED", "Debes seleccionar una ubicacion.");
        }
        validateUniqueSku(request.sku(), location.getId(), null);

        ItemEntity item = new ItemEntity();
        item.setOrganization(currentContextService.currentOrganizationEntity());
        item.setCategory(category);
        item.setUnit(unit);
        item.setPrimaryLocation(location);
        item.setName(request.name().trim());
        item.setSku(request.sku().trim().toUpperCase());
        item.setDescription(normalizeOptional(request.description()));
        item.setImageUrl(normalizeOptional(request.imageUrl()));
        item.setType(request.type());
        item.setStatus(ItemStatus.AVAILABLE);
        item.setConsumable(request.type() == ItemType.CONSUMABLE || request.type() == ItemType.HYBRID);
        item.setLendable(request.type() == ItemType.LENDABLE || request.type() == ItemType.HYBRID);
        item.setTotalStock(BigDecimal.ZERO);
        item.setAvailableStock(BigDecimal.ZERO);
        item.setReservedStock(BigDecimal.ZERO);
        item.setLoanedStock(BigDecimal.ZERO);
        item.setDamagedStock(BigDecimal.ZERO);
        itemRepository.save(item);

        BigDecimal initialStock = request.initialStock() == null ? BigDecimal.ZERO : request.initialStock();
        if (initialStock.compareTo(BigDecimal.ZERO) > 0) {
            QuantityUtils.requirePositive(initialStock);
            item.setTotalStock(initialStock);
            item.setAvailableStock(initialStock);
            item.setLastMovementAt(Instant.now());
            stockMovementRepository.save(buildInitialMovement(item, initialStock, location));
            itemRepository.save(item);
        }

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "ITEM",
                item.getId(),
                "ITEM_CREATED",
                Map.of("sku", item.getSku(), "initialStock", initialStock)
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "item.created", Map.of("itemId", item.getId().toString()));
        return mapItem(item);
    }

    @Transactional
    public ItemDtos.ItemResponse updateItem(UUID id, ItemDtos.UpdateItemRequest request) {
        currentContextService.requireManagerOrAdmin();
        ItemEntity item = findItem(id);
        LocationEntity location = currentContextService.resolveEffectiveLocationEntity(request.primaryLocationId());
        if (location == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_REQUIRED", "Debes seleccionar una ubicacion.");
        }
        validateUniqueSku(item.getSku(), location.getId(), item.getId());
        item.setName(request.name().trim());
        item.setDescription(normalizeOptional(request.description()));
        item.setImageUrl(normalizeOptional(request.imageUrl()));
        item.setStatus(request.status());
        item.setCategory(categoryRepository.findByIdAndOrganizationId(UUID.fromString(request.categoryId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Categoria no encontrada.")));
        item.setUnit(unitRepository.findByIdAndOrganizationId(UUID.fromString(request.unitId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "UNIT_NOT_FOUND", "Unidad no encontrada.")));
        item.setPrimaryLocation(location);
        itemRepository.save(item);

        auditService.log(
                currentContextService.currentOrganizationEntity(),
                currentContextService.currentActorEntity(),
                "ITEM",
                item.getId(),
                "ITEM_UPDATED",
                Map.of("status", item.getStatus().name())
        );
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "item.updated", Map.of("itemId", item.getId().toString()));
        return mapItem(item);
    }

    private ItemEntity findItem(UUID id) {
        ItemEntity item = itemRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
        currentContextService.ensureAccessibleLocation(item.getPrimaryLocation().getId());
        return item;
    }

    private StockMovementEntity buildInitialMovement(ItemEntity item, BigDecimal quantity, LocationEntity location) {
        StockMovementEntity movement = new StockMovementEntity();
        movement.setOrganization(currentContextService.currentOrganizationEntity());
        movement.setItem(item);
        movement.setMovementType(MovementType.ENTRY);
        movement.setQuantity(quantity);
        movement.setTargetLocation(location);
        movement.setReason("Stock inicial");
        movement.setNotes("Carga inicial al crear item");
        movement.setPerformedBy(currentContextService.currentActorEntity());
        movement.setOccurredAt(Instant.now());
        return movement;
    }

    private void validateUniqueSku(String sku, UUID locationId, UUID currentItemId) {
        String normalizedSku = sku.trim().toUpperCase();
        itemRepository.findByOrganizationIdAndPrimaryLocationIdAndSkuIgnoreCase(
                        currentContextService.currentUser().organizationId(),
                        locationId,
                        normalizedSku
                )
                .filter(existing -> currentItemId == null || !existing.getId().equals(currentItemId))
                .ifPresent(existing -> {
                    throw new ApiException(HttpStatus.CONFLICT, "SKU_ALREADY_EXISTS", "Ya existe un articulo con ese SKU en la ubicacion seleccionada.");
                });
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private ItemDtos.ItemResponse mapItem(ItemEntity item) {
        return new ItemDtos.ItemResponse(
                item.getId().toString(),
                item.getName(),
                item.getSku(),
                item.getDescription(),
                item.getImageUrl(),
                item.getType().name(),
                item.getStatus().name(),
                item.getCategory().getId().toString(),
                item.getCategory().getName(),
                item.getUnit().getId().toString(),
                item.getUnit().getSymbol(),
                item.getPrimaryLocation().getId().toString(),
                item.getPrimaryLocation().getName(),
                item.getTotalStock(),
                item.getAvailableStock(),
                item.getReservedStock(),
                item.getLoanedStock(),
                item.getDamagedStock(),
                item.getLastMovementAt()
        );
    }
}
