(function () {
  const messages = {
    es: 'Para usar el sistema: ingrese los datos del ciudadano, reserve el turno, guarde el token generado y consulte el seguimiento para ver sede, oficina, funcionario, fecha y hora.',
    en: 'To use the system: enter the citizen data, book the appointment, save the generated token, and check tracking to see office, assigned staff, date, and time.',
    qu: 'Kay sistema llamkanapa: runa willayta churay, turnota akllay, token yupayta wakaychiy, chaymanta seguimiento rikuy oficina, yanapakuq runa, punchaw, hora willaykunata.'
  };

  function initTranslator() {
    const selector = document.getElementById('languageSelector');
    const output = document.getElementById('translatedHelp');

    if (!selector || !output) return;

    function render() {
      output.textContent = messages[selector.value];
    }

    selector.addEventListener('change', render);
    render();
  }

  window.TurnosTranslator = { initTranslator };
})();
