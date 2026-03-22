package com.tuinventario.api.report;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
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
import org.springframework.web.bind.annotation.RestController;

import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final CurrentContextService currentContextService;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;

    @GetMapping(value = "/inventory.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public String inventoryCsv() {
        StringBuilder builder = new StringBuilder("name,sku,availableStock,reservedStock,loanedStock,status\n");
        itemRepository.search(currentContextService.currentUser().organizationId(), null, org.springframework.data.domain.PageRequest.of(0, 1000))
                .forEach(item -> builder.append(item.getName()).append(',')
                        .append(item.getSku()).append(',')
                        .append(item.getAvailableStock()).append(',')
                        .append(item.getReservedStock()).append(',')
                        .append(item.getLoanedStock()).append(',')
                        .append(item.getStatus()).append('\n'));
        return builder.toString();
    }

    @GetMapping(value = "/loans.csv", produces = "text/csv")
    @Transactional(readOnly = true)
    public String loansCsv() {
        StringBuilder builder = new StringBuilder("borrower,status,dueAt,loanedAt,returnedAt\n");
        loanRepository.findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId())
                .forEach(loan -> builder.append(loan.getBorrower().getName()).append(',')
                        .append(loan.getStatus()).append(',')
                        .append(loan.getDueAt()).append(',')
                        .append(loan.getLoanedAt()).append(',')
                        .append(loan.getReturnedAt()).append('\n'));
        return builder.toString();
    }

    @GetMapping(value = "/inventory.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Transactional(readOnly = true)
    public ResponseEntity<byte[]> inventoryPdf() {
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, outputStream);
            document.open();
            document.add(new Paragraph("Reporte de inventario - TuInventario"));
            document.add(new Paragraph(" "));
            itemRepository.search(currentContextService.currentUser().organizationId(), null, org.springframework.data.domain.PageRequest.of(0, 1000))
                    .forEach(item -> {
                        try {
                            document.add(new Paragraph(item.getName() + " | SKU: " + item.getSku() + " | Disponible: " + item.getAvailableStock()));
                        } catch (DocumentException e) {
                            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF_GENERATION_ERROR", "No fue posible generar el PDF.");
                        }
                    });
            document.close();
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=inventory-report.pdf")
                    .body(outputStream.toByteArray());
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "PDF_GENERATION_ERROR", "No fue posible generar el PDF.");
        }
    }
}
