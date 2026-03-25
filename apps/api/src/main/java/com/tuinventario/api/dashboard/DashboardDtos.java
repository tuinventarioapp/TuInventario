package com.tuinventario.api.dashboard;

import java.math.BigDecimal;
import java.util.List;

public final class DashboardDtos {

    private DashboardDtos() {
    }

    public record LowStockAlert(
            String itemId,
            String itemName,
            String sku,
            String categoryName,
            String locationName,
            String unitSymbol,
            BigDecimal availableStock,
            BigDecimal minimumStock
    ) {
    }

    public record DashboardResponse(
            int totalItems,
            long activeLoans,
            long overdueLoans,
            int recentMovements,
            List<LowStockAlert> lowStockAlerts,
            boolean hasOperationalData
    ) {
    }
}
