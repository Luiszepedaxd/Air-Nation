-- AMG-2026.1 — Agrega campos de ganador de ronda
-- Ejecutar en: Supabase Dashboard → SQL Editor

ALTER TABLE tournament_rounds
  ADD COLUMN IF NOT EXISTS winner_team       TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS victory_condition TEXT DEFAULT NULL
    CHECK (victory_condition IN ('elimination', 'control_point', 'time', 'objective'));

COMMENT ON COLUMN tournament_rounds.winner_team IS
  'Nombre del equipo ganador de la ronda (Reglamento AMG-2026.1 Sección 4/5)';

COMMENT ON COLUMN tournament_rounds.victory_condition IS
  'Cómo se ganó la ronda: elimination=eliminación total, control_point=captura CP, time=tiempo, objective=objetivo';
