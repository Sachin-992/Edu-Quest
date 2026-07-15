-- UPDATED BOOTSTRAP ADMIN SCRIPT
-- Run this to create the admin user record correctly

INSERT INTO users (auth_id, email, name, role, status, first_login)
VALUES (
    'ede8055b-433a-4a3f-912d-9162bf120b1d', -- This is your User UID
    'balanp212121@gmail.com',               -- Your email
    'Admin User',                           -- Name (Required field)
    'admin',
    'active',
    false
);
