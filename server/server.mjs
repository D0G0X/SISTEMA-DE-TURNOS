// API local para sincronizar turnos y atender el chatbot IA por MCP.
// El frontend sincroniza fire-and-forget; si esta API cae, la app sigue con localStorage.
import { createServer } from 'node:http';
import { platform } from 'node:process';
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

function loadEnvFile() {
  try {
    const content = readFileSync(new URL('./.env', import.meta.url), 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) return;
      const key = trimmed.slice(0, equalIndex).trim();
      const value = trimmed.slice(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (key && process.env[key] == null) process.env[key] = value;
    });
  } catch {
    // .env es opcional; tambien se puede configurar con variables del sistema.
  }
}

loadEnvFile();

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

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS);
      return res.end();
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      await pool.query('SELECT 1');
      return json(res, 200, {
        ok: true,
        chat: {
          model: OPENAI_MODEL,
          openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
          mcpReady,
          mcpError,
        },
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/chat/health') {
      return json(res, 200, {
        ok: Boolean(process.env.OPENAI_API_KEY) && mcpReady,
        model: OPENAI_MODEL,
        openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
        mcpReady,
        mcpError,
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      if (!process.env.OPENAI_API_KEY) {
        return json(res, 503, { error: 'Falta OPENAI_API_KEY en el backend.' });
      }
      if (!mcpReady) {
        return json(res, 503, { error: 'MCP no esta conectado.', detail: mcpError });
      }

      const body = await readBody(req);
      const message = String(body.message || '').trim();
      if (message.length < 2) return json(res, 400, { error: 'Escriba una pregunta para el asistente.' });
      if (message.length > 800) return json(res, 400, { error: 'La pregunta es demasiado larga.' });

      const answer = await answerChat(message);
      return json(res, 200, { answer, model: OPENAI_MODEL, mcp: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/citizens') {
      const body = await readBody(req);
      if (!body.cedula || !body.nombre) return json(res, 400, { error: 'cedula y nombre son obligatorios' });
      await pool.query(upsertCitizen, [body.cedula, body.nombre, body.correo || '', body.telefono || '']);
      return json(res, 201, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/appointments') {
      const body = await readBody(req);
      for (const field of ['token', 'cedula', 'tramite', 'sede', 'fecha', 'hora']) {
        if (!body[field]) return json(res, 400, { error: field + ' es obligatorio' });
      }

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

      if (inserted.rowCount === 0) {
        const owner = await pool.query('SELECT cedula FROM appointments WHERE token = $1', [body.token]);
        if (owner.rows[0]?.cedula !== body.cedula) {
          console.error('Colision de token:', body.token);
          return json(res, 409, { error: 'token ya usado por otro ciudadano' });
        }
      }

      return json(res, 201, { ok: true });
    }

    return json(res, 404, { error: 'ruta no encontrada' });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
});

await initMcp();
server.listen(PORT, '127.0.0.1', () => {
  console.log(`API de sincronizacion y chatbot escuchando en http://127.0.0.1:${PORT}`);
});
