package com.tuinventario.api.movement;

import com.tuinventario.api.shared.model.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @GetMapping
    public PageResponse<MovementDtos.MovementResponse> listMovements(
            @RequestParam(required = false) UUID locationId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) com.tuinventario.api.domain.enums.MovementType movementType,
            @RequestParam(required = false) BigDecimal minQuantity,
            @RequestParam(required = false) BigDecimal maxQuantity,
            @RequestParam(required = false) LocalDate fromDate,
            @RequestParam(required = false) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return movementService.listMovements(locationId, query, movementType, minQuantity, maxQuantity, fromDate, toDate, page, size);
    }

    @PostMapping
    public MovementDtos.MovementResponse createMovement(@Valid @RequestBody MovementDtos.CreateMovementRequest request) {
        return movementService.createMovement(request);
    }
}
