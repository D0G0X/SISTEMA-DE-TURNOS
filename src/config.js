(function () {
  var localApi = 'http://127.0.0.1:3001';
  var renderApi = 'https://sistema-turnos-api.onrender.com';
  var savedApi = localStorage.getItem('TURNOS_API_URL');
  var isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);

  window.TURNOS_API = window.TURNOS_API || savedApi || (isLocal ? localApi : renderApi);
})();
