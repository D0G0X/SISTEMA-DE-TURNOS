(function () {
  var BOT_NAME = 'Turni';
  var BOT_AVATAR = 'Tu';
  var TEASER_RADIUS = 140;
  var HISTORY_KEY = 'turniChatHistory';
  var MAX_SESSIONS = 25;

  var currentToken = '';
  var busy = false;
  var isOpen = false;
  var menuOpen = false;
  var teaserVisible = false;

  var chatStore = { activeId: '', sessions: [] };
  var activeMessages = [];

  function el(id) {
    return document.getElementById(id);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function loadHistory() {
    try {
      var raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
      chatStore.activeId = raw.activeId || '';
      chatStore.sessions = Array.isArray(raw.sessions) ? raw.sessions : [];
    } catch (e) {
      chatStore = { activeId: '', sessions: [] };
    }
  }

  function saveHistory() {
    localStorage.setItem(
      HISTORY_KEY,
      JSON.stringify({ activeId: chatStore.activeId, sessions: chatStore.sessions })
    );
  }

  function formatSessionDate(iso) {
    try {
      return new Date(iso).toLocaleString('es-EC', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return iso;
    }
  }

  function sessionTitle(session) {
    if (session.title) return session.title;
    var firstUser = (session.messages || []).find(function (m) {
      return m.role === 'user';
    });
    if (firstUser) {
      var text = firstUser.text.trim();
      return text.length > 42 ? text.slice(0, 42) + '…' : text;
    }
    return 'Conversación · ' + formatSessionDate(session.updatedAt || session.createdAt);
  }

  function getSession(id) {
    return chatStore.sessions.find(function (s) {
      return s.id === id;
    });
  }

  function getActiveSession() {
    return getSession(chatStore.activeId);
  }

  function createSession(token) {
    return {
      id: 'chat-' + Date.now(),
      title: '',
      token: token || '',
      messages: [],
      createdAt: nowIso(),
      updatedAt: nowIso()
    };
  }

  function ensureActiveSession(token) {
    var session = getActiveSession();
    if (session) return session;

    if (chatStore.sessions.length > 0) {
      chatStore.activeId = chatStore.sessions[0].id;
      return getActiveSession();
    }

    var fresh = createSession(token || currentToken);
    chatStore.sessions.unshift(fresh);
    chatStore.activeId = fresh.id;
    saveHistory();
    return fresh;
  }

  function persistActiveSession() {
    var session = getActiveSession();
    if (!session) return;
    session.messages = activeMessages.slice();
    session.token = currentToken || session.token || '';
    session.updatedAt = nowIso();
    if (!session.title) {
      var userMsg = activeMessages.find(function (m) {
        return m.role === 'user';
      });
      if (userMsg) session.title = sessionTitle(session);
    }
    saveHistory();
    renderHistoryList();
  }

  function getLocalAppointment() {
    if (!currentToken) return null;
    var state = TurnosStorage.read();
    return state.appointments.find(function (item) {
      return item.token === currentToken;
    }) || null;
  }

  function getWelcomeMessage() {
    return (
      '¡Hola! Soy ' +
      BOT_NAME +
      ', su asistente virtual del Sistema de Turnos. Puedo ayudarle con reservas, seguimiento, documentos, inasistencias, sanciones y mucho más. ¿En qué le puedo ayudar?'
    );
  }

  function renderMessages(messages) {
    var log = el('aiChatLog');
    if (!log) return;
    log.innerHTML = '';
    messages.forEach(function (msg) {
      appendMessage(msg.role, msg.text, true);
    });
  }

  function appendMessage(role, text, skipPersist) {
    var log = el('aiChatLog');
    if (!log) return;

    if (!skipPersist) {
      activeMessages.push({ role: role, text: text });
      persistActiveSession();
    }

    var item = document.createElement('div');
    item.className = 'chatbot-bubble chatbot-bubble-' + role;

    if (role === 'assistant') {
      var avatar = document.createElement('span');
      avatar.className = 'chatbot-bubble-avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = BOT_AVATAR;
      item.appendChild(avatar);
    }

    var body = document.createElement('div');
    body.className = 'chatbot-bubble-body';

    if (role === 'assistant') {
      var label = document.createElement('span');
      label.className = 'chatbot-bubble-name';
      label.textContent = BOT_NAME;
      body.appendChild(label);
    }

    var msg = document.createElement('p');
    msg.textContent = text;
    body.appendChild(msg);
    item.appendChild(body);
    log.appendChild(item);
    log.scrollTop = log.scrollHeight;
  }

  function showWelcomeMessage() {
    appendMessage('assistant', getWelcomeMessage());
  }

  function loadSession(sessionId) {
    var session = getSession(sessionId);
    if (!session) return;

    persistActiveSession();
    chatStore.activeId = sessionId;
    activeMessages = (session.messages || []).slice();
    if (session.token) currentToken = session.token;
    saveHistory();
    renderMessages(activeMessages);
    renderHistoryList();
    closeChatMenu();

    if (activeMessages.length === 0) showWelcomeMessage();

    var input = el('aiChatInput');
    if (input) input.focus();
  }

  function startNewChat() {
    if (busy) return;
    persistActiveSession();

    var fresh = createSession(currentToken);
    chatStore.sessions.unshift(fresh);
    chatStore.activeId = fresh.id;

    while (chatStore.sessions.length > MAX_SESSIONS) {
      var removed = chatStore.sessions.pop();
      if (removed && removed.id === chatStore.activeId && chatStore.sessions[0]) {
        chatStore.activeId = chatStore.sessions[0].id;
      }
    }

    activeMessages = [];
    saveHistory();
    renderMessages([]);
    showWelcomeMessage();
    renderHistoryList();
    closeChatMenu();

    var input = el('aiChatInput');
    if (input) input.focus();
    TurnosApp.setStatus('Información', 'Nueva conversación con ' + BOT_NAME + '.', 'i');
  }

  function renderHistoryList() {
    var list = el('chatbotHistoryList');
    var empty = el('chatbotHistoryEmpty');
    if (!list) return;

    list.innerHTML = '';
    var others = chatStore.sessions.slice();

    if (others.length === 0) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;

    others.forEach(function (session) {
      var item = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chatbot-history-item';
      btn.setAttribute('role', 'menuitem');
      if (session.id === chatStore.activeId) btn.classList.add('is-active');

      var title = document.createElement('span');
      title.className = 'chatbot-history-title';
      title.textContent = sessionTitle(session);

      var meta = document.createElement('span');
      meta.className = 'chatbot-history-meta';
      meta.textContent =
        formatSessionDate(session.updatedAt || session.createdAt) +
        (session.messages && session.messages.length ? ' · ' + session.messages.length + ' mensajes' : '');

      btn.appendChild(title);
      btn.appendChild(meta);
      btn.addEventListener('click', function () {
        if (session.id !== chatStore.activeId) loadSession(session.id);
        else closeChatMenu();
      });

      item.appendChild(btn);
      list.appendChild(item);
    });
  }

  function openChatMenu() {
    var menu = el('chatbotMenu');
    var btn = el('chatbotMenuBtn');
    if (!menu || !btn) return;
    persistActiveSession();
    renderHistoryList();
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    menuOpen = true;
  }

  function closeChatMenu() {
    var menu = el('chatbotMenu');
    var btn = el('chatbotMenuBtn');
    if (!menu || !btn) return;
    menu.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    menuOpen = false;
  }

  function toggleChatMenu() {
    if (menuOpen) closeChatMenu();
    else openChatMenu();
  }

  function showTyping(show) {
    var typing = el('chatbotTyping');
    if (typing) typing.hidden = !show;
    if (show) {
      var log = el('aiChatLog');
      if (log) log.scrollTop = log.scrollHeight;
    }
  }

  function setInsight(text) {
    var insight = el('aiInsightText');
    var banner = el('aiInsightBanner');
    var bannerText = el('aiInsightBannerText');

    if (insight) insight.textContent = text || '';

    if (banner && bannerText) {
      if (text) {
        bannerText.textContent = text;
        banner.hidden = false;
      } else {
        banner.hidden = true;
      }
    }
  }

  function setSubtitle(text) {
    var subtitle = el('chatbotSubtitle');
    if (subtitle) subtitle.textContent = text || 'Asistente Virtual · Sistema de Turnos';
  }

  function renderTimeline(events) {
    var list = el('trackingTimeline');
    if (!list) return;

    list.innerHTML = '';

    if (!events || events.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'tracking-timeline-empty';
      empty.textContent = 'Aún no hay eventos de seguimiento registrados.';
      list.appendChild(empty);
      return;
    }

    events.forEach(function (event) {
      var item = document.createElement('li');
      item.className = 'tracking-timeline-item';

      var time = document.createElement('time');
      time.dateTime = event.created_at || '';
      time.textContent = TurnosAppointmentTracking.formatEventTime(event.created_at);

      var status = document.createElement('span');
      status.className = 'tracking-timeline-status';
      status.textContent = event.estado_nuevo;

      var msg = document.createElement('p');
      msg.textContent = event.mensaje;

      item.appendChild(time);
      item.appendChild(status);
      item.appendChild(msg);
      list.appendChild(item);
    });
  }

  function showInsightPanel(show) {
    var panel = el('trackingInsightPanel');
    if (panel) panel.hidden = !show;
  }

  function setTeaserVisible(show) {
    var teaser = el('chatbotTeaser');
    if (!teaser) return;
    if (isOpen) show = false;
    teaserVisible = show;
    teaser.hidden = !show;
    teaser.setAttribute('aria-hidden', show ? 'false' : 'true');
  }

  function updateTeaserProximity(clientX, clientY) {
    if (isOpen) {
      setTeaserVisible(false);
      return;
    }
    var toggle = el('chatbotToggle');
    if (!toggle) return;
    var rect = toggle.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = clientX - cx;
    var dy = clientY - cy;
    var near = Math.sqrt(dx * dx + dy * dy) <= TEASER_RADIUS;
    setTeaserVisible(near);
  }

  function openChat() {
    var windowEl = el('chatbotWindow');
    var toggle = el('chatbotToggle');
    if (!windowEl || !toggle) return;

    isOpen = true;
    setTeaserVisible(false);
    windowEl.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Cerrar chat con ' + BOT_NAME);

    ensureActiveSession(currentToken);
    var session = getActiveSession();
    activeMessages = session ? session.messages.slice() : [];
    renderMessages(activeMessages);

    if (activeMessages.length === 0) showWelcomeMessage();

    var input = el('aiChatInput');
    if (input) input.focus();
  }

  function closeChat() {
    var windowEl = el('chatbotWindow');
    var toggle = el('chatbotToggle');
    if (!windowEl || !toggle) return;

    closeChatMenu();
    persistActiveSession();
    isOpen = false;
    windowEl.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Abrir a ' + BOT_NAME + ', asistente virtual');
    toggle.focus();
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  function bindToToken(token, bundle) {
    currentToken = token;
    showInsightPanel(true);

    if (bundle && bundle.appointment) {
      setInsight(bundle.appointment.ai_insight);
      renderTimeline(bundle.events);
      setSubtitle('Monitoreando turno ' + token);
    } else {
      var local = getLocalAppointment();
      if (local) {
        setInsight(local.aiInsight);
        renderTimeline(local.trackingEvents || []);
        setSubtitle('Monitoreando turno ' + token);
      }
    }

    TurnosTracker.startPolling(token, function (updated) {
      if (updated.appointment.token !== currentToken) return;
      setInsight(updated.appointment.ai_insight);
      renderTimeline(updated.events);
      setSubtitle('Monitoreando turno ' + currentToken);

      var estadoField = el('estado');
      if (estadoField) estadoField.value = updated.appointment.estado;

      var appt = getLocalAppointment();
      if (appt && appt.estado !== updated.appointment.estado) {
        TurnosApp.setStatus('Información', 'Seguimiento IA: estado actualizado a "' + updated.appointment.estado + '".', 'i');
        if (isOpen) {
          appendMessage('assistant', 'Actualización: su turno ahora está en estado "' + updated.appointment.estado + '".');
        }
      }
    });

    ensureActiveSession(token);
    var session = getActiveSession();
    if (session) session.token = token;

    openChat();
    appendMessage(
      'assistant',
      'Turno ' + token + ' cargado. Puede preguntarme lo que necesite sobre este trámite o sobre las normas del sistema.'
    );
  }

  function clearPanel() {
    currentToken = '';
    TurnosTracker.stopPolling();
    showInsightPanel(false);
    setInsight('');
    renderTimeline([]);
    setSubtitle('Asistente Virtual · Sistema de Turnos');
  }

  function resolveAnswer(question) {
    var local = getLocalAppointment();
    return TurnosAiKnowledge.answerQuestion(question, local);
  }

  function submitQuestion(event) {
    event.preventDefault();
    if (busy) return;

    var form = el('aiChatForm');
    var input = form.elements.pregunta;
    var question = input.value.trim();
    if (!question) return;

    ensureActiveSession(currentToken);
    appendMessage('user', question);
    input.value = '';
    busy = true;
    el('aiChatSubmit').disabled = true;
    showTyping(true);

    var tokenForAsk = currentToken || (getActiveSession() && getActiveSession().token) || '';

    TurnosTracker.askAi(tokenForAsk, question)
      .then(function (response) {
        appendMessage('assistant', response.answer);
        if (response.ai_insight) setInsight(response.ai_insight);
        if (response.estado) {
          var estadoField = el('estado');
          if (estadoField) estadoField.value = response.estado;
        }
      })
      .catch(function () {
        appendMessage('assistant', resolveAnswer(question));
      })
      .finally(function () {
        busy = false;
        showTyping(false);
        el('aiChatSubmit').disabled = false;
        input.focus();
      });
  }

  function initAiAssistant() {
    loadHistory();

    var toggle = el('chatbotToggle');
    var closeBtn = el('chatbotClose');
    var menuBtn = el('chatbotMenuBtn');
    var menuNew = el('chatbotMenuNew');
    var form = el('aiChatForm');
    var launcher = el('chatbotLauncher');
    var menuWrap = document.querySelector('.chatbot-menu-wrap');

    if (toggle) toggle.addEventListener('click', toggleChat);
    if (closeBtn) closeBtn.addEventListener('click', closeChat);
    if (menuBtn) menuBtn.addEventListener('click', toggleChatMenu);
    if (menuNew) menuNew.addEventListener('click', startNewChat);
    if (form) form.addEventListener('submit', submitQuestion);

    document.querySelectorAll('[data-ai-question]').forEach(function (button) {
      button.addEventListener('click', function () {
        if (!isOpen) openChat();
        var input = el('aiChatInput');
        input.value = button.getAttribute('data-ai-question');
        form.requestSubmit();
      });
    });

    if (launcher) {
      launcher.addEventListener('mouseenter', function () {
        if (!isOpen) setTeaserVisible(true);
      });
      launcher.addEventListener('mouseleave', function () {
        setTeaserVisible(false);
      });
      launcher.addEventListener('focusin', function () {
        if (!isOpen) setTeaserVisible(true);
      });
      launcher.addEventListener('focusout', function () {
        setTeaserVisible(false);
      });
    }

    document.addEventListener('click', function (event) {
      if (!menuOpen || !menuWrap) return;
      if (!menuWrap.contains(event.target)) closeChatMenu();
    });

    document.addEventListener('mousemove', function (event) {
      updateTeaserProximity(event.clientX, event.clientY);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        if (menuOpen) closeChatMenu();
        else if (isOpen) closeChat();
      }
    });

    renderHistoryList();
  }

  window.TurnosAiAssistant = {
    initAiAssistant: initAiAssistant,
    bindToToken: bindToToken,
    clearPanel: clearPanel,
    renderTimeline: renderTimeline,
    setInsight: setInsight,
    openChat: openChat,
    closeChat: closeChat,
    startNewChat: startNewChat
  };
})();
