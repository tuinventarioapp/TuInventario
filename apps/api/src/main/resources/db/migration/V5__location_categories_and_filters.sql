CREATE TABLE location_categories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (organization_id, name)
);

ALTER TABLE locations ADD COLUMN location_category_id UUID;

INSERT INTO location_categories (id, organization_id, name, description, created_at, updated_at)
SELECT CAST(SUBSTRING(CAST(organization_id AS VARCHAR), 1, 35) || seed_code AS UUID),
       organization_id,
       name,
       description,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM (
    SELECT o.id AS organization_id, '1' AS seed_code, 'Bodega' AS name, 'Ubicacion de almacenamiento' AS description
    FROM organizations o
    UNION ALL
    SELECT o.id AS organization_id, '2' AS seed_code, 'Oficina' AS name, 'Puesto o area administrativa' AS description
    FROM organizations o
    UNION ALL
    SELECT o.id AS organization_id, '3' AS seed_code, 'Vehiculo' AS name, 'Unidad movil o camion' AS description
    FROM organizations o
    UNION ALL
    SELECT o.id AS organization_id, '4' AS seed_code, 'Sitio del cliente' AS name, 'Ubicacion externa del cliente' AS description
    FROM organizations o
    UNION ALL
    SELECT o.id AS organization_id, '5' AS seed_code, 'Otra' AS name, 'Otra categoria de ubicacion' AS description
    FROM organizations o
) seeds
WHERE NOT EXISTS (
    SELECT 1
    FROM location_categories lc
    WHERE lc.organization_id = seeds.organization_id
      AND LOWER(lc.name) = LOWER(seeds.name)
);

UPDATE locations l
SET location_category_id = (
    SELECT lc.id
    FROM location_categories lc
    WHERE lc.organization_id = l.organization_id
      AND LOWER(lc.name) = LOWER(
          CASE
              WHEN l.type = 'WAREHOUSE' THEN 'Bodega'
              WHEN l.type = 'OFFICE' THEN 'Oficina'
              WHEN l.type = 'VEHICLE' THEN 'Vehiculo'
              WHEN l.type = 'CLIENT_SITE' THEN 'Sitio del cliente'
              ELSE 'Otra'
          END
      )
);

ALTER TABLE locations ALTER COLUMN location_category_id SET NOT NULL;
ALTER TABLE locations ADD CONSTRAINT fk_locations_location_category FOREIGN KEY (location_category_id) REFERENCES location_categories(id);

CREATE INDEX idx_location_categories_org_name ON location_categories (organization_id, name);
CREATE INDEX idx_locations_org_category ON locations (organization_id, location_category_id);
