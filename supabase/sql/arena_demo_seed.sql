-- =============================================================================
-- ARENA — Datos DEMO para probar el marketplace de punta a punta
-- Archivo: supabase/sql/arena_demo_seed.sql
-- Ejecutar COMPLETO en Supabase SQL Editor. Es re-ejecutable (ON CONFLICT).
--
-- Requiere corridos antes: arena_mvp.sql, campos_prueba.sql y
-- arena_marketplace.sql. arena_landing.sql es OPCIONAL: las columnas y la
-- tabla que agrega se llenan solo si existen (bloques DO más abajo).
--
-- Crea DOS campos marcados `fields.es_prueba = true`: NO salen en /arena, ni
-- en /campos, ni en el sitemap, ni en Joulie. Se ven entrando por su URL
-- directa y desde /admin/arena. Los nombres empiezan con "DEMO " a propósito:
-- ningún negocio real, ninguna dirección real.
--
-- Dinero en centavos. Fechas en America/Mexico_City.
--
-- Para quitarlo todo NO hace falta SQL: /admin/arena/<fieldId> → "CAMPO DE
-- PRUEBA" → BORRAR CAMPO DEMO (o LIMPIAR RESERVAS DEMO para dejar el campo
-- y tirar solo las reservas de prueba).
-- =============================================================================

-- UUID fijos para que correr este archivo dos veces no duplique nada.
--   Campos:  dddddddd-0000-4000-8000-00000000000N
--   Items:   dddddddd-1111-4111-8111-0000000000NN
--   Cierres: dddddddd-2222-4222-8222-0000000000NN
--   Landing: dddddddd-3333-4333-8333-0000000000NN


-- -----------------------------------------------------------------------------
-- 1. Los dos campos DEMO
--    status = 'aprobado' a propósito: lo que los esconde del directorio es
--    es_prueba, no el status (ver campos_prueba.sql).
-- -----------------------------------------------------------------------------
INSERT INTO public.fields (
  id, nombre, slug, ciudad, estado, tipo, status, es_prueba,
  descripcion, direccion, maps_url, telefono, horarios_json, created_by)
VALUES
  (
    'dddddddd-0000-4000-8000-000000000001',
    'DEMO Campo Bosque Norte',
    'demo-campo-bosque-norte',
    'Zapopan',
    'Jalisco',
    'publico',
    'aprobado',
    TRUE,
    'Campo DEMO para pruebas de AirNation ARENA. Cuatro hectáreas de bosque con una aldea de CQB. No es un negocio real: sirve para probar reservas, pagos y escaneo de QR.',
    'Domicilio de prueba 100, Zapopan, Jalisco',
    NULL,
    NULL,
    '{
      "lunes":     {"abierto": false, "apertura": "09:00", "cierre": "18:00"},
      "martes":    {"abierto": false, "apertura": "09:00", "cierre": "18:00"},
      "miercoles": {"abierto": true,  "apertura": "09:00", "cierre": "18:00"},
      "jueves":    {"abierto": true,  "apertura": "09:00", "cierre": "18:00"},
      "viernes":   {"abierto": true,  "apertura": "09:00", "cierre": "19:00"},
      "sabado":    {"abierto": true,  "apertura": "08:00", "cierre": "19:00"},
      "domingo":   {"abierto": true,  "apertura": "08:00", "cierre": "17:00"}
    }'::jsonb,
    (SELECT u.id FROM public.users u WHERE u.app_role = 'admin' ORDER BY u.created_at LIMIT 1)
  ),
  (
    'dddddddd-0000-4000-8000-000000000002',
    'DEMO Arena Urbana Sur',
    'demo-arena-urbana-sur',
    'Ciudad de México',
    'Ciudad de México',
    'publico',
    'aprobado',
    TRUE,
    'Campo DEMO para pruebas de AirNation ARENA. Nave urbana con contenedores y pasillos cortos, pensada para partidas rápidas. No es un negocio real.',
    'Domicilio de prueba 200, Ciudad de México',
    NULL,
    NULL,
    '{
      "lunes":     {"abierto": false, "apertura": "10:00", "cierre": "20:00"},
      "martes":    {"abierto": true,  "apertura": "10:00", "cierre": "20:00"},
      "miercoles": {"abierto": true,  "apertura": "10:00", "cierre": "20:00"},
      "jueves":    {"abierto": true,  "apertura": "10:00", "cierre": "20:00"},
      "viernes":   {"abierto": true,  "apertura": "10:00", "cierre": "22:00"},
      "sabado":    {"abierto": true,  "apertura": "09:00", "cierre": "22:00"},
      "domingo":   {"abierto": true,  "apertura": "09:00", "cierre": "18:00"}
    }'::jsonb,
    (SELECT u.id FROM public.users u WHERE u.app_role = 'admin' ORDER BY u.created_at LIMIT 1)
  )
