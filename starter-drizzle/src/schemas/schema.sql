
INSERT INTO movies (id, title, description, duration_minutes, rating, release_date)
VALUES
  ('2f9b7a5e-3f1d-4d8e-9b8a-3c1f6e2a7d10', 'Inception', 'Sci-fi thriller about dreams within dreams.', 148, 'PG-13', '2010-07-16'),
  ('8c2d4f91-1a6b-4c3e-8f57-9d2a6b4e1c22', 'Interstellar', 'Exploration through space and time.', 169, 'PG-13', '2014-11-07'),
  ('5e1a9c34-7b2d-4f6a-a8c1-2d7e9b3f4a55', 'The Dark Knight', 'Batman faces the Joker.', 152, 'PG-13', '2008-07-18')
ON CONFLICT (id) DO NOTHING;

INSERT INTO rooms (id, name, capacity)
VALUES
  ('c1a7e9d3-2b4f-4a8c-9d1e-6f3b2a7c8e11', 'Room A', 120),
  ('f4d2b8a1-6c3e-4f9a-8b2d-1e7c5a9d3f20', 'Room B', 80)
ON CONFLICT (id) DO NOTHING;

INSERT INTO screenings (id, movie_id, room_id, start_time, price)
VALUES
  ('91b4d3e2-7a6c-4f1d-8e9b-2c5a7d3f1b01', '2f9b7a5e-3f1d-4d8e-9b8a-3c1f6e2a7d10', 'c1a7e9d3-2b4f-4a8c-9d1e-6f3b2a7c8e11', '2025-06-01 18:00:00', 12.50),
  ('a3e7c1b9-5d2f-4a8e-9c1d-7f3b2e6a4d02', '2f9b7a5e-3f1d-4d8e-9b8a-3c1f6e2a7d10', 'f4d2b8a1-6c3e-4f9a-8b2d-1e7c5a9d3f20', '2025-06-01 21:00:00', 12.50),
  ('b8d2f4a6-1c7e-4d9a-8f3b-5e2a7c1d9b03', '8c2d4f91-1a6b-4c3e-8f57-9d2a6b4e1c22', 'c1a7e9d3-2b4f-4a8c-9d1e-6f3b2a7c8e11', '2025-06-02 19:00:00', 13.00),
  ('c5a1e7d9-3b2f-4c8a-9d6e-1f7b3a2c5d04', '5e1a9c34-7b2d-4f6a-a8c1-2d7e9b3f4a55', 'f4d2b8a1-6c3e-4f9a-8b2d-1e7c5a9d3f20', '2025-06-03 20:30:00', 11.00)
ON CONFLICT (id) DO NOTHING;
