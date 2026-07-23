# Sistema de Gestion de Turnos Inteligente

Proyecto frontend para un sistema gubernamental de registro, reserva y seguimiento de turnos, con controles de accesibilidad WCAG.

## Requisitos

- Python 3 para ejecutar el frontend local.
- Navegador moderno: Chrome, Edge o Firefox.
- Node.js solo si se quiere ejecutar la API local, Postgres o el chatbot.

## Ejecutar el frontend

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente"
python -m http.server 5173 --bind 127.0.0.1
```

Abrir:

```text
http://127.0.0.1:5173/
```

Para detener el servidor, presionar `Ctrl + C` en PowerShell.

## Credenciales de prueba

- Usuario normal: `normal`
- Contrasena normal: `normal123`
- Usuario admin: `admin`
- Contrasena admin: `admin123`

El admin entra sin llenar datos de ciudadano. El usuario normal debe completar sus datos personales para que sus turnos queden asociados a su sesion.

## Atajos de teclado

- `Ctrl + R`: abrir seleccion y reserva.
- `Ctrl + S`: abrir confirmacion y seguimiento.
- `Ctrl + A`: abrir accesibilidad WCAG.

## Flujo funcional

1. Iniciar sesion como ciudadano o admin.
2. El ciudadano reserva un turno seleccionando tramite, sede, fecha y hora.
3. El sistema genera un token con formato `TUR-123456`.
4. En seguimiento se consulta el token.
5. El sistema muestra estado, ciudadano, tramite, sede, oficina, funcionario, fecha y hora.

La reserva valida que una sede no tenga dos turnos en la misma fecha y hora.

## Vistas disponibles

1. Inicio: introduccion del sistema, imagen principal y video institucional.
2. Registro / Login ciudadano: acceso de usuario normal o admin.
3. Seleccion y reserva: formulario para elegir tramite, sede, fecha y hora.
4. Confirmacion y seguimiento: consulta del turno mediante token.
5. Accesibilidad WCAG: criterios, ayudas y atajos.
6. Administracion: visible solo para admin; permite crear sedes y tramites.

## API y chatbot de IA

No pegues claves API dentro de `index.html` ni en archivos JS del frontend. Eso expone el secreto en el navegador y en GitHub.

Para usar el chatbot visible en la pagina se necesita:

1. Base de datos Postgres local:

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente"
docker compose up -d
```

2. Configurar la API key en el backend. Crear el archivo `server\.env` tomando como base `server\.env.example`:

```text
OPENAI_API_KEY=TU_CLAVE_NUEVA_AQUI
OPENAI_MODEL=gpt-5.5
DATABASE_URL=postgresql://turnos:turnos@localhost:5433/turnos
CHATBOT_DB_URL=postgresql://chatbot_ro:chatbot_ro@localhost:5433/turnos
PORT=3001
```

3. Ejecutar el backend Node:

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente\server"
npm install
npm start
```

4. Ejecutar el frontend en otra terminal:

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente"
python -m http.server 5173 --bind 127.0.0.1
```

El boton `IA` aparece en la parte inferior derecha. Muestra el modelo configurado y el estado de MCP.

Para probar solo el chatbot por consola:

```powershell
cd "C:\Users\D0G0X\OneDrive\Documentos\USABILIDAD\prototipos\sistema-turnos-inteligente\server"
npm run chat
```

Si la clave fue pegada en un chat o repositorio, revocala y genera una nueva antes de usarla.

## Arquitectura

- `src/views`: logica especifica de cada vista.
- `src/components`: componentes reutilizables de interfaz.
- `src/lib`: reglas compartidas, validaciones, almacenamiento y logica de turnos.
- `src/styles/main.css`: estilos globales, responsive y estados de accesibilidad.
- `src/app.js`: inicializa la aplicacion.
- `server`: API local y chatbot opcional.

La arquitectura separa vistas, componentes y librerias para evitar codigo espagueti y permitir que el proyecto escale.
