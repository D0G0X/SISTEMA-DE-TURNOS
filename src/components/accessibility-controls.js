(function () {
  const sizes = ['text-normal', 'text-large', 'text-xlarge'];
  let currentSize = 0;

  function applySize(index) {
    document.body.classList.remove(...sizes);
    currentSize = Math.max(0, Math.min(index, sizes.length - 1));
    document.body.classList.add(sizes[currentSize]);
  }

  function initAccessibilityControls() {
    const menuButton = document.getElementById('accessibilityMenuButton');
    const menu = document.getElementById('accessibilityMenu');
    const decrease = document.getElementById('decreaseTextButton');
    const increase = document.getElementById('increaseTextButton');
    const contrast = document.getElementById('contrastButton');
    const spacing = document.getElementById('spacingButton');
    const reflow = document.getElementById('reflowButton');
    const textCues = document.getElementById('textCuesButton');
    const imageText = document.getElementById('imageTextButton');
    const nonTextContrast = document.getElementById('nonTextContrastButton');
    const hoverFocus = document.getElementById('hoverFocusButton');
    const motion = document.getElementById('motionButton');
    const audioControl = document.getElementById('audioControlButton');
    const orientation = document.getElementById('orientationButton');
    const time = document.getElementById('timeButton');
    const pauseHide = document.getElementById('pauseHideButton');
    const wcag = document.getElementById('accessibilityViewButton');

    function setMenuOpen(isOpen) {
      menu.hidden = !isOpen;
      menuButton.setAttribute('aria-expanded', String(isOpen));
    }

    menuButton.addEventListener('click', () => {
      setMenuOpen(menuButton.getAttribute('aria-expanded') !== 'true');
    });

    document.addEventListener('click', (event) => {
      if (!menuButton.contains(event.target) && !menu.contains(event.target)) {
        setMenuOpen(false);
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        menuButton.focus();
      }
    });

    decrease.addEventListener('click', () => applySize(currentSize - 1));
    increase.addEventListener('click', () => applySize(currentSize + 1));

    contrast.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('high-contrast');
      contrast.setAttribute('aria-pressed', String(enabled));
      contrast.setAttribute('aria-label', enabled ? 'Desactivar alto contraste' : 'Activar alto contraste');
    });

    spacing.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('accessible-spacing');
      spacing.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Espaciado de texto accesible activado.' : 'Espaciado de texto normal restaurado.', 'i');
    });

    reflow.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('force-reflow');
      reflow.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Reajuste en una columna activado.' : 'Reajuste automático restaurado.', 'i');
    });

    textCues.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('text-cues');
      textCues.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Señales textuales visibles activadas: los campos muestran etiquetas además del color.' : 'Señales textuales adicionales desactivadas.', 'i');
    });

    imageText.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('image-text-check');
      imageText.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Comprobación activa: las imágenes quedan marcadas y el texto funcional sigue siendo HTML.' : 'Comprobación de imágenes de texto desactivada.', 'i');
    });

    nonTextContrast.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('strong-non-text');
      nonTextContrast.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Contraste no textual reforzado: bordes, controles y foco son más visibles.' : 'Contraste no textual normal restaurado.', 'i');
    });

    hoverFocus.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('show-focus-content');
      hoverFocus.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Tooltips y ayudas de foco visibles para revisión.' : 'Tooltips vuelven a mostrarse solo con cursor o foco.', 'i');
    });

    motion.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('reduce-motion');
      motion.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', enabled ? 'Movimiento reducido activado.' : 'Movimiento normal restaurado.', 'i');
    });

    audioControl.addEventListener('click', () => {
      if (window.TurnosSpeechReader) {
        window.TurnosSpeechReader.stopAll();
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      TurnosApp.setStatus('Información', 'Audio y lectura en voz alta detenidos.', 'i');
    });

    orientation.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('orientation-free');
      orientation.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', 'La interfaz permite orientación vertical u horizontal sin bloquear la pantalla.', 'i');
    });

    time.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('no-time-limit');
      time.setAttribute('aria-pressed', String(enabled));
      TurnosApp.setStatus('Información', 'Los formularios no tienen límite de tiempo para completarse.', 'i');
    });

    pauseHide.addEventListener('click', () => {
      const enabled = document.body.classList.toggle('hide-optional-content');
      pauseHide.setAttribute('aria-pressed', String(enabled));
      pauseHide.textContent = enabled ? 'Mostrar' : 'Ocultar';
      TurnosApp.setStatus('Información', enabled ? 'Contenido auxiliar oculto para reducir distracciones.' : 'Contenido auxiliar visible nuevamente.', 'i');
    });

    wcag.addEventListener('click', () => {
      setMenuOpen(false);
      TurnosRouter.showView('accesibilidad');
    });
    applySize(0);
  }

  window.TurnosAccessibilityControls = { initAccessibilityControls };
})();
