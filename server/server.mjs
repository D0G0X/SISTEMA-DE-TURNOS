import './env.mjs';
import { createServer } from 'node:http';
import { platform } from 'node:process';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import {
  askAssistant,
  buildFallbackInsight,
  computeStatus,
  getAiInfo,
  trackAll,
  trackAppointment,
} from './ai-tracking.mjs';
import { chatCompletion } from './ai-client.mjs';

const PORT = Number(process.env.PORT || 3001);
const HOST = process.env.HOST || '0.0.0.0';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://turnos:turnos@localhost:5433/turnos';
const CHATBOT_DB_URL = process.env.CHATBOT_DB_URL || DATABASE_URL;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1')
    ? false
    : { rejectUnauthorized: false },
});

pool.on('error', (err) => console.error('Error del pool de Postgres:', err.message));

let mcp;
let mcpTools = [];
let mcpReady = false;
let mcpError = '';

const CHAT_SYSTEM = `Eres el asistente IA del Sistema de Gestion de Turnos Inteligente del Gobierno Digital.
Puedes consultar datos reales con la herramienta MCP "query" conectada a PostgreSQL.
Usa solo SELECT, responde en espanol, no inventes tokens y no reveles correo ni telefono completos.`;

function corsHeaders(req) {
  const requestOrigin = req.headers.origin || '';
  const allowOrigin = ALLOWED_ORIGINS.includes('*')
    ? '*'
    : ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0] || '*';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(req, res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...corsHeaders(req) });
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  return JSON.parse(raw || '{}');
}

