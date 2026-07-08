(function () {
  var POLICIES = [
    {
      test: function (q) {
        return /perd|pierd|no asist|falt|sancion|multa|penalidad|castigo|bloque/.test(q);
      },
      answer: function (ctx) {
        var extra = ctx && ctx.appointment
          ? ' Su turno ' + ctx.appointment.token + ' quedaría registrado como "No asistió" si no se presenta.'
          : '';
        return 'Si pierde su turno o no se presenta a la hora indicada, el sistema lo registra como inasistencia.' +
          ' En la mayoría de trámites no hay multa económica automática, pero sí puede perder el cupo reservado.' +
          ' Tras dos inasistencias consecutivas en el mismo trámite, el sistema puede aplicar una restricción temporal de 15 días para volver a reservar en línea.' +
          ' Para casos justificados (emergencia médica, fuerza mayor), acérquese a la sede con documentación y solicite levantar la restricción.' +
          extra +
          ' Puede reservar un nuevo turno desde la vista de reserva cuando la restricción no esté activa.';
      }
    },
    {
      test: function (q) {
        return /reprogram|cambiar|modificar|otra fecha|otro horario|reagend/.test(q);
      },
      answer: function (ctx) {
        if (ctx && ctx.appointment) {
          return 'Para reprogramar el turno ' + ctx.appointment.token + ' (actualmente ' + ctx.appointment.fecha + ' a las ' +
            ctx.appointment.hora + '), cancele o deje vencer el turno actual y reserve uno nuevo con fecha y hora disponibles.' +
            ' Si falta menos de 24 horas, también puede acudir a ' + ctx.appointment.sede + ' y pedir reprogramación en ventanilla.';
        }
        return 'Puede reprogramar reservando un nuevo turno en la vista "Selección y reserva".' +
          ' Si ya tiene uno agendado, el horario anterior queda libre al reservar otro (según disponibilidad).' +
          ' Con menos de 24 horas de anticipación, la reprogramación en línea puede no estar disponible; acuda a la sede.';
      }
    },
    {
      test: function (q) {
        return /cancel|anular|eliminar turno/.test(q);
      },
      answer: function () {
        return 'Para cancelar un turno, no es necesario hacer un trámite formal: simplemente no se presente y el cupo quedará libre tras la ventana de atención.' +
          ' Si desea liberar el horario antes, reserve otro turno solo si realmente lo necesita, o consulte en la sede.' +
          ' Cancelar con anticipación ayuda a que otro ciudadano use ese cupo.';
      }
    },
    {
      test: function (q) {
        return /token|c[oó]digo|tur-/.test(q);
      },
      answer: function (ctx) {
        if (ctx && ctx.appointment) {
          return 'Su token de seguimiento es ' + ctx.appointment.token + '. Guárdelo en un lugar seguro.' +
            ' Lo necesita para consultar el estado en la vista de seguimiento y al presentarse en la sede.' +
            ' Tiene formato TUR- seguido de 6 números.';
        }
        return 'Al reservar un turno el sistema genera un token con formato TUR-123456.' +
          ' Es su comprobante digital: úselo en "Confirmación y seguimiento" para ver estado, sede, oficina y funcionario asignado.';
      }
    },
    {
      test: function (q) {
        return /reserv|agendar|sacar turno|c[oó]mo pido/.test(q);
      },
      answer: function () {
        return 'Para reservar: 1) Inicie sesión en Registro/Login. 2) Vaya a Selección y reserva. 3) Elija trámite, sede, fecha y hora.' +
          ' 4) Confirme y guarde el token TUR-XXXXXX. El sistema evita doble reserva en el mismo horario y sede.';
      }
    },
    {
      test: function (q) {
        return /document|llevar|traer|requisito|papeles/.test(q);
      },
      answer: function (ctx) {
        var tramite = ctx && ctx.appointment ? ctx.appointment.tramite : 'su trámite';
        return 'Para ' + tramite + ' generalmente necesita: cédula de identidad vigente y el token del turno (impreso o en el celular).' +
          ' Según el trámite pueden pedir comprobante de domicilio, formularios previos o pago de tasas.' +
          ' Llegue 10 minutos antes del horario asignado.';
      }
    },
    {
      test: function (q) {
        return /horario|hora de atenci|cu[aá]ndo abren|d[ií]as h[aá]biles/.test(q);
      },
      answer: function () {
        return 'Las sedes atienden en días hábiles. Los turnos en línea se ofrecen en franjas como 08:30, 10:00, 11:30, 14:00 y 15:30.' +
          ' Se recomienda llegar 10 minutos antes. Feriados nacionales no hay atención presencial.';
      }
    },
    {
      test: function (q) {
        return /d[oó]nde|ubic|direcci|sede|llegar|oficina/.test(q);
      },
      answer: function (ctx) {
        if (ctx && ctx.appointment) {
          return 'Debe presentarse en ' + ctx.appointment.sede + ', oficina ' + (ctx.appointment.oficina || 'indicada al llegar') +
            ', el ' + ctx.appointment.fecha + ' a las ' + ctx.appointment.hora + '.' +
            ' Funcionario asignado: ' + (ctx.appointment.funcionario || 'se confirmará en recepción') + '.';
        }
        return 'Al reservar elige la sede más conveniente (Norte, Centro o Sur). En seguimiento verá oficina y funcionario asignados.' +
          ' Presente su token en recepción para ser direccionado.';
      }
    },
    {
      test: function (q) {
        return /estado|seguimiento|consultar|c[oó]mo va|avance/.test(q);
      },
      answer: function (ctx) {
        if (ctx && ctx.appointment) {
          var status = ctx.appointment.estado || 'Turno agendado';
          return 'El turno ' + ctx.appointment.token + ' está en estado "' + status + '". ' +
            (ctx.appointment.aiInsight || TurnosAppointmentTracking.buildInsight(ctx.appointment, status));
        }
        return 'Ingrese su token en la vista "Confirmación y seguimiento" para ver el estado actualizado.' +
          ' El asistente monitorea automáticamente y envía recordatorios según se acerca la fecha.';
      }
    },
    {
      test: function (q) {
        return /accesib|discapac|silla|ceguera|sordo|lengua de señas|wcag/.test(q);
      },
      answer: function () {
        return 'El sistema incluye controles de accesibilidad WCAG: tamaño de texto, alto contraste, espaciado, lectura en voz alta y navegación por teclado.' +
          ' Use el botón "Accesibilidad" en la esquina inferior derecha. En sede puede solicitar acompañamiento prioritario presentando su token.';
      }
    },
    {
      test: function (q) {
        return /login|sesi[oó]n|contrase|usuario|registr/.test(q);
      },
      answer: function () {
        return 'Use la vista Registro/Login con usuario "normal" y contraseña "normal123" para reservar turnos como ciudadano.' +
          ' Debe completar sus datos (nombre, cédula, correo, teléfono). Los administradores usan usuario "admin".';
      }
    },
    {
      test: function (q) {
        return /hola|buenas|ayuda|qu[eé] puedes|qui[eé]n eres/.test(q);
      },
      answer: function () {
        return '¡Hola! Soy el asistente virtual del Sistema de Gestión de Turnos Inteligente.' +
          ' Puedo orientarle sobre reservas, seguimiento, documentos, inasistencias, sanciones, reprogramación y accesibilidad.' +
          ' ¿Qué necesita saber?';
      }
    }
  ];

  function normalizeQuestion(text) {
    return String(text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function answerQuestion(question, appointment) {
    var q = normalizeQuestion(question);
    var ctx = { appointment: appointment || null };

    for (var i = 0; i < POLICIES.length; i++) {
      if (POLICIES[i].test(q)) {
        return POLICIES[i].answer(ctx);
      }
    }

    if (appointment) {
      return TurnosAppointmentTracking.buildInsight(appointment, appointment.estado || TurnosAppointmentTracking.computeStatus(appointment));
    }

    return 'Puedo ayudarle con reservas, tokens, seguimiento, documentos, inasistencias y sanciones.' +
      ' Por ejemplo pregunte: "¿Qué pasa si pierdo mi turno?" o "¿Cómo reservo un turno?".' +
      ' Si ya tiene un turno consultado, haré referencia a su información específica.';
  }

  function getSystemKnowledgeText() {
    return 'Políticas institucionales del Sistema de Turnos: ' +
      'Inasistencia registra el turno como "No asistió" sin multa automática en la mayoría de trámites. ' +
      'Dos inasistencias consecutivas en el mismo trámite pueden generar restricción de 15 días para reservar en línea. ' +
      'Emergencias justificadas se revisan en sede con documentación. ' +
      'Reprogramación: reservar nuevo turno o acudir a ventanilla si faltan menos de 24 horas. ' +
      'Token formato TUR-XXXXXX. Llegar 10 minutos antes con cédula. ' +
      'Horarios típicos: 08:30, 10:00, 11:30, 14:00, 15:30 en días hábiles.';
  }

  window.TurnosAiKnowledge = {
    answerQuestion: answerQuestion,
    getSystemKnowledgeText: getSystemKnowledgeText
  };
})();
