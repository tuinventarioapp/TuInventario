package com.tuinventario.api.inventory;

import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
import com.tuinventario.api.shared.model.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final ItemBulkImportService itemBulkImportService;
    private final ItemImportTemplateService itemImportTemplateService;

    @GetMapping
    public PageResponse<ItemDtos.ItemResponse> listItems(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) ItemStatus status,
            @RequestParam(required = false) ItemType type,
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String stockFilter,
            @RequestParam(required = false) java.math.BigDecimal minAvailableStock,
            @RequestParam(required = false) java.math.BigDecimal maxAvailableStock,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return itemService.listItems(query, categoryId, status, type, locationId, stockFilter, minAvailableStock, maxAvailableStock, page, size);
    }

    @GetMapping("/{id}")
    public ItemDtos.ItemResponse getItem(@PathVariable UUID id) {
        return itemService.getItem(id);
    }

    @PostMapping
    public ItemDtos.ItemResponse createItem(@Valid @RequestBody ItemDtos.CreateItemRequest request) {
        return itemService.createItem(request);
    }

    @PutMapping("/{id}")
    public ItemDtos.ItemResponse updateItem(@PathVariable UUID id, @Valid @RequestBody ItemDtos.UpdateItemRequest request) {
        return itemService.updateItem(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteItem(@PathVariable UUID id) {
        itemService.deleteItem(id);
    }

    @GetMapping(value = "/import/template", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    public ResponseEntity<ByteArrayResource> downloadImportTemplate(java.util.Locale locale) {
        byte[] bytes = itemImportTemplateService.generateTemplate(locale);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"plantilla-carga-masiva-articulos-v1.0.xlsx\"")
                .contentLength(bytes.length)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new ByteArrayResource(bytes));
    }

    @PostMapping(value = "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemImportDtos.ImportPreviewResponse previewImport(@RequestParam("file") MultipartFile file) {
        return itemBulkImportService.preview(file);
    }

    @PostMapping(value = "/import/commit", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ItemImportDtos.ImportCommitResponse commitImport(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "updateSkus", required = false) List<String> updateSkus
    ) {
        return itemBulkImportService.commit(file, updateSkus);
    }
}
