package com.tuinventario.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.domain.entity.CategoryEntity;
import com.tuinventario.api.domain.entity.ItemEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.UnitEntity;
import com.tuinventario.api.domain.enums.ItemStatus;
import com.tuinventario.api.domain.enums.ItemType;
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

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MovementControllerTest {

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

    private String accessToken;

    @BeforeEach
    void authenticate() throws Exception {
        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@admin.com",
                                "password", "admin123"
                        ))))
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode jsonNode = objectMapper.readTree(loginResponse);
        accessToken = jsonNode.get("accessToken").asText();
    }

    @Test
    void shouldCreateEntryMovement() throws Exception {
        var item = ensureItem();
        var location = locationRepository.findAll().getFirst();

        mockMvc.perform(post("/api/v1/movements")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "movementType", "ENTRY",
                                "itemId", item.getId().toString(),
                                "quantity", new BigDecimal("2"),
                                "targetLocationId", location.getId().toString(),
                                "reason", "Entrada de prueba",
                                "notes", "Caso de prueba"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.movementType").value("ENTRY"))
                .andExpect(jsonPath("$.itemId").value(item.getId().toString()));
    }

    private ItemEntity ensureItem() {
        return itemRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    OrganizationEntity organization = organizationRepository.findAll().stream().findFirst().orElseThrow();
                    CategoryEntity category = categoryRepository.findByOrganizationIdOrderByNameAsc(organization.getId()).stream()
                            .findFirst()
                            .orElseGet(() -> {
                                CategoryEntity created = new CategoryEntity();
                                created.setOrganization(organization);
                                created.setName("General");
                                created.setDescription("Categoria base para pruebas");
                                return categoryRepository.save(created);
                            });
                    UnitEntity unit = unitRepository.findByOrganizationIdOrderByNameAsc(organization.getId()).stream()
                            .findFirst()
                            .orElseGet(() -> {
                                UnitEntity created = new UnitEntity();
                                created.setOrganization(organization);
                                created.setName("Unidad");
                                created.setSymbol("und");
                                created.setAllowsDecimal(false);
                                return unitRepository.save(created);
                            });

                    ItemEntity item = new ItemEntity();
                    item.setOrganization(organization);
                    item.setCategory(category);
                    item.setUnit(unit);
                    item.setPrimaryLocation(locationRepository.findAll().getFirst());
                    item.setName("Item Movimiento");
                    item.setSku("MOV-" + UUID.randomUUID().toString().substring(0, 8));
                    item.setDescription("Item base para prueba de movimientos");
                    item.setType(ItemType.LENDABLE);
                    item.setStatus(ItemStatus.AVAILABLE);
                    item.setConsumable(false);
                    item.setLendable(true);
                    item.setTotalStock(new BigDecimal("5"));
                    item.setAvailableStock(new BigDecimal("5"));
                    item.setMinimumStock(BigDecimal.ZERO);
                    item.setReservedStock(BigDecimal.ZERO);
                    item.setLoanedStock(BigDecimal.ZERO);
                    item.setDamagedStock(BigDecimal.ZERO);
                    return itemRepository.save(item);
                });
    }
}
