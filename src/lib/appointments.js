(function () {
  function createTurnCode() {
    return 'TUR-' + String(Math.floor(100000 + Math.random() * 900000));
  }

  function buildAppointment({ owner, citizen, tramite, sede, fecha, hora }) {
    const assignment = TurnosCatalog.findOffice(sede);

    return {
      token: createTurnCode(),
      owner,
      citizen,
      tramite,
      sede,
      fecha,
      hora,
      oficina: assignment ? assignment.room : 'Oficina por asignar',
      funcionario: assignment ? assignment.agent : 'Funcionario por asignar',
      estado: 'Turno agendado',
      aiInsight: '',
      trackingEvents: []
    };
  }

  window.TurnosAppointments = { buildAppointment };
})();
