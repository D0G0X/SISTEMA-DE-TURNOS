// API mínima para persistir los turnos en Postgres.
// El frontend le pega fire-and-forget; si esta API está caída, la app sigue en localStorage.
import { createServer } from 'node:http';
import { platform } from 'node:process';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const PORT = Number(process.env.PORT || 3001);
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://turnos:turnos@localhost:5433/turnos';
const CHATBOT_DB_URL = process.env.CHATBOT_DB_URL || 'postgresql://chatbot_ro:chatbot_ro@localhost:5433/turnos';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.5';

const pool = new pg.Pool({ connectionString: DATABASE_URL });
pool.on('error', (err) => console.error('Error del pool de Postgres:', err.message));

let mcp;
let mcpTools = [];
let mcpReady = false;
let mcpError = '';

const CHAT_SYSTEM = `Eres el asistente IA del Sistema de Gestion de Turnos Inteligente del Gobierno Digital.
Ayudas a los usuarios a reservar turnos y consultar seguimiento. Cuando debas revisar datos reales,
usa la herramienta "query" conectada por MCP a PostgreSQL.

Esquema disponible:
- citizens(cedula, nombre, correo, telefono, created_at)
- appointments(token, cedula, tramite, sede, oficina, funcionario, fecha, hora, estado, created_at)

Reglas obligatorias:
- Usa solo consultas SELECT.
- No inventes turnos ni tokens.
- Si no encuentras informacion, dilo claramente.
- Responde en espanol, breve y amable.
- No reveles correo ni telefono completos.
- Para ayudar a reservar, guia al usuario hacia la vista Reserva si faltan datos.`;

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

async function initMcp() {
  try {
    mcp = new Client({ name: 'turnos-chatbot-http', version: '1.0.0' });
    await mcp.connect(new StdioClientTransport({
      command: platform === 'win32' ? 'npx.cmd' : 'npx',
      args: ['-y', '@modelcontextprotocol/server-postgres', CHATBOT_DB_URL],
    }));
    const listed = await mcp.listTools();
    mcpTools = listed.tools || [];
    mcpReady = true;
    mcpError = '';
    console.log('MCP chatbot conectado:', mcpTools.map((tool) => tool.name).join(', '));
  } catch (err) {
    mcpReady = false;
    mcpError = err.message;
    console.error('No se pudo iniciar MCP chatbot:', err.message);
  }
}

async function callMcpTool(name, args) {
  if (!mcpReady || !mcp) throw new Error('MCP no esta disponible.');
  const result = await mcp.callTool({ name, arguments: args });
  return (result.content || []).map((item) => item.text ?? JSON.stringify(item)).join('\n');
}

function toOpenAiTools() {
  return mcpTools.map((tool) => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description || 'Herramienta MCP de consulta.',
      parameters: tool.inputSchema,
    },
  }));
}

async function askOpenAi(messages) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      tools: toOpenAiTools(),
      tool_choice: 'auto',
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API ${response.status}: ${await response.text()}`);
  }

  return (await response.json()).choices[0].message;
}

async function answerChat(message) {
  const messages = [
    { role: 'system', content: CHAT_SYSTEM },
    { role: 'user', content: message },
  ];

  let assistant = await askOpenAi(messages);
  let toolSteps = 0;

  while (assistant.tool_calls?.length && toolSteps < 4) {
    toolSteps += 1;
    messages.push(assistant);

    for (const toolCall of assistant.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const output = await callMcpTool(toolCall.function.name, args);
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: output });
    }

    assistant = await askOpenAi(messages);
  }

  return assistant.content || 'No pude generar una respuesta en este momento.';
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
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

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
        [body.cedula, body.nombre || '', body.correo || '', body.telefono || '']
      );

      const inserted = await pool.query(
        `INSERT INTO appointments (token, cedula, tramite, sede, oficina, funcionario, fecha, hora, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (token) DO NOTHING`,
        [
          body.token,
          body.cedula,
          body.tramite,
          body.sede,
          body.oficina || '',
          body.funcionario || '',
          body.fecha,
          body.hora,
          body.estado || 'Turno agendado',
        ]
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

    return json(res, 404, { error: 'ruta no encontrada' });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
});

// Solo loopback: esta API escribe sin autenticacion, no debe verse desde la LAN.
server.listen(PORT, '127.0.0.1', () => console.log(`API de sincronizacion escuchando en http://127.0.0.1:${PORT}`));
