(function () {
  const USERS = {
    normal: { password: 'normal123', role: 'normal', label: 'Usuario normal' },
    admin: { password: 'admin123', role: 'admin', label: 'Administrador' }
  };

  function setLoginError(input, message) {
    const field = input.closest('.field');
    const error = field.querySelector('.error-text');
    field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message ? 'Error: ' + message : '';
  }

  function validateLogin(form) {
    const userInput = form.elements.usuario;
    const passwordInput = form.elements.password;
    const username = userInput.value.trim().toLowerCase();
    const password = passwordInput.value.trim();
    const account = USERS[username];

    setLoginError(userInput, '');
    setLoginError(passwordInput, '');

    if (!username) {
      setLoginError(userInput, 'Ingrese el usuario.');
      userInput.focus();
      return null;
    }

    if (!account) {
      setLoginError(userInput, 'Usuario no reconocido. Use normal o admin.');
      userInput.focus();
      return null;
    }

    if (!password) {
      setLoginError(passwordInput, 'Ingrese la contrase?a.');
      passwordInput.focus();
      return null;
    }

    if (password !== account.password) {
      setLoginError(passwordInput, 'Contrase?a incorrecta.');
      passwordInput.focus();
      return null;
    }

    return { username, role: account.role, label: account.label };
  }

  function initRegistro() {
    const form = document.getElementById('citizenForm');
    const result = document.getElementById('registroResult');

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const session = validateLogin(form);
      if (!session) {
        result.className = 'form-result error';
        result.textContent = 'Revise usuario y contrase?a.';
        TurnosApp.setStatus('Error', 'Revise usuario y contrase?a.', '!');
        return;
      }

      if (session.role === 'admin') {
        TurnosStorage.update((state) => {
          state.session = session;
        });

        result.className = 'form-result success';
        result.textContent = 'Administrador identificado correctamente.';
        TurnosApp.setStatus('?xito', 'Administrador identificado correctamente.', '?');
        TurnosDialog.showDialog({
          title: 'Acceso administrador',
          message: 'Puede administrar sedes y tr?mites del sistema.',
          secondaryLabel: 'Ir a administraci?n',
          onSecondary: () => TurnosRouter.showView('admin')
        });
        return;
      }

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
        state.session = session;
        state.citizen = citizen;
      });

      window.dispatchEvent(new CustomEvent('auth:updated'));
      result.className = 'form-result success';
      result.textContent = 'Ciudadano identificado correctamente. Ya puede reservar un turno.';
      TurnosApp.setStatus('?xito', 'Ciudadano identificado correctamente.', '?');
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
        setLoginError(form.elements.usuario, '');
        setLoginError(form.elements.password, '');
        result.textContent = '';
        result.className = 'form-result';
      }, 0);
    });
  }

  window.TurnosRegistro = { initRegistro };
})();
