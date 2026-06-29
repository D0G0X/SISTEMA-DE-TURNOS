(function () {
  const KEY = 'turnosGobiernoState';

  const defaultState = {
    citizen: null,
    appointments: []
  };

  function cloneDefaultState() {
    return JSON.parse(JSON.stringify(defaultState));
  }

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || cloneDefaultState();
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
