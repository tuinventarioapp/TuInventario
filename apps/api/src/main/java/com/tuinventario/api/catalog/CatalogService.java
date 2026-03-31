package com.tuinventario.api.catalog;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationCategoryEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.LoanRequestStatus;
import com.tuinventario.api.domain.enums.LoanStatus;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.repository.BorrowerRepository;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
import com.tuinventario.api.domain.repository.LoanRequestRepository;
import com.tuinventario.api.domain.repository.LocationCategoryRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.MembershipRepository;
import com.tuinventario.api.domain.repository.StockMovementRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private static final int ITEM_BATCH_SIZE = 200;

    private final CurrentContextService currentContextService;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationCategoryRepository locationCategoryRepository;
    private final LocationRepository locationRepository;
    private final BorrowerRepository borrowerRepository;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;
    private final LoanRequestRepository loanRequestRepository;
    private final MembershipRepository membershipRepository;
    private final StockMovementRepository stockMovementRepository;

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listCategories() {
        return categoryRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(category -> new CatalogDtos.CatalogOptionResponse(
                        category.getId().toString(),
                        category.getName(),
                        category.getDescription(),
                        null,
                        null
                ))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createCategory(CatalogDtos.CreateCategoryRequest request) {
        currentContextService.requireAdmin();
        validateCategoryName(request.name(), null);
        CategoryEntity entity = new CategoryEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name().trim());
        entity.setDescription(normalizeOptional(request.description()));
        categoryRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getDescription(), null, null);
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse updateCategory(UUID categoryId, CatalogDtos.UpdateCategoryRequest request) {
        currentContextService.requireAdmin();
        CategoryEntity entity = categoryRepository.findByIdAndOrganizationId(categoryId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Categoria no encontrada."));
        validateCategoryName(request.name(), categoryId);
        entity.setName(request.name().trim());
        entity.setDescription(normalizeOptional(request.description()));
        categoryRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getDescription(), null, null);
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        currentContextService.requireAdmin();
        if (itemRepository.existsByOrganizationIdAndCategoryIdAndDeletedAtIsNull(currentContextService.currentUser().organizationId(), categoryId)) {
            throw new ApiException(HttpStatus.CONFLICT, "CATEGORY_IN_USE", "No puedes eliminar una categoria que ya esta en uso.");
        }
        CategoryEntity entity = categoryRepository.findByIdAndOrganizationId(categoryId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Categoria no encontrada."));
        categoryRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listUnits() {
        return unitRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(unit -> new CatalogDtos.CatalogOptionResponse(
                        unit.getId().toString(),
                        unit.getName(),
                        unit.getSymbol(),
                        Boolean.toString(unit.isAllowsDecimal()),
                        null
                ))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createUnit(CatalogDtos.CreateUnitRequest request) {
        currentContextService.requireAdmin();
        validateUnitName(request.name(), null);
        UnitEntity entity = new UnitEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name().trim());
        entity.setSymbol(request.symbol().trim());
        entity.setAllowsDecimal(request.allowsDecimal());
        unitRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getSymbol(), Boolean.toString(entity.isAllowsDecimal()), null);
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse updateUnit(UUID unitId, CatalogDtos.UpdateUnitRequest request) {
        currentContextService.requireAdmin();
        UnitEntity entity = unitRepository.findByIdAndOrganizationId(unitId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "UNIT_NOT_FOUND", "Unidad no encontrada."));
        validateUnitName(request.name(), unitId);
        entity.setName(request.name().trim());
        entity.setSymbol(request.symbol().trim());
        entity.setAllowsDecimal(request.allowsDecimal());
        unitRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getSymbol(), Boolean.toString(entity.isAllowsDecimal()), null);
    }

    @Transactional
    public void deleteUnit(UUID unitId) {
        currentContextService.requireAdmin();
        if (itemRepository.existsByOrganizationIdAndUnitIdAndDeletedAtIsNull(currentContextService.currentUser().organizationId(), unitId)) {
            throw new ApiException(HttpStatus.CONFLICT, "UNIT_IN_USE", "No puedes eliminar una unidad que ya esta en uso.");
        }
        UnitEntity entity = unitRepository.findByIdAndOrganizationId(unitId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "UNIT_NOT_FOUND", "Unidad no encontrada."));
        unitRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listLocationCategories() {
        return locationCategoryRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(category -> new CatalogDtos.CatalogOptionResponse(
                        category.getId().toString(),
                        category.getName(),
                        category.getDescription(),
                        null,
                        null
                ))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createLocationCategory(CatalogDtos.CreateLocationCategoryRequest request) {
        currentContextService.requireAdmin();
        validateLocationCategoryName(request.name(), null);
        LocationCategoryEntity entity = new LocationCategoryEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name().trim());
        entity.setDescription(normalizeOptional(request.description()));
        locationCategoryRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getDescription(), null, null);
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse updateLocationCategory(UUID locationCategoryId, CatalogDtos.UpdateLocationCategoryRequest request) {
        currentContextService.requireAdmin();
        LocationCategoryEntity entity = findLocationCategory(locationCategoryId);
        validateLocationCategoryName(request.name(), locationCategoryId);
        entity.setName(request.name().trim());
        entity.setDescription(normalizeOptional(request.description()));
        locationCategoryRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getDescription(), null, null);
    }

    @Transactional
    public void deleteLocationCategory(UUID locationCategoryId) {
        currentContextService.requireAdmin();
        UUID organizationId = currentContextService.currentUser().organizationId();
        if (locationRepository.existsByOrganizationIdAndLocationCategoryId(organizationId, locationCategoryId)) {
            throw new ApiException(HttpStatus.CONFLICT, "LOCATION_CATEGORY_IN_USE", "No puedes eliminar una categoria de ubicacion que ya tiene sedes asociadas.");
        }
        locationCategoryRepository.delete(findLocationCategory(locationCategoryId));
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listLocations() {
        return locationRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(location -> new CatalogDtos.CatalogOptionResponse(
                        location.getId().toString(),
                        location.getName(),
                        location.getLocationCategory().getName(),
                        location.getDescription(),
                        location.getLocationCategory().getId().toString()
                ))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createLocation(CatalogDtos.CreateLocationRequest request) {
        currentContextService.requireAdmin();
        validateLocationName(request.name(), null);
        LocationCategoryEntity locationCategory = findLocationCategory(UUID.fromString(request.locationCategoryId()));
        LocationEntity entity = new LocationEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name().trim());
        entity.setType(LocationType.OTHER);
        entity.setLocationCategory(locationCategory);
        entity.setDescription(normalizeOptional(request.description()));
        locationRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(
                entity.getId().toString(),
                entity.getName(),
                entity.getLocationCategory().getName(),
                entity.getDescription(),
                entity.getLocationCategory().getId().toString()
        );
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse updateLocation(UUID locationId, CatalogDtos.UpdateLocationRequest request) {
        currentContextService.requireAdmin();
        LocationEntity entity = locationRepository.findByIdAndOrganizationId(locationId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
        validateLocationName(request.name(), locationId);
        LocationCategoryEntity locationCategory = findLocationCategory(UUID.fromString(request.locationCategoryId()));
        entity.setName(request.name().trim());
        entity.setType(LocationType.OTHER);
        entity.setLocationCategory(locationCategory);
        entity.setDescription(normalizeOptional(request.description()));
        locationRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(
                entity.getId().toString(),
                entity.getName(),
                entity.getLocationCategory().getName(),
                entity.getDescription(),
                entity.getLocationCategory().getId().toString()
        );
    }

    @Transactional
    public void deleteLocation(UUID locationId) {
        currentContextService.requireAdmin();
        UUID organizationId = currentContextService.currentUser().organizationId();
        boolean locationInUse = itemRepository.existsByOrganizationIdAndPrimaryLocationIdAndDeletedAtIsNull(organizationId, locationId)
                || membershipRepository.existsByOrganizationIdAndAssignedLocationId(organizationId, locationId)
                || stockMovementRepository.existsByOrganizationIdAndSourceLocationId(organizationId, locationId)
                || stockMovementRepository.existsByOrganizationIdAndTargetLocationId(organizationId, locationId);
        if (locationInUse) {
            throw new ApiException(HttpStatus.CONFLICT, "LOCATION_IN_USE", "No puedes eliminar una ubicacion que ya tiene inventario, usuarios o movimientos asociados.");
        }
        LocationEntity entity = locationRepository.findByIdAndOrganizationId(locationId, organizationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOCATION_NOT_FOUND", "Ubicacion no encontrada."));
        locationRepository.delete(entity);
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.BorrowerResponse> listBorrowers(String query) {
        String safeQuery = query == null ? "" : query.trim();
        return borrowerRepository.searchActiveByOrganizationIdAndName(currentContextService.currentUser().organizationId(), safeQuery)
                .stream()
                .map(this::mapBorrower)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listPublicLoanableItems(UUID organizationId) {
        return fetchAllItems(organizationId)
                .stream()
                .filter(ItemEntity::isLendable)
                .filter(item -> item.getAvailableStock().compareTo(BigDecimal.ZERO) > 0)
                .filter(item -> item.getStatus() != ItemStatus.ARCHIVED && item.getStatus() != ItemStatus.LOST && item.getStatus() != ItemStatus.MAINTENANCE)
                .map(item -> new CatalogDtos.CatalogOptionResponse(
                        item.getId().toString(),
                        item.getName(),
                        item.getAvailableStock().toPlainString(),
                        item.getPrimaryLocation().getName(),
                        item.getPrimaryLocation().getId().toString()
                ))
                .toList();
    }

    private List<ItemEntity> fetchAllItems(UUID organizationId) {
        List<ItemEntity> items = new ArrayList<>();
        Page<ItemEntity> currentPage;
        int page = 0;
        do {
            currentPage = itemRepository.search(organizationId, "", PageRequest.of(page, ITEM_BATCH_SIZE));
            items.addAll(currentPage.getContent());
            page++;
        } while (currentPage.hasNext());
        return items;
    }

    @Transactional
    public CatalogDtos.BorrowerResponse createBorrower(CatalogDtos.BorrowerRequest request) {
        currentContextService.requireManagerOrAdmin();
        BorrowerEntity entity = new BorrowerEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name().trim());
        entity.setEmail(normalizeOptional(request.email()));
        entity.setPhone(normalizeOptional(request.phone()));
        entity.setNotes(normalizeOptional(request.notes()));
        borrowerRepository.save(entity);
        return mapBorrower(entity);
    }

    @Transactional
    public CatalogDtos.BorrowerResponse updateBorrower(UUID borrowerId, CatalogDtos.UpdateBorrowerRequest request) {
        currentContextService.requireManagerOrAdmin();
        BorrowerEntity entity = findBorrower(borrowerId);
        entity.setName(request.name().trim());
        entity.setEmail(normalizeOptional(request.email()));
        entity.setPhone(normalizeOptional(request.phone()));
        entity.setNotes(normalizeOptional(request.notes()));
        borrowerRepository.save(entity);
        return mapBorrower(entity);
    }

    @Transactional
    public void deleteBorrower(UUID borrowerId) {
        currentContextService.requireManagerOrAdmin();
        BorrowerEntity entity = findBorrower(borrowerId);
        UUID organizationId = currentContextService.currentUser().organizationId();
        boolean hasPendingRequests = loanRequestRepository.existsByBorrowerIdAndOrganizationIdAndStatus(
                borrowerId,
                organizationId,
                LoanRequestStatus.PENDING
        );
        boolean hasActiveLoans = loanRepository.existsByBorrowerIdAndOrganizationIdAndStatusIn(
                borrowerId,
                organizationId,
                List.of(LoanStatus.APPROVED, LoanStatus.DELIVERED, LoanStatus.OVERDUE)
        );
        if (hasPendingRequests || hasActiveLoans) {
            throw new ApiException(HttpStatus.CONFLICT, "BORROWER_ACTIVE_LOANS", "No puedes eliminar un prestatario con solicitudes o prestamos activos.");
        }
        entity.setDeletedAt(Instant.now());
        borrowerRepository.save(entity);
    }

    private BorrowerEntity findBorrower(UUID borrowerId) {
        return borrowerRepository.findByIdAndOrganizationIdAndDeletedAtIsNull(borrowerId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BORROWER_NOT_FOUND", "Prestatario no encontrado."));
    }

    private LocationCategoryEntity findLocationCategory(UUID locationCategoryId) {
        return locationCategoryRepository.findByIdAndOrganizationId(locationCategoryId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "LOCATION_CATEGORY_NOT_FOUND", "Categoria de ubicacion no encontrada."));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void validateCategoryName(String name, UUID currentCategoryId) {
        String normalized = name.trim();
        if (categoryRepository.existsByOrganizationIdAndNameIgnoreCase(currentContextService.currentUser().organizationId(), normalized)) {
            if (currentCategoryId == null || categoryRepository.findByIdAndOrganizationId(currentCategoryId, currentContextService.currentUser().organizationId())
                    .filter(existing -> !existing.getName().equalsIgnoreCase(normalized))
                    .isPresent()) {
                throw new ApiException(HttpStatus.CONFLICT, "CATEGORY_ALREADY_EXISTS", "Ya existe una categoria con ese nombre.");
            }
        }
    }

    private void validateUnitName(String name, UUID currentUnitId) {
        String normalized = name.trim();
        if (unitRepository.existsByOrganizationIdAndNameIgnoreCase(currentContextService.currentUser().organizationId(), normalized)) {
            if (currentUnitId == null || unitRepository.findByIdAndOrganizationId(currentUnitId, currentContextService.currentUser().organizationId())
                    .filter(existing -> !existing.getName().equalsIgnoreCase(normalized))
                    .isPresent()) {
                throw new ApiException(HttpStatus.CONFLICT, "UNIT_ALREADY_EXISTS", "Ya existe una unidad con ese nombre.");
            }
        }
    }

    private void validateLocationCategoryName(String name, UUID currentLocationCategoryId) {
        String normalized = name.trim();
        if (locationCategoryRepository.existsByOrganizationIdAndNameIgnoreCase(currentContextService.currentUser().organizationId(), normalized)) {
            if (currentLocationCategoryId == null || locationCategoryRepository.findByIdAndOrganizationId(currentLocationCategoryId, currentContextService.currentUser().organizationId())
                    .filter(existing -> !existing.getName().equalsIgnoreCase(normalized))
                    .isPresent()) {
                throw new ApiException(HttpStatus.CONFLICT, "LOCATION_CATEGORY_ALREADY_EXISTS", "Ya existe una categoria de ubicacion con ese nombre.");
            }
        }
    }

    private void validateLocationName(String name, UUID currentLocationId) {
        String normalized = name.trim();
        if (locationRepository.existsByOrganizationIdAndNameIgnoreCase(currentContextService.currentUser().organizationId(), normalized)) {
            if (currentLocationId == null || locationRepository.findByIdAndOrganizationId(currentLocationId, currentContextService.currentUser().organizationId())
                    .filter(existing -> !existing.getName().equalsIgnoreCase(normalized))
                    .isPresent()) {
                throw new ApiException(HttpStatus.CONFLICT, "LOCATION_ALREADY_EXISTS", "Ya existe una ubicacion con ese nombre.");
            }
        }
    }

    private CatalogDtos.BorrowerResponse mapBorrower(BorrowerEntity entity) {
        return new CatalogDtos.BorrowerResponse(
                entity.getId().toString(),
                entity.getName(),
                entity.getEmail(),
                entity.getPhone(),
                entity.getNotes()
        );
    }
}
