-- backend/db/init.sql

-- This extension is required for the uuid_generate_v4() function.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in a specific order to avoid foreign key constraints errors.
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS outbox;
DROP TABLE IF EXISTS transaction_requests;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;

-- -----------------------------------------------------------------------------
-- Users Table (User's Existing Design)
-- Stores user authentication and profile information.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Accounts Table (User's Existing Design)
-- Stores banking account information, linked to a user.
-- -----------------------------------------------------------------------------
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    balance NUMERIC(20, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- Transaction Requests Table
-- Stores high-level transaction intents, written to by the producer.
-- An idempotency key ensures a request is only processed once.
-- -----------------------------------------------------------------------------
CREATE TYPE request_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

CREATE TABLE transaction_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idempotency_key UUID UNIQUE NOT NULL,
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(20, 2) NOT NULL,
    status request_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- Outbox Table
-- Implements the Transactional Outbox pattern. Messages are written here
-- atomically with the main transaction and then relayed to the message queue.
-- -----------------------------------------------------------------------------
CREATE TABLE outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    aggregate_type VARCHAR(255) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ DEFAULT NULL
);

-- -----------------------------------------------------------------------------
-- Transactions Table (Final, Immutable Ledger)
-- This table is the single source of truth for all completed transactions.
-- It is only updated by the consumer worker.
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES transaction_requests(id),
    from_account_id UUID NOT NULL REFERENCES accounts(id),
    to_account_id UUID NOT NULL REFERENCES accounts(id),
    amount NUMERIC(20, 2) NOT NULL,
    final_balance_from NUMERIC(20, 2) NOT NULL,
    final_balance_to NUMERIC(20, 2) NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW()
);