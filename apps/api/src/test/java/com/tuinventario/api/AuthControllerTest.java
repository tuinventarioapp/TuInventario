package com.tuinventario.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.auth.AuthMailService;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @MockBean
    private AuthMailService authMailService;

    @Test
    void shouldLoginWithInitialAdminUser() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "admin@admin.com",
                                "password", "admin123"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("admin@admin.com"));
    }

    @Test
    void shouldReturnBadRequestForMalformedJson() throws Exception {
        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@admin.com\","))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_JSON"))
                .andExpect(jsonPath("$.message").value("El cuerpo JSON de la solicitud no es valido."));
    }

    @Test
    void shouldRegisterAdminRequireVerificationAndLoginAfterCodeValidation() throws Exception {
        String email = "registro." + System.nanoTime() + "@tuinventario.local";
        String password = "Registro123!";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Admin Registro",
                                "email", email,
                                "password", password,
                                "organizationName", "Empresa Registro"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.message").isNotEmpty());

        UserEntity user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        org.junit.jupiter.api.Assertions.assertFalse(user.isEmailVerified());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password
                        ))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(authMailService).sendRegistrationVerificationCode(anyString(), anyString(), codeCaptor.capture(), anyString());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "code", codeCaptor.getValue()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    void shouldResendVerificationCodeForPendingAdminRegistration() throws Exception {
        String email = "reenvio." + System.nanoTime() + "@tuinventario.local";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Admin Reenvio",
                                "email", email,
                                "password", "Registro123!",
                                "organizationName", "Empresa Reenvio"
                        ))))
                .andExpect(status().isOk());

        clearInvocations(authMailService);

        mockMvc.perform(post("/api/v1/auth/resend-verification")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void shouldSendPasswordResetCodeAndChangeAdminPassword() throws Exception {
        String email = "reset." + System.nanoTime() + "@tuinventario.local";
        String originalPassword = "Registro123!";

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Admin Reset",
                                "email", email,
                                "password", originalPassword,
                                "organizationName", "Empresa Reset"
                        ))))
                .andExpect(status().isOk());

        ArgumentCaptor<String> registrationCodeCaptor = ArgumentCaptor.forClass(String.class);
        verify(authMailService).sendRegistrationVerificationCode(anyString(), anyString(), registrationCodeCaptor.capture(), anyString());

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "code", registrationCodeCaptor.getValue()
                        ))))
                .andExpect(status().isOk());

        clearInvocations(authMailService);

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("email", email))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(authMailService, times(1)).sendPasswordResetCode(anyString(), anyString(), codeCaptor.capture(), anyString());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "code", codeCaptor.getValue(),
                                "newPassword", "NuevaClave123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").isNotEmpty());

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", email,
                                "password", "NuevaClave123!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));
    }
}
