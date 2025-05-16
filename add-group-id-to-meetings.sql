-- Añadir columna group_id a la tabla meetings si no existe
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS group_id VARCHAR(255) NULL;

-- Crear índice para mejorar el rendimiento de las consultas por grupo
CREATE INDEX IF NOT EXISTS idx_meetings_group_id ON meetings(group_id);
