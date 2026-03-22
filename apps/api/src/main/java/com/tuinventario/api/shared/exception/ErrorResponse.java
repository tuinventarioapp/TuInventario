package com.tuinventario.api.shared.exception;

import java.time.Instant;
import java.util.Map;

public record ErrorResponse(
        String code,
        String message,
        Map<String, Object> details,
        Instant timestamp
) {
}
