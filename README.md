# Biblioteca Ducky

Aplicación web de la Biblioteca de la Universidad Ducky, hecha con el patrón **MVC**. Incluye:

| Función | Pantallas |
|---|---|
| **Gestión de usuarios** | Iniciar sesión (con sus escenarios de error), cambio de contraseña temporal, menú por rol, gestión de usuarios (registrar, consultar y modificar perfil, dar de baja, reactivar) y perfiles y permisos |
| **Gestión de libros** | Catálogo, registrar o modificar ficha bibliográfica, consultar libro, dar de alta en catálogo, etiquetar ejemplares, cambiar condición, baja de ejemplar o de libro, solicitudes a Tesorería y recepción de libros adquiridos |
| **Búsqueda de libros** | Búsqueda con uno o varios filtros, resultados, ficha bibliográfica pública, solicitud de préstamo y lista de libros (imprimible o PDF). Se adapta a la pantalla del celular |

## Stack

- **Backend:** Node.js + Express + PostgreSQL (`pg`).
- **Frontend:** HTML5 + CSS3 + JavaScript, sin frameworks, con su propio MVC (`js/models`, `js/views`, `js/controllers`, `js/utils`).

## Estructura (MVC)

```
biblioteca-ducky/
├── server.js            # Punto de entrada: API /api/... y frontend estático
├── db.js                # Pool de PostgreSQL + transacción con usuario (bitácora)
├── routes/              # Rutas Express → controlador (y permiso requerido)
├── controllers/         # Lógica de cada pantalla y respuestas HTTP
├── models/              # Consultas SQL (únicas que tocan la base de datos)
├── middleware/auth.js   # Sesión firmada + permiso por función del perfil
├── utils/               # Validadores, errores y directorio institucional simulado
├── database/            # Scripts SQL (esquema, reglas, datos) e instalador
└── frontend/
    ├── *.html           # Pantallas
    ├── css/styles.css   # Estilos
    ├── img/             # Logos Universidad Ducky y FlowBit
    └── js/
        ├── models/      # Llamadas a la API (nunca tocan el DOM)
        ├── views/       # Manejo del DOM (sin lógica de negocio)
        ├── controllers/ # Orquestan vista + modelo
        └── utils/       # api, session, ui, layout (menú por rol)
```

Flujo de una acción: **Vista (HTML) → Controller JS → Model JS → `fetch` → Ruta Express → Controller → Model → PostgreSQL**, y la respuesta regresa por el mismo camino.

## Cómo correrlo

