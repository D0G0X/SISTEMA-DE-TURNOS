(function () {
  function setText(id, value) {
    document.getElementById(id).textContent = value || '-';
  }

  function renderDetails(appointment) {
    document.getElementById('trackingDetails').hidden = false;
    setText('detailToken', appointment.token);
    setText('detailCitizen', appointment.citizen.nombre + ' - C.I. ' + appointment.citizen.cedula);
    setText('detailProcedure', appointment.tramite);
    setText('detailOffice', appointment.sede);
    setText('detailRoom', appointment.oficina);
    setText('detailAgent', appointment.funcionario);
    setText('detailDate', appointment.fecha);
    setText('detailTime', appointment.hora);
  }

  function canSeeAppointment(appointment, session) {
    if (!session) return false;
    if (session.role === 'admin') return true;
    return appointment.owner === session.username;
  }

  function applyTrackingToAppointment(appointment) {
    TurnosAppointmentTracking.applyLocalTracking(appointment);
    TurnosStorage.update(function (state) {
      var idx = state.appointments.findIndex(function (item) {
        return item.token === appointment.token;
      });
      if (idx >= 0) state.appointments[idx] = appointment;
    });
    if (typeof TurnosSync !== 'undefined' && TurnosSync.updateAppointmentStatus) {
      TurnosSync.updateAppointmentStatus(appointment);
    }
  }

  function showTrackedAppointment(appointment, bundle) {
    renderDetails(appointment);
    TurnosAiAssistant.bindToToken(appointment.token, bundle);
    TurnosAiAssistant.setInsight(appointment.aiInsight || (bundle && bundle.appointment && bundle.appointment.ai_insight));
    if (bundle && bundle.events) {
      TurnosAiAssistant.renderTimeline(bundle.events);
    }
  }

  function initSeguimiento() {
    var form = document.getElementById('trackingForm');
    var result = document.getElementById('seguimientoResult');
    var details = document.getElementById('trackingDetails');
    var estado = document.getElementById('estado');

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var state = TurnosStorage.read();
      var session = state.session;

      if (!session) {
        result.className = 'form-result error';
        result.textContent = 'Debe iniciar sesión para consultar sus turnos.';
        TurnosApp.setStatus('Información', 'Debe iniciar sesión para consultar sus turnos.', 'i');
        TurnosRouter.showView('registro');
        details.hidden = true;
        TurnosAiAssistant.clearPanel();
        return;
      }

      if (!TurnosValidators.validateForm(form, ['codigo'])) {
        result.className = 'form-result error';
        result.textContent = 'Ingrese un token válido para consultar.';
        TurnosApp.setStatus('Error', 'Ingrese un token válido para consultar.', '!');
        details.hidden = true;
        TurnosAiAssistant.clearPanel();
        return;
      }

      var token = form.elements.codigo.value.trim().toUpperCase();
      var appointment = state.appointments.find(function (item) {
        return item.token === token && canSeeAppointment(item, session);
      });

      if (!appointment) {
        estado.value = 'No encontrado';
        details.hidden = true;
        result.className = 'form-result error';
        result.textContent = 'No se encontró un turno suyo con ese token.';
        TurnosApp.setStatus('Error', 'No se encontró un turno suyo con ese token.', '!');
        TurnosAiAssistant.clearPanel();
        return;
      }

      applyTrackingToAppointment(appointment);
      estado.value = appointment.estado;
      showTrackedAppointment(appointment, null);

      TurnosTracker.syncTracking(token).then(function (bundle) {
        var refreshed = TurnosStorage.read().appointments.find(function (item) {
          return item.token === token;
        });
        if (refreshed) {
          estado.value = refreshed.estado;
          showTrackedAppointment(refreshed, bundle);
        }
      });

      result.className = 'form-result success';
      result.textContent = 'Turno encontrado. Abra a Turni (botón inferior) para consultas.';
      TurnosApp.setStatus('Éxito', 'Turno encontrado. Turni está disponible.', '✓');
    });

    form.addEventListener('reset', function () {
      setTimeout(function () {
        TurnosValidators.clearFormState(form);
        result.textContent = '';
        result.className = 'form-result';
        estado.value = 'Pendiente de consulta';
        details.hidden = true;
        TurnosAiAssistant.clearPanel();
      }, 0);
    });
  }

  window.TurnosSeguimiento = { initSeguimiento };
})();
