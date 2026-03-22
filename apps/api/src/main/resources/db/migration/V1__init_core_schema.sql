CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    timezone VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name VARCHAR(40) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    phone VARCHAR(40),
    avatar_url VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE memberships (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    status VARCHAR(30) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, user_id)
);

CREATE TABLE categories (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(120) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (organization_id, name)
);

CREATE TABLE units (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(120) NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    allows_decimal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (organization_id, name)
);

CREATE TABLE locations (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(120) NOT NULL,
    type VARCHAR(40) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (organization_id, name)
);

CREATE TABLE items (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    category_id UUID NOT NULL REFERENCES categories(id),
    unit_id UUID NOT NULL REFERENCES units(id),
    primary_location_id UUID NOT NULL REFERENCES locations(id),
    name VARCHAR(160) NOT NULL,
    sku VARCHAR(80) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    type VARCHAR(40) NOT NULL,
    status VARCHAR(40) NOT NULL,
    is_consumable BOOLEAN NOT NULL DEFAULT FALSE,
    is_lendable BOOLEAN NOT NULL DEFAULT FALSE,
    total_stock NUMERIC(19,2) NOT NULL DEFAULT 0,
    available_stock NUMERIC(19,2) NOT NULL DEFAULT 0,
    reserved_stock NUMERIC(19,2) NOT NULL DEFAULT 0,
    loaned_stock NUMERIC(19,2) NOT NULL DEFAULT 0,
    last_movement_at TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE (organization_id, sku)
);

CREATE TABLE item_images (
    id UUID PRIMARY KEY,
    item_id UUID NOT NULL REFERENCES items(id),
    image_url VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    item_id UUID NOT NULL REFERENCES items(id),
    movement_type VARCHAR(40) NOT NULL,
    quantity NUMERIC(19,2) NOT NULL,
    source_location_id UUID REFERENCES locations(id),
    target_location_id UUID REFERENCES locations(id),
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    performed_by_user_id UUID NOT NULL REFERENCES users(id),
    occurred_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_snapshots (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    item_id UUID NOT NULL REFERENCES items(id),
    captured_at TIMESTAMP NOT NULL,
    total_stock NUMERIC(19,2) NOT NULL,
    available_stock NUMERIC(19,2) NOT NULL,
    reserved_stock NUMERIC(19,2) NOT NULL,
    loaned_stock NUMERIC(19,2) NOT NULL
);

CREATE TABLE borrowers (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    name VARCHAR(160) NOT NULL,
    email VARCHAR(160),
    phone VARCHAR(40),
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_requests (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    borrower_id UUID NOT NULL REFERENCES borrowers(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(19,2) NOT NULL,
    requested_by_user_id UUID REFERENCES users(id),
    status VARCHAR(40) NOT NULL,
    requested_at TIMESTAMP NOT NULL,
    due_at TIMESTAMP NOT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loans (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    borrower_id UUID NOT NULL REFERENCES borrowers(id),
    loan_request_id UUID REFERENCES loan_requests(id),
    status VARCHAR(40) NOT NULL,
    approved_by_user_id UUID REFERENCES users(id),
    delivered_by_user_id UUID REFERENCES users(id),
    loaned_at TIMESTAMP,
    due_at TIMESTAMP NOT NULL,
    returned_at TIMESTAMP,
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE loan_items (
    id UUID PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES loans(id),
    item_id UUID NOT NULL REFERENCES items(id),
    quantity NUMERIC(19,2) NOT NULL,
    returned_quantity NUMERIC(19,2) NOT NULL DEFAULT 0,
    return_condition VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    actor_user_id UUID REFERENCES users(id),
    entity_type VARCHAR(80) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(80) NOT NULL,
    payload TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    recipient_user_id UUID REFERENCES users(id),
    type VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    body VARCHAR(255) NOT NULL,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    revoked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memberships_org_user ON memberships (organization_id, user_id);
CREATE INDEX idx_categories_org_name ON categories (organization_id, name);
CREATE INDEX idx_units_org_name ON units (organization_id, name);
CREATE INDEX idx_locations_org_name ON locations (organization_id, name);
CREATE INDEX idx_items_org_sku ON items (organization_id, sku);
CREATE INDEX idx_items_org_name ON items (organization_id, name);
CREATE INDEX idx_movements_org_item_date ON stock_movements (organization_id, item_id, occurred_at DESC);
CREATE INDEX idx_loan_requests_org_status ON loan_requests (organization_id, status, due_at);
CREATE INDEX idx_loans_org_status ON loans (organization_id, status, due_at);
CREATE INDEX idx_audit_org_date ON audit_logs (organization_id, created_at DESC);
