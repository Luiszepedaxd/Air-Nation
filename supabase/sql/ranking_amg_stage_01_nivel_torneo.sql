-- AMG Stage 01 CDMX es una fecha de circuito (Torneo), no la final.
-- La fila está en nivel 4. La escalera nueva lee 4 como Final nacional
-- (200 pts). Torneo es nivel 3, base 120.
--
-- 6 jugadores = evento chico, factor 0.5. La bolsa guardada (100) salió
-- de 200 × 0.5. Con Torneo queda 120 × 0.5 = 60.
-- No toca ranking_resultados: los puntos de cada jugador se quedan.

UPDATE ranking_eventos
SET nivel = 3,
    bolsa = 60
WHERE slug = 'amg-stage-01-cdmx-2026';
