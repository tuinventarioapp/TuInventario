package com.tuinventario.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.repository.BorrowerRepository;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.OrganizationRepository;
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
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
    private BorrowerRepository borrowerRepository;

    @Autowired
    private OrganizationRepository organizationRepository;

    private String adminToken;
    private String managerToken;

    @BeforeEach
    void authenticate() throws Exception {
        adminToken = login("demo@tuinventario.local", "Demo12345!");
        managerToken = login("gestor@tuinventario.local", "Gestor12345!");
    }

    @Test
    void shouldExposeDashboardAndProtectedReportsForAdmin() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems").value(1))
                .andExpect(jsonPath("$.lowStockItems").value(0))
                .andExpect(jsonPath("$.activeLoans").value(0))
                .andExpect(jsonPath("$.overdueLoans").value(0));

        mockMvc.perform(get("/api/v1/reports/inventory.csv")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith("text/csv"))
                .andExpect(content().string(org.hamcrest.Matchers.containsString("Taladro Inalambrico")));
    }

    @Test
    void shouldSupportEndToEndLoanFlow() throws Exception {
        ItemEntity item = itemRepository.findAll().getFirst();
        String borrowerId = borrowerRepository.findAll().getFirst().getId().toString();
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
        mockMvc.perform(post("/api/v1/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Colaborador Prueba",
                                "email", "colaborador.prueba@tuinventario.local",
                                "password", "Prueba123!",
                                "role", "COLLABORATOR"
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
                                "role", "MANAGER"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("INSUFFICIENT_PERMISSIONS"));
    }

    @Test
    void shouldListPublicLoanableItems() throws Exception {
        String organizationId = organizationRepository.findBySlug("tuinventario-demo").orElseThrow().getId().toString();

        mockMvc.perform(get("/api/v1/public-items")
                        .param("organizationId", organizationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Taladro Inalambrico"));
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
}
