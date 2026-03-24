ALTER TABLE items ADD COLUMN minimum_stock NUMERIC(19,2) NOT NULL DEFAULT 0;

CREATE INDEX idx_items_org_minimum_stock ON items (organization_id, minimum_stock);
