-- Esquema del sistema de turnos.
CREATE TABLE IF NOT EXISTS citizens (
  cedula     TEXT PRIMARY KEY,
  nombre     TEXT NOT NULL,
  correo     TEXT NOT NULL DEFAULT '',
  telefono   TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  token          TEXT PRIMARY KEY,
  cedula         TEXT NOT NULL REFERENCES citizens(cedula),
  tramite        TEXT NOT NULL,
  sede           TEXT NOT NULL,
  oficina        TEXT NOT NULL DEFAULT '',
  funcionario    TEXT NOT NULL DEFAULT '',
  fecha          DATE NOT NULL,
  hora           TEXT NOT NULL,
  estado         TEXT NOT NULL DEFAULT 'Turno agendado',
  ai_insight     TEXT NOT NULL DEFAULT '',
  last_tracked_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de seguimiento inteligente por turno.
CREATE TABLE IF NOT EXISTS tracking_events (
  id              SERIAL PRIMARY KEY,
  token           TEXT NOT NULL REFERENCES appointments(token) ON DELETE CASCADE,
  estado_anterior TEXT,
  estado_nuevo    TEXT NOT NULL,
  mensaje         TEXT NOT NULL,
  origen          TEXT NOT NULL DEFAULT 'ia',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_events_token ON tracking_events(token);
CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);

-- Usuario del chatbot: SOLO LECTURA, garantizado por la BD (no por el prompt).
-- ponytail: password simple porque es dev local; cambiarla si esto sale de tu maquina.
CREATE ROLE chatbot_ro LOGIN PASSWORD 'chatbot_ro';
GRANT CONNECT ON DATABASE turnos TO chatbot_ro;
GRANT USAGE ON SCHEMA public TO chatbot_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO chatbot_ro;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO chatbot_ro;
