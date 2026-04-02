package com.tuinventario.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.LocationCategoryEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LocationCategoryRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class OperationalFlowTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private ItemRepository itemRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UnitRepository unitRepository;

    @Autowired
    private LocationRepository locationRepository;

    @Autowired
    private LocationCategoryRepository locationCategoryRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private String adminToken;
    private String managerToken;
    private String collaboratorToken;

    @BeforeEach
    void authenticate() throws Exception {
        adminToken = login("admin@admin.com", "admin123");
        managerToken = login("trabajador@trabajador.com", "trabajador123");
        collaboratorToken = login("colaborador@colaborador.com", "colaborador123");
    }

    @Test
    void shouldExposeDashboardAndProtectedReportsForAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.activeLoans").value(greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.overdueLoans").value(greaterThanOrEqualTo(0)));

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(containsString("sep=;")))
                .andExpect(content().string(containsString("Reporte")))
                .andExpect(content().string(containsString("Inventario operativo")));

        mockMvc.perform(get("/api/v1/reports/inventory-admin.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(containsString("Inventario administrativo")))
                .andExpect(content().string(containsString("Stock total")));

        mockMvc.perform(get("/api/v1/reports/inventory-admin.csv")
                        .header("Authorization", "Bearer " + collaboratorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("Accept-Language", "en"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Report")))
                .andExpect(content().string(containsString("Operational inventory")))
                .andExpect(content().string(containsString("Available")));
    }

    @Test
    void shouldFilterReportsAndAuditLog() throws Exception {
        String borrowerId = createBorrower("Borrower Reporte " + System.nanoTime());
        String itemName = "Item Reporte " + System.nanoTime();
        String itemId = createItem(itemName, "REP-" + System.nanoTime(), 2);
        String loanRequestId = createLoanRequest(borrowerId, itemId, 1, Instant.now().plus(1, ChronoUnit.DAYS));
        approveLoanRequest(loanRequestId);
        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(itemName)));

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", tomorrow.toString())
                        .param("toDate", tomorrow.toString()))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString(itemName))));

        mockMvc.perform(get("/api/v1/reports/loans.csv")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Borrower Reporte")));

        mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("entityType", "ITEM")
                        .param("action", "ITEM_CREATED")
                        .param("actor", "Admin")
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void shouldRestrictAuditByRoleAndLocationScope() throws Exception {
        String localSku = "AUD-LOCAL-" + System.nanoTime();
        String remoteSku = "AUD-REMOTE-" + System.nanoTime();
        createItem("Item auditoria local " + System.nanoTime(), localSku, 1);
        String remoteLocationId = createLocation("Sucursal auditoria " + System.nanoTime());
        createItem("Item auditoria remota " + System.nanoTime(), remoteSku, 1, remoteLocationId);
        createUser("audit.user." + System.nanoTime() + "@tuinventario.local", "COLLABORATOR");
        LocalDate today = LocalDate.now();

        mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", "Bearer " + collaboratorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));

        String managerAudit = mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("entityType", "ITEM")
                        .param("action", "ITEM_CREATED")
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.junit.jupiter.api.Assertions.assertTrue(managerAudit.contains(localSku));
        org.junit.jupiter.api.Assertions.assertFalse(managerAudit.contains(remoteSku));

        mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("entityType", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        String adminAudit = mockMvc.perform(get("/api/v1/audit")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("entityType", "ITEM")
                        .param("action", "ITEM_CREATED")
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.junit.jupiter.api.Assertions.assertTrue(adminAudit.contains(localSku));
        org.junit.jupiter.api.Assertions.assertTrue(adminAudit.contains(remoteSku));
    }

    @Test
    void shouldNotSilentlyTruncatePublicCatalogOrInventoryReport() throws Exception {
        String markerName = createBulkItemsForCatalogAndReport(1005);

        mockMvc.perform(get("/api/v1/public-items")
                        .param("organizationId", organizationId().toString()))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(markerName)));

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(markerName)));
    }

    @Test
    void shouldPreviewAndCommitBulkItemImport() throws Exception {
        UUID organizationId = organizationId();
        CategoryEntity category = ensureCategory(organizationId);
        UnitEntity unit = ensureUnit(organizationId);
        String locationId = firstLocationId();
        String existingSku = "BULK-MATCH-" + System.nanoTime();
        String existingItemId = createItem("Item existente", existingSku, 3, locationId, 1);

        MockMultipartFile previewFile = new MockMultipartFile(
                "file",
                "plantilla-carga-masiva-articulos-v1.0.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        buildImportWorkbook(List.of(
                                List.of("BULK-NEW-" + System.nanoTime(), "Guantes nitrilo", "CONSUMABLE", category.getName(), unit.getName(), locationRepository.findById(UUID.fromString(locationId)).orElseThrow().getName(), "25", "5", "AVAILABLE", "Caja de guantes"),
                                List.of(existingSku, "Item existente actualizado", "LENDABLE", category.getName(), unit.getName(), locationRepository.findById(UUID.fromString(locationId)).orElseThrow().getName(), "8", "2", "AVAILABLE", "Actualizado desde Excel"),
                                List.of("BULK-ERR-" + System.nanoTime(), "Fila invalida", "LENDABLE", category.getName(), unit.getName(), locationRepository.findById(UUID.fromString(locationId)).orElseThrow().getName(), "-1", "0", "AVAILABLE", "")
                        ))
        );

        mockMvc.perform(multipart("/api/v1/items/import/preview")
                        .file(previewFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.newItems").value(1))
                .andExpect(jsonPath("$.summary.matches").value(1))
                .andExpect(jsonPath("$.summary.errors").value(1))
                .andExpect(jsonPath("$.rows[1].suggestedAction").value("UPDATE_EXISTING"));

        MockMultipartFile commitFile = new MockMultipartFile(
                "file",
                "plantilla-carga-masiva-articulos-v1.0.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                previewFile.getBytes()
        );

        mockMvc.perform(multipart("/api/v1/items/import/commit")
                        .file(commitFile)
                        .param("updateSkus", existingSku)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.created").value(1))
                .andExpect(jsonPath("$.summary.updated").value(1))
                .andExpect(jsonPath("$.summary.errors").value(1))
                .andExpect(jsonPath("$.rows[0].outcome").value("CREATED"))
                .andExpect(jsonPath("$.rows[1].outcome").value("UPDATED"))
                .andExpect(jsonPath("$.rows[2].outcome").value("ERROR"));

        List<ItemEntity> items = itemRepository.findByOrganizationIdAndDeletedAtIsNull(organizationId);
        org.junit.jupiter.api.Assertions.assertTrue(items.stream().anyMatch(item -> item.getSku().startsWith("BULK-NEW-")));
        ItemEntity updated = itemRepository.findById(UUID.fromString(existingItemId)).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Item existente actualizado", updated.getName());
        org.junit.jupiter.api.Assertions.assertEquals(0, updated.getTotalStock().compareTo(BigDecimal.valueOf(8)));
        org.junit.jupiter.api.Assertions.assertEquals(0, updated.getMinimumStock().compareTo(BigDecimal.valueOf(2)));
    }

    @Test
    void shouldFlagDuplicateSkusAndUnknownCatalogReferencesDuringBulkPreview() throws Exception {
        UUID organizationId = organizationId();
        CategoryEntity category = ensureCategory(organizationId);
        UnitEntity unit = ensureUnit(organizationId);
        String locationName = locationRepository.findByOrganizationIdOrderByNameAsc(organizationId).getFirst().getName();
        String duplicatedSku = "BULK-DUP-" + System.nanoTime();

        MockMultipartFile previewFile = new MockMultipartFile(
                "file",
                "plantilla-carga-masiva-articulos-v1.0.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        buildImportWorkbook(List.of(
                                List.of(duplicatedSku, "Fila uno", "CONSUMABLE", category.getName(), unit.getName(), locationName, "5", "1", "AVAILABLE", ""),
                                List.of(duplicatedSku, "Fila dos", "CONSUMABLE", "Categoria inexistente", unit.getName(), locationName, "4", "1", "AVAILABLE", "")
                        ))
        );

        String response = mockMvc.perform(multipart("/api/v1/items/import/preview")
                        .file(previewFile)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.errors").value(2))
                .andReturn()
                .getResponse()
                .getContentAsString();

        org.junit.jupiter.api.Assertions.assertTrue(response.contains("duplicado dentro del mismo archivo"));
        org.junit.jupiter.api.Assertions.assertTrue(response.contains("no existe en el sistema"));
    }

    @Test
    void shouldDownloadLocalizedTemplateAndAllowManagerLocationAutofill() throws Exception {
        UUID organizationId = organizationId();
        CategoryEntity category = ensureCategory(organizationId);
        UnitEntity unit = ensureUnit(organizationId);

        byte[] templateBytes = mockMvc.perform(get("/api/v1/items/import/template")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(templateBytes))) {
            var articlesSheet = workbook.getSheet("Articulos");
            var instructionsSheet = workbook.getSheet("Instrucciones");
            var listsSheet = workbook.getSheet("Listas");

            org.junit.jupiter.api.Assertions.assertEquals("descripcion", articlesSheet.getRow(0).getCell(9).getStringCellValue());
            org.junit.jupiter.api.Assertions.assertTrue(articlesSheet.isColumnHidden(10));
            org.junit.jupiter.api.Assertions.assertEquals("Consumible, Prestable, Hibrido", instructionsSheet.getRow(12).getCell(1).getStringCellValue());
            org.junit.jupiter.api.Assertions.assertTrue(instructionsSheet.getRow(14).getCell(1).getStringCellValue().contains(category.getName()));
            org.junit.jupiter.api.Assertions.assertEquals("Prestable", listsSheet.getRow(2).getCell(0).getStringCellValue());
            org.junit.jupiter.api.Assertions.assertEquals("Disponible", listsSheet.getRow(1).getCell(1).getStringCellValue());
        }

        byte[] managerTemplateBytes = mockMvc.perform(get("/api/v1/items/import/template")
                        .header("Authorization", "Bearer " + managerToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsByteArray();

        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(managerTemplateBytes))) {
            var articlesSheet = workbook.getSheet("Articulos");
            var instructionsSheet = workbook.getSheet("Instrucciones");

            org.junit.jupiter.api.Assertions.assertTrue(articlesSheet.isColumnHidden(5));
            org.junit.jupiter.api.Assertions.assertTrue(instructionsSheet.getRow(16).getCell(1).getStringCellValue().contains("ubicacion_principal vacio"));
        }

        String managerLocationName = locationRepository.findById(UUID.fromString(firstLocationId())).orElseThrow().getName();

        MockMultipartFile managerFile = new MockMultipartFile(
                "file",
                "plantilla-carga-masiva-articulos-v1.0.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                buildImportWorkbook(List.of(
                        List.of("BULK-MANAGER-" + System.nanoTime(), "Tomate roma", "Prestable", category.getName(), unit.getName(), "", "6", "2", "Disponible", "Se asigna a la sede del gestor")
                ))
        );

        mockMvc.perform(multipart("/api/v1/items/import/preview")
                        .file(managerFile)
                        .header("Authorization", "Bearer " + managerToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.newItems").value(1))
                .andExpect(jsonPath("$.summary.errors").value(0));

        String commitResponse = mockMvc.perform(multipart("/api/v1/items/import/commit")
                        .file(managerFile)
                        .header("Authorization", "Bearer " + managerToken)
                        .header("Accept-Language", "es"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.created").value(1))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String createdSku = objectMapper.readTree(commitResponse).get("rows").get(0).get("sku").asText();
        ItemEntity createdItem = itemRepository.findByOrganizationIdAndDeletedAtIsNull(organizationId).stream()
                .filter(item -> createdSku.equals(item.getSku()))
                .findFirst()
                .orElseThrow();
        String createdLocationName = locationRepository.findById(createdItem.getPrimaryLocation().getId()).orElseThrow().getName();
        org.junit.jupiter.api.Assertions.assertEquals(managerLocationName, createdLocationName);
    }

    @Test
    void shouldSupportEndToEndLoanFlow() throws Exception {
        String borrowerId = createBorrower("Borrower Flujo " + System.nanoTime());
        String itemId = createItem("Item Flujo", "FLOW-" + System.nanoTime(), 4);
        ItemEntity item = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();
        Instant dueAt = Instant.now().plus(2, ChronoUnit.DAYS);

        String requestResponse = mockMvc.perform(post("/api/v1/loan-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "borrowerId", borrowerId,
                                "itemId", item.getId().toString(),
                                "quantity", 1,
                                "dueAt", dueAt.toString(),
                                "notes", "Prestamo de prueba"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String loanRequestId = objectMapper.readTree(requestResponse).get("id").asText();

        String approveResponse = mockMvc.perform(post("/api/v1/loan-requests/{id}/approve", loanRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Solicitud aprobada"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String loanId = objectMapper.readTree(approveResponse).get("id").asText();

        mockMvc.perform(post("/api/v1/loans/{id}/deliver", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Entrega de prueba"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activeLoans").value(1));
    }

    @Test
    void shouldRequireReasonToRejectLoanRequest() throws Exception {
        String borrowerId = createBorrower("Borrower Rechazo " + System.nanoTime());
        String itemId = createItem("Item Rechazo " + System.nanoTime(), "REJ-" + System.nanoTime(), 2);
        String loanRequestId = createLoanRequest(borrowerId, itemId, 1, Instant.now().plus(2, ChronoUnit.DAYS));

        mockMvc.perform(post("/api/v1/loan-requests/{id}/reject", loanRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", ""))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("REJECTION_REASON_REQUIRED"));
    }

    @Test
    void shouldRejectLoanRequestAndKeepItInClosedHistory() throws Exception {
        String borrowerId = createBorrower("Borrower Rechazo Historial " + System.nanoTime());
        String itemSku = "REJ-HIST-" + System.nanoTime();
        String itemId = createItem("Item Rechazo Historial " + System.nanoTime(), itemSku, 3);
        String loanRequestId = createLoanRequest(borrowerId, itemId, 1, Instant.now().plus(3, ChronoUnit.DAYS));
        ItemEntity beforeReject = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();

        String rejectResponse = mockMvc.perform(post("/api/v1/loan-requests/{id}/reject", loanRequestId)
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "No se puede prestar hoy"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.notes", containsString("Motivo de rechazo")))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String rejectedLoanId = objectMapper.readTree(rejectResponse).get("id").asText();

        mockMvc.perform(get("/api/v1/loan-requests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(loanRequestId)))
                .andExpect(content().string(containsString("\"status\":\"REJECTED\"")));

        mockMvc.perform(get("/api/v1/loans")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(rejectedLoanId)))
                .andExpect(content().string(containsString("REJECTED")))
                .andExpect(content().string(containsString("Motivo de rechazo: No se puede prestar hoy")));

        ItemEntity afterReject = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, beforeReject.getAvailableStock().compareTo(afterReject.getAvailableStock()));
    }

    @Test
    void shouldCreateUsersOnlyForAdmins() throws Exception {
        String assignedLocationId = firstLocationId();
        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Colaborador Prueba",
                                "email", "colaborador.prueba@tuinventario.local",
                                "password", "Prueba123!",
                                "role", "COLLABORATOR",
                                "assignedLocationId", assignedLocationId
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("COLLABORATOR"));

        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + managerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Usuario Bloqueado",
                                "email", "usuario.bloqueado@tuinventario.local",
                                "password", "Bloqueado123!",
                                "role", "MANAGER",
                                "assignedLocationId", assignedLocationId
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }

    @Test
    void shouldListPublicLoanableItems() throws Exception {
        String itemName = "Taladro Inalambrico " + System.nanoTime();
        createItem(itemName, "PUB-" + System.nanoTime(), 2);
        String organizationId = organizationId().toString();

        mockMvc.perform(get("/api/v1/public-items")
                        .param("organizationId", organizationId))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(itemName)));
    }

    @Test
    void shouldFilterInventoryWithoutExposingRemovedDamagedStock() throws Exception {
        String itemId = createItem("Filtro Demo", "FILTRO-" + System.nanoTime(), 1);

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("stockFilter", "IN_STOCK")
                        .param("query", "Filtro Demo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(itemId))
                .andExpect(jsonPath("$.content[0].damagedStock").doesNotExist());

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", "Filtro Demo")
                        .param("type", "LENDABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(itemId));
    }

    @Test
    void shouldExposeMinimumStockAlertsOnInventoryAndDashboard() throws Exception {
        String itemName = "Computadores Portatiles " + System.nanoTime();
        String itemId = createItem(itemName, "MIN-" + System.nanoTime(), 10, firstLocationId(), 2);

        mockMvc.perform(post("/api/v1/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "movementType", "EXIT",
                                "itemId", itemId,
                                "quantity", 8,
                                "reason", "Salida controlada",
                                "notes", "Baja para probar stock minimo"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("stockFilter", "LOW_STOCK")
                        .param("query", itemName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].minimumStock").value(2));

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lowStockAlerts[0].itemName").value(itemName))
                .andExpect(jsonPath("$.lowStockAlerts[0].minimumStock").value(2))
                .andExpect(jsonPath("$.lowStockAlerts[0].availableStock").value(2));
    }

    @Test
    void shouldCloseLoanUsingReturnedQuantityAndNotes() throws Exception {
        String borrowerId = createBorrower("Borrower Parcial " + System.nanoTime());
        String itemId = createItem("Item Parcial", "PART-" + System.nanoTime(), 5);
        Instant dueAt = Instant.now().plus(2, ChronoUnit.DAYS);

        String loanRequestId = createLoanRequest(borrowerId, itemId, 3, dueAt);
        String loanId = approveLoanRequest(loanRequestId);
        deliverLoan(loanId, "Entrega parcial");

        mockMvc.perform(post("/api/v1/loans/{id}/return", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "returnedQuantity", 2,
                                "notes", "Se consumo 1 kg durante la operacion"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.outstandingQuantity").value(0))
                .andExpect(jsonPath("$.returnedQuantity").value(2))
                .andExpect(jsonPath("$.returnNotes", containsString("Se consumo 1 kg durante la operacion")));

        ItemEntity partialItem = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, partialItem.getLoanedStock().compareTo(new java.math.BigDecimal("0.00")));
        org.junit.jupiter.api.Assertions.assertEquals(0, partialItem.getAvailableStock().compareTo(new java.math.BigDecimal("4.00")));
        org.junit.jupiter.api.Assertions.assertEquals(0, partialItem.getTotalStock().compareTo(new java.math.BigDecimal("4.00")));
    }

    @Test
    void shouldAllowChangingItemTypeIncludingNonLendable() throws Exception {
        String itemId = createItem("Item Tipo " + System.nanoTime(), "TYPE-" + System.nanoTime(), 2);
        ItemEntity item = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();
        Map<String, Object> updatePayload = new java.util.HashMap<>();
        updatePayload.put("name", item.getName());
        updatePayload.put("description", item.getDescription());
        updatePayload.put("imageUrl", item.getImageUrl());
        updatePayload.put("type", "NON_LENDABLE");
        updatePayload.put("status", item.getStatus().name());
        updatePayload.put("categoryId", item.getCategory().getId().toString());
        updatePayload.put("unitId", item.getUnit().getId().toString());
        updatePayload.put("primaryLocationId", item.getPrimaryLocation().getId().toString());
        updatePayload.put("minimumStock", item.getMinimumStock());

        mockMvc.perform(put("/api/v1/items/{id}", itemId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatePayload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("NON_LENDABLE"));

        String borrowerId = createBorrower("Borrower Tipo " + System.nanoTime());
        mockMvc.perform(post("/api/v1/loan-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "borrowerId", borrowerId,
                                "itemId", itemId,
                                "quantity", 1,
                                "dueAt", Instant.now().plus(1, ChronoUnit.DAYS).toString(),
                                "notes", "No deberia prestarse"
                        ))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ITEM_NOT_LENDABLE"));
    }

    @Test
    void shouldAllowEditingDeliveredLoanDatesAndNotes() throws Exception {
        String borrowerId = createBorrower("Borrower Edit " + System.nanoTime());
        String itemId = createItem("Item Editable", "EDIT-" + System.nanoTime(), 3);
        Instant originalDueAt = Instant.now().plus(3, ChronoUnit.DAYS);
        String loanRequestId = createLoanRequest(borrowerId, itemId, 1, originalDueAt);
        String loanId = approveLoanRequest(loanRequestId);
        deliverLoan(loanId, "Entrega original");

        Instant correctedLoanedAt = Instant.now().plus(1, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.SECONDS);
        Instant correctedDueAt = Instant.now().plus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);

        mockMvc.perform(put("/api/v1/loans/{id}", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "loanedAt", correctedLoanedAt.toString(),
                                "dueAt", correctedDueAt.toString(),
                                "notes", "Fechas corregidas por auditoria"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.notes").value("Fechas corregidas por auditoria"))
                .andExpect(jsonPath("$.dueAt").value(correctedDueAt.toString()))
                .andExpect(jsonPath("$.loanedAt").value(correctedLoanedAt.toString()));
    }

    @Test
    void shouldFilterMovementsByQueryTypeAndDateRange() throws Exception {
        String itemName = "Tomate Roma " + System.nanoTime();
        String sku = "MOV-FILTER-" + System.nanoTime();
        String itemId = createItem(itemName, sku, 5);

        mockMvc.perform(post("/api/v1/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "movementType", "ENTRY",
                                "itemId", itemId,
                                "quantity", 2,
                                "reason", "Carga de prueba",
                                "notes", "Movimiento filtrable"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.itemSku").value(sku))
                .andExpect(jsonPath("$.unitSymbol").isNotEmpty());

        LocalDate today = LocalDate.now();
        LocalDate tomorrow = today.plusDays(1);

        mockMvc.perform(get("/api/v1/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", "Tomate")
                        .param("movementType", "ENTRY")
                        .param("fromDate", today.toString())
                        .param("toDate", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.content[0].itemName").value(itemName))
                .andExpect(jsonPath("$.content[0].itemSku").value(sku));

        mockMvc.perform(get("/api/v1/movements")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", "Tomate")
                        .param("fromDate", tomorrow.toString())
                        .param("toDate", tomorrow.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void shouldAllowAdminToUpdateAndBlockUsers() throws Exception {
        String email = "usuario." + System.nanoTime() + "@tuinventario.local";
        String userId = createUser(email, "COLLABORATOR");
        String assignedLocationId = firstLocationId();

        mockMvc.perform(put("/api/v1/users/{id}", userId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Usuario Editado",
                                "email", email,
                                "role", "MANAGER",
                                "status", "ACTIVE",
                                "assignedLocationId", assignedLocationId
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("MANAGER"));

        mockMvc.perform(delete("/api/v1/users/{id}", userId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Prueba123!"
                        ))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldAllowAdminToResetUserPasswords() throws Exception {
        String email = "reset." + System.nanoTime() + "@tuinventario.local";
        String userId = createUser(email, "COLLABORATOR");

        mockMvc.perform(post("/api/v1/users/{id}/reset-password", userId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "newPassword", "NuevaClave123!"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "Prueba123!"
                        ))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "NuevaClave123!"
                        ))))
                .andExpect(status().isOk());
    }

    @Test
    void shouldUpdateAndDeleteBorrowersRespectingHistory() throws Exception {
        String borrowerId = createBorrower("Sin Historial " + System.nanoTime());
        String borrowerName = "Sin Historial Editado";

        mockMvc.perform(put("/api/v1/borrowers/{id}", borrowerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", borrowerName,
                                "email", "borrower@test.local",
                                "phone", "3001112233",
                                "notes", "Actualizado"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value(borrowerName));

        mockMvc.perform(delete("/api/v1/borrowers/{id}", borrowerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/borrowers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", borrowerName))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString(borrowerName))));

        String borrowerWithHistoryName = "Con Historial " + System.nanoTime();
        String borrowerWithHistoryId = createBorrower(borrowerWithHistoryName);
        String itemId = createItem("Item Historial", "HIST-" + System.nanoTime(), 2);
        String pendingRequestId = createLoanRequest(borrowerWithHistoryId, itemId, 1, Instant.now().plus(1, ChronoUnit.DAYS));

        mockMvc.perform(delete("/api/v1/borrowers/{id}", borrowerWithHistoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BORROWER_ACTIVE_LOANS"));

        String loanId = approveLoanRequest(pendingRequestId);
        deliverLoan(loanId, "Entrega de historial");

        mockMvc.perform(post("/api/v1/loans/{id}/return", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "returnedQuantity", 1,
                                "notes", "Devolucion completa"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"));

        mockMvc.perform(delete("/api/v1/borrowers/{id}", borrowerWithHistoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/borrowers")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", borrowerWithHistoryName))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString(borrowerWithHistoryName))));

        mockMvc.perform(get("/api/v1/loans")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString(borrowerWithHistoryName)))
                .andExpect(content().string(containsString("RETURNED")));
    }

    @Test
    void shouldSoftDeleteItemsFromActiveInventory() throws Exception {
        String itemName = "Item Eliminable " + System.nanoTime();
        String sku = "DEL-" + System.nanoTime();
        String itemId = createItem(itemName, sku, 5);

        mockMvc.perform(delete("/api/v1/items/{id}", itemId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", itemName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void shouldScopeManagerToAssignedLocationAndAllowAdminLocationFilters() throws Exception {
        String secondLocationId = createLocation("Sucursal Norte " + System.nanoTime());
        String remoteItemName = "Item Remoto " + System.nanoTime();
        createItem(remoteItemName, "REM-" + System.nanoTime(), 3, secondLocationId);

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + managerToken)
                        .param("query", remoteItemName))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("locationId", secondLocationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(greaterThanOrEqualTo(1)));
    }

    @Test
    void shouldAllowAdminToCreateEditAndDeleteCatalogs() throws Exception {
        String categoryId = mockMvc.perform(post("/api/v1/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Categoria " + System.nanoTime(),
                                "description", "Temporal"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String savedCategoryId = objectMapper.readTree(categoryId).get("id").asText();

        mockMvc.perform(put("/api/v1/categories/{id}", savedCategoryId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Categoria Editada",
                                "description", "Actualizada"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Categoria Editada"));

        mockMvc.perform(delete("/api/v1/categories/{id}", savedCategoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        String locationCategoryResponse = mockMvc.perform(post("/api/v1/location-categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sucursal " + System.nanoTime(),
                                "description", "Categoria de prueba"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        String locationCategoryId = objectMapper.readTree(locationCategoryResponse).get("id").asText();

        mockMvc.perform(put("/api/v1/location-categories/{id}", locationCategoryId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sucursal Editada",
                                "description", "Actualizada"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sucursal Editada"));

        String locationResponse = mockMvc.perform(post("/api/v1/locations")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Ubicacion Flexible " + System.nanoTime(),
                                "locationCategoryId", locationCategoryId,
                                "description", "Ubicacion de prueba"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.extra").value("Sucursal Editada"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        String locationId = objectMapper.readTree(locationResponse).get("id").asText();

        mockMvc.perform(delete("/api/v1/locations/{id}", locationId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/v1/location-categories/{id}", locationCategoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    private String login(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode jsonNode = objectMapper.readTree(response);
        return jsonNode.get("accessToken").asText();
    }

    private String createBorrower(String name) throws Exception {
        String response = mockMvc.perform(post("/api/v1/borrowers")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "email", "",
                                "phone", "",
                                "notes", "Creado en prueba"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String createItem(String name, String sku, int stock) throws Exception {
        return createItem(name, sku, stock, firstLocationId(), 0);
    }

    private String createItem(String name, String sku, int stock, String locationId) throws Exception {
        return createItem(name, sku, stock, locationId, 0);
    }

    private String createItem(String name, String sku, int stock, String locationId, int minimumStock) throws Exception {
        UUID organizationId = organizationId();
        CategoryEntity category = ensureCategory(organizationId);
        UnitEntity unit = ensureUnit(organizationId);

        String response = mockMvc.perform(post("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", name,
                                "sku", sku,
                                "description", "Item de prueba",
                                "type", "LENDABLE",
                                "categoryId", category.getId().toString(),
                                "unitId", unit.getId().toString(),
                                "primaryLocationId", locationId,
                                "initialStock", stock,
                                "minimumStock", minimumStock
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        return objectMapper.readTree(response).get("id").asText();
    }

    private String createLoanRequest(String borrowerId, String itemId, int quantity, Instant dueAt) throws Exception {
        String response = mockMvc.perform(post("/api/v1/loan-requests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "borrowerId", borrowerId,
                                "itemId", itemId,
                                "quantity", quantity,
                                "dueAt", dueAt.toString(),
                                "notes", "Prestamo de prueba"
                        ))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String approveLoanRequest(String loanRequestId) throws Exception {
        String response = mockMvc.perform(post("/api/v1/loan-requests/{id}/approve", loanRequestId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", "Solicitud aprobada"))))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private void deliverLoan(String loanId, String notes) throws Exception {
        mockMvc.perform(post("/api/v1/loans/{id}/deliver", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("notes", notes))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"));
    }

    private String createUser(String email, String role) throws Exception {
        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("fullName", "Usuario Prueba");
        payload.put("email", email);
        payload.put("password", "Prueba123!");
        payload.put("role", role);
        if (!"ADMIN".equals(role)) {
            payload.put("assignedLocationId", firstLocationId());
        }

        String response = mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return objectMapper.readTree(response).get("id").asText();
    }

    private String firstLocationId() {
        return locationRepository.findByOrganizationIdOrderByNameAsc(organizationId()).getFirst().getId().toString();
    }

    private String createLocation(String name) {
        UUID organizationId = organizationId();
        LocationEntity location = new LocationEntity();
        location.setOrganization(organizationRepository.findById(organizationId).orElseThrow());
        location.setName(name);
        location.setType(LocationType.OTHER);
        LocationCategoryEntity locationCategory = locationCategoryRepository.findByOrganizationIdOrderByNameAsc(organizationId).getFirst();
        location.setLocationCategory(locationCategory);
        location.setDescription("Creada en prueba");
        locationRepository.save(location);
        return location.getId().toString();
    }

    private UUID organizationId() {
        return organizationRepository.findAll().stream()
                .map(OrganizationEntity::getId)
                .findFirst()
                .orElseThrow();
    }

    private CategoryEntity ensureCategory(UUID organizationId) {
        return categoryRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .findFirst()
                .orElseGet(() -> {
                    CategoryEntity category = new CategoryEntity();
                    category.setOrganization(organizationRepository.findById(organizationId).orElseThrow());
                    category.setName("General");
                    category.setDescription("Categoria base para pruebas");
                    return categoryRepository.save(category);
                });
    }

    private UnitEntity ensureUnit(UUID organizationId) {
        return unitRepository.findByOrganizationIdOrderByNameAsc(organizationId).stream()
                .findFirst()
                .orElseGet(() -> {
                    UnitEntity unit = new UnitEntity();
                    unit.setOrganization(organizationRepository.findById(organizationId).orElseThrow());
                    unit.setName("Unidad");
                    unit.setSymbol("und");
                    unit.setAllowsDecimal(false);
                    return unitRepository.save(unit);
                });
    }

    private String createBulkItemsForCatalogAndReport(int totalItems) {
        UUID organizationId = organizationId();
        CategoryEntity category = ensureCategory(organizationId);
        UnitEntity unit = ensureUnit(organizationId);
        LocationEntity location = locationRepository.findByOrganizationIdOrderByNameAsc(organizationId).getFirst();
        List<ItemEntity> items = new ArrayList<>();
        String markerName = null;

        for (int index = 0; index < totalItems; index++) {
            ItemEntity item = new ItemEntity();
            item.setOrganization(organizationRepository.findById(organizationId).orElseThrow());
            item.setCategory(category);
            item.setUnit(unit);
            item.setPrimaryLocation(location);
            markerName = "Carga masiva " + System.nanoTime() + "-" + index;
            item.setName(markerName);
            item.setSku("MASS-" + System.nanoTime() + "-" + index);
            item.setType(com.tuinventario.api.domain.enums.ItemType.LENDABLE);
            item.setStatus(com.tuinventario.api.domain.enums.ItemStatus.AVAILABLE);
            item.setConsumable(false);
            item.setLendable(true);
            item.setTotalStock(BigDecimal.ONE);
            item.setAvailableStock(BigDecimal.ONE);
            item.setReservedStock(BigDecimal.ZERO);
            item.setLoanedStock(BigDecimal.ZERO);
            item.setMinimumStock(BigDecimal.ZERO);
            item.setLastMovementAt(Instant.now());
            items.add(item);
        }

        itemRepository.saveAll(items);
        return markerName;
    }

    private byte[] buildImportWorkbook(List<List<String>> rows) throws Exception {
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Articulos");
            Row header = sheet.createRow(0);
            String[] columns = {"sku", "nombre", "tipo_articulo", "categoria", "unidad", "ubicacion_principal", "stock_inicial", "stock_minimo", "estado", "descripcion"};
            for (int index = 0; index < columns.length; index++) {
                header.createCell(index).setCellValue(columns[index]);
            }

            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 1);
                List<String> values = rows.get(rowIndex);
                for (int cellIndex = 0; cellIndex < values.size(); cellIndex++) {
                    row.createCell(cellIndex).setCellValue(values.get(cellIndex));
                }
            }

            workbook.createSheet("Instrucciones");
            workbook.createSheet("Listas");
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
}
