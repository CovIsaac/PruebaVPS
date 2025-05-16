-- Verificar si la columna group_id existe en la tabla meetings
DO $$
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'meetings'
        AND column_name = 'group_id'
    ) THEN
        -- Si no existe, añadir la columna
        ALTER TABLE meetings ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
        RAISE NOTICE 'Columna group_id añadida a la tabla meetings';
    ELSE
        RAISE NOTICE 'La columna group_id ya existe en la tabla meetings';
    END IF;
END $$;

-- Crear un índice para mejorar el rendimiento de las consultas por group_id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE tablename = 'meetings'
        AND indexname = 'meetings_group_id_idx'
    ) THEN
        CREATE INDEX meetings_group_id_idx ON meetings(group_id);
        RAISE NOTICE 'Índice meetings_group_id_idx creado';
    ELSE
        RAISE NOTICE 'El índice meetings_group_id_idx ya existe';
    END IF;
END $$;

-- Mostrar algunas estadísticas sobre las reuniones y sus grupos
SELECT 
    COUNT(*) AS total_meetings,
    COUNT(group_id) AS meetings_with_group_id,
    COUNT(DISTINCT group_id) AS unique_groups
FROM meetings;
