package com.tuinventario.api.inventory;

import com.tuinventario.api.shared.model.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;

    @GetMapping
    public PageResponse<ItemDtos.ItemResponse> listItems(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return itemService.listItems(query, page, size);
    }

    @GetMapping("/{id}")
    public ItemDtos.ItemResponse getItem(@PathVariable UUID id) {
        return itemService.getItem(id);
    }

    @PostMapping
    public ItemDtos.ItemResponse createItem(@Valid @RequestBody ItemDtos.CreateItemRequest request) {
        return itemService.createItem(request);
    }

    @PutMapping("/{id}")
    public ItemDtos.ItemResponse updateItem(@PathVariable UUID id, @Valid @RequestBody ItemDtos.UpdateItemRequest request) {
        return itemService.updateItem(id, request);
    }
}
