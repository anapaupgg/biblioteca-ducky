# MVC y estándar de Biblioteca Ducky

Referencia: «Estandar de codificacion Biblioteca Ducky.docx», proporcionado por
Diego. Aplicación revisada el 26 de octubre de 2026. Esta refactorización no
agrega funciones de negocio ni modifica tablas, datos o permisos.

## Responsabilidades

| Capa | Ubicación | Responsabilidad |
| --- | --- | --- |
| Rutas | `routes/` | Montar middleware y delegar la petición. |
| Controlador HTTP | `controllers/` | Validar datos, comprobar reglas y coordinar modelos/transacciones. |
| Modelo de datos | `models/` | Consultas SQL parametrizadas; reutilizar la conexión transaccional recibida. |
| Servicios del dominio | `services/` | Reglas reutilizables del chatbot y entrega de correo. |
| Modelo cliente | `frontend/js/models/` | Acceder a la API mediante `api`; sin DOM. |
| Vista | `frontend/*.html`, `frontend/js/views/` | Presentar datos, capturar formularios y enlazar callbacks. |
| Controlador cliente | `frontend/js/controllers/` | Coordinar vista y modelo, validar formularios y dirigir navegación. |
| Infraestructura | `db.js`, `middleware/`, `utils/`, `frontend/js/utils/` | Conexiones, autorización, sesión, HTTP y presentación compartida. |

Flujo: evento de vista → controlador cliente → modelo cliente → ruta →
controlador HTTP → modelo SQL. La respuesta recorre esas capas hasta la vista.
El controlador no ejecuta SQL ni modifica elementos DOM. Las vistas no llaman
al servidor. Los servicios no sustituyen los controles de autorización.

## Convenciones para cambios posteriores

- Encabezado con Program Assignment, Name, Date y Description.
- Listing Contents con las operaciones del archivo; actualizar al cambiar firmas.
- Reuse Instructions: entrada, retorno, límites, errores y condiciones de uso.
- Cuatro espacios por nivel, bloques separados y llaves alineadas.
- Identificadores propios descriptivos en minúsculas y snake_case; constantes
  de configuración en MAYÚSCULAS. Conservar nombres exigidos por las APIs
  externas (`getElementById`, `URLSearchParams`, `Request`, etc.).
- Los nombres de archivos existentes se conservan para mantener rutas; los
  objetos JavaScript propios usan minúsculas, por ejemplo `chatbot_view`.
- Las claves del contrato JSON, campos SQL y nombres de métodos de terceros
  se conservan. Cambiar un identificador local no debe cambiar el contrato.
- Documentar el propósito de estados, reglas y variables que no sea evidente.
  No agregar comentarios que solo repitan una asignación.
- Renderizar datos no confiables con `textContent` o el escape central de `ui`.
- SQL parametrizado en modelos; `client` recibido pertenece al llamador.
- Los literales devueltos se envuelven en paréntesis cuando sus llaves se
  separan de `return`, evitando el retorno implícito de JavaScript.

## Verificación

`npm test` comprueba comportamiento y separación MVC. `DUCKY_TEST_DB=1 npm test`
añade integración con PostgreSQL usando rollback o esquemas aislados. Revisar
navegación después de modificar nombres compartidos por páginas. No ejecutar
`db:init`: elimina datos. El formato se aplicó con herramientas temporales,
sin dependencias nuevas ni cambios al lockfile del proyecto.
