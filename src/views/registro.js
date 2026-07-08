(function () {
  function initRegistro() {
    const form = document.getElementById('citizenForm');
    const result = document.getElementById('registroResult');

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!TurnosValidators.validateForm(form, ['nombre', 'cedula', 'correo', 'telefono'])) {
        result.className = 'form-result error';
        result.textContent = 'Revise los campos marcados antes de continuar.';
        TurnosApp.setStatus('Error', 'Revise los campos marcados antes de continuar.', '!');
        return;
      }

      const citizen = {
        nombre: form.elements.nombre.value.trim(),
        cedula: form.elements.cedula.value.trim(),
        correo: form.elements.correo.value.trim(),
        telefono: form.elements.telefono.value.trim()
      };

      TurnosStorage.update((state) => {
        state.citizen = citizen;
      });
      TurnosSync.saveCitizen(citizen);

      result.className = 'form-result success';
      result.textContent = 'Ciudadano identificado correctamente. Ya puede reservar un turno.';
      TurnosApp.setStatus('Éxito', 'Ciudadano identificado correctamente.', '✓');
      TurnosDialog.showDialog({
        title: 'Registro listo',
        message: 'El ciudadano fue identificado. Puede continuar con la reserva del turno.',
        secondaryLabel: 'Ir a reserva',
        onSecondary: () => TurnosRouter.showView('reserva')
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

  window.TurnosRegistro = { initRegistro };
})();
