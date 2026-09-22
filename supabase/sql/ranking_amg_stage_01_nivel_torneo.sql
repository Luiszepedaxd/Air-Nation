-- AMG Stage 01 CDMX es una fecha de circuito (Torneo), no la final.
-- La fila está en nivel 4, y la UI de la escalera nueva lee eso como
-- Final nacional. No toca bolsa ni ranking_resultados: los puntos de
-- cada jugador se quedan.
--
-- Después de correr esto, se puede quitar el slug de
-- SLUGS_TORNEO_NIVEL_FINAL en frontend/lib/ranking.ts.

UPDATE ranking_eventos
SET nivel = 3
WHERE slug = 'amg-stage-01-cdmx-2026'
  AND nivel IN (4, 5);
