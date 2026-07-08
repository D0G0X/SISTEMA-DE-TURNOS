(function () {
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (event) => {
      if (!event.ctrlKey || event.altKey || event.shiftKey) return;
      const key = event.key.toLowerCase();

      if (key === 'r') {
        event.preventDefault();
        TurnosRouter.showView('reserva');
        TurnosApp.setStatus('Informaci?n', 'Atajo Ctrl+R: vista de reserva abierta.', 'i');
      }

      if (key === 's') {
        event.preventDefault();
        TurnosRouter.showView('seguimiento');
        TurnosApp.setStatus('Informaci?n', 'Atajo Ctrl+S: vista de seguimiento abierta.', 'i');
      }
    });
  }

  window.TurnosKeyboardShortcuts = { initKeyboardShortcuts };
})();
