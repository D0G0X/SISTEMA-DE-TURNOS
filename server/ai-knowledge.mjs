// Base de conocimiento del asistente virtual (reglas locales + contexto para OpenAI).
import { buildFallbackInsight, computeStatus } from './ai-tracking.mjs';

const POLICIES = [
  {
    test: (q) => /perd|pierd|no asist|falt|sancion|multa|penalidad|castigo|bloque/.test(q),
    answer: (ctx) => {
      const extra = ctx.appointment
        ? ` Su turno ${ctx.appointment.token} quedaría registrado como "No asistió" si no se presenta.`
        : '';
      return (
        'Si pierde su turno o no se presenta a la hora indicada, el sistema lo registra como inasistencia.' +
        ' En la mayoría de trámites no hay multa económica automática, pero sí puede perder el cupo reservado.' +
        ' Tras dos inasistencias consecutivas en el mismo trámite, el sistema puede aplicar una restricción temporal de 15 días para volver a reservar en línea.' +
        ' Para casos justificados (emergencia médica, fuerza mayor), acérquese a la sede con documentación y solicite levantar la restricción.' +
        extra +
        ' Puede reservar un nuevo turno desde la vista de reserva cuando la restricción no esté activa.'
      );
    },
  },
  {
    test: (q) => /reprogram|cambiar|modificar|otra fecha|otro horario|reagend/.test(q),
    answer: (ctx) => {
      if (ctx.appointment) {
        const a = ctx.appointment;
        return (
          `Para reprogramar el turno ${a.token} (actualmente ${a.fecha} a las ${a.hora}), cancele o deje vencer el turno actual y reserve uno nuevo.` +
          ` Si falta menos de 24 horas, acuda a ${a.sede} y pida reprogramación en ventanilla.`
        );
      }
      return (
        'Puede reprogramar reservando un nuevo turno en "Selección y reserva".' +
        ' Con menos de 24 horas de anticipación, acuda a la sede.'
      );
    },
  },
  {
    test: (q) => /cancel|anular|eliminar turno/.test(q),
    answer: () =>
      'Para cancelar, no es obligatorio un trámite formal: el cupo queda libre tras la ventana de atención si no se presenta.' +
      ' Cancelar con anticipación permite que otro ciudadano use ese horario.',
  },
  {
    test: (q) => /token|c[oó]digo|tur-/.test(q),
    answer: (ctx) =>
      ctx.appointment
        ? `Su token es ${ctx.appointment.token}. Guárdelo para seguimiento y al presentarse en sede. Formato TUR- + 6 números.`
        : 'Al reservar se genera un token TUR-123456. Úselo en seguimiento para ver estado, sede y horario.',
  },
  {
    test: (q) => /reserv|agendar|sacar turno|c[oó]mo pido/.test(q),
    answer: () =>
      'Para reservar: inicie sesión, vaya a Selección y reserva, elija trámite, sede, fecha y hora, y guarde el token generado.',
  },
  {
    test: (q) => /document|llevar|traer|requisito|papeles/.test(q),
    answer: (ctx) => {
      const tramite = ctx.appointment?.tramite || 'su trámite';
      return `Para ${tramite}: cédula vigente y token del turno. Llegue 10 minutos antes. Pueden pedirse documentos adicionales según el trámite.`;
    },
  },
  {
    test: (q) => /horario|hora de atenci|cu[aá]ndo abren|d[ií]as h[aá]biles/.test(q),
    answer: () =>
      'Atención en días hábiles. Franjas típicas: 08:30, 10:00, 11:30, 14:00, 15:30. Llegue 10 minutos antes.',
  },
  {
    test: (q) => /d[oó]nde|ubic|direcci|sede|llegar|oficina/.test(q),
    answer: (ctx) =>
      ctx.appointment
        ? `Presentarse en ${ctx.appointment.sede}, oficina ${ctx.appointment.oficina || 'por confirmar'}, ${ctx.appointment.fecha} a las ${ctx.appointment.hora}.`
        : 'Elija sede al reservar. En seguimiento verá oficina y funcionario asignados.',
  },
  {
    test: (q) => /estado|seguimiento|consultar|c[oó]mo va|avance/.test(q),
    answer: (ctx) =>
      ctx.appointment
        ? `Turno ${ctx.appointment.token} en estado "${ctx.appointment.estado}". ${ctx.appointment.ai_insight || buildFallbackInsight(ctx.appointment, ctx.appointment.estado)}`
        : 'Ingrese su token en seguimiento para ver el estado y recordatorios automáticos.',
  },
  {
    test: (q) => /accesib|discapac|wcag/.test(q),
    answer: () =>
      'Use el botón Accesibilidad: texto ampliado, contraste, lectura en voz alta y navegación por teclado. En sede puede pedir atención prioritaria.',
  },
  {
    test: (q) => /login|sesi[oó]n|contrase|usuario|registr/.test(q),
    answer: () => 'Ciudadano: usuario normal / normal123. Complete datos en Registro. Admin: admin / admin123.',
  },
  {
    test: (q) => /hola|buenas|ayuda|qu[eé] puedes|qui[eé]n eres/.test(q),
    answer: () =>
      '¡Hola! Soy el asistente virtual del Sistema de Turnos. Pregúnteme sobre reservas, inasistencias, sanciones, documentos o seguimiento.',
  },
];

export function normalizeQuestion(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function answerLocalQuestion(question, appointment = null) {
  const q = normalizeQuestion(question);
  const ctx = { appointment };

  for (const policy of POLICIES) {
    if (policy.test(q)) return policy.answer(ctx);
  }

  if (appointment) {
    const status = appointment.estado || computeStatus(appointment);
    return appointment.ai_insight || buildFallbackInsight(appointment, status);
  }

  return (
    'Puedo ayudarle con reservas, tokens, seguimiento, documentos, inasistencias y sanciones.' +
    ' Por ejemplo: "¿Qué pasa si pierdo mi turno?" o "¿Cómo reservo?"'
  );
}

export function getSystemKnowledgeText() {
  return (
    'Políticas: inasistencia = estado "No asistió", sin multa automática usualmente. ' +
    'Dos inasistencias seguidas en el mismo trámite → restricción 15 días para reservar en línea. ' +
    'Fuerza mayor revisable en sede. Reprogramación vía nueva reserva o ventanilla (<24h). ' +
    'Token TUR-XXXXXX. Cédula + llegar 10 min antes.'
  );
}
