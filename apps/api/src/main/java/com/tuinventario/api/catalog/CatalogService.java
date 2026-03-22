package com.tuinventario.api.catalog;

import com.tuinventario.api.domain.entity.BorrowerEntity;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.repository.BorrowerRepository;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
import com.tuinventario.api.domain.repository.LoanRequestRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final CurrentContextService currentContextService;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationRepository locationRepository;
    private final BorrowerRepository borrowerRepository;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;
    private final LoanRequestRepository loanRequestRepository;

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listCategories() {
        return categoryRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(category -> new CatalogDtos.CatalogOptionResponse(category.getId().toString(), category.getName(), category.getDescription()))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createCategory(CatalogDtos.CreateCategoryRequest request) {
        currentContextService.requireManagerOrAdmin();
        CategoryEntity entity = new CategoryEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name());
        entity.setDescription(request.description());
        categoryRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getDescription());
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listUnits() {
        return unitRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(unit -> new CatalogDtos.CatalogOptionResponse(unit.getId().toString(), unit.getName(), unit.getSymbol()))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createUnit(CatalogDtos.CreateUnitRequest request) {
        currentContextService.requireManagerOrAdmin();
        UnitEntity entity = new UnitEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name());
        entity.setSymbol(request.symbol());
        entity.setAllowsDecimal(request.allowsDecimal());
        unitRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getSymbol());
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listLocations() {
        return locationRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(location -> new CatalogDtos.CatalogOptionResponse(location.getId().toString(), location.getName(), location.getType().name()))
                .toList();
    }

    @Transactional
    public CatalogDtos.CatalogOptionResponse createLocation(CatalogDtos.CreateLocationRequest request) {
        currentContextService.requireManagerOrAdmin();
        LocationEntity entity = new LocationEntity();
        entity.setOrganization(currentContextService.currentOrganizationEntity());
        entity.setName(request.name());
        entity.setType(request.type() == null ? LocationType.OTHER : request.type());
        entity.setDescription(request.description());
        locationRepository.save(entity);
        return new CatalogDtos.CatalogOptionResponse(entity.getId().toString(), entity.getName(), entity.getType().name());
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.BorrowerResponse> listBorrowers() {
        return borrowerRepository.findByOrganizationIdOrderByNameAsc(currentContextService.currentUser().organizationId())
                .stream()
                .map(this::mapBorrower)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CatalogDtos.CatalogOptionResponse> listPublicLoanableItems(UUID organizationId) {
        return itemRepository.search(organizationId, "", org.springframework.data.domain.PageRequest.of(0, 100))
                .stream()
                .filter(ItemEntity::isLendable)
                .filter(item -> item.getAvailableStock().compareTo(BigDecimal.ZERO) > 0)
                .filter(item -> item.getStatus() != ItemStatus.ARCHIVED && item.getStatus() != ItemStatus.LOST && item.getStatus() != ItemStatus.MAINTENANCE)
                .map(item -> new CatalogDtos.CatalogOptionResponse(
                        item.getId().toString(),
                        item.getName(),
                        item.getAvailableStock().toPlainString()
                ))
                .toList();
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
        boolean hasHistory = loanRepository.existsByBorrowerIdAndOrganizationId(borrowerId, organizationId)
                || loanRequestRepository.existsByBorrowerIdAndOrganizationId(borrowerId, organizationId);
        if (hasHistory) {
            throw new ApiException(HttpStatus.CONFLICT, "BORROWER_HAS_HISTORY", "No puedes eliminar un prestatario con prestamos o solicitudes registradas.");
        }
        borrowerRepository.delete(entity);
    }

    private BorrowerEntity findBorrower(UUID borrowerId) {
        return borrowerRepository.findByIdAndOrganizationId(borrowerId, currentContextService.currentUser().organizationId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BORROWER_NOT_FOUND", "Prestatario no encontrado."));
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
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
