-- Verificar si la tabla 'groups' existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'groups'
);

-- Verificar las columnas de la tabla 'groups'
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'groups';
