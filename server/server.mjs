// API mínima para persistir los turnos en Postgres.
// El frontend le pega fire-and-forget; si esta API está caída, la app sigue en localStorage.
import './env.mjs';
import { createServer } from 'node:http';
import pg from 'pg';
import {
  trackAppointment,
  trackAll,
  askAssistant,
  computeStatus,
  buildFallbackInsight,
  getAiInfo,
} from './ai-tracking.mjs';

const PORT = Number(process.env.PORT || 3001);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://turnos:turnos@localhost:5433/turnos',
});
pool.on('error', (err) => console.error('Error del pool de Postgres:', err.message));

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

const upsertCitizen = `
  INSERT INTO citizens (cedula, nombre, correo, telefono) VALUES ($1, $2, $3, $4)
  ON CONFLICT (cedula) DO UPDATE SET nombre = $2, correo = $3, telefono = $4`;

async function getTrackingBundle(token) {
  await trackAppointment(pool, token);
  const { rows } = await pool.query(
    `SELECT a.*, c.nombre, c.correo, c.telefono
     FROM appointments a
     JOIN citizens c ON c.cedula = a.cedula
     WHERE a.token = $1`,
    [token]
  );
  if (!rows[0]) return null;
  const { rows: events } = await pool.query(
    'SELECT id, estado_anterior, estado_nuevo, mensaje, origen, created_at FROM tracking_events WHERE token = $1 ORDER BY created_at DESC LIMIT 20',
    [token]
  );
  return { appointment: rows[0], events };
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }

    const url = new URL(req.url, 'http://127.0.0.1');

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const ai = getAiInfo();
      let db = false;
      try {
        await pool.query('SELECT 1');
        db = true;
      } catch {
        db = false;
      }
      return json(res, 200, { ok: true, db, ai: ai.enabled, provider: ai.provider, model: ai.model });
    }

    if (req.method === 'POST' && url.pathname === '/api/citizens') {
      const b = await readBody(req);
      if (!b.cedula || !b.nombre) return json(res, 400, { error: 'cedula y nombre son obligatorios' });
      await pool.query(upsertCitizen, [b.cedula, b.nombre, b.correo || '', b.telefono || '']);
      return json(res, 201, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/appointments') {
      const b = await readBody(req);
      for (const campo of ['token', 'cedula', 'tramite', 'sede', 'fecha', 'hora']) {
        if (!b[campo]) return json(res, 400, { error: campo + ' es obligatorio' });
      }
      await pool.query(
        `INSERT INTO citizens (cedula, nombre, correo, telefono) VALUES ($1, $2, $3, $4)
         ON CONFLICT (cedula) DO NOTHING`,
        [b.cedula, b.nombre || '', b.correo || '', b.telefono || '']
      );
      const ins = await pool.query(
        `INSERT INTO appointments (token, cedula, tramite, sede, oficina, funcionario, fecha, hora, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (token) DO NOTHING`,
        [b.token, b.cedula, b.tramite, b.sede, b.oficina || '', b.funcionario || '', b.fecha, b.hora, b.estado || 'Turno agendado']
      );
      if (ins.rowCount === 0) {
        const dueno = await pool.query('SELECT cedula FROM appointments WHERE token = $1', [b.token]);
        if (dueno.rows[0]?.cedula !== b.cedula) {
          console.error('Colision de token:', b.token);
          return json(res, 409, { error: 'token ya usado por otro ciudadano' });
        }
      } else {
        const insight = buildFallbackInsight(
          { token: b.token, tramite: b.tramite, sede: b.sede, oficina: b.oficina, funcionario: b.funcionario, fecha: b.fecha, hora: b.hora },
          b.estado || 'Turno agendado'
        );
        await pool.query(
          `UPDATE appointments SET ai_insight = $1 WHERE token = $2`,
          [insight, b.token]
        );
        await pool.query(
          `INSERT INTO tracking_events (token, estado_anterior, estado_nuevo, mensaje, origen)
           VALUES ($1, NULL, $2, $3, 'sistema')`,
          [b.token, b.estado || 'Turno agendado', insight]
        );
      }
      return json(res, 201, { ok: true });
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/appointments/')) {
      const token = decodeURIComponent(url.pathname.slice('/api/appointments/'.length)).toUpperCase();
      const b = await readBody(req);
      if (!b.estado) return json(res, 400, { error: 'estado es obligatorio' });
      const prev = await pool.query('SELECT estado FROM appointments WHERE token = $1', [token]);
      if (!prev.rows[0]) return json(res, 404, { error: 'turno no encontrado' });
      const insight = b.ai_insight || buildFallbackInsight({ token, ...b }, b.estado);
      await pool.query(
        'UPDATE appointments SET estado = $1, ai_insight = $2, last_tracked_at = now() WHERE token = $3',
        [b.estado, insight, token]
      );
      await pool.query(
        `INSERT INTO tracking_events (token, estado_anterior, estado_nuevo, mensaje, origen)
         VALUES ($1, $2, $3, $4, 'manual')`,
        [token, prev.rows[0].estado, b.estado, insight]
      );
      return json(res, 200, { ok: true, estado: b.estado, ai_insight: insight });
    }

    const trackingMatch = url.pathname.match(/^\/api\/tracking\/([^/]+)$/);
    if (req.method === 'GET' && trackingMatch) {
      const token = decodeURIComponent(trackingMatch[1]).toUpperCase();
      const bundle = await getTrackingBundle(token);
      if (!bundle) return json(res, 404, { error: 'turno no encontrado' });
      return json(res, 200, bundle);
    }

    if (req.method === 'POST' && url.pathname === '/api/tracking/run') {
      const result = await trackAll(pool);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/ask') {
      const b = await readBody(req);
      if (!b.question?.trim()) return json(res, 400, { error: 'question es obligatorio' });
      const token = (b.token || '').trim().toUpperCase();
      const question = b.question.trim();

      let appointment = null;
      let events = [];

      if (token) {
        const bundle = await getTrackingBundle(token);
        if (!bundle) return json(res, 404, { error: 'turno no encontrado' });
        appointment = bundle.appointment;
        events = bundle.events;
      }

      const answer = await askAssistant(question, appointment, events);
      return json(res, 200, {
        answer,
        estado: appointment?.estado || null,
        ai_insight: appointment?.ai_insight || null,
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/preview') {
      const b = await readBody(req);
      for (const campo of ['fecha', 'hora']) {
        if (!b[campo]) return json(res, 400, { error: campo + ' es obligatorio' });
      }
      const estado = computeStatus(b);
      const insight = buildFallbackInsight(
        {
          token: b.token || 'TUR-000000',
          tramite: b.tramite || 'Trámite',
          sede: b.sede || 'Sede',
          oficina: b.oficina || '',
          funcionario: b.funcionario || '',
          fecha: b.fecha,
          hora: b.hora,
        },
        estado
      );
      return json(res, 200, { estado, ai_insight: insight });
    }

    json(res, 404, { error: 'ruta no encontrada' });
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

server.listen(PORT, '127.0.0.1', () => console.log(`API de sincronizacion escuchando en http://127.0.0.1:${PORT}`));
