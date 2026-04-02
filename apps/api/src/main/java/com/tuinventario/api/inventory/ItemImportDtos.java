package com.tuinventario.api.inventory;

import java.util.List;

public final class ItemImportDtos {

    private ItemImportDtos() {
    }

    public record ImportPreviewResponse(
            String fileName,
            Summary summary,
            List<PreviewRow> rows
    ) {
    }

    public record ImportCommitResponse(
            Summary summary,
            List<ResultRow> rows
    ) {
    }

    public record Summary(
            int newItems,
            int matches,
            int errors,
            int totalRows,
            int created,
            int updated,
            int omitted
    ) {
    }

    public record PreviewRow(
            int rowNumber,
            String sku,
            String itemName,
            String existingItemName,
            String status,
            String suggestedAction,
            boolean canUpdate,
            List<String> errors
    ) {
    }

    public record ResultRow(
            int rowNumber,
            String sku,
            String itemName,
            String outcome,
            List<String> messages
    ) {
    }
}
