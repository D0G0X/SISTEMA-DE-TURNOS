(function () {
  const routes = ['inicio', 'registro', 'reserva', 'seguimiento', 'accesibilidad'];

  function showView(route) {
    const safeRoute = routes.includes(route) ? route : 'inicio';

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

    const initialRoute = window.location.hash.replace('#', '') || 'inicio';
    showView(initialRoute);
  }

  window.TurnosRouter = { initRouter, showView };
})();
