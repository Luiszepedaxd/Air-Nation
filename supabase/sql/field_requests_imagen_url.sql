-- Imagen opcional en solicitudes de campo (portada del evento al aprobar).
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE public.field_requests
  ADD COLUMN IF NOT EXISTS imagen_url text;
