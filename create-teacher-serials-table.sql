-- Verificar si la tabla ya existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'teacher_serials') THEN
        -- Crear la tabla teacher_serials
        CREATE TABLE public.teacher_serials (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            serial TEXT NOT NULL UNIQUE,
            is_used BOOLEAN DEFAULT FALSE,
            used_by UUID REFERENCES auth.users(id),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Añadir índices para mejorar el rendimiento
        CREATE INDEX idx_teacher_serials_serial ON public.teacher_serials(serial);
        CREATE INDEX idx_teacher_serials_is_used ON public.teacher_serials(is_used);
        CREATE INDEX idx_teacher_serials_used_by ON public.teacher_serials(used_by);

        -- Añadir trigger para actualizar el campo updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER update_teacher_serials_updated_at
        BEFORE UPDATE ON public.teacher_serials
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        -- Añadir algunos seriales de ejemplo (solo para desarrollo)
        INSERT INTO public.teacher_serials (serial) VALUES 
        ('TEACHER-2023-001'),
        ('TEACHER-2023-002'),
        ('TEACHER-2023-003'),
        ('TEACHER-2023-004'),
        ('TEACHER-2023-005');
    END IF;
END
$$;
