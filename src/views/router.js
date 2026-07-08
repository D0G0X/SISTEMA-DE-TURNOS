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
    document.querySelectorAll('[data-admin-only]').forEach((item) => {
      item.hidden = !isAdmin();
    });
  }

  function canAccess(route) {
    if (route !== 'admin') return true;
    return isAdmin();
  }

  function showView(route) {
    updateRoleNavigation();
    let safeRoute = routes.includes(route) ? route : 'inicio';

    if (!canAccess(safeRoute)) {
      TurnosApp.setStatus('Informaci?n', 'Debe iniciar sesi?n como admin para entrar a Administraci?n.', 'i');
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

  function initRouter() {
    document.querySelectorAll('[data-route]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        showView(link.dataset.route);
      });
    });

    window.addEventListener('auth:updated', updateRoleNavigation);
    const initialRoute = window.location.hash.replace('#', '') || 'inicio';
    showView(initialRoute);
  }

  window.TurnosRouter = { initRouter, showView, updateRoleNavigation };
})();
