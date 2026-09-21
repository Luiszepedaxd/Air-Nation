-- Remapeo de ranking_eventos.nivel: escalera de 5 niveles → 4.
-- Ejecutar UNA vez en el SQL Editor de Supabase, y solo si hay filas
-- cargadas con la numeración vieja. No reaplicar después de publicar
-- eventos con la escalera nueva (2 = milsim/opsim, 3 = torneo).
--
-- Vieja: 1 Dominguera, 2 Torneo, 3 Milsim, 4 Circuito nacional, 5 Final nacional
-- Nueva: 1 Dominguera, 2 Milsim/Opsim, 3 Torneo, 4 Final nacional
--
-- Circuito nacional (4) → Torneo (3): fechas de circuito son competitivas
-- con lugares, no la final. Final (5) → Final nacional (4).

UPDATE ranking_eventos
SET nivel = CASE nivel
  WHEN 1 THEN 1
  WHEN 2 THEN 3
  WHEN 3 THEN 2
  WHEN 4 THEN 3
  WHEN 5 THEN 4
  ELSE nivel
END
WHERE nivel BETWEEN 2 AND 5;
