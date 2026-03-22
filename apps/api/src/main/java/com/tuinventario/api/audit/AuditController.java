package com.tuinventario.api.audit;

import com.tuinventario.api.domain.repository.AuditLogRepository;
import com.tuinventario.api.shared.exception.ApiException;
import com.tuinventario.api.shared.model.PageResponse;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;
    private final CurrentContextService currentContextService;

    @GetMapping
    @Transactional(readOnly = true)
    public PageResponse<AuditEntryResponse> listAudit(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        validateRange(fromDate, toDate);
        String normalizedEntityType = normalize(entityType);
        String normalizedAction = normalize(action);
        String normalizedActor = normalize(actor);
        Instant fromInstant = toInstant(fromDate);
        Instant toExclusiveInstant = toExclusiveInstant(toDate);

        List<AuditEntryResponse> filtered = auditLogRepository
                .findByOrganizationIdOrderByCreatedAtDesc(currentContextService.currentUser().organizationId())
                .stream()
                .filter(entry -> containsIgnoreCase(entry.getEntityType(), normalizedEntityType))
                .filter(entry -> containsIgnoreCase(entry.getAction(), normalizedAction))
                .filter(entry -> containsIgnoreCase(entry.getActorUser() == null ? "Sistema" : entry.getActorUser().getFullName(), normalizedActor))
                .filter(entry -> fromInstant == null || !entry.getCreatedAt().isBefore(fromInstant))
                .filter(entry -> toExclusiveInstant == null || entry.getCreatedAt().isBefore(toExclusiveInstant))
                .map(entry -> new AuditEntryResponse(
                        entry.getId().toString(),
                        entry.getEntityType(),
                        entry.getAction(),
                        entry.getPayload(),
                        entry.getActorUser() == null ? "Sistema" : entry.getActorUser().getFullName(),
                        entry.getCreatedAt()
                ))
                .toList();

        int safeSize = size <= 0 ? 10 : size;
        int safePage = Math.max(page, 0);
        int start = Math.min(safePage * safeSize, filtered.size());
        int end = Math.min(start + safeSize, filtered.size());
        int totalPages = safeSize == 0 ? 0 : (int) Math.ceil((double) filtered.size() / safeSize);

        return new PageResponse<>(
                filtered.subList(start, end),
                safePage,
                safeSize,
                filtered.size(),
                totalPages
        );
    }

    private void validateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_AUDIT_RANGE", "La fecha inicial no puede ser mayor que la fecha final.");
        }
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private boolean containsIgnoreCase(String value, String filter) {
        if (filter == null) {
            return true;
        }
        if (value == null) {
            return false;
        }
        return value.toLowerCase(Locale.ROOT).contains(filter.toLowerCase(Locale.ROOT));
    }

    private Instant toInstant(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.atStartOfDay(ZoneId.of(currentContextService.currentOrganizationEntity().getTimezone())).toInstant();
    }

    private Instant toExclusiveInstant(LocalDate date) {
        if (date == null) {
            return null;
        }
        return date.plusDays(1).atStartOfDay(ZoneId.of(currentContextService.currentOrganizationEntity().getTimezone())).toInstant();
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
