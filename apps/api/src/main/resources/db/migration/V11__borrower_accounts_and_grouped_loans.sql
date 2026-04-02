ALTER TABLE borrowers
    ADD COLUMN user_id UUID UNIQUE;

ALTER TABLE borrowers
    ADD CONSTRAINT fk_borrowers_user
        FOREIGN KEY (user_id) REFERENCES users (id);

ALTER TABLE loan_requests
    ADD COLUMN request_group_id UUID;

ALTER TABLE loan_requests
    ADD COLUMN approved_quantity NUMERIC(19, 2);

CREATE INDEX idx_loan_requests_group
    ON loan_requests (organization_id, request_group_id);

CREATE INDEX idx_loan_requests_requested_by
    ON loan_requests (organization_id, requested_by_user_id, request_group_id);

ALTER TABLE loans
    ADD COLUMN request_group_id UUID;

CREATE INDEX idx_loans_group
    ON loans (organization_id, request_group_id);
