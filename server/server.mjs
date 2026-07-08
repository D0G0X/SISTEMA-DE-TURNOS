// API mínima para persistir los turnos en Postgres.
// El frontend le pega fire-and-forget; si esta API está caída, la app sigue en localStorage.
import { createServer } from 'node:http';
import pg from 'pg';

const PORT = Number(process.env.PORT || 3001);
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://turnos:turnos@localhost:5433/turnos',
});
pool.on('error', (err) => console.error('Error del pool de Postgres:', err.message));

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
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

const server = createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }

    if (req.method === 'GET' && req.url === '/api/health') {
      await pool.query('SELECT 1');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/citizens') {
      const b = await readBody(req);
      if (!b.cedula || !b.nombre) return json(res, 400, { error: 'cedula y nombre son obligatorios' });
      await pool.query(upsertCitizen, [b.cedula, b.nombre, b.correo || '', b.telefono || '']);
      return json(res, 201, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/appointments') {
      const b = await readBody(req);
      // Validar TODO antes de tocar la BD: evita escrituras parciales.
      for (const campo of ['token', 'cedula', 'tramite', 'sede', 'fecha', 'hora']) {
        if (!b[campo]) return json(res, 400, { error: campo + ' es obligatorio' });
      }
      // Asegura que el ciudadano exista (por la FK) SIN pisar sus datos: actualizar es trabajo de /api/citizens.
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
        // ponytail: token TUR-###### tiene solo 900k valores; ante colision no perdemos turnos en silencio.
        const dueno = await pool.query('SELECT cedula FROM appointments WHERE token = $1', [b.token]);
        if (dueno.rows[0]?.cedula !== b.cedula) {
          console.error('Colision de token:', b.token);
          return json(res, 409, { error: 'token ya usado por otro ciudadano' });
        }
        // misma cedula: re-sincronizacion idempotente, todo bien
      }
      return json(res, 201, { ok: true });
    }

    json(res, 404, { error: 'ruta no encontrada' });
  } catch (err) {
    json(res, 500, { error: err.message });
  }
});

// Solo loopback: esta API escribe sin autenticacion, no debe verse desde la LAN.
server.listen(PORT, '127.0.0.1', () => console.log(`API de sincronizacion escuchando en http://127.0.0.1:${PORT}`));