ON CONFLICT (id) DO UPDATE SET
  nombre         = EXCLUDED.nombre,
  slug           = EXCLUDED.slug,
  ciudad         = EXCLUDED.ciudad,
  estado         = EXCLUDED.estado,
  tipo           = EXCLUDED.tipo,
  status         = EXCLUDED.status,
  es_prueba      = TRUE,
  descripcion    = EXCLUDED.descripcion,
  direccion      = EXCLUDED.direccion,
  horarios_json  = EXCLUDED.horarios_json;


-- -----------------------------------------------------------------------------
-- 2. ARENA activo, con lo que leen los filtros de /arena
--    (disciplinas, terrenos y edad mínima vienen de arena_marketplace.sql)
-- -----------------------------------------------------------------------------
INSERT INTO public.arena_field_settings (
  field_id, activo, plan, comision_pct,
  anticipacion_min_horas, anticipacion_max_dias, cancelacion_horas_limite,
  politica_cancelacion, email_avisos, telefono_avisos,
  banco, clabe, titular_cuenta,
  disciplinas, terrenos, edad_minima)
VALUES
  (
    'dddddddd-0000-4000-8000-000000000001',
    TRUE, 'premium', 10.00,
    12, 30, 24,
    'Cancelas hasta 24 horas antes de la apertura y te devolvemos el 100%. Después de ese plazo la reserva ya no se reembolsa. Si el campo cancela, el reembolso siempre es total.',
    'demo.bosque@example.com', '3300000000',
    'BANCO DEMO', '000000000000000001', 'DEMO Campo Bosque Norte',
    ARRAY['airsoft', 'gotcha']::text[],
    ARRAY['bosque', 'cqb']::text[],
    12
  ),
  (
    'dddddddd-0000-4000-8000-000000000002',
    TRUE, 'free', 8.00,
    6, 21, 48,
    'Cancelas hasta 48 horas antes de la apertura y te devolvemos el 100%. Después de ese plazo la reserva ya no se reembolsa.',
    'demo.urbana@example.com', '5500000000',
    'BANCO DEMO', '000000000000000002', 'DEMO Arena Urbana Sur',
    ARRAY['airsoft', 'gelsoft']::text[],
    ARRAY['urbano', 'cqb']::text[],
    14
  )
ON CONFLICT (field_id) DO UPDATE SET
  activo                   = EXCLUDED.activo,
  plan                     = EXCLUDED.plan,
  comision_pct             = EXCLUDED.comision_pct,
  anticipacion_min_horas   = EXCLUDED.anticipacion_min_horas,
  anticipacion_max_dias    = EXCLUDED.anticipacion_max_dias,
  cancelacion_horas_limite = EXCLUDED.cancelacion_horas_limite,
  politica_cancelacion     = EXCLUDED.politica_cancelacion,
  email_avisos             = EXCLUDED.email_avisos,
  telefono_avisos          = EXCLUDED.telefono_avisos,
  banco                    = EXCLUDED.banco,
  clabe                    = EXCLUDED.clabe,
  titular_cuenta           = EXCLUDED.titular_cuenta,
  disciplinas              = EXCLUDED.disciplinas,
  terrenos                 = EXCLUDED.terrenos,
  edad_minima              = EXCLUDED.edad_minima;


-- Columnas de arena_landing.sql: solo si ese archivo ya se corrió.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'arena_field_settings'
      AND column_name = 'resumen_landing') THEN
    UPDATE public.arena_field_settings SET
      destacado       = TRUE,
      orden_landing   = 1,
      resumen_landing = 'Campo DEMO: bosque y CQB, con árbitro incluido.'
    WHERE field_id = 'dddddddd-0000-4000-8000-000000000001';

    UPDATE public.arena_field_settings SET
      destacado       = FALSE,
      orden_landing   = 2,
      resumen_landing = 'Campo DEMO: nave urbana, partidas rápidas de noche.'
    WHERE field_id = 'dddddddd-0000-4000-8000-000000000002';
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 3. Catálogo: un paquete obligatorio (es_base) por disciplina, el derecho de
--    campo, y rentas y extras opcionales. Precios en CENTAVOS.
--    `es_base` NO se inserta: la calcula la BD a partir de `tipo`.
-- -----------------------------------------------------------------------------
INSERT INTO public.arena_items (
  id, field_id, tipo, nombre, descripcion, incluye,
  precio_centavos, unidad, disciplina, duracion_min,
  min_jugadores, max_jugadores, max_por_reserva, activo, orden)
