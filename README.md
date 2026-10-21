# Biblioteca Ducky

Aplicación web de la Biblioteca de la Universidad Ducky, hecha con el patrón **MVC**. Incluye:

| Función | Pantallas |
|---|---|
| **Gestión de usuarios** | Iniciar sesión (con sus escenarios de error), restablecer contraseña, cambio de contraseña temporal, menú por rol, gestión de usuarios (registrar, consultar y modificar perfil, dar de baja, reactivar) y perfiles y permisos |
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

- **Correo:** no hay servidor de correo. La contraseña temporal se muestra al administrador al registrar al usuario, y el enlace de recuperación aparece en pantalla después de solicitarlo.
- **Directorio institucional:** los datos personales al registrar un usuario se leen de un directorio simulado en `utils/institucion.js`. En producción, ese módulo llamaría al servicio de la universidad.
