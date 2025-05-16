-- Eliminar columnas relacionadas con Google Drive de la tabla meetings
ALTER TABLE meetings
DROP COLUMN IF EXISTS google_drive_id,
DROP COLUMN IF EXISTS google_drive_link,
DROP COLUMN IF EXISTS user_folder_id;
