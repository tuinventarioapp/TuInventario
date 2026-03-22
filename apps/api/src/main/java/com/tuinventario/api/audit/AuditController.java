package com.tuinventario.api.audit;

import com.tuinventario.api.domain.repository.AuditLogRepository;
import com.tuinventario.api.shared.model.PageResponse;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1/audit-log")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final CurrentContextService currentContextService;

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<AuditEntryResponse> listAudit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        var result = auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId(), PageRequest.of(page, size))
                .map(entry -> new AuditEntryResponse(
                        entry.getId().toString(),
                        entry.getEntityType(),
                        entry.getAction(),
                        entry.getPayload(),
                        entry.getActorUser() == null ? "Sistema" : entry.getActorUser().getFullName(),
                        entry.getCreatedAt()
                ));
        return PageResponse.from(result);
    }

    public record AuditEntryResponse(
            String id,
            String entityType,
            String action,
            String payload,
            String actor,
            Instant createdAt
    ) {
    }
}
