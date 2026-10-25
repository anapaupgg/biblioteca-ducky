# Revisión funcional y de datos — 21 de octubre de 2026

Alcance: aplicación funcional y PostgreSQL. Figma y documentos se usan como referencia; presentación, videos, cartas y otros entregables académicos quedan fuera por indicación de Diego. Esta es una revisión de brechas, no una certificación de cumplimiento ni una calificación.

## Actualización de recuperación

La exposición pública del token se mitigó deshabilitando emisión y canje de enlaces (503), incluidos enlaces demo previos. No es recuperación por correo terminada: falta configurar entrega verificada y revocar tokens históricos antes de reabrirla. Cambio autenticado conservado.

## Actualización de bajas y reactivaciones

Corregido el ciclo en la aplicación: baja elimina credenciales y revoca sesiones/tokens; reactivación genera credencial temporal, valida jerarquía y tipo incluso al conservar perfil, conserva historial y registra la acción. Probado contra PostgreSQL con rollback. No se migraron datos históricos ni se modificó el esquema. La entrega de credenciales es manual al administrador autorizado; correo y fuente institucional real siguen pendientes. Las observaciones originales de la tabla siguiente describen la revisión inicial.

## Actualización de compras concurrentes

Corregida concurrencia en los flujos de la aplicación: presupuesto bloqueado antes de crear líneas; estado de pedido bloqueado y validado dentro de la transacción; recepción y ejemplares atómicos; numeración de ejemplares serializada por libro. Consulta por ID directa. Pruebas concurrentes en esquema temporal verifican saldo, recepción única y rollback. No hay migración de esquema; SQL externo debe seguir el protocolo de bloqueo de la aplicación. Las observaciones originales de compras de la revisión inicial quedan sustituidas por esta actualización para dichos flujos.

## Actualización del listado — 22 de octubre de 2026

ISBN incorporado en consulta y tabla. Impresión/PDF sigue usando el diálogo del navegador, con estilos para ajustar columnas y repetir cabeceras. Un fallo de actualización limpia datos anteriores, mantiene impresión deshabilitada y no anuncia éxito. Prueba de error y recuperación aprobada. No se ha validado visualmente el PDF resultante ni la navegación autenticada; no se afirma cerrado HUGL04 completo.

## Base y verificación

- `git fetch origin` completado; `main` y `origin/main` coinciden en `78d6967`, sin commits nuevos. Conservados los cambios previos en `package-lock.json` y `CAMBIOS_Y_PLAN.txt`.
- Nueve pruebas automatizadas aprobadas. Cubren configuración, autenticación y montaje de navegación; no sustituyen pruebas completas de negocio.
- `npm run db:check`: conexión correcta, tabla usuarios y función de login disponibles. HTTP 200 en `http://localhost:3001/login.html`.
- PostgreSQL local en 5433. Sin ejecutar `db:init`, migraciones ni escrituras de negocio.
- Lectura de los tres PDF y de la rúbrica. Inspección de estructura de Figma y captura del login; no se recorrieron todas las interacciones ni se hizo comparación visual completa con la app.

## Historias seleccionadas: evidencia y faltantes

| Historia | Evidencia en código | Brecha o comprobación necesaria |
|---|---|---|
| HUGU01 Alta | Validación de clave, perfil, jerarquía, tipo y alta transaccional en `controllers/usuarioController.js` | `utils/institucion.js` es un directorio simulado. `models/usuarioModel.js` almacena nombre, correo y tipo, aunque la historia exige consultarlos sin copiarlos. Devuelve contraseña temporal al administrador; falta correo real y tratamiento de fallo de entrega. |
| HUGU02 Baja | Valida adeudos, crea baja y cierra sesiones | `models/usuarioModel.js` y `fn_bajas_usuario` conservan credenciales; la historia pide eliminarlas. Falta notificación por correo y validar los escenarios de error y cancelación. |
| HUGU03 Cambio/reactivación | Cambio de perfil y reactivación con consulta institucional simulada | La reactivación no genera nuevas credenciales ni las envía. Revisar confirmación al retirar permisos y bitácora de valores anteriores/nuevos mediante prueba de integración. |
| HUGU04 Perfiles | CRUD, permisos de servidor y menú por funciones | El middleware devuelve 403 sin registrar el intento en bitácora. El modelo cuenta únicamente usuarios activos para bloquear baja; la historia dice usuarios asignados. Implementa baja lógica frente a eliminación física descrita: decidir criterio y conservar historial. |
| HUGU05 Login | Hash de contraseña, bloqueo, sesión, permisos y cambio de contraseña temporal | No consulta vigencia institucional al autenticar. Faltan notificaciones de bloqueo/nuevo dispositivo. Revisar todos los escenarios contra BD; la expiración se calcula desde inicio de sesión, aunque el código la denomina inactividad. |
| HUBL01 Búsqueda | Filtros, ficha, ejemplares, ubicación, enlace digital y solicitud | Implementación presente; falta prueba de aceptación de disponibles, todos prestados, retirados, errores y persistencia de filtros. Solicitar no equivale a autorizar/entregar un préstamo. |
| HUGL01 Ficha | Controladores, modelos y rutas de catálogo | Validar alta, duplicado con ficha existente, campos obligatorios y etiquetado con datos reales controlados. |
| HUGL02 Catálogo | Alta, edición, retiro y gestión de ejemplares | Validar diferencia título/ejemplar, conservación histórica y efecto inmediato en búsqueda. Aclarar equivalencia de “consulta externa” del documento con los usos del modelo. |
| HUGL03 Compras | Pedido y líneas transaccionales, consulta, autorización y recepción | “Enviada a Tesorería” significa registro local; no se encontró transporte a un sistema externo. Las rutas de compras reutilizan permisos `Préstamos`/`Gestionar perfiles`: revisar separación de funciones. Riesgos de concurrencia pendientes. |
| HUGL04 Listado | Tabla y `window.print()` con estilos de impresión | Falta ISBN en `ListaLibrosView.js`. PDF depende de Guardar PDF del navegador, no hay exportación independiente. Verificar igualdad de filas/datos y legibilidad de salida. |

