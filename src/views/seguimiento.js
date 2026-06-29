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

  function initSeguimiento() {
    const form = document.getElementById('trackingForm');
    const result = document.getElementById('seguimientoResult');
    const details = document.getElementById('trackingDetails');
    const estado = document.getElementById('estado');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!TurnosValidators.validateForm(form, ['codigo'])) {
        result.className = 'form-result error';
        result.textContent = 'Ingrese un token válido para consultar.';
        TurnosApp.setStatus('Error', 'Ingrese un token válido para consultar.', '!');
        details.hidden = true;
        return;
      }

      const token = form.elements.codigo.value.trim().toUpperCase();
      const appointment = TurnosStorage.read().appointments.find((item) => item.token === token);

      if (!appointment) {
        estado.value = 'No encontrado';
        details.hidden = true;
        result.className = 'form-result error';
        result.textContent = 'No se encontró un turno registrado con ese token.';
        TurnosApp.setStatus('Error', 'No se encontró un turno registrado con ese token.', '!');
        return;
      }

      estado.value = appointment.estado;
      renderDetails(appointment);
      result.className = 'form-result success';
      result.textContent = 'Turno encontrado. Revise la información agendada.';
      TurnosApp.setStatus('Éxito', 'Turno encontrado. Revise la información agendada.', '✓');
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
