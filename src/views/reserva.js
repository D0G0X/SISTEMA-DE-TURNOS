(function () {
  function fillSelect(select, placeholder, values) {
    const currentValue = select.value;
    select.innerHTML = '';

    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = placeholder;
    select.appendChild(emptyOption);

    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    if (values.includes(currentValue)) select.value = currentValue;
  }

  function refreshCatalogOptions() {
    const catalog = TurnosCatalog.getCatalog();
    fillSelect(document.getElementById('tramite'), 'Seleccione una opción', catalog.procedures);
    fillSelect(
      document.getElementById('sede'),
      'Seleccione una sede',
      catalog.offices.map((office) => office.name)
    );
  }

  function initReserva() {
    const form = document.getElementById('appointmentForm');
    const result = document.getElementById('reservaResult');

    refreshCatalogOptions();
    window.addEventListener('catalog:updated', refreshCatalogOptions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const state = TurnosStorage.read();

      if (!state.session || state.session.role !== 'normal') {
        result.className = 'form-result error';
        result.textContent = 'Debe iniciar sesi?n como usuario normal para reservar turnos.';
        TurnosApp.setStatus('Informaci?n', 'Debe iniciar sesi?n como usuario normal para reservar turnos.', 'i');
        TurnosRouter.showView('registro');
        return;
      }

      if (!state.citizen) {
        result.className = 'form-result error';
        result.textContent = 'Primero debe ingresar o registrar al ciudadano.';
        TurnosApp.setStatus('Información', 'Primero debe ingresar o registrar al ciudadano.', 'i');
        TurnosDialog.showDialog({
          title: 'Registro requerido',
          message: 'Para reservar un turno necesita identificar al ciudadano.',
          secondaryLabel: 'Ir a registro',
          onSecondary: () => TurnosRouter.showView('registro')
        });
        return;
      }

      if (!TurnosValidators.validateForm(form, ['tramite', 'sede', 'fecha', 'hora'])) {
        result.className = 'form-result error';
        result.textContent = 'Complete los campos requeridos de la reserva.';
        TurnosApp.setStatus('Error', 'Complete los campos requeridos de la reserva.', '!');
        return;
      }

      const appointmentData = {
        owner: state.session.username,
        citizen: state.citizen,
        tramite: form.elements.tramite.value,
        sede: form.elements.sede.value,
        fecha: form.elements.fecha.value,
        hora: form.elements.hora.value
      };

      if (TurnosCatalog.hasScheduleConflict(appointmentData)) {
        result.className = 'form-result error';
        result.textContent = 'Ese horario ya está ocupado para la sede seleccionada. Elija otra fecha u hora.';
        TurnosApp.setStatus('Error', 'Ese horario ya está ocupado para la sede seleccionada.', '!');
        form.elements.hora.focus();
        return;
      }

      const appointment = TurnosAppointments.buildAppointment(appointmentData);

      TurnosStorage.update((currentState) => {
        currentState.appointments.push(appointment);
      });
      TurnosSync.saveAppointment(appointment);

      document.getElementById('codigo').value = appointment.token;
      document.getElementById('estado').value = appointment.estado;
      result.className = 'form-result success';
      result.textContent = 'Turno reservado. Token generado: ' + appointment.token + '.';
      TurnosApp.setStatus('Éxito', 'Turno reservado. Token generado: ' + appointment.token + '.', '✓');
      TurnosDialog.showDialog({
        title: 'Turno reservado',
        message: 'Guarde este token para consultar el seguimiento de su turno.',
        token: appointment.token,
        secondaryLabel: 'Ir a seguimiento',
        onSecondary: () => TurnosRouter.showView('seguimiento')
      });
    });

    form.addEventListener('reset', () => {
      setTimeout(() => {
        TurnosValidators.clearFormState(form);
        result.textContent = '';
        result.className = 'form-result';
      }, 0);
    });
  }

  window.TurnosReserva = { initReserva, refreshCatalogOptions };
})();
