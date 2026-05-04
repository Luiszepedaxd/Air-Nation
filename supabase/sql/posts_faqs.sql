-- FAQ JSON para schema.org FAQPage en posts del blog.
-- Ejecutar en Supabase SQL Editor.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS faqs jsonb;
