-- Добавление полей профиля пользователя
ALTER TABLE public.allowed_users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMP;

-- Комментарии к полям
COMMENT ON COLUMN public.allowed_users.avatar_url IS 'URL или Base64 аватара пользователя';
COMMENT ON COLUMN public.allowed_users.email_verified IS 'Подтверждён ли email';
COMMENT ON COLUMN public.allowed_users.email_verification_token IS 'Токен для подтверждения email';
COMMENT ON COLUMN public.allowed_users.email_verification_expires IS 'Срок действия токена подтверждения';
