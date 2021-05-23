CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT false,
    activate_token VARCHAR(128),
    UNIQUE(email)
);