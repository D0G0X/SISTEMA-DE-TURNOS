(function () {
  function setStatus(type, message, icon) {
    const status = document.getElementById('globalStatus');
    status.innerHTML = '<span class="status-icon" role="img" aria-label="' + type + '">' + icon + '</span><span><strong>' + type + ':</strong> ' + message + '</span>';
  }

  function init() {
    TurnosMenu.initMenu();
    TurnosRouter.initRouter();
    TurnosRegistro.initRegistro();
    TurnosReserva.initReserva();
    TurnosSeguimiento.initSeguimiento();
    TurnosAccesibilidad.initAccesibilidad();
    TurnosAccessibilityControls.initAccessibilityControls();
    TurnosSpeechReader.initSpeechReader();
  }

  window.TurnosApp = { setStatus };
  document.addEventListener('DOMContentLoaded', init);
})();
