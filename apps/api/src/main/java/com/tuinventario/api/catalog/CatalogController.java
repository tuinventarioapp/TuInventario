package com.tuinventario.api.catalog;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/categories")
    public List<CatalogDtos.CatalogOptionResponse> categories() {
        return catalogService.listCategories();
    }

    @PostMapping("/categories")
    public CatalogDtos.CatalogOptionResponse createCategory(@Valid @RequestBody CatalogDtos.CreateCategoryRequest request) {
        return catalogService.createCategory(request);
    }

    @GetMapping("/units")
    public List<CatalogDtos.CatalogOptionResponse> units() {
        return catalogService.listUnits();
    }

    @PostMapping("/units")
    public CatalogDtos.CatalogOptionResponse createUnit(@Valid @RequestBody CatalogDtos.CreateUnitRequest request) {
        return catalogService.createUnit(request);
    }

    @GetMapping("/locations")
    public List<CatalogDtos.CatalogOptionResponse> locations() {
        return catalogService.listLocations();
    }

    @PostMapping("/locations")
    public CatalogDtos.CatalogOptionResponse createLocation(@Valid @RequestBody CatalogDtos.CreateLocationRequest request) {
        return catalogService.createLocation(request);
    }

    @GetMapping("/borrowers")
    public List<CatalogDtos.BorrowerResponse> borrowers() {
        return catalogService.listBorrowers();
    }

    @GetMapping("/public-items")
    public List<CatalogDtos.CatalogOptionResponse> publicItems(@RequestParam UUID organizationId) {
        return catalogService.listPublicLoanableItems(organizationId);
    }

    @PostMapping("/borrowers")
    public CatalogDtos.BorrowerResponse createBorrower(@Valid @RequestBody CatalogDtos.BorrowerRequest request) {
        return catalogService.createBorrower(request);
    }

    @PutMapping("/borrowers/{id}")
    public CatalogDtos.BorrowerResponse updateBorrower(@PathVariable UUID id, @Valid @RequestBody CatalogDtos.UpdateBorrowerRequest request) {
        return catalogService.updateBorrower(id, request);
    }

    @DeleteMapping("/borrowers/{id}")
    public void deleteBorrower(@PathVariable UUID id) {
        catalogService.deleteBorrower(id);
    }
}
