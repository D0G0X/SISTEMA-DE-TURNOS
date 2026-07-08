(function () {
  function normalize(value) {
    return value.trim().replace(/\s+/g, ' ');
  }

  function sameText(a, b) {
    return normalize(a).toLowerCase() === normalize(b).toLowerCase();
  }

  function getCatalog() {
    const state = TurnosStorage.read();
    return {
      offices: state.offices,
      procedures: state.procedures
    };
  }

  function addOffice({ name, room, agent }) {
    const cleanOffice = {
      name: normalize(name),
      room: normalize(room),
      agent: normalize(agent)
    };

    if (!cleanOffice.name || !cleanOffice.room || !cleanOffice.agent) {
      return { ok: false, message: 'Complete nombre de sede, oficina y funcionario.' };
    }

    const state = TurnosStorage.read();
    if (state.offices.some((office) => sameText(office.name, cleanOffice.name))) {
      return { ok: false, message: 'Ya existe una sede con ese nombre.' };
    }

    TurnosStorage.update((currentState) => {
      currentState.offices.push(cleanOffice);
    });

    window.dispatchEvent(new CustomEvent('catalog:updated'));
    return { ok: true, message: 'Sede agregada correctamente.' };
  }

  function addProcedure(name) {
    const cleanName = normalize(name);

    if (!cleanName) {
      return { ok: false, message: 'Ingrese el nombre del trámite.' };
    }

    const state = TurnosStorage.read();
    if (state.procedures.some((procedure) => sameText(procedure, cleanName))) {
      return { ok: false, message: 'Ya existe un trámite con ese nombre.' };
    }

    TurnosStorage.update((currentState) => {
      currentState.procedures.push(cleanName);
    });

    window.dispatchEvent(new CustomEvent('catalog:updated'));
    return { ok: true, message: 'Trámite agregado correctamente.' };
  }

  function findOffice(name) {
    return TurnosStorage.read().offices.find((office) => sameText(office.name, name));
  }

  function hasScheduleConflict({ sede, fecha, hora }) {
    return TurnosStorage.read().appointments.some((appointment) => {
      return sameText(appointment.sede, sede) && appointment.fecha === fecha && appointment.hora === hora;
    });
  }

  window.TurnosCatalog = {
    getCatalog,
    addOffice,
    addProcedure,
    findOffice,
    hasScheduleConflict
  };
})();
