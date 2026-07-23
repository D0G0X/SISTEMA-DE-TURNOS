(function () {
  const API = window.TURNOS_API || 'http://127.0.0.1:3001';
  let initialized = false;

  function appendMessage(container, text, type) {
    const message = document.createElement('p');
    message.className = 'chatbot-message ' + type;
    message.textContent = text;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
  }

  async function loadHealth(modelLabel, status) {
    try {
      const response = await fetch(API + '/api/chat/health');
      const health = await response.json();
      modelLabel.textContent = 'Modelo: ' + health.model + ' · MCP: ' + (health.mcpReady ? 'activo' : 'sin conexión');

      if (!health.openaiConfigured) {
        status.textContent = 'Falta configurar OPENAI_API_KEY en el backend.';
      } else if (!health.mcpReady) {
        status.textContent = 'MCP no está conectado. Revise Postgres o el servidor MCP.';
      } else {
        status.textContent = 'Listo para responder con datos del sistema.';
      }
    } catch (error) {
      modelLabel.textContent = 'Modelo: backend no disponible';
      status.textContent = 'Inicie el backend Node en el puerto 3001.';
    }
  }

  function initChatbot() {
    if (initialized) return;

    const toggle = document.getElementById('chatbotToggle');
    const close = document.getElementById('chatbotClose');
    const box = document.getElementById('chatbotBox');
    const form = document.getElementById('chatbotForm');
    const input = document.getElementById('chatbotInput');
    const messages = document.getElementById('chatbotMessages');
    const status = document.getElementById('chatbotStatus');
    const modelLabel = document.getElementById('chatbotModel');

    if (!toggle || !box || !form) return;
    initialized = true;

    function setOpen(open) {
      box.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      if (open) {
        loadHealth(modelLabel, status);
        if (input) input.focus();
      }
    }

    if (close) {
      close.addEventListener('click', (event) => {
        event.stopPropagation();
        setOpen(false);
      });
    }

    document.addEventListener('click', (event) => {
      if (event.target.closest('#chatbotClose')) setOpen(false);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const question = input.value.trim();
      if (!question) {
        status.textContent = 'Escriba una pregunta antes de enviar.';
        input.focus();
        return;
      }

      appendMessage(messages, question, 'user');
      input.value = '';
      input.disabled = true;
      status.textContent = 'Consultando al asistente IA por MCP...';

      try {
        const response = await fetch(API + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: question }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No se pudo consultar el chatbot.');
        appendMessage(messages, data.answer, 'bot');
        modelLabel.textContent = 'Modelo: ' + data.model + ' · MCP: activo';
        status.textContent = 'Respuesta generada correctamente.';
      } catch (error) {
        appendMessage(messages, error.message, 'bot error');
        status.textContent = 'No se pudo completar la consulta.';
      } finally {
        input.disabled = false;
        input.focus();
      }
    });

    loadHealth(modelLabel, status);
  }

  function toggleChatbot() {
    initChatbot();
    const toggle = document.getElementById('chatbotToggle');
    const box = document.getElementById('chatbotBox');
    const input = document.getElementById('chatbotInput');
    const status = document.getElementById('chatbotStatus');
    const modelLabel = document.getElementById('chatbotModel');

    if (!toggle || !box) return;
    const open = box.hidden;
    box.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));

    if (open) {
      if (modelLabel && status) loadHealth(modelLabel, status);
      if (input) input.focus();
    }
  }

  window.TurnosChatbot = { initChatbot, toggleChatbot };
  window.toggleTurnosChatbot = toggleChatbot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChatbot);
  } else {
    initChatbot();
  }
})();
