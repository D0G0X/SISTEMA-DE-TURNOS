(function () {
  function initMenu() {
    const button = document.getElementById('menuButton');
    const closeButton = document.getElementById('closeMenuButton');
    const drawer = document.getElementById('drawerMenu');
    const backdrop = document.getElementById('drawerBackdrop');
    const links = drawer.querySelectorAll('[data-route]');

    function setOpen(isOpen) {
      button.setAttribute('aria-expanded', String(isOpen));
      drawer.hidden = !isOpen;
      backdrop.hidden = !isOpen;
      if (isOpen) closeButton.focus();
    }

    button.addEventListener('click', () => {
      setOpen(button.getAttribute('aria-expanded') !== 'true');
    });

    closeButton.addEventListener('click', () => setOpen(false));
    backdrop.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        button.focus();
      }
    });

    links.forEach((link) => {
      link.addEventListener('click', () => setOpen(false));
    });
  }

  window.TurnosMenu = { initMenu };
})();
