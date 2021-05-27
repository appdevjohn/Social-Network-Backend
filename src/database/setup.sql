CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    created_at 
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT false,
    activate_token VARCHAR(128),
    UNIQUE(email)
);

CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT NOT NULL,
    content VARCHAR(1024) NOT NULL,
    type VARCHAR(16) NOT NULL
);

CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    text VARCHAR(1024) NOT NULL,
    media VARCHAR(128)
);

CREATE TABLE conversations (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(128) NOT NULL
);

CREATE TABLE users_conversations (
    id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT NOT NULL
);