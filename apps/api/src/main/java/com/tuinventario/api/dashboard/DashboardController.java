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
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

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
    public Map<String, Object> getDashboard() {
        var orgId = currentContextService.currentUser().organizationId();
        long overdueLoans = loanRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .filter(loan -> loan.getStatus() == LoanStatus.OVERDUE)
                .count();
        long activeLoans = loanRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                .filter(loan -> loan.getStatus() == LoanStatus.DELIVERED || loan.getStatus() == LoanStatus.APPROVED)
                .count();
        long lowStockItems = itemRepository.search(orgId, "", org.springframework.data.domain.PageRequest.of(0, 1000)).stream()
                .filter(item -> item.getAvailableStock().compareTo(java.math.BigDecimal.ONE) <= 0)
                .count();

        return Map.of(
                "totalItems", itemRepository.search(orgId, "", org.springframework.data.domain.PageRequest.of(0, 1000)).getTotalElements(),
                "lowStockItems", lowStockItems,
                "activeLoans", activeLoans,
                "overdueLoans", overdueLoans,
                "recentMovements", stockMovementRepository.findByOrganizationIdOrderByOccurredAtDesc(orgId, org.springframework.data.domain.PageRequest.of(0, 5)).getContent().size()
        );
    }
}
