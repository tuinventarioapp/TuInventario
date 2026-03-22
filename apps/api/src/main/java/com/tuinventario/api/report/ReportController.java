package com.tuinventario.api.report;

import com.lowagie.text.Document;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LoanEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final MediaType CSV_UTF8 = new MediaType("text", "csv", StandardCharsets.UTF_8);

    private final CurrentContextService currentContextService;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;
    private final LocationRepository locationRepository;

    @GetMapping(value = "/inventory.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> inventoryCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        ReportRange range = resolveRange(fromDate, toDate);
        return csvResponse("inventario-operativo.csv", buildInventoryCsv(locationId, false, range));
    }

    @GetMapping(value = "/inventory-admin.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> inventoryAdminCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        currentContextService.requireAdmin();
        ReportRange range = resolveRange(fromDate, toDate);
        return csvResponse("inventario-administrativo.csv", buildInventoryCsv(locationId, true, range));
    }

    @GetMapping(value = "/loans.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> loansCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        ReportRange range = resolveRange(fromDate, toDate);
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        List<LoanEntity> loans = scopedLoans(effectiveLocationId, range);

        List<List<String>> rows = new ArrayList<>();
        for (LoanEntity loan : loans) {
            ItemEntity item = loan.getLoanRequest() == null ? null : loan.getLoanRequest().getItem();
            rows.add(List.of(
                    loan.getBorrower().getName(),
                    item == null ? "" : item.getName(),
                    item == null ? "" : item.getPrimaryLocation().getName(),
                    loan.getStatus().name(),
                    loan.getDueAt() == null ? "" : formatInstant(loan.getDueAt()),
                    loan.getLoanedAt() == null ? "" : formatInstant(loan.getLoanedAt()),
                    loan.getReturnedAt() == null ? "" : formatInstant(loan.getReturnedAt()),
                    loan.getNotes() == null ? "" : loan.getNotes()
            ));
        }

        String content = buildCsvDocument(
                "Prestamos",
                effectiveLocationId == null ? "Toda la empresa" : resolveLocationName(effectiveLocationId),
                range.label(),
                List.of("Prestatario", "Articulo", "Sede", "Estado", "Fecha de vencimiento", "Fecha de entrega", "Fecha de cierre", "Notas"),
                rows
        );
        return csvResponse("prestamos.csv", content);
    }

    @GetMapping(value = "/inventory.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> inventoryPdf(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        return buildInventoryPdf(locationId, false, resolveRange(fromDate, toDate));
    }

    @GetMapping(value = "/inventory-admin.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> inventoryAdminPdf(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate
    ) {
        currentContextService.requireAdmin();
        return buildInventoryPdf(locationId, true, resolveRange(fromDate, toDate));
    }

    private ResponseEntity<String> csvResponse(String fileName, String content) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(CSV_UTF8)
                .body(content);
    }

    private String buildInventoryCsv(UUID locationId, boolean adminView, ReportRange range) {
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        List<ItemEntity> items = scopedItems(effectiveLocationId, range);
        List<List<String>> rows = new ArrayList<>();

        for (ItemEntity item : items) {
            if (adminView) {
                rows.add(List.of(
                        item.getPrimaryLocation().getName(),
                        item.getName(),
                        item.getSku(),
                        item.getCategory().getName(),
                        item.getUnit().getName(),
                        item.getStatus().name(),
                        formatDecimal(item.getTotalStock()),
                        formatDecimal(item.getAvailableStock()),
                        formatDecimal(item.getReservedStock()),
                        formatDecimal(item.getLoanedStock()),
                        formatDecimal(item.getDamagedStock()),
                        formatInstant(item.getLastMovementAt())
                ));
            } else {
                rows.add(List.of(
                        item.getName(),
                        item.getSku(),
                        item.getCategory().getName(),
                        item.getStatus().name(),
                        formatDecimal(item.getAvailableStock()),
                        formatDecimal(item.getLoanedStock()),
                        formatDecimal(item.getDamagedStock()),
                        item.getPrimaryLocation().getName(),
                        formatInstant(item.getLastMovementAt())
                ));
            }
        }

        String title = adminView ? "Inventario administrativo" : "Inventario operativo";
        List<String> headers = adminView
                ? List.of("Sede", "Articulo", "SKU", "Categoria", "Unidad", "Estado", "Stock total", "Disponible", "Reservado", "Prestado", "Danado", "Ultimo movimiento")
                : List.of("Articulo", "SKU", "Categoria", "Estado", "Disponible", "Prestado", "Danado", "Sede", "Ultimo movimiento");

        return buildCsvDocument(
                title,
                effectiveLocationId == null ? "Toda la empresa" : resolveLocationName(effectiveLocationId),
                range.label(),
                headers,
                rows
        );
    }

    private ResponseEntity<byte[]> buildInventoryPdf(UUID locationId, boolean adminView, ReportRange range) {
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        List<ItemEntity> items = scopedItems(effectiveLocationId, range);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate(), 24, 24, 24, 24);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

            document.add(new Paragraph(adminView ? "Inventario administrativo" : "Inventario operativo", titleFont));
            document.add(new Paragraph("Alcance: " + (effectiveLocationId == null ? "Toda la empresa" : resolveLocationName(effectiveLocationId)), subtitleFont));
            document.add(new Paragraph("Periodo: " + range.label(), subtitleFont));
            document.add(new Paragraph("Generado por: " + currentContextService.currentActorEntity().getFullName(), subtitleFont));
            document.add(new Paragraph("Fecha: " + formatInstant(Instant.now()), subtitleFont));
            document.add(new Paragraph(" "));

            List<String> headers = adminView
                    ? List.of("Sede", "Articulo", "SKU", "Categoria", "Unidad", "Estado", "Total", "Disponible", "Reservado", "Prestado", "Danado", "Ultimo movimiento")
                    : List.of("Articulo", "SKU", "Categoria", "Estado", "Disponible", "Prestado", "Danado", "Sede", "Ultimo movimiento");

            PdfPTable table = new PdfPTable(headers.size());
            table.setWidthPercentage(100f);
            for (String header : headers) {
                table.addCell(headerCell(header, headerFont));
            }

            for (ItemEntity item : items) {
                if (adminView) {
                    table.addCell(bodyCell(item.getPrimaryLocation().getName(), bodyFont));
                    table.addCell(bodyCell(item.getName(), bodyFont));
                    table.addCell(bodyCell(item.getSku(), bodyFont));
                    table.addCell(bodyCell(item.getCategory().getName(), bodyFont));
                    table.addCell(bodyCell(item.getUnit().getName(), bodyFont));
                    table.addCell(bodyCell(item.getStatus().name(), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getTotalStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getAvailableStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getReservedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getLoanedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getDamagedStock()), bodyFont));
                    table.addCell(bodyCell(formatInstant(item.getLastMovementAt()), bodyFont));
                } else {
                    table.addCell(bodyCell(item.getName(), bodyFont));
                    table.addCell(bodyCell(item.getSku(), bodyFont));
                    table.addCell(bodyCell(item.getCategory().getName(), bodyFont));
                    table.addCell(bodyCell(item.getStatus().name(), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getAvailableStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getLoanedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getDamagedStock()), bodyFont));
                    table.addCell(bodyCell(item.getPrimaryLocation().getName(), bodyFont));
                    table.addCell(bodyCell(formatInstant(item.getLastMovementAt()), bodyFont));
                }
            }

            document.add(table);
            document.close();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + (adminView ? "inventario-administrativo.pdf" : "inventario-operativo.pdf"))
                    .body(outputStream.toByteArray());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF_GENERATION_ERROR", "No fue posible generar el PDF.");
        }
    }

    private List<ItemEntity> scopedItems(UUID effectiveLocationId, ReportRange range) {
        return itemRepository.search(currentContextService.currentUser().organizationId(), "", org.springframework.data.domain.PageRequest.of(0, 1000))
                .stream()
                .filter(item -> effectiveLocationId == null || item.getPrimaryLocation().getId().equals(effectiveLocationId))
                .filter(item -> matchesRange(resolveItemActivityAt(item), range))
                .sorted(Comparator.comparing((ItemEntity item) -> item.getPrimaryLocation().getName())
                        .thenComparing(ItemEntity::getName))
                .toList();
    }

    private List<LoanEntity> scopedLoans(UUID effectiveLocationId, ReportRange range) {
        return loanRepository.findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .filter(loan -> {
                    ItemEntity item = loan.getLoanRequest() == null ? null : loan.getLoanRequest().getItem();
                    return effectiveLocationId == null || item != null && item.getPrimaryLocation().getId().equals(effectiveLocationId);
                })
                .filter(loan -> loanMatchesRange(loan, range))
                .sorted(Comparator.comparing((LoanEntity loan) -> {
                    ItemEntity item = loan.getLoanRequest() == null ? null : loan.getLoanRequest().getItem();
                    return item == null ? "" : item.getPrimaryLocation().getName();
                }).thenComparing(LoanEntity::getCreatedAt).reversed())
                .toList();
    }

    private boolean loanMatchesRange(LoanEntity loan, ReportRange range) {
        if (!range.hasBounds()) {
            return true;
        }
        Instant start = loan.getCreatedAt();
        Instant end = loan.getReturnedAt();
        boolean afterStart = range.fromInclusive() == null || end == null || !end.isBefore(range.fromInclusive());
        boolean beforeEnd = range.toExclusive() == null || start.isBefore(range.toExclusive());
        return afterStart && beforeEnd;
    }

    private Instant resolveItemActivityAt(ItemEntity item) {
        return item.getLastMovementAt() == null ? item.getCreatedAt() : item.getLastMovementAt();
    }

    private boolean matchesRange(Instant instant, ReportRange range) {
        if (!range.hasBounds() || instant == null) {
            return range.hasBounds() ? instant != null : true;
        }
        boolean afterStart = range.fromInclusive() == null || !instant.isBefore(range.fromInclusive());
        boolean beforeEnd = range.toExclusive() == null || instant.isBefore(range.toExclusive());
        return afterStart && beforeEnd;
    }

    private String buildCsvDocument(String title, String scopeLabel, String rangeLabel, List<String> headers, List<List<String>> rows) {
        StringBuilder builder = new StringBuilder();
        builder.append('\uFEFF');
        builder.append("sep=;\n");
        builder.append(csvRow(List.of("Reporte", title)));
        builder.append(csvRow(List.of("Generado por", currentContextService.currentActorEntity().getFullName())));
        builder.append(csvRow(List.of("Fecha", formatInstant(Instant.now()))));
        builder.append(csvRow(List.of("Alcance", scopeLabel)));
        builder.append(csvRow(List.of("Periodo", rangeLabel)));
        builder.append('\n');
        builder.append(csvRow(headers));
        for (List<String> row : rows) {
            builder.append(csvRow(row));
        }
        return builder.toString();
    }

    private String csvRow(List<String> values) {
        return values.stream().map(this::csvCell).collect(Collectors.joining(";")) + "\n";
    }

    private String csvCell(String value) {
        String safeValue = value == null ? "" : value;
        return "\"" + safeValue.replace("\"", "\"\"") + "\"";
    }

    private PdfPCell headerCell(String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value, font));
        cell.setPadding(6f);
        return cell;
    }

    private PdfPCell bodyCell(String value, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(value == null ? "" : value, font));
        cell.setPadding(5f);
        return cell;
    }

    private String resolveLocationName(UUID locationId) {
        return locationRepository.findByIdAndOrganizationId(locationId, currentContextService.currentUser().organizationId())
                .map(LocationEntity::getName)
                .orElse("Ubicacion");
    }

    private ReportRange resolveRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REPORT_RANGE", "La fecha inicial no puede ser mayor que la fecha final.");
        }
        ZoneId zoneId = ZoneId.of(currentContextService.currentOrganizationEntity().getTimezone());
        Instant fromInclusive = fromDate == null ? null : fromDate.atStartOfDay(zoneId).toInstant();
        Instant toExclusive = toDate == null ? null : toDate.plusDays(1).atStartOfDay(zoneId).toInstant();
        String label;
        if (fromDate == null && toDate == null) {
            label = "Todo el historial";
        } else if (fromDate != null && toDate != null) {
            label = fromDate.format(DateTimeFormatter.ISO_LOCAL_DATE) + " a " + toDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        } else if (fromDate != null) {
            label = "Desde " + fromDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        } else {
            label = "Hasta " + toDate.format(DateTimeFormatter.ISO_LOCAL_DATE);
        }
        return new ReportRange(fromInclusive, toExclusive, label);
    }

    private String formatDecimal(BigDecimal value) {
        return value == null ? "" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatInstant(Instant instant) {
        if (instant == null) {
            return "";
        }
        String timezone = currentContextService.currentOrganizationEntity().getTimezone();
        return DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")
                .withZone(ZoneId.of(timezone))
                .format(instant);
    }

    private record ReportRange(Instant fromInclusive, Instant toExclusive, String label) {
        private boolean hasBounds() {
            return fromInclusive != null || toExclusive != null;
        }
    }
}