async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS citizens (
      cedula TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL DEFAULT '',
      telefono TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      token TEXT PRIMARY KEY,
      cedula TEXT NOT NULL REFERENCES citizens(cedula),
      tramite TEXT NOT NULL,
      sede TEXT NOT NULL,
      oficina TEXT NOT NULL DEFAULT '',
      funcionario TEXT NOT NULL DEFAULT '',
      fecha DATE NOT NULL,
      hora TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'Turno agendado',
      ai_insight TEXT NOT NULL DEFAULT '',
      last_tracked_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS tracking_events (
      id SERIAL PRIMARY KEY,
      token TEXT NOT NULL REFERENCES appointments(token) ON DELETE CASCADE,
      estado_anterior TEXT,
      estado_nuevo TEXT NOT NULL,
      mensaje TEXT NOT NULL,
      origen TEXT NOT NULL DEFAULT 'ia',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_tracking_events_token ON tracking_events(token);
    CREATE INDEX IF NOT EXISTS idx_appointments_fecha ON appointments(fecha);
  `);

  await pool.query(`
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS ai_insight TEXT NOT NULL DEFAULT '';
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS last_tracked_at TIMESTAMPTZ;
  `);
}

async function initMcp() {
  try {
    mcp = new Client({ name: 'turnos-api-mcp', version: '1.0.0' });
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
    console.warn('MCP no disponible, se usara IA/fallback local:', err.message);
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

async function answerMcpChat(message) {
  if (!mcpReady || !mcpTools.length) return askAssistant(message);

  const messages = [
    { role: 'system', content: CHAT_SYSTEM },
    { role: 'user', content: message },
  ];

  let assistant = await chatCompletion({
    messages,
    tools: toOpenAiTools(),
    tool_choice: 'auto',
    max_tokens: 320,
  });

  let toolSteps = 0;
  while (assistant?.tool_calls?.length && toolSteps < 4) {
    toolSteps += 1;
    messages.push(assistant);
    for (const toolCall of assistant.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || '{}');
      const output = await callMcpTool(toolCall.function.name, args);
      messages.push({ role: 'tool', tool_call_id: toolCall.id, content: output });
    }
    assistant = await chatCompletion({
      messages,
      tools: toOpenAiTools(),
      tool_choice: 'auto',
      max_tokens: 320,
    });
  }

  return assistant?.content || askAssistant(message);
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
    `SELECT id, estado_anterior, estado_nuevo, mensaje, origen, created_at
     FROM tracking_events
     WHERE token = $1
     ORDER BY created_at DESC
     LIMIT 20`,
    [token]
  );
  return { appointment: rows[0], events };
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders(req));
      return res.end();
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      await pool.query('SELECT 1');
      return json(req, res, 200, {
        ok: true,
        ai: getAiInfo(),
        mcpReady,
        mcpError,
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/health') {
      return json(req, res, 200, {
        ok: true,
        ...getAiInfo(),
        mcpReady,
        mcpError,
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      const body = await readBody(req);
      const message = String(body.message || '').trim();
      if (message.length < 2) return json(req, res, 400, { error: 'message es obligatorio' });
      const answer = await answerMcpChat(message);
      return json(req, res, 200, { answer, ai: getAiInfo(), mcp: mcpReady });
    }

    if (req.method === 'POST' && url.pathname === '/api/citizens') {
      const body = await readBody(req);
      if (!body.cedula || !body.nombre) return json(req, res, 400, { error: 'cedula y nombre son obligatorios' });
      await pool.query(upsertCitizen, [body.cedula, body.nombre, body.correo || '', body.telefono || '']);
      return json(req, res, 201, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/appointments') {
      const body = await readBody(req);
      for (const field of ['token', 'cedula', 'tramite', 'sede', 'fecha', 'hora']) {
        if (!body[field]) return json(req, res, 400, { error: field + ' es obligatorio' });
      }

      await pool.query(
        `INSERT INTO citizens (cedula, nombre, correo, telefono) VALUES ($1, $2, $3, $4)
         ON CONFLICT (cedula) DO NOTHING`,
        [body.cedula, body.nombre || '', body.correo || '', body.telefono || '']
      );

      const inserted = await pool.query(
        `INSERT INTO appointments (token, cedula, tramite, sede, oficina, funcionario, fecha, hora, estado, ai_insight)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
          body.ai_insight || '',
        ]
      );

      if (inserted.rowCount === 0) {
        const owner = await pool.query('SELECT cedula FROM appointments WHERE token = $1', [body.token]);
        if (owner.rows[0]?.cedula !== body.cedula) {
          return json(req, res, 409, { error: 'token ya usado por otro ciudadano' });
        }
      }

      return json(req, res, 201, { ok: true });
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/appointments/')) {
      const token = decodeURIComponent(url.pathname.slice('/api/appointments/'.length)).toUpperCase();
      const body = await readBody(req);
      if (!body.estado) return json(req, res, 400, { error: 'estado es obligatorio' });

      const prev = await pool.query('SELECT estado FROM appointments WHERE token = $1', [token]);
      if (!prev.rows[0]) return json(req, res, 404, { error: 'turno no encontrado' });

      const insight = body.ai_insight || buildFallbackInsight({ token, ...body }, body.estado);
      await pool.query(
        'UPDATE appointments SET estado = $1, ai_insight = $2, last_tracked_at = now() WHERE token = $3',
        [body.estado, insight, token]
      );
      await pool.query(
        `INSERT INTO tracking_events (token, estado_anterior, estado_nuevo, mensaje, origen)
         VALUES ($1, $2, $3, $4, 'manual')`,
        [token, prev.rows[0].estado, body.estado, insight]
      );
      return json(req, res, 200, { ok: true, estado: body.estado, ai_insight: insight });
    }

    const trackingMatch = url.pathname.match(/^\/api\/tracking\/([^/]+)$/);
    if (req.method === 'GET' && trackingMatch) {
      const token = decodeURIComponent(trackingMatch[1]).toUpperCase();
      const bundle = await getTrackingBundle(token);
      if (!bundle) return json(req, res, 404, { error: 'turno no encontrado' });
      return json(req, res, 200, bundle);
    }

    if (req.method === 'POST' && url.pathname === '/api/tracking/run') {
      const result = await trackAll(pool);
      return json(req, res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/ask') {
      const body = await readBody(req);
      if (!body.question?.trim()) return json(req, res, 400, { error: 'question es obligatorio' });

      const token = (body.token || '').trim().toUpperCase();
      const question = body.question.trim();
      let appointment = null;
      let events = [];

      if (token) {
        const bundle = await getTrackingBundle(token);
        if (!bundle) return json(req, res, 404, { error: 'turno no encontrado' });
        appointment = bundle.appointment;
        events = bundle.events;
      }

      const answer = await askAssistant(question, appointment, events);
      return json(req, res, 200, {
        answer,
        estado: appointment?.estado || null,
        ai_insight: appointment?.ai_insight || null,
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/preview') {
      const body = await readBody(req);
      for (const field of ['fecha', 'hora']) {
        if (!body[field]) return json(req, res, 400, { error: field + ' es obligatorio' });
      }
      const estado = computeStatus(body);
      const insight = buildFallbackInsight(
        {
          token: body.token || 'TUR-000000',
          tramite: body.tramite || 'Tramite',
          sede: body.sede || 'Sede',
          oficina: body.oficina || '',
          funcionario: body.funcionario || '',
          fecha: body.fecha,
          hora: body.hora,
        },
        estado
      );
      return json(req, res, 200, { estado, ai_insight: insight });
    }

    return json(req, res, 404, { error: 'ruta no encontrada' });
  } catch (err) {
    console.error('API error:', err);
    return json(req, res, 500, { error: err.message });
  }
});

await ensureSchema();
await initMcp();

server.listen(PORT, HOST, () => {
  console.log(`API de turnos escuchando en http://${HOST}:${PORT}`);
});
