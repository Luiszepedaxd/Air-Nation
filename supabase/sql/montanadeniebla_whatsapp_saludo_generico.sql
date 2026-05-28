-- Montaña de Niebla — saludos WhatsApp genéricos (sin "Germán" hardcodeado)
-- Ejecutar manualmente en Supabase SQL Editor (fundador).
-- Reemplaza "Hola Germán, ..." por "Hola, ..." en links wa.me pre-llenados.

-- ---------------------------------------------------------------------------
-- 1. Hero — cta1_link
-- ---------------------------------------------------------------------------
UPDATE montanadeniebla_blocks
SET config = jsonb_set(
  config,
  '{cta1_link}',
  '"https://wa.me/522281182919?text=Hola%2C%20quiero%20inscribirme%20a%20Monta%C3%B1a%20de%20Niebla%20VII"'::jsonb
)
WHERE slug = 'hero';

-- ---------------------------------------------------------------------------
-- 2. Inscripción — cta1_link
-- ---------------------------------------------------------------------------
UPDATE montanadeniebla_blocks
SET config = jsonb_set(
  config,
  '{cta1_link}',
  '"https://wa.me/522281182919?text=Hola%2C%20quiero%20inscribirme%20a%20Monta%C3%B1a%20de%20Niebla%20VII"'::jsonb
)
WHERE slug = 'inscripcion';

-- ---------------------------------------------------------------------------
-- 3. Facciones — contacto_whatsapp (red_sun + lux_et_umbra)
-- ---------------------------------------------------------------------------
UPDATE montanadeniebla_blocks
SET config = jsonb_set(
  jsonb_set(
    config,
    '{red_sun,contacto_whatsapp}',
    '"https://wa.me/522281182919?text=Hola%2C%20quiero%20unirme%20a%20RED%20SUN%20en%20Monta%C3%B1a%20de%20Niebla%20VII"'::jsonb
  ),
  '{lux_et_umbra,contacto_whatsapp}',
  '"https://wa.me/522281182919?text=Hola%2C%20quiero%20unirme%20a%20LUX%20ET%20UMBRA%20en%20Monta%C3%B1a%20de%20Niebla%20VII"'::jsonb
)
WHERE slug = 'facciones';

-- ---------------------------------------------------------------------------
-- 4. Fallback — cualquier otro campo en config que aún tenga el patrón viejo
--    (variantes con/sin tilde, encoding parcial)
-- ---------------------------------------------------------------------------
UPDATE montanadeniebla_blocks
SET config = replace(
  replace(
    replace(
      replace(config::text, 'Hola%20Germán%2C%20', 'Hola%2C%20'),
      'Hola%20German%2C%20', 'Hola%2C%20'
    ),
    'Hola Germán, ', 'Hola, '
  ),
  'Hola German, ', 'Hola, '
)::jsonb
WHERE config::text ~* 'Hola.*Germ';

-- Opcional: mismo fallback en otras landings si el seed copió el mismo patrón
-- UPDATE operacionkursk2_blocks SET config = replace(replace(config::text, 'Hola%20Germán%2C%20', 'Hola%2C%20'), 'Hola%20German%2C%20', 'Hola%2C%20')::jsonb WHERE config::text ~* 'Hola.*Germ';
-- UPDATE bloodmoney2_blocks SET config = replace(replace(config::text, 'Hola%20Germán%2C%20', 'Hola%2C%20'), 'Hola%20German%2C%20', 'Hola%2C%20')::jsonb WHERE config::text ~* 'Hola.*Germ';

-- ---------------------------------------------------------------------------
-- Verificación
-- ---------------------------------------------------------------------------
SELECT slug, config->>'cta1_link' AS cta1_link
FROM montanadeniebla_blocks
WHERE slug IN ('hero', 'inscripcion');

SELECT slug,
  config->'red_sun'->>'contacto_whatsapp' AS red_sun_wa,
  config->'lux_et_umbra'->>'contacto_whatsapp' AS lux_wa
FROM montanadeniebla_blocks
WHERE slug = 'facciones';