## Prioridades para aplicación y BD

1. **P0 — Recuperación de contraseña:** `controllers/authController.js` devuelve `enlace_demo` y `correo_demo` desde una ruta pública. Quien conoce una clave puede obtener un token de restablecimiento sin controlar el correo. Corregir antes de compartir la app; no basta cambiar el texto del diálogo. Comportamiento confirmado por lectura de código, sin ejecutar un cambio de contraseña.
2. **P1 — Ciclo de credenciales e institución:** alinear alta, baja, reactivación y vigencia con las historias. Definir una fuente institucional real o una simulación separada explícita y verificable. Cualquier cambio del esquema debe hacerse mediante migración conservadora, nunca con reinicialización.
3. **P1 — Integridad con concurrencia:** `fn_detalle_pedido_presupuesto` suma compromisos sin bloquear el presupuesto compartido; dos pedidos simultáneos pueden superar el monto. En recepción, `controllers/pedidoController.js` comprueba estado antes de la transacción: revisar doble recepción y creación duplicada de ejemplares. Son riesgos identificados por inspección; faltan pruebas concurrentes aisladas.
4. **P1 — Permisos y auditoría:** registrar rechazos relevantes, separar compras de préstamos y comprobar acceso directo por API, además de botones visibles. Revisar cambios de privilegios y usuarios inactivos asignados a perfiles.
5. **P2 — Listado y navegación:** añadir ISBN, definir exportación PDF y comprobar visualmente escritorio/móvil, estados vacíos, formularios y navegación sin pantallas en blanco.
6. **P2 — Desempeño y respaldo:** faltan evidencias de respuesta menor a 3 segundos y 55–100 usuarios concurrentes del backlog. `models/pedidoModel.js` obtiene todos los pedidos para buscar uno. Preparar respaldo y restauración de prueba en base aislada, sin tocar la base de trabajo.

## Alcance posterior del backlog

Sprint 1 añade 2FA: no se encontró un segundo factor en el flujo actual. Sprint 3 añade autorización de préstamos, recibos, renovación, devolución, multas, espera y recordatorios. Hay soporte SQL para varios procesos, pero no rutas ni pantallas completas para operarlos. Sprint 4 añade app móvil/chatbot e integración: el frontend responsivo no demuestra por sí solo ese alcance. No tratar estos módulos como terminados por la sola existencia de tablas.

La regla de renovación del documento base exige vencimiento anterior a la fecha actual; la función SQL permite renovar préstamos activos sin esa condición. Confirmar regla deseada antes de cambiarla: no corregir silenciosamente una ambigüedad documental.

## Figma como referencia

