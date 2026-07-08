(function () {
  const KEY = 'turnosGobiernoState';

  const defaultState = {
    citizen: null,
    appointments: [],
    offices: [
      { name: 'Centro de Atención Norte', room: 'Oficina N-204', agent: 'Analista Pamela Vera' },
      { name: 'Centro de Atención Centro', room: 'Ventanilla C-12', agent: 'Servidor Diego Zambrano' },
      { name: 'Centro de Atención Sur', room: 'Oficina S-107', agent: 'Analista Andrea Mera' }
    ],
    procedures: [
      'Cedulación',
      'Licencia de funcionamiento',
      'Certificado municipal',
      'Pago de obligaciones'
    ]
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function read() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY)) || {};
      const state = Object.assign(cloneDefaultState(), saved);
      if (!Array.isArray(state.appointments)) state.appointments = [];
      if (!Array.isArray(state.offices) || state.offices.length === 0) state.offices = cloneDefaultState().offices;
      if (!Array.isArray(state.procedures) || state.procedures.length === 0) state.procedures = cloneDefaultState().procedures;
      return state;
    } catch (error) {
      return cloneDefaultState();
    }
  }

  function write(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function update(mutator) {
    const state = read();
    mutator(state);
    write(state);
    return state;
  }

  window.TurnosStorage = { read, write, update };
})();
