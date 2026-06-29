(function () {
  function showDialog({ title, message, token, secondaryLabel, onSecondary }) {
    const dialog = document.getElementById('appDialog');
    const titleNode = document.getElementById('dialogTitle');
    const messageNode = document.getElementById('dialogMessage');
    const tokenNode = document.getElementById('dialogToken');
    const primaryButton = document.getElementById('dialogPrimaryButton');
    const secondaryButton = document.getElementById('dialogSecondaryButton');

    titleNode.textContent = title;
    messageNode.textContent = message;
    tokenNode.hidden = !token;
    tokenNode.textContent = token ? 'Token generado: ' + token : '';
    secondaryButton.hidden = !secondaryLabel;
    secondaryButton.textContent = secondaryLabel || '';

    primaryButton.onclick = () => dialog.close();
    secondaryButton.onclick = () => {
      dialog.close();
      if (onSecondary) onSecondary();
    };

    dialog.showModal();
    primaryButton.focus();
  }

  window.TurnosDialog = { showDialog };
})();
