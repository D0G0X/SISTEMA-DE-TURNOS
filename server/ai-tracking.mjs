// Motor de seguimiento inteligente de turnos.
// IA vía OpenAI (predeterminado); sin clave usa reglas locales.
import { answerLocalQuestion, getSystemKnowledgeText } from './ai-knowledge.mjs';
import { chatText, isAiEnabled } from './ai-client.mjs';

const TERMINAL = new Set(['Atención completada', 'Turno archivado', 'No asistió']);

export function parseAppointmentDateTime(fecha, hora) {
  const [y, m, d] = String(fecha).split('-').map(Number);
  const [hh, mm] = String(hora).split(':').map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

export function computeStatus(appointment, now = new Date()) {
  const apptAt = parseAppointmentDateTime(appointment.fecha, appointment.hora);
  const hoursUntil = (apptAt - now) / 3_600_000;

  if (hoursUntil > 48) return 'Turno agendado';
  if (hoursUntil > 24) return 'Recordatorio: turno en 2 días';
  if (hoursUntil > 2) return 'Recordatorio: turno mañana';
  if (hoursUntil > 0) return 'Recordatorio: turno hoy';
  if (hoursUntil > -1) return 'En espera de atención';
  if (hoursUntil > -4) return 'Atención en curso';
  if (hoursUntil > -24) return 'Atención completada';
  if (hoursUntil > -72) return 'Turno archivado';
  return 'No asistió';
}

export function shouldAdvanceStatus(current, next) {
  if (!current || current === next) return false;
  if (TERMINAL.has(current)) return false;
  return true;
}

export function buildFallbackInsight(appointment, status) {
  const { token, tramite, sede, oficina, funcionario, fecha, hora } = appointment;
  const tips = {
    'Turno agendado': `Su turno ${token} para ${tramite} está confirmado el ${fecha} a las ${hora} en ${sede}. Guarde este token y llegue 10 minutos antes.`,
    'Recordatorio: turno en 2 días': `Faltan 2 días para su turno ${token}. Revise la sede ${sede}, oficina ${oficina || 'por confirmar'} y al funcionario ${funcionario || 'asignado'}.`,
    'Recordatorio: turno mañana': `Mañana tiene turno para ${tramite} a las ${hora} en ${sede}. Lleve su documento de identidad y el token ${token}.`,
    'Recordatorio: turno hoy': `Hoy es su turno (${hora}) en ${sede}, oficina ${oficina || 'indicada en pantalla'}. Presente el token ${token} al llegar.`,
    'En espera de atención': `Su horario (${hora}) ya comenzó. Diríjase a ${oficina || 'la ventanilla indicada'} y presente el token ${token}.`,
    'Atención en curso': `Su turno ${token} está en ventana de atención. Si aún no fue llamado, consulte en ${oficina || 'recepción'}.`,
    'Atención completada': `El turno ${token} del ${fecha} fue procesado. Si necesita comprobante, solicítelo en ${sede}.`,
    'Turno archivado': `El turno ${token} quedó registrado como atendido. Puede reservar un nuevo turno cuando lo necesite.`,
    'No asistió': `No registramos asistencia al turno ${token} del ${fecha}. Puede reservar un nuevo horario desde la vista de reserva.`,
  };
  return tips[status] || `Seguimiento activo del turno ${token} (${status}).`;
}

async function aiInsight(appointment, status, recentEvents) {
  if (!isAiEnabled()) return null;

  const history = recentEvents
    .slice(-3)
    .map((e) => `- ${e.estado_nuevo}: ${e.mensaje}`)
    .join('\n');

  const prompt = `Generá UN párrafo breve (máx. 3 oraciones) en español para un ciudadano sobre su turno.
Token: ${appointment.token}
Trámite: ${appointment.tramite}
Sede: ${appointment.sede}
Oficina: ${appointment.oficina || 'por asignar'}
Funcionario: ${appointment.funcionario || 'por asignar'}
Fecha: ${appointment.fecha} Hora: ${appointment.hora}
Estado actual: ${status}
Historial reciente:
${history || '(sin eventos previos)'}
Sé claro, amable y práctico. No inventes datos que no están arriba.`;

  return chatText({
    messages: [
      {
        role: 'system',
        content:
          'Sos el asistente de seguimiento del Sistema de Gestión de Turnos Inteligente (Gobierno Digital).',
      },
      { role: 'user', content: prompt },
    ],
    max_tokens: 180,
  });
}

export async function generateInsight(appointment, status, recentEvents = []) {
  try {
    const ai = await aiInsight(appointment, status, recentEvents);
    if (ai) return ai;
  } catch (err) {
    console.warn('Seguimiento IA: fallback local —', err.message);
  }
  return buildFallbackInsight(appointment, status);
}

export async function askAboutAppointment(appointment, question, events = []) {
  if (!isAiEnabled()) {
    return answerLocalQuestion(question, appointment);
  }

  const history = events
    .slice(-5)
    .map((e) => `[${e.created_at}] ${e.estado_nuevo}: ${e.mensaje}`)
    .join('\n');

  const apptBlock = appointment
    ? `Datos del turno: token ${appointment.token}, trámite ${appointment.tramite}, sede ${appointment.sede},
oficina ${appointment.oficina}, funcionario ${appointment.funcionario}, fecha ${appointment.fecha}, hora ${appointment.hora},
estado ${appointment.estado}, insight: ${appointment.ai_insight || '(sin insight)'}.
Historial:
${history || '(vacío)'}`
    : 'El ciudadano no tiene un turno cargado en esta conversación.';

  try {
    const answer = await chatText({
      messages: [
        {
          role: 'system',
          content: `Sos el asistente virtual del Sistema de Gestión de Turnos Inteligente (Gobierno Digital).
Respondé en español, claro, amable y breve (máx. 4 oraciones salvo que la pregunta requiera detalle).
${getSystemKnowledgeText()}
${apptBlock}
Podés responder sobre: reservas, tokens, seguimiento, documentos, inasistencias, sanciones, reprogramación, accesibilidad y normativa general.
No reveles correo ni teléfono. No inventes datos del turno que no están arriba.`,
        },
        { role: 'user', content: question },
      ],
      max_tokens: 320,
    });
    return answer || answerLocalQuestion(question, appointment);
  } catch (err) {
    console.warn('Chat IA: fallback local —', err.message);
    return answerLocalQuestion(question, appointment);
  }
}

export async function askAssistant(question, appointment = null, events = []) {
  return askAboutAppointment(appointment, question, events);
}

export async function trackAppointment(pool, token) {
  const { rows } = await pool.query(
    `SELECT a.*, c.nombre, c.correo, c.telefono
     FROM appointments a
     JOIN citizens c ON c.cedula = a.cedula
     WHERE a.token = $1`,
    [token]
  );
  if (!rows[0]) return null;

  const appointment = rows[0];
  const nextStatus = computeStatus(appointment);
  const { rows: events } = await pool.query(
    'SELECT * FROM tracking_events WHERE token = $1 ORDER BY created_at DESC LIMIT 5',
    [token]
  );

  let changed = false;
  let insight = appointment.ai_insight;

  if (shouldAdvanceStatus(appointment.estado, nextStatus)) {
    insight = await generateInsight(appointment, nextStatus, events);
    await pool.query('UPDATE appointments SET estado = $1, ai_insight = $2, last_tracked_at = now() WHERE token = $3', [
      nextStatus,
      insight,
      token,
    ]);
    await pool.query(
      `INSERT INTO tracking_events (token, estado_anterior, estado_nuevo, mensaje, origen)
       VALUES ($1, $2, $3, $4, $5)`,
      [token, appointment.estado, nextStatus, insight, isAiEnabled() ? 'ia' : 'sistema']
    );
    changed = true;
    appointment.estado = nextStatus;
  } else if (!appointment.ai_insight) {
    insight = await generateInsight(appointment, appointment.estado, events);
    await pool.query('UPDATE appointments SET ai_insight = $1, last_tracked_at = now() WHERE token = $2', [
      insight,
      token,
    ]);
    changed = true;
  } else {
    await pool.query('UPDATE appointments SET last_tracked_at = now() WHERE token = $1', [token]);
  }

  appointment.ai_insight = insight;
  return { appointment, changed };
}

export async function trackAll(pool) {
  const { rows } = await pool.query('SELECT token FROM appointments ORDER BY fecha, hora');
  let updated = 0;
  for (const { token } of rows) {
    const result = await trackAppointment(pool, token);
    if (result?.changed) updated += 1;
  }
  return { total: rows.length, updated };
}

export { isAiEnabled, getAiInfo } from './ai-client.mjs';
