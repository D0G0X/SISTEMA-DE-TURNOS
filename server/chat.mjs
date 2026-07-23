// Chatbot de consulta del sistema de turnos.
// LLM: OpenAI API · Datos: Postgres via MCP (@modelcontextprotocol/server-postgres).
// Solo lectura: se conecta con el rol chatbot_ro, que unicamente tiene GRANT SELECT.
import readline from 'node:readline/promises';
import { stdin, stdout, exit, env, argv, platform } from 'node:process';
import { readFileSync } from 'node:fs';
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
      if (key && env[key] == null) env[key] = value;
    });
  } catch {
    // .env es opcional; tambien se puede configurar con variables del sistema.
  }
}

loadEnvFile();

const DB_URL = env.CHATBOT_DB_URL || 'postgresql://chatbot_ro:chatbot_ro@localhost:5433/turnos';
const MODEL = env.OPENAI_MODEL || 'gpt-5.5';

const SYSTEM = `Eres el asistente del Sistema de Gestion de Turnos Inteligente (Gobierno Digital).
Respondes preguntas sobre los datos consultando PostgreSQL con la herramienta "query" (SQL de SOLO LECTURA).
Esquema:
- citizens(cedula PK, nombre, correo, telefono, created_at)
- appointments(token PK, cedula FK->citizens, tramite, sede, oficina, funcionario, fecha, hora, estado, created_at)
Los tokens tienen formato TUR-123456.
Reglas: usa solo SELECT; si no hay datos, dilo sin inventar; responde en espanol, breve y claro;
no reveles correo ni telefono completos salvo que pregunten por su propia cedula o token.`;

const mcp = new Client({ name: 'turnos-chatbot', version: '1.0.0' });
await mcp.connect(new StdioClientTransport({
  command: platform === 'win32' ? 'npx.cmd' : 'npx',
  args: ['-y', '@modelcontextprotocol/server-postgres', DB_URL],
}));
const { tools } = await mcp.listTools();

async function callMcpTool(name, args) {
  const result = await mcp.callTool({ name, arguments: args });
  return (result.content || []).map((c) => c.text ?? JSON.stringify(c)).join('\n');
}

if (argv.includes('--selftest')) {
  console.log('Tools MCP disponibles:', tools.map((t) => t.name).join(', '));
  console.log(await callMcpTool('query', { sql: 'SELECT count(*)::int AS turnos FROM appointments' }));
  console.log('Selftest OK: MCP conectado y Postgres respondiendo en modo solo lectura.');
  exit(0);
}

if (!env.OPENAI_API_KEY) {
  console.error('Falta OPENAI_API_KEY. Definela como variable de entorno antes de correr el chatbot.');
  exit(1);
}

const openaiTools = tools.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description || '', parameters: t.inputSchema },
}));

async function openai(messages) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: JSON.stringify({ model: MODEL, messages, tools: openaiTools, tool_choice: 'auto' }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  return (await res.json()).choices[0].message;
}

const messages = [{ role: 'system', content: SYSTEM }];
const rl = readline.createInterface({ input: stdin, output: stdout });
console.log(`Chatbot de turnos (solo consulta, modelo ${MODEL}). Escribe "salir" para terminar.`);

while (true) {
  const q = (await rl.question('\nVos > ')).trim();
  if (!q || q.toLowerCase() === 'salir') break;
  messages.push({ role: 'user', content: q });

  try {
    let msg = await openai(messages);
    while (msg.tool_calls?.length) {
      messages.push(msg);
      for (const tc of msg.tool_calls) {
        let out;
        try {
          out = await callMcpTool(tc.function.name, JSON.parse(tc.function.arguments || '{}'));
        } catch (err) {
          out = 'Error al consultar: ' + err.message;
        }
        messages.push({ role: 'tool', tool_call_id: tc.id, content: out });
      }
      msg = await openai(messages);
    }

    messages.push({ role: 'assistant', content: msg.content ?? '' });
    console.log('\nBot >', msg.content);
  } catch (err) {
    console.log('\nBot > No pude responder ahora:', err.message);
  }
}

rl.close();
exit(0);
