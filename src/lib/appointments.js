(function () {
  const officeAssignments = {
    'Centro de Atención Norte': { room: 'Oficina N-204', agent: 'Analista Pamela Vera' },
    'Centro de Atención Centro': { room: 'Ventanilla C-12', agent: 'Servidor Diego Zambrano' },
    'Centro de Atención Sur': { room: 'Oficina S-107', agent: 'Analista Andrea Mera' }
  };

  function createTurnCode() {
    return 'TUR-' + String(Math.floor(100000 + Math.random() * 900000));
  }

  function buildAppointment({ citizen, tramite, sede, fecha, hora }) {
    const assignment = officeAssignments[sede];

    return {
      token: createTurnCode(),
      citizen,
      tramite,
      sede,
      fecha,
      hora,
      oficina: assignment.room,
      funcionario: assignment.agent,
      estado: 'Turno agendado'
    };
  }

  window.TurnosAppointments = { buildAppointment };
})();
