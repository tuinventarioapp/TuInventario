package com.tuinventario.api.shared.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tuinventario.api.domain.entity.AuditLogEntity;
import com.tuinventario.api.domain.entity.OrganizationEntity;
import com.tuinventario.api.domain.entity.UserEntity;
import com.tuinventario.api.domain.repository.AuditLogRepository;
import com.tuinventario.api.shared.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public void log(OrganizationEntity organization, UserEntity actor, String entityType, UUID entityId, String action, Map<String, Object> payload) {
        AuditLogEntity entity = new AuditLogEntity();
        entity.setOrganization(organization);
        entity.setActorUser(actor);
        entity.setEntityType(entityType);
        entity.setEntityId(entityId);
        entity.setAction(action);
        try {
            entity.setPayload(objectMapper.writeValueAsString(payload));
        } catch (JsonProcessingException e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "AUDIT_SERIALIZATION_ERROR", "No fue posible serializar el log de auditoria.");
        }
        auditLogRepository.save(entity);
    }
}
