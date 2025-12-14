-- Таблица истории изменений
CREATE TABLE change_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES allowed_users(user_id),
  entity_type VARCHAR(50) NOT NULL,
  entity_id INTEGER NOT NULL,
  action VARCHAR(50) NOT NULL,
  description VARCHAR(500) NOT NULL,
  metadata TEXT,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_change_logs_created_at ON change_logs(created_at);
CREATE INDEX idx_change_logs_entity ON change_logs(entity_type, entity_id);

-- Таблица для отслеживания последнего просмотра истории пользователем
CREATE TABLE change_log_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES allowed_users(user_id),
  last_viewed_at TIMESTAMP(6) NOT NULL,
  UNIQUE(user_id)
);
