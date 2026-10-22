-- Campos de PRUEBA: visibles solo por enlace directo, nunca en el directorio.
-- Ejecutar en Supabase SQL Editor (una sola vez) ANTES de desplegar este cambio:
-- las consultas públicas ya filtran por esta columna y fallarían sin ella.
--
-- El campo de prueba queda con status = 'aprobado' a propósito: así las
-- políticas RLS existentes (lectura pública de campos aprobados, reseñas,
-- eventos) siguen funcionando y los dueños ligados pueden operarlo con la
-- llave anónima. Lo que lo oculta es esta bandera, filtrada en cada listado
-- público. Por eso NO hace falta tocar ninguna política.

ALTER TABLE public.fields
  ADD COLUMN IF NOT EXISTS es_prueba boolean NOT NULL DEFAULT false;
