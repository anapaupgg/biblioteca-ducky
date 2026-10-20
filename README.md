# Biblioteca Ducky · Prototipo construido (Sprint 0)

Aplicación web de la Biblioteca de la Universidad Ducky, construida a partir del prototipo de Figma **"Prototipo AES"** con el patrón **MVC**. Este Sprint 0 incluye las tres funciones del Diagrama General de Funciones:

| Función | Pantallas |
|---|---|
| **Gestión de usuarios** | Iniciar sesión (con sus escenarios de error), restablecer contraseña, cambio de contraseña temporal, menú por rol, gestión de usuarios (registrar, consultar y modificar perfil, dar de baja, reactivar) y perfiles y permisos |
| **Gestión de libros** | Catálogo, registrar o modificar ficha bibliográfica, consultar libro, dar de alta en catálogo, etiquetar ejemplares, cambiar condición, baja de ejemplar o de libro, solicitudes a Tesorería y recepción de libros adquiridos |
| **Búsqueda de libros** | Búsqueda con uno o varios filtros, resultados, ficha bibliográfica pública, solicitud de préstamo y lista de libros (imprimible o PDF). Se adapta a la pantalla del celular |

## Stack

- **Backend:** Node.js + Express + PostgreSQL (`pg`).
- **Frontend:** HTML5 + CSS3 + JavaScript, sin frameworks, con su propio MVC (`js/models`, `js/views`, `js/controllers`, `js/utils`).
- **Diseño:** tokens del design system "Ducky" de Figma (colores, Manrope, espacios y radios) en `frontend/css/styles.css`.

## Estructura (MVC)

```
biblioteca-ducky/
├── server.js            # Punto de entrada: API /api/... y frontend estático
├── db.js                # Pool de PostgreSQL + transacción con usuario (bitácora)
├── routes/              # Rutas Express → controlador (y permiso requerido)
├── controllers/         # Reglas del caso de uso y respuestas HTTP
├── models/              # Consultas SQL (únicas que tocan la base de datos)
├── middleware/auth.js   # Sesión firmada + permiso por función del perfil
├── utils/               # Validadores, errores y directorio institucional simulado
├── database/            # Scripts SQL (esquema, reglas, datos) e instalador
└── frontend/
    ├── *.html           # Pantallas
    ├── css/styles.css   # Design system Ducky
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

### 4. Crear la base de datos
Crea una base vacía llamada `ducky` (en pgAdmin: clic derecho en Databases → Create → Database). Después:
```bash
npm run db:init
```
Este comando ejecuta `database/01_esquema.sql`, `02_reglas.sql` y `03_datos.sql`. Si lo vuelves a correr, la base se reinicia con los datos de prueba.

### 5. Levantar la aplicación
```bash
npm start
```
Abre **http://localhost:3000**.

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

## Notas del prototipo

- **Correo:** no hay servidor de correo. La contraseña temporal se muestra al administrador al registrar al usuario, y el enlace de recuperación aparece en pantalla después de solicitarlo.
- **Directorio institucional:** los datos personales al registrar un usuario se leen de un directorio simulado en `utils/institucion.js`. En producción, ese módulo llamaría al servicio de la universidad.
- **Reglas en la base de datos:** las reglas de negocio también las valida PostgreSQL con triggers. Por ejemplo: un perfil con usuarios no se puede eliminar, el motivo "Otro" exige comentario, el ISBN no puede repetirse y los pedidos no pueden rebasar el presupuesto.
