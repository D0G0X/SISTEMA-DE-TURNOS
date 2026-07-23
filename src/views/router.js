(function () {
  const routes = ['inicio', 'registro', 'reserva', 'seguimiento', 'accesibilidad', 'admin'];

  function getSession() {
    return TurnosStorage.read().session || null;
  }

  function isAdmin() {
    const session = getSession();
    return Boolean(session && session.role === 'admin');
  }

  function updateRoleNavigation() {
    const session = getSession();

    document.querySelectorAll('[data-admin-only]').forEach((item) => {
      item.hidden = !(session && session.role === 'admin');
    });

    document.querySelectorAll('[data-auth-hidden]').forEach((item) => {
      item.hidden = Boolean(session);
    });

    document.querySelectorAll('[data-auth-only]').forEach((item) => {
      item.hidden = !session;
    });

    const sessionLabel = document.getElementById('sessionLabel');
    if (sessionLabel) {
      sessionLabel.textContent = session
        ? 'Sesión activa: ' + session.label + ' (' + session.username + ')'
        : 'Sin sesión activa';
    }
  }

  function canAccess(route) {
    if (route !== 'admin') return true;
    return isAdmin();
  }

  function showView(route) {
    updateRoleNavigation();
    let safeRoute = routes.includes(route) ? route : 'inicio';

    if (!canAccess(safeRoute)) {
      TurnosApp.setStatus('Información', 'Debe iniciar sesión como admin para entrar a Administración.', 'i');
      safeRoute = 'registro';
    }

    document.querySelectorAll('.app-view').forEach((view) => {
      const isActive = view.dataset.view === safeRoute;
      view.hidden = !isActive;
      view.classList.toggle('is-active', isActive);
    });

    document.querySelectorAll('[data-route]').forEach((link) => {
      if (link.dataset.route === safeRoute) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    window.location.hash = safeRoute;
    document.getElementById('main-content').focus();
  }

  function logout() {
    TurnosStorage.update((state) => {
      state.session = null;
      state.citizen = null;
    });

    window.dispatchEvent(new CustomEvent('auth:updated'));
    TurnosApp.setStatus('Información', 'Sesión cerrada correctamente.', 'i');
    showView('inicio');
  }

  function initRouter() {
    document.querySelectorAll('[data-route]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showView(link.dataset.route);
      });
    });

    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
      logoutButton.addEventListener('click', logout);
    }

    window.addEventListener('auth:updated', updateRoleNavigation);
    const initialRoute = window.location.hash.replace('#', '') || 'inicio';
    showView(initialRoute);
  }

  window.TurnosRouter = { initRouter, showView, updateRoleNavigation, logout };
})();
