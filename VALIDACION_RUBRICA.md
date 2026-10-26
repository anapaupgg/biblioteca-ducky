# Validación del prototipo — 26 de octubre de 2026

Actualización de depuración: 36 pruebas automatizadas y 64 casos HTTP aprobados.
Consultar GUIA_AVANCE.md para el recorrido y las correcciones; las cifras de
43 casos/32 pruebas de las secciones siguientes corresponden a la medición anterior.

Esta evidencia cubre el alcance implementado; no acredita por sí sola los diez
puntos ni los módulos todavía pendientes del backlog.

| Frente | Resultado comprobado |
| --- | --- |
| MVC (2 puntos) | Suite de contratos: controladores sin SQL/DOM, vistas sin API y scripts HTML compatibles. Convenciones en ESTANDAR_MVC.md. |
| Funcionalidad (4 puntos) | 43 casos HTTP reales en copia restaurada: usuarios, perfiles, sesiones, catálogo y compras; errores, duplicados, revocación y recepción única. Cancelación de compras comprobada con modelos simulados. |
| Experiencia y desempeño (2 puntos) | Carga local de 55 y 100 usuarios distintos aprobada; revisión visual móvil y PDF extenso pendiente. |
| Seguridad y datos (2 puntos) | Matriz de 324 combinaciones de rutas/permisos, permisos independientes de compras y respaldo restaurado en una base nueva. |

## Respaldo y restauración

Se respaldaron 35 tablas y 198 filas mediante una instantánea consistente de
PostgreSQL. La restauración en una base nueva terminó correctamente y coincidió
por conteo y hash del contenido de cada tabla con la instantánea del origen.
Esto verifica filas, no compara por separado definiciones SQL ni secuencias.
El uso posterior de la copia pasó las pruebas de aceptación.

SHA-256 del respaldo verificado:
`a7b6b15366e8c4aed4950125f8bc3393da884b4f05d5a54bf291054afd738f7a`.

Respaldo, configuración y reportes detallados permanecen en `.local-validation/`,
excluido de Git, con acceso restringido. El respaldo contiene datos privados;
no se adjunta a la entrega. No se ejecutó `db:init` ni se restauró sobre el origen.

## Carga local

Se agregaron únicamente a la copia 100 lectores sintéticos y 250 títulos con
un ejemplar cada uno. Los inicios de sesión fueron secuenciales y quedan fuera
de la medición. Cada usuario realizó cinco lecturas HTTP autenticadas: sesión,
búsqueda, listado, chatbot y búsqueda sin coincidencias. Se calentó previamente
el servidor con cinco usuarios; cada usuario mantiene una petición a la vez.

| Usuarios concurrentes | Peticiones | Errores | Mediana | Percentil 95 | Máximo |
| --- | ---: | ---: | ---: | ---: | ---: |
| 55 | 275 | 0 | 80 ms | 192 ms | 237 ms |
| 100 | 500 | 0 | 155 ms | 300 ms | 369 ms |

Medición del 26 de octubre a las 19:48 UTC, HTTP y lectura JSON en localhost.
Todas quedaron por debajo de tres segundos. No mide renderizado del navegador,
usuarios remotos, login concurrente ni escritura simultánea a esa escala.
La concurrencia de presupuesto/recepción tiene pruebas específicas adicionales.

## Compras y permisos

- Solicitar compras: crear solicitudes.
- Autorizar compras: autorizar o rechazar. Asignado inicialmente a los perfiles
  Administrador del sistema y Administrador de biblioteca, según Diego.
- Gestionar libros: recibir ejemplares.
- Préstamos: ya no habilita operaciones de compras.

La migración aditiva fue probada en la copia y aplicada al origen, en una
transacción con registro de versión. Repetirla no vuelve a conceder permisos
que un administrador haya retirado. Los permisos son configurables por perfil;
no hay integración externa real con Tesorería aunque la interfaz conserve ese nombre.

## Verificaciones y límites

`DUCKY_TEST_DB=1 npm test`: 32 pruebas aprobadas, cero fallos u omisiones.
La matriz incluye perfiles con solo préstamos, solo solicitud y solo autorización.
Los 43 casos de aceptación se ejecutaron sobre una copia recién restaurada;
el script deja sus fixtures en esa copia y requiere otra restauración para repetirlos.

La política de seguridad de la herramienta de navegador rechazó el acceso a
la pestaña de localhost:3002. No se eludió el bloqueo. Quedan pendientes la
validación visual móvil, cancelaciones desde la interfaz y la impresión real
del catálogo extenso. Los 250 títulos de prueba están preparados en la copia.
También quedan fuera de este avance préstamos/devoluciones personales, multas
y cualquier funcionalidad del backlog que todavía no tenga pantalla y API.