VALUES
  -- DEMO Campo Bosque Norte
  ('dddddddd-1111-4111-8111-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   'paquete', 'DEMO Jornada de airsoft',
   'Jornada completa en el bosque, con árbitro y zona segura.',
   ARRAY['Marcadora de renta', '1000 bbs', 'Máscara', 'Árbitro', 'Estacionamiento']::text[],
   38000, 'por_persona', 'airsoft', 300, 6, 40, NULL, TRUE, 1),

  ('dddddddd-1111-4111-8111-000000000002', 'dddddddd-0000-4000-8000-000000000001',
   'paquete', 'DEMO Gotcha familiar',
   'Dos horas de gotcha para grupos con niños desde 12 años.',
   ARRAY['Marcadora de renta', '200 bolas', 'Máscara', 'Overol', 'Árbitro']::text[],
   24000, 'por_persona', 'gotcha', 120, 4, 30, NULL, TRUE, 2),

  ('dddddddd-1111-4111-8111-000000000003', 'dddddddd-0000-4000-8000-000000000001',
   'derecho_campo', 'DEMO Derecho de campo (grupo cerrado)',
   'El campo completo para tu grupo, sin mezclarte con otros. Equipo aparte.',
   ARRAY['Campo exclusivo', 'Árbitro', 'Zona de descanso']::text[],
   450000, 'por_reserva', NULL, 300, 10, 60, NULL, TRUE, 3),

  ('dddddddd-1111-4111-8111-000000000004', 'dddddddd-0000-4000-8000-000000000001',
   'renta', 'DEMO Renta de marcadora extra',
   'Una marcadora adicional para quien trae su propio equipo incompleto.',
   '{}'::text[],
   15000, 'por_persona', NULL, NULL, NULL, NULL, NULL, TRUE, 4),

  ('dddddddd-1111-4111-8111-000000000005', 'dddddddd-0000-4000-8000-000000000001',
   'extra', 'DEMO 1000 bbs extra',
   'Bolsa de 1000 bbs biodegradables de 0.25 g.',
   '{}'::text[],
   4500, 'por_unidad', NULL, NULL, NULL, NULL, 10, TRUE, 5),

  ('dddddddd-1111-4111-8111-000000000006', 'dddddddd-0000-4000-8000-000000000001',
   'extra', 'DEMO Comida (taco de guisado)',
   'Comida para después de la partida.',
   '{}'::text[],
   12000, 'por_unidad', NULL, NULL, NULL, NULL, 40, TRUE, 6),

  -- DEMO Arena Urbana Sur
  ('dddddddd-1111-4111-8111-000000000011', 'dddddddd-0000-4000-8000-000000000002',
   'paquete', 'DEMO Partida urbana de airsoft',
   'Tres horas en la nave, con rotación de escenarios.',
   ARRAY['Marcadora de renta', '800 bbs', 'Máscara', 'Árbitro']::text[],
   29000, 'por_persona', 'airsoft', 180, 6, 24, NULL, TRUE, 1),

  ('dddddddd-1111-4111-8111-000000000012', 'dddddddd-0000-4000-8000-000000000002',
   'paquete', 'DEMO Gelsoft nocturno',
   'Partida de gelsoft con luces, de viernes a sábado por la noche.',
   ARRAY['Marcadora de gel', 'Bolas de gel', 'Lentes', 'Árbitro']::text[],
   19000, 'por_persona', 'gelsoft', 120, 4, 20, NULL, TRUE, 2),

  ('dddddddd-1111-4111-8111-000000000013', 'dddddddd-0000-4000-8000-000000000002',
   'derecho_campo', 'DEMO Nave completa (grupo cerrado)',
   'La nave entera para tu grupo. Equipo aparte.',
   ARRAY['Nave exclusiva', 'Árbitro', 'Música']::text[],
   320000, 'por_reserva', NULL, 180, 8, 40, NULL, TRUE, 3),

  ('dddddddd-1111-4111-8111-000000000014', 'dddddddd-0000-4000-8000-000000000002',
   'renta', 'DEMO Renta de chaleco táctico',
   'Chaleco con portacargadores.',
   '{}'::text[],
   8000, 'por_persona', NULL, NULL, NULL, NULL, NULL, TRUE, 4),

  ('dddddddd-1111-4111-8111-000000000015', 'dddddddd-0000-4000-8000-000000000002',
   'extra', 'DEMO Cargador extra',
   'Cargador de alta capacidad, ya cargado.',
   '{}'::text[],
   3500, 'por_unidad', NULL, NULL, NULL, NULL, 6, TRUE, 5)
