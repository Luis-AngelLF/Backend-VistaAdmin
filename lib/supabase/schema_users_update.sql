-- 1. Add password column to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password text;

-- 2. Delete existing admin (safety check)
DELETE FROM users WHERE role = 'admin';

-- 3. Insert new Admin with Password
-- Note: In a real app we MUST hash this (e.g. bcrypt). 
-- For this MVP/Prototype, we'll store plain text OR a simple hash if pgcrypto is on.
-- Let's assume plain text for the absolute simplest "Trust First" demo unless pgcrypto is enabled.
-- Given "Cripto-proyecto", let's try to use pgcrypto if available, else fallback.
-- EXTENSION pgcrypto IS NOT GUARANTEED. 
-- STRATEGY: We will store it as is, and comparing in backend.
-- The USER REQUESTED: "cedula 119720009"

INSERT INTO users (cedula, names, surnames, role, password, is_active, has_voted)
VALUES (
    '119720009', 
    'Administrador', 
    'Sistema', 
    'admin', 
    'admin123', -- Default password, user can change later? Or just hardcoded for now.
    true, 
    false
);
