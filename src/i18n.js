(function () {
  // Traduccion ES<->EN de toda la pagina estatica. Sin dependencias ni red.
  // ponytail: cubre el DOM estatico (texto, aria-label, placeholder, title, alt,
  // inputs readonly). Los textos que el JS regenera en runtime (estado global,
  // errores de validacion, dialogos, y los aria-label que togglean los controles
  // de accesibilidad) vuelven a espanol al regenerarse. Techo conocido.
  var T = {
    // Encabezado y navegacion
    'Saltar al contenido principal': 'Skip to main content',
    'Gobierno Digital': 'Digital Government',
    'Sistema de Gestión de Turnos Inteligente': 'Smart Appointment Management System',
    'Escudo institucional': 'Institutional emblem',
    'Menú principal': 'Main menu',
    'Abrir menú': 'Open menu',
    'Menú': 'Menu',
    'Opciones del sistema': 'System options',
    'Vistas disponibles': 'Available views',
    'Cerrar menú': 'Close menu',
    'Inicio': 'Home',
    'Registro / Login ciudadano': 'Citizen Registration / Login',
    'Selección y reserva': 'Selection and booking',
    'Confirmación y seguimiento': 'Confirmation and tracking',
    'Accesibilidad WCAG': 'WCAG Accessibility',

    // Estado del sistema
    'Estado del sistema': 'System status',
    'Información': 'Information',
    'Información:': 'Information:',
    'Use el menú para cambiar de vista. No hay límite de tiempo para completar los formularios.': 'Use the menu to switch views. There is no time limit to complete the forms.',

    // Landing: hero
    'Inicio': 'Home',
    'Zona de inicio reservada para futura landing': 'Home area reserved for the landing page',
    'Atención ciudadana digital': 'Digital citizen services',
    'Su turno del Estado, sin filas y a su ritmo': 'Your government appointment, no lines, at your pace',
    'Registre al ciudadano, reserve un horario y siga su turno con un token. Todo claro, ordenado y accesible.': 'Register the citizen, book a time slot and track your appointment with a token. Clear, organized and accessible.',
    'Reservar un turno': 'Book an appointment',
    'Consultar seguimiento': 'Check tracking',
    'Beneficios del servicio': 'Service benefits',
    'Sin límite de tiempo': 'No time limit',
    'Sedes y horarios reales': 'Real offices and schedules',
    'Accesible WCAG 2.2': 'WCAG 2.2 accessible',
    'Ilustración de una ciudadana agendando un turno en un calendario junto a un reloj': 'Illustration of a citizen scheduling an appointment on a calendar next to a clock',

    // Landing: introduccion
    'Qué resuelve este sistema': 'What this system solves',
    'Gestione sus turnos de forma rápida y accesible': 'Manage your appointments quickly and accessibly',
    'Esta página ayuda a registrar al ciudadano, reservar un horario disponible y consultar el seguimiento del turno con un token. El sistema muestra la sede, oficina, funcionario asignado, fecha y hora para que la atención sea más clara y ordenada.': 'This page helps you register the citizen, book an available time slot and check the appointment status with a token. The system shows the office, room, assigned officer, date and time to make service clearer and more organized.',
    'Ventajas del servicio': 'Service advantages',
    'Atención más ágil': 'Faster service',
    'Reserve un horario y evite esperas innecesarias.': 'Book a time slot and avoid unnecessary waits.',
    'Token de seguimiento': 'Tracking token',
    'Cada reserva genera un código para consultar su estado.': 'Each booking generates a code to check its status.',
    'Sedes y funcionarios': 'Offices and officers',
    'Vea oficina, agente asignado, fecha y hora del trámite.': 'See the room, assigned agent, date and time of the procedure.',
    'Diseñado para todos': 'Designed for everyone',
    'Contraste, teclado, lectura por voz y ajustes WCAG.': 'Contrast, keyboard, voice reading and WCAG settings.',

    // Landing: como funciona
    'Cómo funciona': 'How it works',
    'Tres pasos para agendar y seguir su turno': 'Three steps to book and track your appointment',
    'Identifíquese': 'Identify yourself',
    'Ingrese los datos del ciudadano en el registro para habilitar la reserva.': "Enter the citizen's details in registration to enable booking.",
    'Ir a registro': 'Go to registration',
    'Reserve el turno': 'Book the appointment',
    'Elija trámite, sede, fecha y hora. Al confirmar se genera su token.': 'Choose procedure, office, date and time. On confirmation your token is generated.',
    'Ir a reserva': 'Go to booking',
    'Siga su turno': 'Track your appointment',
    'Consulte el token para ver estado, oficina, funcionario, fecha y hora.': 'Check the token to see status, room, officer, date and time.',
    'Ir a seguimiento': 'Go to tracking',

    // Landing: video
    'Espacio reservado para video institucional accesible': 'Space reserved for accessible institutional video',
    "Su navegador no puede reproducir el video, o todavía no fue incorporado.": "Your browser can't play the video, or it hasn't been added yet.",
    'Consulte la ayuda en texto y en otros idiomas': 'See the help in text and other languages',
    'Video de ayuda · próximamente': 'Help video · coming soon',
    'Video institucional de ayuda para gestionar turnos. Incluirá subtítulos sincronizados, transcripción textual y audiodescripción.': 'Institutional help video for managing appointments. It will include synchronized captions, a text transcript and audio description.',
    'Video de ayuda institucional': 'Institutional help video',
    'Cuando se incorpore el video se reproducirá con controles y sin inicio automático, e incluirá subtítulos sincronizados, transcripción textual y audiodescripción.': 'When the video is added it will play with controls and without autoplay, and will include synchronized captions, a text transcript and audio description.',
    'Ver transcripción del video': 'View video transcript',
    'Para gestionar su turno: primero identifíquese en el registro con sus datos. Luego reserve el turno eligiendo trámite, sede, fecha y hora; al confirmar, el sistema genera un token con formato TUR-123456. Finalmente, consulte el seguimiento con ese token para ver el estado, la sede, la oficina, el funcionario asignado, la fecha y la hora.': 'To manage your appointment: first identify yourself in registration with your details. Then book the appointment by choosing procedure, office, date and time; on confirmation, the system generates a token in the format TUR-123456. Finally, check the tracking with that token to see the status, office, room, assigned officer, date and time.',

    // Landing: CTA
    '¿Listo para agendar su atención?': 'Ready to book your appointment?',
    'Reserve su turno en minutos y consúltelo cuando quiera con su token.': 'Book your appointment in minutes and check it anytime with your token.',

    // Progreso (mini-steps) y comunes
    'Progreso del trámite': 'Procedure progress',
    'Registro': 'Registration',
    'Reserva': 'Booking',
    'Seguimiento': 'Tracking',

    // Vista registro
    'Paso 1 de 3': 'Step 1 of 3',
    'Identifique al ciudadano para habilitar la reserva de turnos.': 'Identify the citizen to enable appointment booking.',
    'Datos del ciudadano': 'Citizen data',
    'Nombre completo': 'Full name',
    'Ayuda sobre nombre completo': 'Help about full name',
    'Escriba nombres y apellidos como constan en su documento.': 'Write your first and last names as they appear on your ID.',
    'Ejemplo: María Fernanda Pérez López.': 'Example: María Fernanda Pérez López.',
    'Cédula': 'ID number',
    'Ayuda sobre cédula': 'Help about ID number',
    'Ingrese 10 dígitos sin guiones ni espacios.': 'Enter 10 digits with no dashes or spaces.',
    'Formato: 10 números.': 'Format: 10 digits.',
    'Correo electrónico': 'Email',
    'Se usará para enviar la confirmación del turno.': 'It will be used to send the appointment confirmation.',
    'Teléfono': 'Phone',
    'Entre 7 y 10 números.': 'Between 7 and 10 digits.',
    'Ingresar ciudadano': 'Submit citizen',
    'Limpiar': 'Clear',

    // Vista reserva
    'Paso 2 de 3': 'Step 2 of 3',
    'Selección y reserva de turno': 'Appointment selection and booking',
    'Complete los datos del trámite. Al confirmar se generará un token de seguimiento.': 'Fill in the procedure details. On confirmation a tracking token will be generated.',
    'Datos de la reserva': 'Booking details',
    'Tipo de trámite': 'Procedure type',
    'Seleccione una opción': 'Select an option',
    'Cedulación': 'ID issuance',
    'Licencia de funcionamiento': 'Operating license',
    'Certificado municipal': 'Municipal certificate',
    'Pago de obligaciones': 'Payment of obligations',
    'Sede': 'Office',
    'Ayuda sobre sede': 'Help about office',
    'Seleccione la oficina más cercana o con disponibilidad.': 'Select the nearest office or one with availability.',
    'Seleccione una sede': 'Select an office',
    'Centro de Atención Norte': 'North Service Center',
    'Centro de Atención Centro': 'Central Service Center',
    'Centro de Atención Sur': 'South Service Center',
    'Fecha': 'Date',
    'Seleccione una fecha igual o posterior al día actual.': 'Select a date on or after today.',
    'Hora': 'Time',
    'Seleccione una hora': 'Select a time',
    'Reservar turno': 'Book appointment',

    // Vista seguimiento
    'Paso 3 de 3': 'Step 3 of 3',
    'Confirmación y seguimiento del turno': 'Appointment confirmation and tracking',
    'Ingrese el token generado en la reserva para consultar la información del turno.': 'Enter the token generated at booking to look up the appointment information.',
    'Consulta de seguimiento': 'Tracking lookup',
    'Token de turno': 'Appointment token',
    'Ayuda sobre token de turno': 'Help about appointment token',
    'Use el token recibido al reservar. Ejemplo: TUR-123456.': 'Use the token you received when booking. Example: TUR-123456.',
    'Formato: TUR- seguido de 6 números.': 'Format: TUR- followed by 6 digits.',
    'Estado del trámite': 'Procedure status',
    'Pendiente de consulta': 'Pending lookup',
    'Este campo se actualiza después de consultar el token.': 'This field updates after you look up the token.',
    'Consultar seguimiento': 'Check tracking',
    'Información del turno agendado': 'Scheduled appointment information',
    'Token': 'Token',
    'Ciudadano': 'Citizen',
    'Trámite': 'Procedure',
    'Oficina': 'Room',
    'Funcionario asignado': 'Assigned officer',

    // Vista accesibilidad
    'Módulo accesible': 'Accessible module',
    'Accesibilidad WCAG 2.2': 'WCAG 2.2 Accessibility',
    'Esta vista documenta cómo el formulario cubre alternativas textuales, multimedia, color, contraste, texto, tiempo, movimiento y orientación.': 'This view documents how the form covers text and multimedia alternatives, color, contrast, text, time, motion and orientation.',
    'Traductor de ayuda': 'Help translator',
    'Seleccione un idioma para mostrar una alternativa textual equivalente de la ayuda del sistema.': 'Select a language to show an equivalent text alternative of the system help.',
    'Idioma': 'Language',
    'Español': 'Spanish',
    'Kichwa básico': 'Basic Kichwa',
    'Alternativas textuales y multimedia': 'Text and multimedia alternatives',
    'Color, contraste y texto': 'Color, contrast and text',
    'Tiempo, movimiento y orientación': 'Time, motion and orientation',
    '1.1.1 Contenido no textual': '1.1.1 Non-text content',
    'Los iconos del menú, información, ayuda y marca institucional usan texto visible o `aria-label` para lectores de pantalla.': 'The menu, information, help and brand icons use visible text or `aria-label` for screen readers.',
    '1.2.1 Transcripción audio y video': '1.2.1 Audio and video transcript',
    'La ayuda multimedia futura tiene una transcripción textual equivalente. No se usa audio sin alternativa.': 'Future multimedia help has an equivalent text transcript. No audio is used without an alternative.',
    '1.2.2 Subtítulos grabados': '1.2.2 Prerecorded captions',
    'Si se agrega video grabado, esta arquitectura reserva el texto de subtítulos en esta vista de accesibilidad.': 'If prerecorded video is added, this architecture reserves the caption text in this accessibility view.',
    '1.2.3 Audiodescripción': '1.2.3 Audio description',
    'La descripción textual explica los pasos visuales: registro, reserva, token y seguimiento.': 'The text description explains the visual steps: registration, booking, token and tracking.',
    '1.2.4 Subtítulos en directo': '1.2.4 Live captions',
    'No hay transmisión en directo. Si se incorpora, se debe conectar una fuente de subtítulos en vivo.': 'There is no live streaming. If added, a live caption source must be connected.',
    '1.2.5 Audiodescripción grabada': '1.2.5 Prerecorded audio description',
    'La alternativa textual documenta el contenido visual equivalente para material grabado futuro.': 'The text alternative documents the equivalent visual content for future recorded material.',
    '1.4.1 Uso del color': '1.4.1 Use of color',
    'Los errores no dependen solo del color: muestran texto explícito, borde, estado `aria-invalid` y región viva.': "Errors don't rely on color alone: they show explicit text, a border, an `aria-invalid` state and a live region.",
    '1.4.3 Contraste mínimo 4,5:1': '1.4.3 Minimum contrast 4.5:1',
    'La paleta principal usa azul oscuro `#0A1F44` sobre blanco para asegurar contraste alto.': 'The main palette uses dark blue `#0A1F44` on white to ensure high contrast.',
    '1.4.4 Cambio tamaño texto 200%': '1.4.4 Resize text 200%',
    'La interfaz usa unidades relativas y contenedores flexibles para soportar ampliación de texto.': 'The interface uses relative units and flexible containers to support text enlargement.',
    '1.4.5 Imágenes de texto': '1.4.5 Images of text',
    'No se usan imágenes para representar texto funcional. Todo el contenido relevante es HTML real.': 'Images are not used to represent functional text. All relevant content is real HTML.',
    '1.4.10 Reajuste de elementos': '1.4.10 Reflow',
    'Las vistas se reacomodan en una sola columna en pantallas pequeñas.': 'Views reflow into a single column on small screens.',
    '1.4.11 Contraste no textual': '1.4.11 Non-text contrast',
    'Bordes, controles, foco visible y estados usan contraste suficiente contra el fondo.': 'Borders, controls, visible focus and states use sufficient contrast against the background.',
    '1.4.12 Espaciado de texto': '1.4.12 Text spacing',
    'La lectura conserva line-height amplio y no fija alturas rígidas que rompan el espaciado.': 'Reading keeps a generous line-height and sets no rigid heights that break spacing.',
    '1.4.13 Cursor o foco': '1.4.13 Content on hover or focus',
    'Los tooltips se muestran al pasar el cursor y también cuando el botón recibe foco por teclado.': 'Tooltips appear on hover and also when the button receives keyboard focus.',
    '1.3.4 Orientación de pantalla': '1.3.4 Screen orientation',
    'El diseño no fuerza orientación vertical u horizontal; responde a ambas.': "The design doesn't force portrait or landscape orientation; it responds to both.",
    '1.4.2 Control del audio': '1.4.2 Audio control',
    'No existe audio automático. Si se agrega audio, deberá incluir controles para pausar o detener.': 'There is no automatic audio. If audio is added, it must include controls to pause or stop.',
    '2.2.1 Tiempo ajustable': '2.2.1 Timing adjustable',
    'No hay límite de tiempo para completar registro, reserva o seguimiento.': 'There is no time limit to complete registration, booking or tracking.',
    '2.2.2 Poner en pausa, detener, ocultar': '2.2.2 Pause, stop, hide',
    'No hay carruseles ni contenido automático. Los diálogos se cierran manualmente.': 'There are no carousels or automatic content. Dialogs are closed manually.',
    '2.3.1 Tres destellos o menos': '2.3.1 Three flashes or below',
    'No se usan animaciones con destellos ni parpadeos.': 'No flashing or blinking animations are used.',

    // Ayuda accesible
    'Ayuda accesible': 'Accessible help',
    'Ayuda multimedia accesible': 'Accessible multimedia help',
    'Alternativa textual al video de ayuda: registre o ingrese al ciudadano, reserve un turno, copie el token generado y consulte el seguimiento con los datos de oficina, funcionario, fecha y hora asignada.': 'Text alternative to the help video: register or sign in the citizen, book an appointment, copy the generated token and check the tracking with the assigned room, officer, date and time.',

    // Pie de pagina
    'Navegación del sistema': 'System navigation',
    'Sistema de Gestión de Turnos Inteligente para la atención ciudadana.': 'Smart Appointment Management System for citizen services.',
    'Navegación': 'Navigation',
    'Registro / Login': 'Registration / Login',
    'Accesibilidad': 'Accessibility',
    'Contraste alto, navegación por teclado, lectura por voz y ajustes de texto disponibles en todas las vistas.': 'High contrast, keyboard navigation, voice reading and text adjustments available in all views.',
    'Sin límite de tiempo para completar los formularios.': 'No time limit to complete the forms.',
    'Atención ciudadana digital. Servicio informativo de gestión de turnos.': 'Digital citizen services. Informational appointment management service.',
    'Construido siguiendo criterios de accesibilidad WCAG 2.2.': 'Built following WCAG 2.2 accessibility criteria.',

    // Barra de accesibilidad
    'Opciones rápidas de accesibilidad': 'Quick accessibility options',
    'Disminuir tamaño del texto': 'Decrease text size',
    'Aumentar tamaño del texto': 'Increase text size',
    'Contraste': 'Contrast',
    'Activar alto contraste': 'Enable high contrast',
    'Espaciado': 'Spacing',
    'Activar espaciado de texto accesible': 'Enable accessible text spacing',
    'Reajuste': 'Reflow',
    'Activar reajuste de elementos en una columna': 'Enable single-column reflow',
    'No solo color': 'Not only color',
    'Activar señales textuales además del color': 'Enable text cues in addition to color',
    'Img texto': 'Text img',
    'Comprobar imágenes de texto': 'Check images of text',
    'Bordes': 'Borders',
    'Reforzar contraste no textual': 'Strengthen non-text contrast',
    'Mostrar contenido al cursor o foco': 'Show content on hover or focus',
    'Movimiento': 'Motion',
    'Reducir movimiento de la interfaz': 'Reduce interface motion',
    'Detener audio o lectura en voz alta': 'Stop audio or voice reading',
    'Orientación': 'Orientation',
    'Confirmar orientación libre de pantalla': 'Confirm free screen orientation',
    'Sin límite': 'No limit',
    'Confirmar que no existe límite de tiempo': 'Confirm there is no time limit',
    'Ocultar': 'Hide',
    'Ocultar o mostrar contenido auxiliar': 'Hide or show auxiliary content',
    'Abrir criterios WCAG': 'Open WCAG criteria',

    // Panel de sonido
    'Control de sonido': 'Sound control',
    'Abrir controles de sonido': 'Open sound controls',
    'Leer en voz alta la vista actual': 'Read the current view aloud',
    'Leer': 'Read',
    'Silenciar lectura en voz alta': 'Mute voice reading',
    'Volumen': 'Volume',
    'Volumen de lectura en voz alta': 'Voice reading volume',

    // Dialogo
    'Confirmación': 'Confirmation',
    'Aceptar': 'Accept',

    // Login, video y administración (merge d2220fc)
    'Administración': 'Administration',
    'Vista 1': 'View 1',
    'Vista 2': 'View 2',
    'Vista 3': 'View 3',
    'Vista admin': 'Admin view',
    'Video de ayuda: Dominando el Sistema de Turnos y su Accesibilidad': 'Help video: Mastering the Appointment System and its Accessibility',
    'Video explicativo sobre el uso del sistema de turnos y sus opciones de accesibilidad. Si el reproductor no carga, abra el video en una pestaña nueva.': 'Explanatory video about using the appointment system and its accessibility options. If the player does not load, open the video in a new tab.',
    'Abrir video en HeyGen': 'Open video on HeyGen',
    'Acceso al sistema': 'System access',
    'Usuarios de prueba:': 'Test users:',
    'Usuario': 'Username',
    'Use normal para ciudadano o admin para administración.': 'Use normal for citizen or admin for administration.',
    'Contraseña': 'Password',
    'Credenciales: normal123 o admin123.': 'Credentials: normal123 or admin123.',
    'Administración de sedes y trámites': 'Office and procedure administration',
    'Cree nuevas sedes y trámites. La reserva usa este catálogo y evita horarios ya ocupados.': 'Create new offices and procedures. Booking uses this catalog and avoids already-taken time slots.',
    'Nueva sede': 'New office',
    'Nombre de sede': 'Office name',
    'Oficina o ventanilla': 'Office or window',
    'Agregar sede': 'Add office',
    'Nuevo trámite': 'New procedure',
    'Nombre del trámite': 'Procedure name',
    'Agregar trámite': 'Add procedure',
    'Catálogo actual': 'Current catalog',
    'Sedes': 'Offices',
    'Trámites': 'Procedures'
  };

  var REVERSE = {};
  Object.keys(T).forEach(function (k) { REVERSE[T[k]] = k; });

  var ATTRS = ['aria-label', 'placeholder', 'title', 'alt'];
  var current = 'es';

  function apply(root, dict) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var tag = node.parentNode && node.parentNode.nodeName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    var nodes = [], n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      var key = node.nodeValue.trim();
      if (dict[key]) node.nodeValue = node.nodeValue.replace(key, dict[key]);
    });
    root.querySelectorAll('*').forEach(function (el) {
      ATTRS.forEach(function (a) {
        if (el.hasAttribute(a)) {
          var v = el.getAttribute(a).trim();
          if (dict[v]) el.setAttribute(a, dict[v]);
        }
      });
    });
    root.querySelectorAll('input[readonly]').forEach(function (el) {
      if (dict[el.value]) el.value = dict[el.value];
    });
  }

  function updateToggle(btn) {
    if (current === 'es') {
      btn.textContent = 'EN';
      btn.setAttribute('aria-label', 'Translate page to English');
      btn.setAttribute('title', 'English');
    } else {
      btn.textContent = 'ES';
      btn.setAttribute('aria-label', 'Traducir la página al español');
      btn.setAttribute('title', 'Español');
    }
  }

  function setLang(lang, btn) {
    if (lang === current) return;
    apply(document.body, lang === 'en' ? T : REVERSE);
    current = lang;
    document.documentElement.lang = lang;
    try { localStorage.setItem('turnos_lang', lang); } catch (e) { /* sin storage: no persiste */ }
    updateToggle(btn);
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('langToggle');
    if (!btn) return;
    updateToggle(btn);
    btn.addEventListener('click', function () {
      setLang(current === 'es' ? 'en' : 'es', btn);
    });
    var saved = null;
    try { saved = localStorage.getItem('turnos_lang'); } catch (e) { /* ignore */ }
    if (saved === 'en') setLang('en', btn);
  });
})();
