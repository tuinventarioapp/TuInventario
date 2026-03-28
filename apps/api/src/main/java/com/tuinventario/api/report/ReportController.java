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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private static final MediaType CSV_UTF8 = new MediaType("text", "csv", StandardCharsets.UTF_8);
    private static final int ITEM_BATCH_SIZE = 250;

    private final CurrentContextService currentContextService;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;
    private final LocationRepository locationRepository;

    @GetMapping(value = "/inventory.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> inventoryCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            Locale locale
    ) {
        ReportLocalization texts = ReportLocalization.from(locale);
        ReportRange range = resolveRange(fromDate, toDate, texts);
        return csvResponse(texts.inventoryCsvFile(false), buildInventoryCsv(locationId, false, range, texts));
    }

    @GetMapping(value = "/inventory-admin.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> inventoryAdminCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            Locale locale
    ) {
        currentContextService.requireAdmin();
        ReportLocalization texts = ReportLocalization.from(locale);
        ReportRange range = resolveRange(fromDate, toDate, texts);
        return csvResponse(texts.inventoryCsvFile(true), buildInventoryCsv(locationId, true, range, texts));
    }

    @GetMapping(value = "/loans.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public ResponseEntity<String> loansCsv(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            Locale locale
    ) {
        ReportLocalization texts = ReportLocalization.from(locale);
        ReportRange range = resolveRange(fromDate, toDate, texts);
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        List<LoanEntity> loans = scopedLoans(effectiveLocationId, range);

        List<List<String>> rows = new ArrayList<>();
        for (LoanEntity loan : loans) {
            ItemEntity item = loan.getLoanRequest() == null ? null : loan.getLoanRequest().getItem();
            rows.add(List.of(
                    loan.getBorrower().getName(),
                    item == null ? "" : item.getName(),
                    item == null ? "" : item.getPrimaryLocation().getName(),
                    texts.loanStatus(loan.getStatus()),
                    loan.getDueAt() == null ? "" : formatInstant(loan.getDueAt(), texts),
                    loan.getLoanedAt() == null ? "" : formatInstant(loan.getLoanedAt(), texts),
                    loan.getReturnedAt() == null ? "" : formatInstant(loan.getReturnedAt(), texts),
                    loan.getNotes() == null ? "" : loan.getNotes()
            ));
        }

        String content = buildCsvDocument(
                texts.loansTitle(),
                effectiveLocationId == null ? texts.wholeOrganization() : resolveLocationName(effectiveLocationId, texts),
                range.label(),
                texts.loanHeaders(),
                rows
                ,
                texts
        );
        return csvResponse(texts.loansCsvFile(), content);
    }

    @GetMapping(value = "/inventory.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> inventoryPdf(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            Locale locale
    ) {
        ReportLocalization texts = ReportLocalization.from(locale);
        return buildInventoryPdf(locationId, false, resolveRange(fromDate, toDate, texts), texts);
    }

    @GetMapping(value = "/inventory-admin.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> inventoryAdminPdf(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            Locale locale
    ) {
        currentContextService.requireAdmin();
        ReportLocalization texts = ReportLocalization.from(locale);
        return buildInventoryPdf(locationId, true, resolveRange(fromDate, toDate, texts), texts);
    }

    private ResponseEntity<String> csvResponse(String fileName, String content) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(CSV_UTF8)
                .body(content);
    }

    private String buildInventoryCsv(UUID locationId, boolean adminView, ReportRange range, ReportLocalization texts) {
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
                        texts.itemStatus(item.getStatus()),
                        formatDecimal(item.getTotalStock()),
                        formatDecimal(item.getAvailableStock()),
                        formatDecimal(item.getReservedStock()),
                        formatDecimal(item.getLoanedStock()),
                        formatDecimal(item.getDamagedStock()),
                        formatInstant(item.getLastMovementAt(), texts)
                ));
            } else {
                rows.add(List.of(
                        item.getName(),
                        item.getSku(),
                        item.getCategory().getName(),
                        texts.itemStatus(item.getStatus()),
                        formatDecimal(item.getAvailableStock()),
                        formatDecimal(item.getLoanedStock()),
                        formatDecimal(item.getDamagedStock()),
                        item.getPrimaryLocation().getName(),
                        formatInstant(item.getLastMovementAt(), texts)
                ));
            }
        }

        return buildCsvDocument(
                texts.inventoryTitle(adminView),
                effectiveLocationId == null ? texts.wholeOrganization() : resolveLocationName(effectiveLocationId, texts),
                range.label(),
                texts.inventoryHeaders(adminView),
                rows,
                texts
        );
    }

    private ResponseEntity<byte[]> buildInventoryPdf(UUID locationId, boolean adminView, ReportRange range, ReportLocalization texts) {
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

            document.add(new Paragraph(texts.inventoryTitle(adminView), titleFont));
            document.add(new Paragraph(texts.scopeLabel() + ": " + (effectiveLocationId == null ? texts.wholeOrganization() : resolveLocationName(effectiveLocationId, texts)), subtitleFont));
            document.add(new Paragraph(texts.periodLabel() + ": " + range.label(), subtitleFont));
            document.add(new Paragraph(texts.generatedByLabel() + ": " + currentContextService.currentActorEntity().getFullName(), subtitleFont));
            document.add(new Paragraph(texts.generatedAtLabel() + ": " + formatInstant(Instant.now(), texts), subtitleFont));
            document.add(new Paragraph(" "));

            List<String> headers = texts.inventoryHeaders(adminView);

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
                    table.addCell(bodyCell(texts.itemStatus(item.getStatus()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getTotalStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getAvailableStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getReservedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getLoanedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getDamagedStock()), bodyFont));
                    table.addCell(bodyCell(formatInstant(item.getLastMovementAt(), texts), bodyFont));
                } else {
                    table.addCell(bodyCell(item.getName(), bodyFont));
                    table.addCell(bodyCell(item.getSku(), bodyFont));
                    table.addCell(bodyCell(item.getCategory().getName(), bodyFont));
                    table.addCell(bodyCell(texts.itemStatus(item.getStatus()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getAvailableStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getLoanedStock()), bodyFont));
                    table.addCell(bodyCell(formatDecimal(item.getDamagedStock()), bodyFont));
                    table.addCell(bodyCell(item.getPrimaryLocation().getName(), bodyFont));
                    table.addCell(bodyCell(formatInstant(item.getLastMovementAt(), texts), bodyFont));
                }
            }

            document.add(table);
            document.close();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + texts.inventoryPdfFile(adminView))
                    .body(outputStream.toByteArray());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF_GENERATION_ERROR", texts.pdfGenerationErrorMessage());
        }
    }

    private List<ItemEntity> scopedItems(UUID effectiveLocationId, ReportRange range) {
        return fetchAllItems(currentContextService.currentUser().organizationId())
                .stream()
                .filter(item -> effectiveLocationId == null || item.getPrimaryLocation().getId().equals(effectiveLocationId))
                .filter(item -> matchesRange(resolveItemActivityAt(item), range))
                .sorted(Comparator.comparing((ItemEntity item) -> item.getPrimaryLocation().getName())
                        .thenComparing(ItemEntity::getName))
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

    private String buildCsvDocument(String title, String scopeLabel, String rangeLabel, List<String> headers, List<List<String>> rows, ReportLocalization texts) {
        StringBuilder builder = new StringBuilder();
        builder.append('\uFEFF');
        builder.append("sep=;\n");
        builder.append(csvRow(List.of(texts.reportLabel(), title)));
        builder.append(csvRow(List.of(texts.generatedByLabel(), currentContextService.currentActorEntity().getFullName())));
        builder.append(csvRow(List.of(texts.generatedAtLabel(), formatInstant(Instant.now(), texts))));
        builder.append(csvRow(List.of(texts.scopeLabel(), scopeLabel)));
        builder.append(csvRow(List.of(texts.periodLabel(), rangeLabel)));
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

    private String resolveLocationName(UUID locationId, ReportLocalization texts) {
        return locationRepository.findByIdAndOrganizationId(locationId, currentContextService.currentUser().organizationId())
                .map(LocationEntity::getName)
                .orElse(texts.locationFallback());
    }

    private ReportRange resolveRange(LocalDate fromDate, LocalDate toDate, ReportLocalization texts) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_REPORT_RANGE", texts.invalidRangeMessage());
        }
        ZoneId zoneId = ZoneId.of(currentContextService.currentOrganizationEntity().getTimezone());
        Instant fromInclusive = fromDate == null ? null : fromDate.atStartOfDay(zoneId).toInstant();
        Instant toExclusive = toDate == null ? null : toDate.plusDays(1).atStartOfDay(zoneId).toInstant();
        return new ReportRange(fromInclusive, toExclusive, texts.rangeLabel(fromDate, toDate));
    }

    private String formatDecimal(BigDecimal value) {
        return value == null ? "" : value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }

    private String formatInstant(Instant instant, ReportLocalization texts) {
        if (instant == null) {
            return "";
        }
        String timezone = currentContextService.currentOrganizationEntity().getTimezone();
        return texts.formatInstant(instant, timezone);
    }

    private record ReportRange(Instant fromInclusive, Instant toExclusive, String label) {
        private boolean hasBounds() {
            return fromInclusive != null || toExclusive != null;
        }
    }
}
