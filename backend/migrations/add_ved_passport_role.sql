-- Миграция для добавления роли ved_passport
-- Добавляем новую роль в enum UserRole

-- Сначала создаем новый тип enum с дополнительной ролью
CREATE TYPE userrole_new AS ENUM ('admin', 'manager', 'employee', 'ved_passport');

-- Обновляем существующие записи
UPDATE users SET role = 'employee'::text WHERE role = 'admin'::text;
UPDATE users SET role = 'employee'::text WHERE role = 'manager'::text;
UPDATE users SET role = 'employee'::text WHERE role = 'employee'::text;

-- Удаляем старый тип enum
ALTER TABLE users DROP COLUMN role;
DROP TYPE userrole;

-- Переименовываем новый тип
ALTER TYPE userrole_new RENAME TO userrole;

-- Добавляем колонку role обратно
ALTER TABLE users ADD COLUMN role userrole NOT NULL DEFAULT 'employee';

-- Обновляем существующие записи обратно
UPDATE users SET role = 'admin'::userrole WHERE username LIKE '%admin%';
UPDATE users SET role = 'manager'::userrole WHERE username LIKE '%manager%';
UPDATE users SET role = 'employee'::userrole WHERE username NOT LIKE '%admin%' AND username NOT LIKE '%manager%';
