-- Создание администратора с простым паролем admin
INSERT INTO users (username, email, hashed_password, first_name, last_name, middle_name, role, is_active, created_at) 
VALUES (
    'admin', 
    'admin@almazgeobur.kz', 
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO.G', -- пароль: admin
    'Администратор', 
    'Системы', 
    '', 
    'admin', 
    true, 
    NOW()
);

-- Создание отдела администрации если его нет
INSERT INTO departments (name, description, is_active, created_at) 
VALUES (
    'Администрация', 
    'Административный отдел компании', 
    true, 
    NOW()
) ON CONFLICT DO NOTHING;

-- Обновление пользователя - назначение в отдел администрации
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Администрация' LIMIT 1)
WHERE username = 'admin';

-- Назначение администратора главой отдела
UPDATE departments 
SET head_id = (SELECT id FROM users WHERE username = 'admin' LIMIT 1)
WHERE name = 'Администрация';