[Prototipo AES](https://www.figma.com/design/sZgmHvy2YReNXevKvL4fUI/Prototipo-AES?node-id=0-1) contiene páginas de prototipo, Design System y diagrama. La estructura revisada incluye acceso, usuarios, perfiles, catálogo, compras, consulta y pantallas móviles. El login muestra selección de perfil y cuentas de ejemplo distintas de las claves locales; la app debe obtener permisos desde el servidor, no aceptar privilegios elegidos en pantalla. Se observaron claves de libro `B000128` en Figma frente a `L` y seis dígitos en el esquema. Unificar datos de demostración y mensajes. La existencia de frames no acredita navegación funcional ni cumplimiento visual.

## Fuentes de aceptación

- Requerimientos Biblioteca, PDF de 3 páginas: operación y reglas de préstamo.
- Sprint Backlog, PDF de 1 página: sprints 1–4 y restricciones no funcionales.
- Historias del sprint seleccionado, PDF de 12 páginas: HUGU01–05, HUBL01 y HUGL01–04, incluyendo columna corregida. Hay diferencias entre texto corregido y criterios (por ejemplo, avisos en pantalla frente a correo); resolverlas al fijar aceptación, sin borrar requisitos por suposición.
- Rúbrica pegada: aplicación = MVC 2, funcionalidad 4, experiencia/desempeño 2, seguridad/datos 2. No se asigna puntuación sin pruebas completas.

Siguiente ejecución propuesta: corregir recuperación insegura; cerrar credenciales/permisos y listado; probar catálogo/compras en entorno aislado; validar navegación con Figma. Después abordar módulos del siguiente sprint según el alcance acordado.


## Verificación visual del 22 de octubre de 2026

Revisión autorizada en puerto temporal 3002 con cuenta de prueba 100001:
acceso/cierre de sesión, navegación principal, listado con cinco ISBN y
búsqueda por título comprobados. Usuarios y perfiles mostraron sus listas;
catálogo y compras se revisaron solo en su carga inicial. En 390x844 se
comprobó apertura del menú y búsqueda sin desborde global. Se corrigieron
el icono del menú y el logo del acceso, además del mensaje ante respuestas
HTML inesperadas. Suite: 15 aprobadas y 2 integraciones opcionales omitidas.

La revisión no acredita todavía todos los roles, formularios ni estados.
La vista previa de impresión no fue accesible en el navegador integrado:
PDF sigue pendiente. Se cerró la sesión y se detuvo el servidor temporal.


## PDF confirmado en Brave (22 de octubre de 2026)

Se completó Guardar como PDF desde Brave con los cinco títulos actuales:
una página vertical, ocho columnas e ISBN completos. Se corrigió el reparto
de columnas de impresión para evitar cortes de palabras e identificadores.
El archivo se guardó y se comprobó su firma PDF. Esto cierra la validación
del catálogo actual; la paginación con un catálogo extenso sigue pendiente.


## Permisos y revisión del chatbot — 24 de octubre de 2026

Se probó el cableado HTTP de 35 rutas de usuarios, perfiles, libros, búsqueda
y pedidos con seis conjuntos de permisos (210 combinaciones), además de
peticiones anónimas y credenciales temporales. Se usaron routers y middleware
reales con sesiones y controladores simulados: acredita la protección antes
del controlador, no sustituye pruebas completas de cada operación de negocio.
El mismo token dejó de pasar cuando la sesión simulada perdió permisos o cerró.

Corregido: `Gestionar perfiles` por sí solo ya no autoriza crear pedidos ni
cambiar estados. Esas acciones exigen `Préstamos`, consistente con la entrada
actual del módulo; recepción exige `Gestionar libros`. Los perfiles iniciales
conservan sus capacidades. Sigue pendiente separar compras en un permiso propio
mediante migración conservadora y definir quién autoriza por Tesorería.

Chatbot: consulta real de `v_chatbot` devuelve tres preguntas activas (duración,
multas, renovaciones), con fuentes. Existen `contenidos_chatbot`,
`preguntas_chatbot`, `pregunta_contenido`, la vista y CSS. No existen modelo,
controlador, rutas ni panel frontend conectados. El permiso Chatbot asignado
al lector no implica que exista la función operativa.

Próximo alcance concreto: asistente de preguntas frecuentes basado en BD,
sin proveedor de IA ni costo adicional. API autenticada con permiso Chatbot;
panel accesible con preguntas sugeridas, respuesta y fuente; búsqueda que
normalice acentos, mensaje claro si no encuentra coincidencia y estados de
carga/error. No inventará disponibilidad ni información de cuentas. Validar
solo preguntas con fuentes activas: la vista actual usa LEFT JOIN y conserva
preguntas aunque todas sus fuentes estén inactivas. Probar esa condición,
contenido HTML como texto y revocación del permiso. La ambigüedad documental
de renovación debe resolverse antes de ampliar respuestas sobre elegibilidad.

Recuperación: el usuario confirmó recepción del enlace real, cambio de
contraseña e inicio de sesión; se verificó credencial no temporal, bitácora de
restablecimiento y ausencia de enlaces vigentes. No se conserva la contraseña.
