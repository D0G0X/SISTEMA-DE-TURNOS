(function () {
  let isReading = false;
  let muted = false;
  let volume = 0.8;
  let lastVolume = 0.8;
  let lastText = '';
  let wasReadingBeforeMute = false;
  let activeUtterance = null;
  let readButton = null;
  let muteButton = null;
  let volumeInput = null;
  let volumeValue = null;

  function getReadableText() {
    const activeView = document.querySelector('.app-view.is-active');
    const status = document.getElementById('globalStatus');
    const parts = [];

    if (status) parts.push(status.innerText);
    if (activeView) parts.push(activeView.innerText);

    return parts.join('. ').replace(/\s+/g, ' ').trim();
  }

  function getVoice() {
    const voices = window.speechSynthesis.getVoices();
    return voices.find((voice) => voice.lang.toLowerCase().startsWith('es')) || voices[0] || null;
  }

  function updateControls() {
    if (readButton) {
      readButton.textContent = isReading ? 'Detener' : 'Leer';
      readButton.setAttribute('aria-pressed', String(isReading));
      readButton.setAttribute('aria-label', isReading ? 'Detener lectura en voz alta' : 'Leer en voz alta la vista actual');
    }

    if (muteButton) {
      muteButton.textContent = muted ? 'Muted' : 'Mute';
      muteButton.setAttribute('aria-pressed', String(muted));
    }

    if (volumeInput) volumeInput.value = Math.round(volume * 100);
    if (volumeValue) volumeValue.textContent = Math.round(volume * 100) + '%';
  }

  function stopAll() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    activeUtterance = null;
    isReading = false;
    updateControls();
  }

  function readText(text) {
    if (!('speechSynthesis' in window)) {
      TurnosApp.setStatus('Información', 'El navegador no permite lectura en voz alta.', 'i');
      return;
    }

    if (muted || volume === 0) {
      stopAll();
      TurnosApp.setStatus('Información', 'El sonido está silenciado. Desactive Mute o suba el volumen.', 'i');
      return;
    }

    if (!text) {
      TurnosApp.setStatus('Información', 'No hay contenido visible para leer en esta vista.', 'i');
      return;
    }

    window.speechSynthesis.cancel();
    activeUtterance = new SpeechSynthesisUtterance(text);
    activeUtterance.lang = 'es-ES';
    activeUtterance.rate = 0.95;
    activeUtterance.volume = volume;

    const voice = getVoice();
    if (voice) activeUtterance.voice = voice;

    activeUtterance.onend = () => {
      isReading = false;
      activeUtterance = null;
      updateControls();
    };

    activeUtterance.onerror = () => {
      isReading = false;
      activeUtterance = null;
      updateControls();
      TurnosApp.setStatus('Información', 'No se pudo reproducir la lectura en voz alta en este navegador.', 'i');
    };

    lastText = text;
    isReading = true;
    updateControls();
    window.speechSynthesis.speak(activeUtterance);
  }

  function readCurrentView() {
    readText(getReadableText());
  }

  function setVolume(nextVolume) {
    volume = Math.max(0, Math.min(nextVolume, 1));
    muted = volume === 0;
    if (volume > 0) lastVolume = volume;
    updateControls();

    if (muted) {
      stopAll();
      TurnosApp.setStatus('Información', 'Volumen en cero. Lectura silenciada.', 'i');
      return;
    }

    TurnosApp.setStatus('Información', 'Volumen de lectura ajustado al ' + Math.round(volume * 100) + '%.', 'i');

    if (isReading && lastText) {
      readText(lastText);
    }
  }

  function setMuted(nextMuted) {
    muted = nextMuted;

    if (muted) {
      wasReadingBeforeMute = isReading;
      if (volume > 0) lastVolume = volume;
      volume = 0;
      stopAll();
      muted = true;
      updateControls();
      TurnosApp.setStatus('Información', 'Lectura en voz alta silenciada.', 'i');
      return;
    }

    muted = false;
    volume = lastVolume || 0.8;
    updateControls();
    TurnosApp.setStatus('Información', 'Sonido activado al ' + Math.round(volume * 100) + '%.', 'i');

    if (wasReadingBeforeMute && lastText) {
      wasReadingBeforeMute = false;
      readText(lastText);
    }
  }

  function initSpeechReader() {
    readButton = document.getElementById('readViewButton');
    muteButton = document.getElementById('muteSoundButton');
    volumeInput = document.getElementById('soundVolume');
    volumeValue = document.getElementById('soundVolumeValue');

    if (!readButton || !volumeInput) return;

    volume = Number(volumeInput.value) / 100;
    lastVolume = volume || 0.8;
    updateControls();

    window.speechSynthesis?.getVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateControls;
    }

    readButton.addEventListener('click', () => {
      if (isReading) {
        stopAll();
        return;
      }

      readCurrentView();
    });

    if (muteButton) {
      muteButton.addEventListener('click', () => setMuted(!muted));
    }

    volumeInput.addEventListener('input', () => setVolume(Number(volumeInput.value) / 100));
    volumeInput.addEventListener('change', () => setVolume(Number(volumeInput.value) / 100));

    window.addEventListener('hashchange', () => {
      if (isReading) stopAll();
    });
  }

  window.TurnosSpeechReader = { initSpeechReader, stopAll };
})();
