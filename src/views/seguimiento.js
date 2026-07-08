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

  function initSeguimiento() {
    const form = document.getElementById('trackingForm');
    const result = document.getElementById('seguimientoResult');
    const details = document.getElementById('trackingDetails');
    const estado = document.getElementById('estado');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const state = TurnosStorage.read();
      const session = state.session;

      if (!session) {
        result.className = 'form-result error';
        result.textContent = 'Debe iniciar sesi?n para consultar sus turnos.';
        TurnosApp.setStatus('Informaci?n', 'Debe iniciar sesi?n para consultar sus turnos.', 'i');
        TurnosRouter.showView('registro');
        details.hidden = true;
        return;
      }

      if (!TurnosValidators.validateForm(form, ['codigo'])) {
        result.className = 'form-result error';
        result.textContent = 'Ingrese un token v?lido para consultar.';
        TurnosApp.setStatus('Error', 'Ingrese un token v?lido para consultar.', '!');
        details.hidden = true;
        return;
      }

      const token = form.elements.codigo.value.trim().toUpperCase();
      const appointment = state.appointments.find((item) => item.token === token && canSeeAppointment(item, session));

      if (!appointment) {
        estado.value = 'No encontrado';
        details.hidden = true;
        result.className = 'form-result error';
        result.textContent = 'No se encontr? un turno suyo con ese token.';
        TurnosApp.setStatus('Error', 'No se encontr? un turno suyo con ese token.', '!');
        return;
      }

      estado.value = appointment.estado;
      renderDetails(appointment);
      result.className = 'form-result success';
      result.textContent = 'Turno encontrado. Revise la informaci?n agendada.';
      TurnosApp.setStatus('?xito', 'Turno encontrado. Revise la informaci?n agendada.', '?');
    });

    form.addEventListener('reset', () => {
      setTimeout(() => {
        TurnosValidators.clearFormState(form);
        result.textContent = '';
        result.className = 'form-result';
        estado.value = 'Pendiente de consulta';
        details.hidden = true;
      }, 0);
    });
  }

  window.TurnosSeguimiento = { initSeguimiento };
})();
