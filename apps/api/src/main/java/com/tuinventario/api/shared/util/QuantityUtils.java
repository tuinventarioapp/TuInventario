package com.tuinventario.api.shared.util;

import com.tuinventario.api.shared.exception.ApiException;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;

public final class QuantityUtils {

    private QuantityUtils() {
    }

    public static void requirePositive(BigDecimal quantity) {
        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_QUANTITY", "La cantidad debe ser mayor que cero.");
        }
    }
}
