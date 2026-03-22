package com.tuinventario.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.entity.LocationEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.enums.LocationType;
import com.tuinventario.api.domain.repository.CategoryRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LocationRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
import com.tuinventario.api.domain.repository.UnitRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(containsString("sep=;")))
                .andExpect(content().string(containsString("Reporte")))
                .andExpect(content().string(containsString("Inventario operativo")));

        mockMvc.perform(get("/api/v1/reports/inventory-admin.csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(containsString("Inventario administrativo")))
                .andExpect(content().string(containsString("Stock total")));

        mockMvc.perform(get("/api/v1/reports/inventory-admin.csv")
                        .header("Authorization", "Bearer " + collaboratorToken))
                .andExpect(status().isForbidden());
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
    void shouldFilterInventoryAndExposeDamagedStock() throws Exception {
        String itemId = createItem("Filtro Demo", "FILTRO-" + System.nanoTime(), 1);

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("stockFilter", "IN_STOCK")
                        .param("query", "Filtro Demo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(itemId))
                .andExpect(jsonPath("$.content[0].damagedStock").value(0));

        mockMvc.perform(get("/api/v1/items")
                        .header("Authorization", "Bearer " + adminToken)
                        .param("query", "Filtro Demo")
                        .param("type", "LENDABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(itemId));
    }

    @Test
    void shouldSupportPartialAndFinalLoanReturns() throws Exception {
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
                                "returnedGoodQuantity", 1,
                                "returnedDamagedQuantity", 1,
                                "lostQuantity", 0,
                                "notes", "Regresaron 2, una danada"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.outstandingQuantity").value(1))
                .andExpect(jsonPath("$.returnedDamagedQuantity").value(1));

        ItemEntity partialItem = itemRepository.findById(UUID.fromString(itemId)).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals(0, partialItem.getLoanedStock().compareTo(new java.math.BigDecimal("1.00")));
        org.junit.jupiter.api.Assertions.assertEquals(0, partialItem.getDamagedStock().compareTo(new java.math.BigDecimal("1.00")));

        mockMvc.perform(post("/api/v1/loans/{id}/return", loanId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "returnedGoodQuantity", 0,
                                "returnedDamagedQuantity", 0,
                                "lostQuantity", 1,
                                "notes", "Falto una unidad"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RETURNED"))
                .andExpect(jsonPath("$.outstandingQuantity").value(0))
                .andExpect(jsonPath("$.lostQuantity").value(1))
                .andExpect(jsonPath("$.returnCondition").value("LOST"));
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

        mockMvc.perform(put("/api/v1/borrowers/{id}", borrowerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Sin Historial Editado",
                                "email", "borrower@test.local",
                                "phone", "3001112233",
                                "notes", "Actualizado"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Sin Historial Editado"));

        mockMvc.perform(delete("/api/v1/borrowers/{id}", borrowerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        String borrowerWithHistoryId = createBorrower("Con Historial " + System.nanoTime());
        String itemId = createItem("Item Historial", "HIST-" + System.nanoTime(), 2);
        createLoanRequest(borrowerWithHistoryId, itemId, 1, Instant.now().plus(1, ChronoUnit.DAYS));

        mockMvc.perform(delete("/api/v1/borrowers/{id}", borrowerWithHistoryId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("BORROWER_HAS_HISTORY"));
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
        return createItem(name, sku, stock, firstLocationId());
    }

    private String createItem(String name, String sku, int stock, String locationId) throws Exception {
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
                                "initialStock", stock
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
}
