INSERT INTO "User" (
    "id",
    "username",
    "password",
    "isAdmin",
    "createdAt",
    "updatedAt"
) VALUES (
    'admin-user-1',
    'admin',
    '$2b$10$zrQxHXCAd7aVk1BNqGH.7.6wQA0e5kQoRO8QZL.2J8WqR9HD2XiJy', -- This is the hashed version of 'admin123'
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
