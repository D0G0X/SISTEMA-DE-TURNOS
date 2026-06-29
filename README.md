# Sistema de Gestión de Turnos Inteligente

Proyecto frontend puro para un sistema gubernamental de registro, reserva y seguimiento de turnos, con controles de accesibilidad WCAG.

## Requisitos

- Tener instalado Python 3.
- Usar un navegador moderno como Chrome, Edge o Firefox.
- No requiere Node.js ni instalación de dependencias.

## Cómo ejecutar el proyecto

1. Abrir PowerShell.
2. Entrar a la carpeta del proyecto:

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente"
```

3. Iniciar un servidor local:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

4. Abrir en el navegador:

```text
http://127.0.0.1:5173/
```

Para detener el servidor, volver a PowerShell y presionar `Ctrl + C`.

## Estructura del proyecto

```text
sistema-turnos-inteligente/
  index.html
  README.md
  public/
    assets/
  src/
    app.js
    components/
      accessibility-controls.js
      dialog.js
      menu.js
      speech-reader.js
      translator.js
    lib/
      appointments.js
      storage.js
      validators.js
    styles/
      main.css
    views/
      accesibilidad.js
      registro.js
      reserva.js
      router.js
      seguimiento.js
```

## Vistas disponibles

1. Inicio: introducción del sistema, imagen principal y espacio reservado para video institucional.
2. Registro / Login ciudadano: formulario de identificación del ciudadano.
3. Selección y reserva: formulario para elegir trámite, sede, fecha y hora.
4. Confirmación y seguimiento: consulta del turno mediante token.
5. Accesibilidad WCAG: criterios y ayudas de accesibilidad.

## Flujo funcional

1. El ciudadano se registra o ingresa sus datos.
2. Reserva un turno seleccionando trámite, sede, fecha y hora.
3. El sistema genera un token con formato `TUR-123456`.
4. En seguimiento se consulta el token.
5. El sistema muestra estado, ciudadano, trámite, sede, oficina, funcionario, fecha y hora.

## Controles de accesibilidad

El botón desplegable `Accesibilidad` permite:

- Aumentar o disminuir tamaño de texto.
- Activar alto contraste.
- Activar espaciado accesible.
- Forzar reajuste en una columna.
- Mostrar señales textuales además del color.
- Verificar imágenes de texto.
- Reforzar contraste no textual.
- Mostrar tooltips.
- Reducir movimiento.
- Confirmar orientación libre.
- Confirmar ausencia de límite de tiempo.
- Ocultar contenido auxiliar.
- Abrir la vista WCAG.

El botón desplegable de sonido permite:

- Leer en voz alta la vista actual.
- Silenciar la lectura.
- Ajustar el volumen con un control deslizante.

## Paleta 70/20/10

La interfaz usa una regla visual 70/20/10:

- 70% color base: azul noche para fondo principal y presencia institucional.
- 20% color secundario: blanco para tarjetas, formularios y lectura.
- 10% color acento: azul vivo para acciones, botones y elementos interactivos.

El amarillo se reserva para el foco visible de teclado, porque cumple una función de accesibilidad.

## Arquitectura

- `src/views`: contiene la lógica específica de cada vista.
- `src/components`: contiene componentes reutilizables de interfaz.
- `src/lib`: contiene reglas compartidas, validaciones, almacenamiento y lógica de turnos.
- `src/styles/main.css`: contiene estilos globales, responsive y estados de accesibilidad.
- `src/app.js`: inicializa la aplicación.

La arquitectura evita mezclar toda la lógica en un solo archivo para facilitar que el proyecto pueda crecer.
