(function () {
  var TERMINAL = {
    'Atención completada': true,
    'Turno archivado': true,
    'No asistió': true
  };

  function parseDateTime(fecha, hora) {
    var parts = String(fecha).split('-').map(Number);
    var time = String(hora).split(':').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], time[0] || 0, time[1] || 0, 0, 0);
  }

  function computeStatus(appointment, now) {
    var apptAt = parseDateTime(appointment.fecha, appointment.hora);
    var hoursUntil = (apptAt - (now || new Date())) / 3600000;

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

  function shouldAdvanceStatus(current, next) {
    if (!current || current === next) return false;
    if (TERMINAL[current]) return false;
    return true;
  }

  function buildInsight(appointment, status) {
    var token = appointment.token;
    var tramite = appointment.tramite;
    var sede = appointment.sede;
    var oficina = appointment.oficina || 'por confirmar';
    var funcionario = appointment.funcionario || 'asignado';
    var fecha = appointment.fecha;
    var hora = appointment.hora;

    var tips = {
      'Turno agendado': 'Su turno ' + token + ' para ' + tramite + ' está confirmado el ' + fecha + ' a las ' + hora + ' en ' + sede + '. Guarde este token y llegue 10 minutos antes.',
      'Recordatorio: turno en 2 días': 'Faltan 2 días para su turno ' + token + '. Revise la sede ' + sede + ', oficina ' + oficina + ' y al funcionario ' + funcionario + '.',
      'Recordatorio: turno mañana': 'Mañana tiene turno para ' + tramite + ' a las ' + hora + ' en ' + sede + '. Lleve su documento de identidad y el token ' + token + '.',
      'Recordatorio: turno hoy': 'Hoy es su turno (' + hora + ') en ' + sede + ', oficina ' + oficina + '. Presente el token ' + token + ' al llegar.',
      'En espera de atención': 'Su horario (' + hora + ') ya comenzó. Diríjase a ' + oficina + ' y presente el token ' + token + '.',
      'Atención en curso': 'Su turno ' + token + ' está en ventana de atención. Si aún no fue llamado, consulte en recepción.',
      'Atención completada': 'El turno ' + token + ' del ' + fecha + ' fue procesado. Si necesita comprobante, solicítelo en ' + sede + '.',
      'Turno archivado': 'El turno ' + token + ' quedó registrado como atendido. Puede reservar un nuevo turno cuando lo necesite.',
      'No asistió': 'No registramos asistencia al turno ' + token + ' del ' + fecha + '. Puede reservar un nuevo horario desde la vista de reserva.'
    };

    return tips[status] || ('Seguimiento activo del turno ' + token + ' (' + status + ').');
  }

  function applyLocalTracking(appointment) {
    var prev = appointment.estado;
    var next = computeStatus(appointment);
    var changed = false;

    if (shouldAdvanceStatus(prev, next)) {
      var insight = buildInsight(appointment, next);
      appointment.estado = next;
      appointment.aiInsight = insight;
      pushTrackingEvent(appointment, prev, next, insight);
      changed = true;
    } else if (!appointment.aiInsight) {
      appointment.aiInsight = buildInsight(appointment, appointment.estado || next);
      if (!appointment.trackingEvents || appointment.trackingEvents.length === 0) {
        pushTrackingEvent(appointment, null, appointment.estado || next, appointment.aiInsight);
      }
      changed = true;
    }

    return changed;
  }

  function pushTrackingEvent(appointment, prevEstado, newEstado, mensaje) {
    if (!appointment.trackingEvents) appointment.trackingEvents = [];
    appointment.trackingEvents.unshift({
      estado_anterior: prevEstado,
      estado_nuevo: newEstado,
      mensaje: mensaje,
      origen: 'sistema',
      created_at: new Date().toISOString()
    });
  }

  function formatEventTime(iso) {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-EC', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function askLocalQuestion(appointment, question) {
    return TurnosAiKnowledge.answerQuestion(question, appointment);
  }

  window.TurnosAppointmentTracking = {
    computeStatus: computeStatus,
    buildInsight: buildInsight,
    applyLocalTracking: applyLocalTracking,
    formatEventTime: formatEventTime,
    askLocalQuestion: askLocalQuestion
  };
})();
