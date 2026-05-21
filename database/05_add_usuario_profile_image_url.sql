-- 05_ADD_USUARIO_PROFILE_IMAGE_URL.SQL
-- Añade la columna profile_image_url a la tabla usuarios para almacenar URL/base64 de la foto de perfil

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS profile_image_url TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN usuarios.profile_image_url IS 'URL o base64 de la imagen de perfil del usuario';
