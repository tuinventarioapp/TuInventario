ALTER TABLE memberships ADD COLUMN assigned_location_id UUID REFERENCES locations(id);

UPDATE memberships
SET assigned_location_id = (
    SELECT l.id
    FROM locations l
    WHERE l.organization_id = memberships.organization_id
    ORDER BY l.created_at ASC
    LIMIT 1
)
WHERE assigned_location_id IS NULL
  AND role_id IN (
      SELECT id
      FROM roles
      WHERE name IN ('MANAGER', 'COLLABORATOR')
  );

ALTER TABLE items DROP CONSTRAINT IF EXISTS items_organization_id_sku_key;
DROP INDEX IF EXISTS idx_items_org_sku;

CREATE UNIQUE INDEX IF NOT EXISTS uq_items_org_location_sku
    ON items (organization_id, primary_location_id, sku);
