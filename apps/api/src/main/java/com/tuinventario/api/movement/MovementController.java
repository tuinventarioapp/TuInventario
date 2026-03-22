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

@RestController
@RequestMapping("/api/v1/movements")
@RequiredArgsConstructor
public class MovementController {

    private final MovementService movementService;

    @GetMapping
    public PageResponse<MovementDtos.MovementResponse> listMovements(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return movementService.listMovements(page, size);
    }

    @PostMapping
    public MovementDtos.MovementResponse createMovement(@Valid @RequestBody MovementDtos.CreateMovementRequest request) {
        return movementService.createMovement(request);
    }
}
