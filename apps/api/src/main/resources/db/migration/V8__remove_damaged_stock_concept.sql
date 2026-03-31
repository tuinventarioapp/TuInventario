UPDATE items
SET damaged_stock = 0
WHERE damaged_stock <> 0;

UPDATE items
SET status = CASE
    WHEN loaned_stock > 0 THEN 'ON_LOAN'
    WHEN reserved_stock > 0 THEN 'RESERVED'
    WHEN available_stock > 0 THEN 'AVAILABLE'
    WHEN total_stock <= 0 THEN 'LOST'
    ELSE 'AVAILABLE'
END
WHERE status = 'DAMAGED';

UPDATE loan_items
SET returned_damaged_quantity = 0
WHERE returned_damaged_quantity <> 0;

UPDATE loan_items
SET return_condition = 'GOOD'
WHERE return_condition = 'DAMAGED';
