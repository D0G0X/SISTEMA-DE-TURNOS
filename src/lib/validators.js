(function () {
  const rules = {
    nombre(value) {
      if (!value.trim()) return 'Ingrese el nombre completo.';
      if (value.trim().length < 6) return 'El nombre debe tener al menos 6 caracteres.';
      return '';
    },
    cedula(value) {
      if (!value.trim()) return 'Ingrese la cédula.';
      if (!/^\d{10}$/.test(value.trim())) return 'La cédula debe tener exactamente 10 números.';
      return '';
    },
    correo(value) {
      if (!value.trim()) return 'Ingrese el correo electrónico.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Ingrese un correo válido.';
      return '';
    },
    telefono(value) {
      if (!value.trim()) return 'Ingrese el teléfono.';
      if (!/^\d{7,10}$/.test(value.trim())) return 'El teléfono debe tener entre 7 y 10 números.';
      return '';
    },
    tramite(value) {
      return value ? '' : 'Seleccione el tipo de trámite.';
    },
    sede(value) {
      return value ? '' : 'Seleccione una sede.';
    },
    fecha(value) {
      if (!value) return 'Seleccione una fecha.';
      const selected = new Date(value + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) return 'La fecha debe ser igual o posterior al día actual.';
      return '';
    },
    hora(value) {
      return value ? '' : 'Seleccione una hora.';
    },
    codigo(value) {
      if (!value.trim()) return 'Ingrese el token del turno.';
      if (!/^TUR-\d{6}$/i.test(value.trim())) return 'El token debe tener el formato TUR-123456.';
      return '';
    }
  };

  function setFieldState(input, message) {
    const field = input.closest('.field');
    const error = field.querySelector('.error-text');

    field.classList.remove('has-error', 'has-success');
    input.removeAttribute('aria-invalid');

    if (message) {
      field.classList.add('has-error');
      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'Error: ' + message;
      return;
    }

    if (!input.readOnly && input.value.trim()) {
      field.classList.add('has-success');
    }

    error.textContent = '';
  }

  function validateForm(form, fieldNames) {
    let firstInvalid = null;

    fieldNames.forEach((name) => {
      const input = form.elements[name];
      const message = rules[name](input.value);
      setFieldState(input, message);
      if (message && !firstInvalid) firstInvalid = input;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }

    return true;
  }

  function clearFormState(form) {
    form.querySelectorAll('.field').forEach((field) => {
      field.classList.remove('has-error', 'has-success');
      const input = field.querySelector('input, select');
      const error = field.querySelector('.error-text');
      if (input) input.removeAttribute('aria-invalid');
      if (error) error.textContent = '';
    });
  }

  window.TurnosValidators = { validateForm, clearFormState };
})();
