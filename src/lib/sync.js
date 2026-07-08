(function () {
  // Sincronización a la API de Postgres. Fire-and-forget: si la API está
  // caída, la app sigue funcionando con localStorage (no rompe nada).
  var API = window.TURNOS_API || 'http://127.0.0.1:3001';

  function send(path, data) {
    fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(function () { /* sin conexión: se conserva la copia local */ });
  }

  function saveCitizen(citizen) {
    send('/api/citizens', citizen);
  }

  function saveAppointment(appointment) {
    send('/api/appointments', {
      token: appointment.token,
      cedula: appointment.citizen.cedula,
      nombre: appointment.citizen.nombre,
      correo: appointment.citizen.correo,
      telefono: appointment.citizen.telefono,
      tramite: appointment.tramite,
      sede: appointment.sede,
      oficina: appointment.oficina,
      funcionario: appointment.funcionario,
      fecha: appointment.fecha,
      hora: appointment.hora,
      estado: appointment.estado
    });
  }

  window.TurnosSync = { saveCitizen: saveCitizen, saveAppointment: saveAppointment };
})();
