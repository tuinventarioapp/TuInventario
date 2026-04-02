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
import com.tuinventario.api.shared.service.AuditService;
import com.tuinventario.api.shared.service.CurrentContextService;
import com.tuinventario.api.shared.service.RealtimePublisher;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemBulkImportService {

    private static final String SHEET_NAME = "Articulos";
    private static final List<String> REQUIRED_COLUMNS = List.of("sku", "nombre", "tipo_articulo", "categoria", "unidad", "ubicacion_principal", "stock_inicial", "stock_minimo");
    private static final List<String> OPTIONAL_COLUMNS = List.of("estado", "descripcion");

    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationRepository locationRepository;
    private final StockMovementRepository stockMovementRepository;
    private final CurrentContextService currentContextService;
    private final AuditService auditService;
    private final RealtimePublisher realtimePublisher;

    @Transactional(readOnly = true)
    public ItemImportDtos.ImportPreviewResponse preview(MultipartFile file) {
        ParsedImport parsed = parse(file);
        return new ItemImportDtos.ImportPreviewResponse(
                parsed.fileName,
                new ItemImportDtos.Summary(parsed.newItems, parsed.matches, parsed.errors, parsed.rows.size(), 0, 0, 0),
                parsed.rows.stream().map(row -> new ItemImportDtos.PreviewRow(
                        row.rowNumber,
                        row.sku,
                        row.itemName,
                        row.existingItemName,
                        row.status,
                        row.suggestedAction,
                        row.canUpdate,
                        List.copyOf(row.errors)
                )).toList()
        );
    }

    @Transactional
    public ItemImportDtos.ImportCommitResponse commit(MultipartFile file, List<String> updateSkus) {
        ParsedImport parsed = parse(file);
        Set<String> selectedSkus = updateSkus == null ? Set.of() : updateSkus.stream().map(this::normalizeSku).collect(Collectors.toSet());
        List<ItemImportDtos.ResultRow> rows = new ArrayList<>();
        int created = 0;
        int updated = 0;
        int omitted = 0;
        int errors = 0;

        for (PreviewRowInternal row : parsed.rows) {
            if (!row.errors.isEmpty()) {
                errors++;
                rows.add(new ItemImportDtos.ResultRow(row.rowNumber, row.sku, row.itemName, "ERROR", List.copyOf(row.errors)));
                continue;
            }
            if (row.existingItem != null && !selectedSkus.contains(row.normalizedSku)) {
                omitted++;
                rows.add(new ItemImportDtos.ResultRow(row.rowNumber, row.sku, row.itemName, "OMITTED", List.of("La coincidencia por SKU no fue seleccionada para actualizar.")));
                continue;
            }
            if (row.existingItem == null) {
                ItemEntity createdItem = createItemFromImport(row);
                created++;
                rows.add(new ItemImportDtos.ResultRow(row.rowNumber, row.sku, createdItem.getName(), "CREATED", List.of("Articulo creado correctamente.")));
            } else {
                ItemEntity updatedItem = updateItemFromImport(row);
                updated++;
                rows.add(new ItemImportDtos.ResultRow(row.rowNumber, row.sku, updatedItem.getName(), "UPDATED", List.of("Articulo existente actualizado correctamente.")));
            }
        }

        return new ItemImportDtos.ImportCommitResponse(
                new ItemImportDtos.Summary(parsed.newItems, parsed.matches, errors, parsed.rows.size(), created, updated, omitted),
                rows
        );
    }

    private ParsedImport parse(MultipartFile file) {
        validateFile(file);
        UUID organizationId = currentContextService.currentUser().organizationId();
        CatalogContext context = loadCatalogContext(organizationId);
        Map<String, List<ItemEntity>> existingBySku = itemRepository.findByOrganizationIdAndDeletedAtIsNull(organizationId).stream()
                .collect(Collectors.groupingBy(item -> normalizeSku(item.getSku())));

        try (InputStream inputStream = file.getInputStream(); Workbook workbook = WorkbookFactory.create(inputStream)) {
            Sheet sheet = workbook.getSheet(SHEET_NAME);
            if (sheet == null) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_SHEET_MISSING", "La hoja Articulos no existe en el archivo cargado.");
            }

            Map<String, Integer> headerIndexes = resolveHeaderIndexes(sheet);
            List<PreviewRowInternal> rows = new ArrayList<>();
            for (int rowIndex = 1; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
                rows.add(parseRow(sheet.getRow(rowIndex), rowIndex + 1, headerIndexes, context, existingBySku));
            }
            markDuplicatedSkus(rows);

            int newItems = 0;
            int matches = 0;
            int errors = 0;
            for (PreviewRowInternal row : rows) {
                if (!row.errors.isEmpty()) {
                    row.status = "ERROR";
                    row.suggestedAction = "ERROR";
                    row.canUpdate = false;
                    errors++;
                } else if (row.existingItem != null) {
                    row.status = "MATCH";
                    row.suggestedAction = "UPDATE_EXISTING";
                    row.canUpdate = true;
                    matches++;
                } else {
                    row.status = "CREATE";
                    row.suggestedAction = "CREATE_NEW";
                    newItems++;
                }
            }
            return new ParsedImport(file.getOriginalFilename() == null ? "carga-masiva.xlsx" : file.getOriginalFilename(), rows, newItems, matches, errors);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_FILE_INVALID", "No fue posible leer el archivo Excel. Verifica que sea una plantilla .xlsx valida.");
        }
    }

    private PreviewRowInternal parseRow(Row row, int rowNumber, Map<String, Integer> headerIndexes, CatalogContext context, Map<String, List<ItemEntity>> existingBySku) {
        if (row == null || isEmptyRow(row, headerIndexes)) {
            return PreviewRowInternal.error(rowNumber, "", "", "La fila esta vacia.");
        }

        PreviewRowInternal preview = new PreviewRowInternal();
        preview.rowNumber = rowNumber;
        preview.sku = readCell(row, headerIndexes.get("sku"));
        preview.itemName = readCell(row, headerIndexes.get("nombre"));
        preview.normalizedSku = preview.sku == null || preview.sku.isBlank() ? "" : normalizeSku(preview.sku);

        String typeValue = readCell(row, headerIndexes.get("tipo_articulo"));
        String categoryValue = readCell(row, headerIndexes.get("categoria"));
        String unitValue = readCell(row, headerIndexes.get("unidad"));
        String locationValue = readCell(row, headerIndexes.get("ubicacion_principal"));
        String initialStockValue = readCell(row, headerIndexes.get("stock_inicial"));
        String minimumStockValue = readCell(row, headerIndexes.get("stock_minimo"));
        String statusValue = readCell(row, headerIndexes.getOrDefault("estado", -1));
        boolean admin = currentContextService.currentUser().isAdmin();

        requireValue(preview, preview.sku, "El SKU es obligatorio.");
        requireValue(preview, preview.itemName, "El nombre es obligatorio.");
        requireValue(preview, typeValue, "El tipo de articulo es obligatorio.");
        requireValue(preview, categoryValue, "La categoria es obligatoria.");
        requireValue(preview, unitValue, "La unidad es obligatoria.");
        if (admin) {
            requireValue(preview, locationValue, "La ubicacion principal es obligatoria.");
        }
        requireValue(preview, initialStockValue, "El stock inicial es obligatorio.");
        requireValue(preview, minimumStockValue, "El stock minimo es obligatorio.");

        preview.itemType = parseItemType(typeValue, preview);
        preview.itemStatus = parseItemStatus(statusValue, preview);
        preview.category = resolveCategory(categoryValue, context, preview);
        preview.unit = resolveUnit(unitValue, context, preview);
        preview.location = resolveLocation(locationValue, context, preview);
        preview.initialStock = parseQuantity(initialStockValue, "stock_inicial", preview);
        preview.minimumStock = parseQuantity(minimumStockValue, "stock_minimo", preview);
        preview.description = normalizeOptional(readCell(row, headerIndexes.getOrDefault("descripcion", -1)));

        if (preview.unit != null) {
            validateDecimals(preview.initialStock, preview.unit, "stock_inicial", preview);
            validateDecimals(preview.minimumStock, preview.unit, "stock_minimo", preview);
        }

        if (!preview.errors.isEmpty()) {
            return preview;
        }

        List<ItemEntity> matches = existingBySku.getOrDefault(preview.normalizedSku, List.of());
        if (matches.size() > 1) {
            preview.errors.add("El SKU ya existe varias veces en el sistema. Debes resolverlo antes de usar la carga masiva.");
            return preview;
        }
        if (matches.size() == 1) {
            ItemEntity existingItem = matches.getFirst();
            if (!canAccessExistingItem(existingItem)) {
                preview.errors.add("El SKU ya existe en otra sede fuera de tu alcance operativo.");
                return preview;
            }
            if (existingItem.getReservedStock().compareTo(BigDecimal.ZERO) > 0 || existingItem.getLoanedStock().compareTo(BigDecimal.ZERO) > 0) {
                preview.errors.add("El articulo ya tiene stock reservado o en prestamo y no se puede actualizar por carga masiva.");
                return preview;
            }
            preview.existingItem = existingItem;
            preview.existingItemName = existingItem.getName();
        }

        return preview;
    }

    private ItemEntity createItemFromImport(PreviewRowInternal row) {
        ItemEntity item = new ItemEntity();
        item.setOrganization(currentContextService.currentOrganizationEntity());
        item.setCategory(row.category);
        item.setUnit(row.unit);
        item.setPrimaryLocation(row.location);
        item.setName(row.itemName.trim());
        item.setSku(row.normalizedSku);
        item.setDescription(row.description);
        item.setType(row.itemType);
        applyItemType(item, row.itemType);
        applyStockAndStatus(item, row.itemStatus, row.initialStock, row.minimumStock);
        item.setLastMovementAt(Instant.now());
        itemRepository.save(item);
        registerStockMovementForImport(item, row.initialStock, true);
        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "ITEM", item.getId(), "ITEM_BULK_CREATED", Map.of("sku", item.getSku(), "source", "excel-import"));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "item.created", Map.of("itemId", item.getId().toString()));
        return item;
    }

    private ItemEntity updateItemFromImport(PreviewRowInternal row) {
        ItemEntity item = row.existingItem;
        BigDecimal previousTotal = item.getTotalStock();
        item.setName(row.itemName.trim());
        item.setDescription(row.description);
        item.setCategory(row.category);
        item.setUnit(row.unit);
        item.setPrimaryLocation(row.location);
        item.setType(row.itemType);
        applyItemType(item, row.itemType);
        applyStockAndStatus(item, row.itemStatus, row.initialStock, row.minimumStock);
        item.setLastMovementAt(Instant.now());
        itemRepository.save(item);
        registerStockMovementForImport(item, row.initialStock.subtract(previousTotal), false);
        auditService.log(currentContextService.currentOrganizationEntity(), currentContextService.currentActorEntity(), "ITEM", item.getId(), "ITEM_BULK_UPDATED", Map.of("sku", item.getSku(), "source", "excel-import"));
        realtimePublisher.publish(currentContextService.currentUser().organizationId(), "item.updated", Map.of("itemId", item.getId().toString()));
        return item;
    }

    private void registerStockMovementForImport(ItemEntity item, BigDecimal quantityDelta, boolean creation) {
        if (quantityDelta == null || quantityDelta.compareTo(BigDecimal.ZERO) == 0) {
            return;
        }
        StockMovementEntity movement = new StockMovementEntity();
        movement.setOrganization(currentContextService.currentOrganizationEntity());
        movement.setItem(item);
        movement.setMovementType(quantityDelta.compareTo(BigDecimal.ZERO) >= 0 ? MovementType.ENTRY : MovementType.EXIT);
        movement.setQuantity(quantityDelta.abs());
        movement.setSourceLocation(quantityDelta.compareTo(BigDecimal.ZERO) >= 0 ? null : item.getPrimaryLocation());
        movement.setTargetLocation(quantityDelta.compareTo(BigDecimal.ZERO) >= 0 ? item.getPrimaryLocation() : null);
        movement.setReason(creation ? "Carga masiva inicial" : "Carga masiva de inventario");
        movement.setNotes("Actualizacion realizada desde carga masiva por Excel.");
        movement.setPerformedBy(currentContextService.currentActorEntity());
        movement.setOccurredAt(Instant.now());
        stockMovementRepository.save(movement);
    }

    private void applyStockAndStatus(ItemEntity item, ItemStatus status, BigDecimal totalStock, BigDecimal minimumStock) {
        item.setStatus(status);
        item.setMinimumStock(minimumStock);
        item.setTotalStock(totalStock);
        BigDecimal available = BigDecimal.ZERO;
        BigDecimal reserved = BigDecimal.ZERO;
        BigDecimal loaned = BigDecimal.ZERO;
        switch (status) {
            case AVAILABLE -> available = totalStock;
            case RESERVED -> reserved = totalStock;
            case ON_LOAN -> loaned = totalStock;
            case MAINTENANCE, LOST, ARCHIVED -> {
                available = BigDecimal.ZERO;
                reserved = BigDecimal.ZERO;
                loaned = BigDecimal.ZERO;
            }
        }
        item.setAvailableStock(available);
        item.setReservedStock(reserved);
        item.setLoanedStock(loaned);
    }

    private void applyItemType(ItemEntity item, ItemType itemType) {
        item.setConsumable(itemType == ItemType.CONSUMABLE || itemType == ItemType.HYBRID);
        item.setLendable(itemType == ItemType.LENDABLE || itemType == ItemType.HYBRID);
    }

    private boolean canAccessExistingItem(ItemEntity item) {
        if (currentContextService.currentUser().isAdmin()) {
            return true;
        }
        UUID assignedLocationId = currentContextService.currentUser().assignedLocationId();
        return assignedLocationId != null && assignedLocationId.equals(item.getPrimaryLocation().getId());
    }

    private CatalogContext loadCatalogContext(UUID organizationId) {
        Map<String, CategoryEntity> categories = categoryRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .collect(Collectors.toMap(category -> normalizeName(category.getName()), category -> category, (left, right) -> left, LinkedHashMap::new));
        Map<String, UnitEntity> units = unitRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .collect(Collectors.toMap(unit -> normalizeName(unit.getName()), unit -> unit, (left, right) -> left, LinkedHashMap::new));
        Map<String, LocationEntity> locations = locationRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .collect(Collectors.toMap(location -> normalizeName(location.getName()), location -> location, (left, right) -> left, LinkedHashMap::new));
        return new CatalogContext(categories, units, locations);
    }

    private CategoryEntity resolveCategory(String rawValue, CatalogContext context, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) return null;
        CategoryEntity category = context.categories.get(normalizeName(rawValue));
        if (category == null) row.errors.add("La categoria '" + rawValue + "' no existe en el sistema.");
        return category;
    }

    private UnitEntity resolveUnit(String rawValue, CatalogContext context, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) return null;
        UnitEntity unit = context.units.get(normalizeName(rawValue));
        if (unit == null) row.errors.add("La unidad '" + rawValue + "' no existe en el sistema.");
        return unit;
    }

    private LocationEntity resolveLocation(String rawValue, CatalogContext context, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) {
            if (currentContextService.currentUser().isAdmin()) {
                return null;
            }
            return currentContextService.assignedLocationOrThrow();
        }
        LocationEntity location = context.locations.get(normalizeName(rawValue));
        if (location == null) {
            row.errors.add("La ubicacion principal '" + rawValue + "' no existe en el sistema.");
            return null;
        }
        if (!currentContextService.currentUser().isAdmin() && currentContextService.currentUser().assignedLocationId() != null
                && !currentContextService.currentUser().assignedLocationId().equals(location.getId())) {
            row.errors.add("La ubicacion '" + rawValue + "' esta fuera de tu alcance operativo.");
            return null;
        }
        return location;
    }

    private ItemType parseItemType(String rawValue, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) return null;
        ItemType parsed = ItemImportLocalization.parseItemType(rawValue);
        if (parsed == null || parsed == ItemType.NON_LENDABLE) {
            row.errors.add("El tipo de articulo '" + rawValue + "' no es valido.");
        }
        return parsed;
    }

    private ItemStatus parseItemStatus(String rawValue, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) return ItemStatus.AVAILABLE;
        ItemStatus parsed = ItemImportLocalization.parseItemStatus(rawValue);
        if (parsed == null) {
            row.errors.add("El estado '" + rawValue + "' no es valido.");
        }
        return parsed;
    }

    private BigDecimal parseQuantity(String rawValue, String fieldName, PreviewRowInternal row) {
        if (rawValue == null || rawValue.isBlank()) return null;
        try {
            BigDecimal value = new BigDecimal(rawValue.trim().replace(",", "."));
            if (value.compareTo(BigDecimal.ZERO) < 0) {
                row.errors.add("El campo " + fieldName + " no puede ser negativo.");
            }
            return value;
        } catch (NumberFormatException exception) {
            row.errors.add("El campo " + fieldName + " debe ser numerico.");
            return null;
        }
    }

    private void validateDecimals(BigDecimal value, UnitEntity unit, String fieldName, PreviewRowInternal row) {
        if (value == null || unit.isAllowsDecimal()) return;
        if (value.stripTrailingZeros().scale() > 0) {
            row.errors.add("El campo " + fieldName + " no admite decimales para la unidad '" + unit.getName() + "'.");
        }
    }

    private void validateFile(MultipartFile file) {
        currentContextService.requireManagerOrAdmin();
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_FILE_REQUIRED", "Debes seleccionar un archivo Excel para continuar.");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_FILE_TYPE_INVALID", "La carga masiva solo acepta archivos .xlsx.");
        }
    }

    private Map<String, Integer> resolveHeaderIndexes(Sheet sheet) {
        Row headerRow = sheet.getRow(0);
        if (headerRow == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_HEADER_MISSING", "La hoja Articulos no tiene encabezados.");
        }
        Map<String, Integer> indexes = new LinkedHashMap<>();
        DataFormatter formatter = new DataFormatter();
        for (Cell cell : headerRow) {
            String header = formatter.formatCellValue(cell).trim().toLowerCase(Locale.ROOT);
            if (!header.isBlank()) {
                indexes.put(header, cell.getColumnIndex());
            }
        }
        List<String> missingColumns = REQUIRED_COLUMNS.stream().filter(column -> !indexes.containsKey(column)).toList();
        if (!missingColumns.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_COLUMNS_MISSING", "Faltan columnas requeridas: " + String.join(", ", missingColumns) + ".");
        }
        OPTIONAL_COLUMNS.forEach(column -> indexes.putIfAbsent(column, -1));
        return indexes;
    }

    private boolean isEmptyRow(Row row, Map<String, Integer> headerIndexes) {
        return headerIndexes.values().stream().filter(index -> index >= 0).map(index -> readCell(row, index)).allMatch(String::isBlank);
    }

    private String readCell(Row row, int columnIndex) {
        if (columnIndex < 0 || row == null) return "";
        DataFormatter formatter = new DataFormatter();
        Cell cell = row.getCell(columnIndex, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return cell == null ? "" : formatter.formatCellValue(cell).trim();
    }

    private void requireValue(PreviewRowInternal row, String value, String message) {
        if (value == null || value.isBlank()) {
            row.errors.add(message);
        }
    }

    private void markDuplicatedSkus(List<PreviewRowInternal> rows) {
        Map<String, Long> occurrences = rows.stream()
                .map(row -> row.normalizedSku)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.groupingBy(value -> value, Collectors.counting()));
        Set<String> duplicates = occurrences.entrySet().stream()
                .filter(entry -> entry.getValue() > 1)
                .map(Map.Entry::getKey)
                .collect(Collectors.toSet());
        rows.stream().filter(row -> duplicates.contains(row.normalizedSku)).forEach(row -> row.errors.add("El SKU esta duplicado dentro del mismo archivo."));
    }

    private String normalizeName(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeSku(String value) {
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private static final class CatalogContext {
        private final Map<String, CategoryEntity> categories;
        private final Map<String, UnitEntity> units;
        private final Map<String, LocationEntity> locations;

        private CatalogContext(Map<String, CategoryEntity> categories, Map<String, UnitEntity> units, Map<String, LocationEntity> locations) {
            this.categories = categories;
            this.units = units;
            this.locations = locations;
        }
    }

    private static final class ParsedImport {
        private final String fileName;
        private final List<PreviewRowInternal> rows;
        private final int newItems;
        private final int matches;
        private final int errors;

        private ParsedImport(String fileName, List<PreviewRowInternal> rows, int newItems, int matches, int errors) {
            this.fileName = fileName;
            this.rows = rows;
            this.newItems = newItems;
            this.matches = matches;
            this.errors = errors;
        }
    }

    private static final class PreviewRowInternal {
        private int rowNumber;
        private String sku;
        private String itemName;
        private String normalizedSku;
        private final List<String> errors = new ArrayList<>();
        private ItemEntity existingItem;
        private String existingItemName;
        private CategoryEntity category;
        private UnitEntity unit;
        private LocationEntity location;
        private ItemType itemType;
        private ItemStatus itemStatus;
        private BigDecimal initialStock;
        private BigDecimal minimumStock;
        private String description;
        private String status = "ERROR";
        private String suggestedAction = "ERROR";
        private boolean canUpdate;

        static PreviewRowInternal error(int rowNumber, String sku, String itemName, String message) {
            PreviewRowInternal row = new PreviewRowInternal();
            row.rowNumber = rowNumber;
            row.sku = sku;
            row.itemName = itemName;
            row.normalizedSku = sku == null ? "" : sku;
            row.errors.add(message);
            return row;
        }
    }
}
