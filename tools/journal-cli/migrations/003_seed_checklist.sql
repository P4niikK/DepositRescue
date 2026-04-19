-- Idempotent seed of the initial checklist. Safe to re-run.
INSERT INTO agent_checklist (category, title, tags, assignee, done, created_by, position)
VALUES
  ('Research', 'Postear en r/Tenant',                     ARRAY['validation'],         'feli', true,  'feli', 1),
  ('Research', '3 entrevistas con tenants afectados',     ARRAY['interviews'],         'feli', true,  'feli', 2),
  ('Research', 'Descargar statutes CA/NY/TX',             ARRAY['legal','priority'],   'feli', false, 'feli', 3),
  ('Research', 'Comparar APIs de OCR para evidence pack', ARRAY['tech'],               'matu', false, 'matu', 4),

  ('Agents',   'Base del orquestador multi-experto',      ARRAY['core'],               'matu', true,  'matu', 1),
  ('Agents',   'Subagente de photo comparison',           ARRAY['core','priority'],    'matu', false, 'matu', 2),
  ('Agents',   'Skill por estado (1 por c/u, no regional)', ARRAY['skills'],           'feli', false, 'feli', 3),
  ('Agents',   'Abogado del diablo automático en debates', ARRAY['core'],              NULL,   false, 'matu', 4),

  ('Demo',     'Grabar draft del demo video',             ARRAY['video'],              'feli', false, 'feli', 1),
  ('Demo',     'Pulir landing con 3 screens reales',      ARRAY['ui'],                 'matu', false, 'matu', 2),
  ('Demo',     'Audit trail: debate → commit',            ARRAY['integrity'],          NULL,   false, 'matu', 3)
ON CONFLICT DO NOTHING;
