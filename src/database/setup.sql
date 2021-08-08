CREATE TYPE content_type AS ENUM ('text', 'image');

CREATE TABLE users (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    user_id BIGSERIAL PRIMARY KEY NOT NULL,
    socket_id VARCHAR(32),
    first_name VARCHAR(64) NOT NULL,
    last_name VARCHAR(64) NOT NULL,
    username VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    profile_pic_url VARCHAR(256),
    hashed_password VARCHAR(128) NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT false,
    activate_token VARCHAR(128),
    UNIQUE(email),
    UNIQUE(username)
);

CREATE TABLE messages (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    message_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT,
    post_id BIGINT,
    content VARCHAR(1024) NOT NULL,
    type content_type NOT NULL
);

CREATE TABLE posts (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    post_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    title VARCHAR(128) NOT NULL,
    text VARCHAR(1024),
    media VARCHAR(128)
);

CREATE TABLE conversations (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    convo_id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(128) NOT NULL
);

CREATE TABLE groups (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    group_id BIGSERIAL PRIMARY KEY NOT NULL,
    name VARCHAR(128) NOT NULL,
    UNIQUE(name)
);

CREATE TABLE users_conversations (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    users_conversations_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    convo_id BIGINT NOT NULL,
    last_read_message_id BIGINT
);

CREATE TABLE users_groups (
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    iusers_groups_id BIGSERIAL PRIMARY KEY NOT NULL,
    user_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL
);

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.* IS DISTINCT FROM OLD.* THEN
      NEW.updated_at = NOW(); 
      RETURN NEW;
   ELSE
      RETURN OLD;
   END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_timestamp BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON messages
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON groups
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON users_conversations
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_timestamp BEFORE UPDATE ON users_groups
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();