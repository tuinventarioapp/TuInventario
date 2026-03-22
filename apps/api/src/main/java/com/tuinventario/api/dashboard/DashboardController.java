package com.tuinventario.api.dashboard;

import com.tuinventario.api.domain.enums.LoanStatus;
import com.tuinventario.api.domain.repository.ItemRepository;
import com.tuinventario.api.domain.repository.LoanRepository;
import com.tuinventario.api.domain.repository.StockMovementRepository;
import com.tuinventario.api.shared.service.CurrentContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final CurrentContextService currentContextService;
    private final ItemRepository itemRepository;
    private final LoanRepository loanRepository;
    private final StockMovementRepository stockMovementRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboard(@RequestParam(required = false) UUID locationId) {
        var orgId = currentContextService.currentUser().organizationId();
        UUID effectiveLocationId = currentContextService.effectiveLocationId(locationId);
        var loans = loanRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .filter(loan -> effectiveLocationId == null || loan.getLoanRequest() != null && loan.getLoanRequest().getItem().getPrimaryLocation().getId().equals(effectiveLocationId))
                .toList();
        var items = itemRepository.search(orgId, "", org.springframework.data.domain.PageRequest.of(0, 1000)).stream()
                .filter(item -> effectiveLocationId == null || item.getPrimaryLocation().getId().equals(effectiveLocationId))
                .toList();

        long overdueLoans = loans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.OVERDUE)
                .count();
        long activeLoans = loans.stream()
                .filter(loan -> loan.getStatus() == LoanStatus.DELIVERED || loan.getStatus() == LoanStatus.APPROVED)
                .count();
        long lowStockItems = items.stream()
                .filter(item -> item.getAvailableStock().compareTo(java.math.BigDecimal.ONE) <= 0)
                .count();

        return Map.of(
                "totalItems", items.size(),
                "lowStockItems", lowStockItems,
                "activeLoans", activeLoans,
                "overdueLoans", overdueLoans,
                "recentMovements", stockMovementRepository.searchByLocation(orgId, effectiveLocationId, org.springframework.data.domain.PageRequest.of(0, 5)).getContent().size()
        );
    }
}
