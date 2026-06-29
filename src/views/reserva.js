(function () {
  function initReserva() {
    const form = document.getElementById('appointmentForm');
    const result = document.getElementById('reservaResult');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const state = TurnosStorage.read();

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

      const sede = form.elements.sede.value;
      const appointment = TurnosAppointments.buildAppointment({
        citizen: state.citizen,
        tramite: form.elements.tramite.value,
        sede,
        fecha: form.elements.fecha.value,
        hora: form.elements.hora.value
      });

      TurnosStorage.update((currentState) => {
        currentState.appointments.push(appointment);
      });

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

  window.TurnosReserva = { initReserva };
})();
