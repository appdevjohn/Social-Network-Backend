CREATE TYPE content_type AS ENUM ('text', 'image');

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY NOT NULL,
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    username VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    hashed_password VARCHAR(128) NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT false,
    activate_token VARCHAR(128),
    UNIQUE(email),
    UNIQUE(username)
);

CREATE TABLE messages (
    message_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT,
    post_id BIGINT,
    content VARCHAR(1024) NOT NULL,
    type content_type NOT NULL
);

CREATE TABLE posts (
    post_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,
    text VARCHAR(1024),
    media VARCHAR(128)
);

CREATE TABLE conversations (
    convo_id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(128) NOT NULL
);

CREATE TABLE groups (
    group_id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(128) NOT NULL,
    UNIQUE(name)
);

CREATE TABLE users_conversations (
    users_conversations_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT NOT NULL
);

CREATE TABLE users_groups (
    iusers_groups_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL
);