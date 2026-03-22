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
    public PageResponse<ItemDtos.ItemResponse> listItems(String query, int page, int size) {
        var result = itemRepository.search(currentContextService.currentUser().organizationId(), query, PageRequest.of(page, size))
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
        LocationEntity location = locationRepository.findByIdAndOrganizationId(UUID.fromString(request.primaryLocationId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));

        ItemEntity item = new ItemEntity();
        item.setOrganization(currentContextService.currentOrganizationEntity());
        item.setCategory(category);
        item.setUnit(unit);
        item.setPrimaryLocation(location);
        item.setName(request.name());
        item.setSku(request.sku());
        item.setDescription(request.description());
        item.setImageUrl(request.imageUrl());
        item.setType(request.type());
        item.setStatus(ItemStatus.AVAILABLE);
        item.setConsumable(request.type() == ItemType.CONSUMABLE || request.type() == ItemType.HYBRID);
        item.setLendable(request.type() == ItemType.LENDABLE || request.type() == ItemType.HYBRID);
        item.setTotalStock(BigDecimal.ZERO);
        item.setAvailableStock(BigDecimal.ZERO);
        item.setReservedStock(BigDecimal.ZERO);
        item.setLoanedStock(BigDecimal.ZERO);
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
        item.setName(request.name());
        item.setDescription(request.description());
        item.setImageUrl(request.imageUrl());
        item.setStatus(request.status());
        item.setCategory(categoryRepository.findByIdAndOrganizationId(UUID.fromString(request.categoryId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Categoria no encontrada.")));
        item.setUnit(unitRepository.findByIdAndOrganizationId(UUID.fromString(request.unitId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "UNIT_NOT_FOUND", "Unidad no encontrada.")));
        item.setPrimaryLocation(locationRepository.findByIdAndOrganizationId(UUID.fromString(request.primaryLocationId()), currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "LOCATION_NOT_FOUND", "Ubicacion no encontrada.")));
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
        return itemRepository.findByIdAndOrganizationId(id, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ITEM_NOT_FOUND", "Item no encontrado."));
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
                item.getLastMovementAt()
        );
    }
}
