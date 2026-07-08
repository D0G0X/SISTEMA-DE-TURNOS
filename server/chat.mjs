// Chatbot de consulta del sistema de turnos.
// LLM: OpenAI (predeterminado) · Datos: Postgres vía MCP (@modelcontextprotocol/server-postgres).
import './env.mjs';
import readline from 'node:readline/promises';
import { stdin, stdout, exit, env, argv, platform } from 'node:process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { chatCompletion, getAiInfo, isAiEnabled } from './ai-client.mjs';

const DB_URL = env.CHATBOT_DB_URL || 'postgresql://chatbot_ro:chatbot_ro@localhost:5433/turnos';

const SYSTEM = `Sos el asistente del Sistema de Gestión de Turnos Inteligente (Gobierno Digital).
Respondés preguntas sobre los datos consultando PostgreSQL con la herramienta "query" (SQL de SOLO LECTURA).
Esquema:
- citizens(cedula PK, nombre, correo, telefono, created_at)
- appointments(token PK, cedula FK->citizens, tramite, sede, oficina, funcionario, fecha, hora, estado, created_at)
Los tokens tienen formato TUR-123456.
Reglas: usá solo SELECT; si no hay datos, decilo sin inventar; respondé en español, breve y claro;
no reveles correo ni teléfono completos salvo que pregunten por su propia cédula o token.`;

// Conexión MCP: lanza el servidor Postgres MCP como proceso hijo (stdio).
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

// Prueba de cableado sin gastar tokens: node chat.mjs --selftest
if (argv.includes('--selftest')) {
  console.log('Tools MCP disponibles:', tools.map((t) => t.name).join(', '));
  console.log(await callMcpTool('query', { sql: 'SELECT count(*)::int AS turnos FROM appointments' }));
  console.log('Selftest OK: MCP conectado y Postgres respondiendo en modo solo lectura.');
  exit(0);
}

if (!isAiEnabled()) {
  console.error('Falta OPENAI_API_KEY. Consígala en https://platform.openai.com/api-keys');
  exit(1);
}

const aiInfo = getAiInfo();
const llmTools = tools.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description || '', parameters: t.inputSchema },
}));

async function askLlm(messages) {
  const msg = await chatCompletion({ messages, tools: llmTools, tool_choice: 'auto' });
  if (!msg) throw new Error('Sin respuesta del modelo');
  return msg;
}

const messages = [{ role: 'system', content: SYSTEM }];
const rl = readline.createInterface({ input: stdin, output: stdout });
console.log(`Chatbot de turnos (${aiInfo.label}, modelo ${aiInfo.model}). Escribí "salir" para terminar.`);

while (true) {
  const q = (await rl.question('\nVos > ')).trim();
  if (!q || q.toLowerCase() === 'salir') break;
  messages.push({ role: 'user', content: q });

  // Un error de la API (sin creditos, rate limit, red) no debe tumbar el chatbot: avisa y sigue.
  try {
    let msg = await askLlm(messages);
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
      msg = await askLlm(messages);
    }

    messages.push({ role: 'assistant', content: msg.content ?? '' });
    console.log('\nBot >', msg.content);
  } catch (err) {
    console.log('\nBot > No pude responder ahora:', err.message);
  }
}

rl.close();
exit(0);
