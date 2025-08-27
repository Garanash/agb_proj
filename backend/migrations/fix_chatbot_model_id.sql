-- Миграция для переименования поля model_id в bot_model_id
-- чтобы избежать конфликта с protected namespace Pydantic

ALTER TABLE chat_bots RENAME COLUMN model_id TO bot_model_id;