ON CONFLICT (id) DO UPDATE SET
  field_id        = EXCLUDED.field_id,
  tipo            = EXCLUDED.tipo,
  nombre          = EXCLUDED.nombre,
  descripcion     = EXCLUDED.descripcion,
  incluye         = EXCLUDED.incluye,
  precio_centavos = EXCLUDED.precio_centavos,
  unidad          = EXCLUDED.unidad,
  disciplina      = EXCLUDED.disciplina,
  duracion_min    = EXCLUDED.duracion_min,
  min_jugadores   = EXCLUDED.min_jugadores,
  max_jugadores   = EXCLUDED.max_jugadores,
  max_por_reserva = EXCLUDED.max_por_reserva,
  activo          = EXCLUDED.activo,
  orden           = EXCLUDED.orden;


-- -----------------------------------------------------------------------------
-- 4. Días cerrados (blackouts)
--    Relativos a hoy para que el demo siga teniendo días cerrados a futuro:
--    re-correr el archivo los recorre. Caen en días que el horario abre, que
--    es justo lo que hace que el calendario los pinte tachados.
-- -----------------------------------------------------------------------------
INSERT INTO public.arena_blackouts (id, field_id, fecha, motivo)
VALUES
  ('dddddddd-2222-4222-8222-000000000001', 'dddddddd-0000-4000-8000-000000000001',
   (now() AT TIME ZONE 'America/Mexico_City')::date + 6, 'DEMO evento privado'),
  ('dddddddd-2222-4222-8222-000000000002', 'dddddddd-0000-4000-8000-000000000001',
   (now() AT TIME ZONE 'America/Mexico_City')::date + 13, 'DEMO mantenimiento'),
  ('dddddddd-2222-4222-8222-000000000011', 'dddddddd-0000-4000-8000-000000000002',
   (now() AT TIME ZONE 'America/Mexico_City')::date + 9, 'DEMO torneo cerrado')
ON CONFLICT (id) DO UPDATE SET
  field_id = EXCLUDED.field_id,
  fecha    = EXCLUDED.fecha,
  motivo   = EXCLUDED.motivo;


-- -----------------------------------------------------------------------------
-- 5. Bloques de la landing /arena — SOLO si arena_landing.sql ya se corrió.
--    Sin foto real: `url` queda vacía a propósito, para que el fundador suba
--    la suya desde /admin/arena/landing. El hero degrada solo si no hay foto.
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.arena_landing_media') IS NOT NULL THEN
    INSERT INTO public.arena_landing_media (id, slot, url, titulo, subtitulo, cta_label, cta_href, activo, orden)
    VALUES
      ('dddddddd-3333-4333-8333-000000000001', 'hero', '',
       'Reserva tu próximo partido',
       'Campos de airsoft, gotcha y gelsoft con reserva en línea. Eliges día, pagas y te llega tu QR de entrada.',
       NULL, NULL, FALSE, 0),
      ('dddddddd-3333-4333-8333-000000000002', 'banner', '',
       'DEMO Banner de ejemplo',
       'Cambia la foto y el texto desde /admin/arena/landing.',
       'Ver campos', '/arena', FALSE, 1)
    ON CONFLICT (id) DO UPDATE SET
      slot      = EXCLUDED.slot,
      titulo    = EXCLUDED.titulo,
      subtitulo = EXCLUDED.subtitulo,
      cta_label = EXCLUDED.cta_label,
      cta_href  = EXCLUDED.cta_href,
      orden     = EXCLUDED.orden;
    -- activo = FALSE a propósito: sin foto no vale la pena publicarlos.
    -- Se encienden desde /admin/arena/landing cuando tengan imagen.
  END IF;
END
$$;


-- -----------------------------------------------------------------------------
-- 6. Comprobación rápida (no cambia nada)
-- -----------------------------------------------------------------------------
SELECT
  f.nombre,
  f.slug,
  f.es_prueba,
  s.activo AS arena_activo,
  s.disciplinas,
  s.terrenos,
  (SELECT count(*) FROM public.arena_items i WHERE i.field_id = f.id) AS items,
  (SELECT count(*) FROM public.arena_blackouts b WHERE b.field_id = f.id) AS dias_cerrados
FROM public.fields f
LEFT JOIN public.arena_field_settings s ON s.field_id = f.id
WHERE f.id IN (
  'dddddddd-0000-4000-8000-000000000001',
  'dddddddd-0000-4000-8000-000000000002')
ORDER BY f.nombre;
