
DO $$
DECLARE
  teams_count integer;
BEGIN
  SELECT COUNT(*) INTO teams_count FROM public.teams;
  IF teams_count = 0 THEN
    WITH tA AS (
      INSERT INTO public.teams(name, slug) VALUES ('Équipe A', 'equipe-a') RETURNING id
    ), tB AS (
      INSERT INTO public.teams(name, slug) VALUES ('Équipe B', 'equipe-b') RETURNING id
    ),
    dA AS (
      INSERT INTO public.drivers(team_id, name, color)
      SELECT tA.id, v.name, v.color FROM tA, (VALUES
        ('Alice', '#49abff'),
        ('Bob',   '#f59e0b'),
        ('Claire','#22c55e')
      ) AS v(name,color)
      RETURNING id, name, team_id
    ),
    dB AS (
      INSERT INTO public.drivers(team_id, name, color)
      SELECT tB.id, v.name, v.color FROM tB, (VALUES
        ('Diego', '#3b82f6'),
        ('Emma',  '#ec4899')
      ) AS v(name,color)
      RETURNING id, name, team_id
    ),
    rA AS (
      INSERT INTO public.races(team_id, name, type, date, start, finish)
      SELECT tA.id, x.name, x.type, x.date, x.start, x.finish FROM tA, (VALUES
        ('Qualification','qualifying','2025-09-19','11:00','11:20'),
        ('Sprint',       'sprint',    '2025-09-19','12:00','12:15'),
        ('Course 1',     'race',      '2025-09-19','13:05','14:00')
      ) AS x(name,type,date,start,finish)
      RETURNING id, name, team_id
    ),
    rB AS (
      INSERT INTO public.races(team_id, name, type, date, start, finish)
      SELECT tB.id, x.name, x.type, x.date, x.start, x.finish FROM tB, (VALUES
        ('Libre', 'practice','2025-09-19','10:00','10:30'),
        ('Course','race',    '2025-09-19','15:00','16:00')
      ) AS x(name,type,date,start,finish)
      RETURNING id, name, team_id
    )
    INSERT INTO public.stints (race_id, driver_id, duration_minutes, pos)
    SELECT r.id, d.id, s.dur, s.pos
    FROM (
      SELECT 'A' grp, 'Course 1' race, 'Alice'  driver, 10 dur, 0 pos UNION ALL
      SELECT 'A' grp, 'Course 1' race, 'Bob'    driver, 12, 1 UNION ALL
      SELECT 'A' grp, 'Course 1' race, 'Claire' driver, 15, 2 UNION ALL
      SELECT 'A' grp, 'Course 1' race, 'Alice'  driver,  8, 3 UNION ALL
      SELECT 'B' grp, 'Course'   race, 'Diego'  driver, 20, 0 UNION ALL
      SELECT 'B' grp, 'Course'   race, 'Emma'   driver, 20, 1 UNION ALL
      SELECT 'B' grp, 'Course'   race, 'Diego'  driver, 20, 2
    ) s
    JOIN (
      SELECT 'A' grp, r.* FROM rA r
      UNION ALL
      SELECT 'B' grp, r.* FROM rB r
    ) r ON r.name = s.race AND r.grp = s.grp
    JOIN (
      SELECT 'A' grp, d.* FROM dA d
      UNION ALL
      SELECT 'B' grp, d.* FROM dB d
    ) d ON d.name = s.driver AND d.grp = s.grp;
  END IF;
END $$;
