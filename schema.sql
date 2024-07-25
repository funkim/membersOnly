CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    membership BOOLEAN DEFAULT false,
    hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL
);

CREATE TABLE messages (
    title VARCHAR(255) NOT NULL,
    message VARCHAR(255) NOT NULL,
    creator VARCHAR(255) NOT NULL,
    timestamp VARCHAR(255)
);