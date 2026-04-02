package com.tuinventario.api.inventory;

import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.DataValidation;
import org.apache.poi.ss.usermodel.DataValidationConstraint;
import org.apache.poi.ss.usermodel.DataValidationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellRangeAddressList;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.helpers.ColumnHelper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ItemImportTemplateService {

    private static final String TEMPLATE_RESOURCE = "templates/plantilla-carga-masiva-articulos-v1.0.xlsx";

    private final CurrentContextService currentContextService;
    private final CategoryRepository categoryRepository;
    private final UnitRepository unitRepository;
    private final LocationRepository locationRepository;

    public byte[] generateTemplate(Locale locale) {
        currentContextService.requireManagerOrAdmin();
        UUID organizationId = currentContextService.currentUser().organizationId();
        boolean admin = currentContextService.currentUser().isAdmin();

        List<String> categories = categoryRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .map(CategoryEntity::getName)
                .toList();
        List<String> units = unitRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .map(UnitEntity::getName)
                .toList();
        List<String> locations = admin
                ? locationRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream().map(LocationEntity::getName).toList()
                : List.of(currentContextService.assignedLocationOrThrow().getName());

        ItemImportLocalization texts = ItemImportLocalization.from(locale);

        try (InputStream inputStream = new ClassPathResource(TEMPLATE_RESOURCE).getInputStream();
             Workbook workbook = new XSSFWorkbook(inputStream);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Sheet articlesSheet = workbook.getSheet("Articulos");
            Sheet instructionsSheet = rebuildSheet(workbook, "Instrucciones");
            Sheet listsSheet = rebuildSheet(workbook, "Listas");

            if (articlesSheet == null || instructionsSheet == null || listsSheet == null) {
                throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "IMPORT_TEMPLATE_INVALID", "La plantilla base de carga masiva no es valida.");
            }

            configureArticlesSheet(articlesSheet, admin);
            configureInstructionsSheet(instructionsSheet, texts, admin, categories, units, locations);
            configureListsSheet(listsSheet, texts, categories, units, locations);
            configureDataValidations(articlesSheet, listsSheet, admin);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "IMPORT_TEMPLATE_UNAVAILABLE", "No fue posible preparar la plantilla de carga masiva.");
        }
    }

    private Sheet rebuildSheet(Workbook workbook, String name) {
        int existingIndex = workbook.getSheetIndex(name);
        if (existingIndex >= 0) {
            workbook.removeSheetAt(existingIndex);
        } else {
            existingIndex = workbook.getNumberOfSheets();
        }
        Sheet sheet = workbook.createSheet(name);
        workbook.setSheetOrder(name, existingIndex);
        return sheet;
    }

    private void configureArticlesSheet(Sheet sheet, boolean admin) {
        Row header = sheet.getRow(0);
        if (header == null) {
            header = sheet.createRow(0);
        }
        String[] columns = {"sku", "nombre", "tipo_articulo", "categoria", "unidad", "ubicacion_principal", "stock_inicial", "stock_minimo", "estado", "descripcion"};
        for (int index = 0; index < columns.length; index++) {
            if (header.getCell(index) == null) {
                header.createCell(index);
            }
            header.getCell(index).setCellValue(columns[index]);
        }
        if (header.getCell(10) == null) {
            header.createCell(10);
        }
        header.getCell(10).setBlank();
        applyColumnHidden(sheet, 10, true);
        applyColumnHidden(sheet, 5, !admin);
    }

    private void applyColumnHidden(Sheet sheet, int zeroBasedIndex, boolean hidden) {
        sheet.setColumnHidden(zeroBasedIndex, hidden);
        if (sheet instanceof XSSFSheet xssfSheet) {
            ColumnHelper columnHelper = new ColumnHelper(xssfSheet.getCTWorksheet());
            columnHelper.setColHidden(zeroBasedIndex + 1L, hidden);
        }
    }

    private void configureInstructionsSheet(
            Sheet sheet,
            ItemImportLocalization texts,
            boolean admin,
            List<String> categories,
            List<String> units,
            List<String> locations
    ) {
        writeInstruction(sheet, 0, 0, texts.templateTitle());
        writeInstruction(sheet, 2, 0, texts.howToUseTitle());
        writeInstruction(sheet, 3, 0, texts.stepDownload());
        writeInstruction(sheet, 4, 0, texts.stepOneRowPerItem());
        writeInstruction(sheet, 5, 0, texts.stepSku());
        writeInstruction(sheet, 6, 0, texts.stepMatches());
        writeInstruction(sheet, 7, 0, texts.stepUpload());
        writeInstruction(sheet, 9, 0, texts.requiredFieldsLabel());
        writeInstruction(sheet, 9, 1, texts.requiredFieldsValue(admin));
        writeInstruction(sheet, 10, 0, texts.optionalFieldsLabel());
        writeInstruction(sheet, 10, 1, texts.optionalFieldsValue(admin));
        writeInstruction(sheet, 12, 0, texts.validTypesLabel());
        writeInstruction(sheet, 12, 1, String.join(", ", texts.localizedItemTypes()));
        writeInstruction(sheet, 13, 0, texts.validStatusLabel());
        writeInstruction(sheet, 13, 1, String.join(", ", texts.localizedStatuses()));
        writeInstruction(sheet, 14, 0, texts.validCategoriesLabel());
        writeInstruction(sheet, 14, 1, joinOrFallback(categories, texts.emptyCatalogValue()));
        writeInstruction(sheet, 15, 0, texts.validUnitsLabel());
        writeInstruction(sheet, 15, 1, joinOrFallback(units, texts.emptyCatalogValue()));
        writeInstruction(sheet, 16, 0, texts.validLocationsLabel());
        writeInstruction(
                sheet,
                16,
                1,
                admin
                        ? joinOrFallback(locations, texts.emptyCatalogValue())
                        : texts.managerLocationHint(locations.getFirst())
        );
    }

    private void configureListsSheet(
            Sheet sheet,
            ItemImportLocalization texts,
            List<String> categories,
            List<String> units,
            List<String> locations
    ) {
        writeInstruction(sheet, 0, 0, "tipo_articulo");
        writeInstruction(sheet, 0, 1, "estado");
        writeInstruction(sheet, 0, 2, "categoria");
        writeInstruction(sheet, 0, 3, "unidad");
        writeInstruction(sheet, 0, 4, "ubicacion_principal");

        clearSheetRows(sheet, 1);

        int maxRows = Math.max(
                Math.max(texts.localizedItemTypes().size(), texts.localizedStatuses().size()),
                Math.max(categories.size(), Math.max(units.size(), locations.size()))
        );
        for (int index = 0; index < maxRows; index++) {
            Row row = sheet.getRow(index + 1);
            if (row == null) {
                row = sheet.createRow(index + 1);
            }
            writeValue(row, 0, valueAt(texts.localizedItemTypes(), index));
            writeValue(row, 1, valueAt(texts.localizedStatuses(), index));
            writeValue(row, 2, valueAt(categories, index));
            writeValue(row, 3, valueAt(units, index));
            writeValue(row, 4, valueAt(locations, index));
        }
    }

    private void configureDataValidations(Sheet articlesSheet, Sheet listsSheet, boolean admin) {
        DataValidationHelper helper = articlesSheet.getDataValidationHelper();
        addValidation(helper, articlesSheet, "=Listas!$A$2:$A$4", 1, 500, 2, 2);
        addValidation(helper, articlesSheet, "=Listas!$B$2:$B$7", 1, 500, 8, 8);
        addValidation(helper, articlesSheet, "=Listas!$C$2:$C$501", 1, 500, 3, 3);
        addValidation(helper, articlesSheet, "=Listas!$D$2:$D$501", 1, 500, 4, 4);
        if (admin) {
            addValidation(helper, articlesSheet, "=Listas!$E$2:$E$501", 1, 500, 5, 5);
        }
        articlesSheet.getDataValidations().forEach(validation -> validation.setEmptyCellAllowed(true));
        listsSheet.autoSizeColumn(0);
        listsSheet.autoSizeColumn(1);
        listsSheet.autoSizeColumn(2);
        listsSheet.autoSizeColumn(3);
        listsSheet.autoSizeColumn(4);
    }

    private void addValidation(DataValidationHelper helper, Sheet sheet, String formula, int firstRow, int lastRow, int firstCol, int lastCol) {
        CellRangeAddressList addressList = new CellRangeAddressList(firstRow, lastRow, firstCol, lastCol);
        DataValidationConstraint constraint = helper.createFormulaListConstraint(formula);
        DataValidation validation = helper.createValidation(constraint, addressList);
        validation.setSuppressDropDownArrow(false);
        validation.setShowErrorBox(true);
        validation.setEmptyCellAllowed(true);
        sheet.addValidationData(validation);
    }

    private void clearSheetRows(Sheet sheet, int fromRow) {
        List<Integer> rowsToClear = new ArrayList<>();
        for (int rowIndex = fromRow; rowIndex <= sheet.getLastRowNum(); rowIndex++) {
            rowsToClear.add(rowIndex);
        }
        rowsToClear.forEach(rowIndex -> {
            Row row = sheet.getRow(rowIndex);
            if (row != null) {
                sheet.removeRow(row);
            }
        });
    }

    private void writeInstruction(Sheet sheet, int rowIndex, int columnIndex, String value) {
        Row row = sheet.getRow(rowIndex);
        if (row == null) {
            row = sheet.createRow(rowIndex);
        }
        writeValue(row, columnIndex, value);
    }

    private void writeValue(Row row, int columnIndex, String value) {
        if (row.getCell(columnIndex) == null) {
            row.createCell(columnIndex);
        }
        row.getCell(columnIndex).setCellValue(value == null ? "" : value);
    }

    private String joinOrFallback(List<String> values, String fallback) {
        return values.isEmpty() ? fallback : String.join(", ", values);
    }

    private String valueAt(List<String> values, int index) {
        return index < values.size() ? values.get(index) : "";
    }
}
