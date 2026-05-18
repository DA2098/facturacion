-- Agregar imagen de perfil a usuarios
-- Ejecutar en DBeaver / pgAdmin sobre la base facturaya

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS profile_image_url TEXT DEFAULT '';

UPDATE usuarios
SET profile_image_url = COALESCE(profile_image_url, '')
WHERE profile_image_url IS NULL;