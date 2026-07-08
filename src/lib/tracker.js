(function () {
  var API = window.TURNOS_API || 'http://127.0.0.1:3001';
  var pollTimer = null;

  function fetchTracking(token) {
    return fetch(API + '/api/tracking/' + encodeURIComponent(token))
      .then(function (res) {
        if (!res.ok) return null;
        return res.json();
      })
      .catch(function () {
        return null;
      });
  }

  function askAi(token, question) {
    return fetch(API + '/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token || '', question: question })
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (b) { throw new Error(b.error || 'Error al consultar'); });
        return res.json();
      });
  }

  function mergeRemoteTracking(token, bundle) {
    if (!bundle || !bundle.appointment) return null;

    var remote = bundle.appointment;
    TurnosStorage.update(function (state) {
      var local = state.appointments.find(function (item) {
        return item.token === token;
      });
      if (local) {
        local.estado = remote.estado;
        local.aiInsight = remote.ai_insight || local.aiInsight;
        local.trackingEvents = bundle.events || [];
      }
    });

    return bundle;
  }

  function syncTracking(token) {
    return fetchTracking(token).then(function (bundle) {
      if (bundle) mergeRemoteTracking(token, bundle);
      return bundle;
    });
  }

  function startPolling(token, onUpdate, intervalMs) {
    stopPolling();
    if (!token) return;

    var tick = function () {
      syncTracking(token).then(function (bundle) {
        if (bundle && typeof onUpdate === 'function') onUpdate(bundle);
      });
    };

    tick();
    pollTimer = setInterval(tick, intervalMs || 45000);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  window.TurnosTracker = {
    fetchTracking: fetchTracking,
    askAi: askAi,
    syncTracking: syncTracking,
    mergeRemoteTracking: mergeRemoteTracking,
    startPolling: startPolling,
    stopPolling: stopPolling
  };
})();
