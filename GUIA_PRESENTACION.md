# Biblioteca Ducky · Presentación del 20 de noviembre

Diego presenta los dos bloques en ocho minutos. El recorrido va de sistema a catálogo y luego a biblioteca.

## Antes de presentar

En la terminal, desde la raíz del proyecto, ejecuta:

```sh
node .local-validation/presentacion-2026-11-20/iniciar.js demo
```

Deja la terminal abierta. Cuando aparezca «BD conectada», abre [la demo en el puerto 3004](http://localhost:3004/login.html). En esta computadora quedó lista una base independiente con datos ficticios, las cuatro cuentas sembradas y la clave `645678` libre. Usa el modo `ensayo` y el puerto 3003 para practicar con el mismo código. Ese modo conserva las operaciones de la prueba del 19 de noviembre. Para un segundo ensayo de alta de libro, cambia el ISBN y el título.

| Cuenta de prueba | Perfil que se elige al entrar |
| --- | --- |
| `100001` | Administrador del sistema |
| `100002` | Administrador de biblioteca |
| `100003` | Administrador del catálogo |
| `621234` | Lector (alumno o docente) |

Las cuatro usan `1234` en las copias de demostración. Ten abiertos el guion y el PDF descargado del ensayo como respaldo. Mantén el navegador al 90–100 % y prepara el ISBN y el título para pegarlos. En la demo se pueden confirmar altas y bajas de sus propios registros. El correo se desactivó en las dos copias. Evita `db:init`.

## Bloque 1 · Sistema y usuarios · 0:00–4:00

| Tiempo | Qué mostrar | Qué decir |
| --- | --- | --- |
| 0:00–0:40 | Inicio y un ejemplo en `ESTANDAR_MVC.md`. Usa búsqueda como ejemplo de ruta, controlador, modelo y vista. | «El modelo consulta PostgreSQL, el controlador valida y coordina, y la vista muestra el resultado. El equipo comparte un estándar de nombres e indentación». |
| 0:40–1:15 | Entra con `100001`, perfil de sistema. Muestra su menú. | «El sistema autentica a cada usuario y habilita acciones según sus permisos». |
| 1:15–2:10 | **Perfiles y permisos → Crear perfil**. Registra `Lector demostración` con **Buscar libros**. Selecciona el perfil y abre **Editar funciones** para mostrar dónde se agrega **Chatbot**. | «Un perfil agrupa las funciones que se pueden asignar a diferentes cuentas». |
| 2:10–3:40 | **Gestión de usuarios → Registrar usuario**. Captura `645678`, selecciona **Lector** y registra. Regresa a la lista, busca la clave y muestra el estado **Activo**. Si alcanza el tiempo, abre **Consultar y modificar** y asigna el perfil de demostración. | «El directorio ficticio verifica la matrícula y PostgreSQL guarda la cuenta. Cada alta genera una contraseña temporal para el primer acceso». |
| 3:40–4:00 | Si piden baja, hazla sobre el usuario recién creado y muestra el estado inactivo. Cierra sesión para entrar como catálogo. | «Ahora entro como administrador del catálogo para mostrar el alta de un libro». |

## Bloque 2 · Catálogo, compras y consulta · 4:00–8:00

### 4:00–5:25 · Ficha y alta

1. Entra con `100003`, perfil de catálogo. Abre **Gestionar libros → Crear ficha bibliográfica**.
2. Usa **Manual Ducky de demostración**, ISBN `9780000000995`, autor **Ian Sommerville**, tema **Programación** y editorial **Pearson**. Pulsa **Usar sinopsis de ejemplo**. Baja de tres copias a una y elige **Computación · E-01 / F-02**. Deja **Físico** y **Préstamo externo**.
3. Pulsa **Guardar ficha → Dar de alta en catálogo → Confirmar alta**. Señala la clave que se generó y el estado activo. Si ya vas justo de tiempo, conserva esta confirmación y deja modificación y baja para preguntas.

> «Guardar la ficha registra los datos bibliográficos y prepara los ejemplares. Dar de alta activa el título para que aparezca en el catálogo y pueda prestarse según la disponibilidad».

**Si piden cambio o baja.** En **Ver catálogo actualizado**, selecciona la fila del Manual y pulsa **Consultar ficha**. Para editar, usa **Modificar libro → Sinopsis → Guardar modificación** y muestra el resultado. Para retirar, vuelve a consultar la ficha y usa **Dar de baja libro → Obsoleto → Continuar baja → Dar de baja**. Desde la confirmación, **Comprobar exclusión en búsqueda** muestra cero resultados activos para ese título.

### 5:25–6:40 · Solicitud de compra

1. Cierra sesión y entra con `100002`, perfil de biblioteca. En Inicio, abre **Solicitudes de compra a Tesorería → Abrir solicitudes**.
2. Si aparece el aviso, registra **8000 MXN** como presupuesto ficticio y confirma. Esto se hace una vez al mes. Si ya lo registraste al preparar la demo, usa el saldo visible.
3. Pulsa **Ver solicitud / agregar más**. Selecciona **L000131 · Clean Code**, cantidad **1**, costo unitario **950** y peticionario **700123**. Pulsa **Agregar libro → Revisar solicitud → Enviar a Tesorería**. Señala el folio, el estado **Enviado** y el total de **$950 MXN**.

> «Biblioteca reúne los libros y el sistema valida el total contra el saldo. Al confirmar se genera un folio y el importe queda comprometido. Es un registro interno de la solicitud».

**Si piden autorización o recepción.** Desde **Nueva solicitud → Historial y recepción → Solicitudes enviadas**, busca el folio que acabas de generar. Con biblioteca, pulsa **Autorizada → Registrar**. Explica que es el registro de la decisión de Tesorería. Si se rechaza, se libera el presupuesto comprometido. Para enseñar la recepción, cambia a `100003` y abre **Gestionar libros → Recibir libros adquiridos → Computación · E-01 / F-02 → Confirmar recepción**. La pantalla muestra la etiqueta generada. Este extra requiere otro cambio de perfil.

### 6:40–7:20 · PDF e impresión

Desde **Buscar libros → Listado de libros → Generar PDF**, enseña la vista previa y señala **Descargar PDF**. Pulsa **Preparar impresión** si te piden mostrar la salida A4. Puedes volver al listado desde la vista previa.

> «El listado usa el catálogo activo. Se puede descargar como PDF con ISBN y datos bibliográficos, o preparar para impresión en A4».

### 7:20–8:00 · Búsqueda física y cierre

Abre **Buscar libros**, escribe **Ingeniería** en **Título** y pulsa **Buscar**. En la tarjeta de **Ingeniería de software** (`L000129`), señala **Computación · E-01 / F-02** y la disponibilidad. La ubicación ya aparece en la tarjeta.

> «Con el título encontramos el libro y vemos en qué sección, estante y fila está. El mismo catálogo alimenta los resultados de búsqueda y el listado».

**Si sobra tiempo.** En Inicio abre **Asistente Ducky** y pregunta «¿Qué libros tienen de ingeniería?». El ensayo devolvió dos títulos y mostró la ubicación del físico. Si te piden demostrar permisos, desde el inicio del lector usa **Demostrar acceso restringido** y muestra **Acceso denegado**.

## Qué se verificó el 19 de noviembre

| Área | Resultado |
| --- | --- |
| Catálogo | En navegador se guardó la ficha, se activó, se modificó la sinopsis y se dio de baja. La búsqueda confirmó su exclusión. |
| Compras | En navegador se registró el presupuesto ficticio, se envió el pedido, se autorizó y se recibió. El folio de ensayo fue `NOV-2026-002` y se generó la etiqueta `L000131-02`. |
| Usuarios y perfiles | Se abrieron las pantallas de gestión en navegador. Se comprobaron por HTTP el alta y edición de perfil, el alta, cambio y baja de usuario, y el bloqueo del lector. |
| Experiencia | Se vieron lista, PDF, vista previa de impresión, búsqueda física y asistente. Se descargó y revisó un PDF A4 con los cinco títulos de la base de ensayo. La impresión física quedó fuera del ensayo. |
| MVC y datos | 77 pruebas automatizadas aprobadas, incluidas integración con PostgreSQL, separación MVC, permisos y reglas de préstamos y devoluciones. Se completaron 18 comprobaciones HTTP adicionales en las dos copias. |

La disponibilidad de otras bibliotecas muestra un aviso porque falta conectar un acervo externo. El enlace del título digital de Ingeniería es ilustrativo. Tesorería, Servicios Escolares y las alertas de espera se representan con registros internos. La validación de esta presentación fue en escritorio. Los estados secundarios y la equivalencia visual completa con Figma siguen pendientes.
