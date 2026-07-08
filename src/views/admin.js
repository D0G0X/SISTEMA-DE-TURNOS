(function () {
  function renderCatalog() {
    const { offices, procedures } = TurnosCatalog.getCatalog();
    const officeList = document.getElementById('officeList');
    const procedureList = document.getElementById('procedureList');

    officeList.innerHTML = '';
    procedureList.innerHTML = '';

    offices.forEach((office) => {
      const item = document.createElement('li');
      item.textContent = office.name + ' - ' + office.room + ' - ' + office.agent;
      officeList.appendChild(item);
    });

    procedures.forEach((procedure) => {
      const item = document.createElement('li');
      item.textContent = procedure;
      procedureList.appendChild(item);
    });
  }

  function showFieldError(input, message) {
    const field = input.closest('.field');
    const error = field.querySelector('.error-text');
    field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message ? 'Error: ' + message : '';
  }

  function validateRequired(form, names) {
    let firstInvalid = null;

    names.forEach((name) => {
      const input = form.elements[name];
      const message = input.value.trim() ? '' : 'Este campo es obligatorio.';
      showFieldError(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function initAdmin() {
    const officeForm = document.getElementById('officeForm');
    const procedureForm = document.getElementById('procedureForm');
    const officeResult = document.getElementById('officeResult');
    const procedureResult = document.getElementById('procedureResult');

    renderCatalog();
    window.addEventListener('catalog:updated', renderCatalog);

    officeForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateRequired(officeForm, ['adminSede', 'adminOficina', 'adminFuncionario'])) {
        officeResult.className = 'form-result error';
        officeResult.textContent = 'Complete todos los datos de la sede.';
        return;
      }

      const response = TurnosCatalog.addOffice({
        name: officeForm.elements.adminSede.value,
        room: officeForm.elements.adminOficina.value,
        agent: officeForm.elements.adminFuncionario.value
      });

      officeResult.className = 'form-result ' + (response.ok ? 'success' : 'error');
      officeResult.textContent = response.message;

      if (response.ok) {
        officeForm.reset();
        TurnosApp.setStatus('Éxito', response.message, '✓');
      } else {
        TurnosApp.setStatus('Error', response.message, '!');
      }
    });

    procedureForm.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateRequired(procedureForm, ['adminTramite'])) {
        procedureResult.className = 'form-result error';
        procedureResult.textContent = 'Ingrese el nombre del trámite.';
        return;
      }

      const response = TurnosCatalog.addProcedure(procedureForm.elements.adminTramite.value);
      procedureResult.className = 'form-result ' + (response.ok ? 'success' : 'error');
      procedureResult.textContent = response.message;

      if (response.ok) {
        procedureForm.reset();
        TurnosApp.setStatus('Éxito', response.message, '✓');
      } else {
        TurnosApp.setStatus('Error', response.message, '!');
      }
    });
  }

  window.TurnosAdmin = { initAdmin };
})();