### 1. Requisitos
- [Node.js](https://nodejs.org) 18 o superior.
- PostgreSQL 15 o superior (local con pgAdmin, o en la nube con Neon).

### 2. Instalar dependencias
```bash
cd biblioteca-ducky
npm install
```

### 3. Configurar la conexión
Copia `.env.example` como `.env` y escribe tu conexión:
```
DATABASE_URL=postgresql://postgres:TU_CONTRASENA@localhost:5432/ducky
DB_SSL=false
```
Si usas Neon, pega su cadena de conexión y pon `DB_SSL=true`.

Configura también `SESSION_SECRET` con una clave aleatoria propia de al menos 32 caracteres. Puedes generar una con:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Guárdala en `.env`, que está excluido de Git. No compartas credenciales en el repositorio.

### 4. Crear la base de datos
Crea una base vacía llamada `ducky` (en pgAdmin: clic derecho en Databases → Create → Database). Después:
```bash
npm run db:init
```
Este comando ejecuta `database/01_esquema.sql`, `02_reglas.sql` y `03_datos.sql`. Si lo vuelves a correr, la base se reinicia con los datos de prueba.

Antes de arrancar, comprueba la conexión sin modificar datos:
```bash
npm run db:check
```
El comando comprueba acceso a la tabla de usuarios y existencia de la función de login. Si ya hay datos, no ejecutes `db:init` para resolver un fallo de conexión: revisa primero las credenciales y el esquema.

### 5. Levantar la aplicación
```bash
npm start
```
El servidor valida `DATABASE_URL`, `SESSION_SECRET` y el acceso a la tabla de usuarios antes de abrir el puerto. Si falta configuración o PostgreSQL no responde, muestra un diagnóstico y termina.

Abre **http://localhost:3000**.

### Pruebas de regresión
```bash
npm test
```
Estas pruebas verifican configuración, tokens, permisos con contraseña temporal y manejo de sesión en el cliente usando datos simulados. No sustituyen una prueba de integración con PostgreSQL.

## Cuentas de prueba (contraseña `1234`)

| Clave | Perfil | Qué ve |
|---|---|---|
| 100001 | Administrador del sistema | Todo, incluido Perfiles y permisos |
| 100002 | Administrador de biblioteca | Gestión de usuarios, Solicitudes a Tesorería, Buscar y Lista de libros |
| 100003 | Administrador del catálogo | Gestionar libros, recepción de libros, Buscar y Lista de libros |
| 621234 | Lector (alumno) | Buscar libros y Lista de libros |
| 700123 | Lector (profesor) | Buscar libros y Lista de libros |

Claves de la institución simulada para registrar usuarios nuevos:
- **Se pueden registrar:** 645678, 651122, 702345 y 810077.
- **No vigente:** 600999.
- **Sin correo institucional:** 655000.

## Notas

- **Correo:** no hay servidor de correo. La contraseña temporal se muestra al administrador al registrar al usuario. La recuperación y el restablecimiento públicos están deshabilitados (HTTP 503): no generan tokens, revelan cuentas ni aceptan enlaces antiguos de demostración. El cambio de contraseña autenticado sigue disponible. Para habilitar recuperación se requiere entrega por correo verificado, revocar tokens antiguos y probar expiración, uso único y límites de solicitudes.
- **Directorio institucional:** los datos personales al registrar un usuario se leen de un directorio simulado en `utils/institucion.js`. En producción, ese módulo llamaría al servicio de la universidad.

## Baja y reactivación de usuarios

La baja conserva el usuario y su historial, elimina su credencial y revoca sesiones y enlaces de recuperación. La reactivación exige vigencia institucional y un perfil activo autorizado; genera una contraseña temporal nueva que debe cambiarse al entrar. En este prototipo, el administrador autorizado recibe la contraseña en un diálogo para entregarla por un medio privado; todavía no se envía por correo. Las operaciones se ejecutan en una transacción y registran la acción sin guardar la contraseña en bitácora. No requieren cambios de esquema ni `db:init`.

Prueba de integración opcional: `DUCKY_TEST_DB=1 node --test tests/usuarios-ciclo.test.js`. Usa la conexión de `.env`, crea un usuario temporal y revierte la transacción al finalizar; las secuencias pueden avanzar aunque los registros se reviertan.

## Compras concurrentes

La aplicación bloquea el presupuesto durante la creación del pedido y comprueba el estado del pedido dentro de la transacción al autorizar, rechazar o recibir. La recepción y los ejemplares se confirman juntos; un error revierte la operación. La numeración de ejemplares se protege bloqueando la ficha del libro. La consulta de un pedido filtra directamente por ID.

Prueba: `DUCKY_TEST_DB=1 node --test tests/pedidos-concurrencia.test.js`. Requiere permiso para crear un esquema temporal, utiliza la extensión pgcrypto ya instalada y elimina únicamente ese esquema al terminar. No ejecuta `db:init`, no cambia la configuración de la base ni modifica los datos de `biblioteca`.

Estas garantías corresponden a las operaciones de la aplicación y su transacción. Las escrituras SQL externas deben respetar el mismo protocolo de bloqueo; no se ha migrado el trigger de presupuesto para proteger escrituras externas.


### Recuperación por correo con Resend

Configurar solo en el servidor `RESEND_API_KEY` (permiso de envío),
`RECOVERY_FROM` (correo de un dominio verificado en Resend),
`APP_PUBLIC_URL` (origen HTTPS público, sin subruta) y `RECOVERY_SECRET`
(secreto aleatorio independiente de al menos 32 caracteres).
Generar este último con `openssl rand -hex 32` y guardarlo en `.env`, nunca
versionarlo. Reiniciar la app tras configurar. Sin estas variables la API
responde 503 y no genera tokens. Rotar RECOVERY_SECRET invalida enlaces previos.

La recuperación envía únicamente al correo activo registrado en BD. El enlace
vence en 30 minutos, es de un solo uso y cierra sesiones al restablecer.
Las cuentas de ejemplo necesitan un correo real autorizado para la prueba;
no cambiar destinatarios en producción para hacer demostraciones.
La aceptación de Resend no garantiza entrega: comprobar el panel del proveedor.
No se enviaron mensajes reales durante las pruebas automatizadas.
El límite IP se mantiene en memoria por instancia; para varias réplicas usar
un almacén compartido y configurar proxies confiables antes de desplegar.
Documentación: https://resend.com/docs/api-reference/emails/send-email


#### Prueba local sin alojamiento público

En desarrollo se permite `APP_PUBLIC_URL=http://localhost:3001` solo con
`NODE_ENV=development` y `RECOVERY_ALLOW_LOCALHOST=true`. También se admiten
127.0.0.1 y ::1; no direcciones de red ni dominios HTTP externos. Producción
sigue exigiendo HTTPS. La URL no admite subrutas, credenciales, consulta ni
fragmentos. El enlace local debe abrirse en la computadora que ejecuta la app.
Con el remitente de prueba de Resend, el destinatario debe ser el correo de
la cuenta de Resend. No usar estas variables locales en producción.


## Arquitectura y estándar de codificación

Consulta [ESTANDAR_MVC.md](ESTANDAR_MVC.md) para responsabilidades de modelos,
vistas, controladores y servicios, además de las convenciones del documento
proporcionado por el equipo. Las pruebas de `tests/mvc.test.js` comprueban la
separación de capas y que los scripts de cada página cargan juntos.
