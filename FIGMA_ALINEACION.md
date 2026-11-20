# Alineación con Prototipo-AES

Referencia: [Figma, página 01 - Prototipo](https://www.figma.com/design/sZgmHvy2YReNXevKvL4fUI/Prototipo-AES?node-id=0-1). Revisado el 11 de noviembre de 2026. La página contiene secciones `00` a `10`, además de selectores y escenarios de error. Cada pantalla nueva se implementa desde su nodo concreto y se verifica contra su captura.

## Preguntas abiertas en Asistente Ducky

- Frame `2483:74914` consultado como referencia. Se conserva la estructura de
  conversación, el formulario de texto libre y las ocho sugerencias. El saludo
  actualizado menciona temas de la biblioteca, el proyecto y los préstamos
  de la sesión.
- La API amplía respuestas con datos locales y puede usar Claude para redactar
  respuestas abiertas desde contexto público. Las preguntas personales y de
  catálogo se resuelven con datos de la aplicación. El prototipo ilustra
  respuestas de ejemplo y no define integración con un proveedor.
- Las sugerencias conservan sus respuestas locales. El texto generado se
  muestra en la misma burbuja, sin asteriscos ni etiqueta de proveedor.

## Borrador de compras: verificación del 19 de noviembre de 2026

- Se consultaron `2011:28537` (formulario y resumen), `2011:28878` (agregar
  más libros) y `2011:29860` (revisión sin libros). La navegación conserva
  el formulario operativo abierto al agregar o quitar y ahora restaura todos
  los campos al volver desde la revisión vacía.
- «Limpiar campos» permite descartar una captura aún no agregada sin vaciar
  los renglones confirmados del borrador. Se verificaron en navegador el
  regreso al formulario, dos renglones consecutivos y el envío con su folio.
  Este cotejo cubre el comportamiento del recorrido de compras en escritorio.

## Presupuesto mensual: revisión del 17 de noviembre de 2026

- Se consultó el frame `2011:28537` (Solicitar libros a Tesorería). La tarjeta
  principal muestra el presupuesto como dato de solo lectura. La aplicación
  mantiene esa composición cuando hay presupuesto vigente.
- Si falta la asignación del mes, un administrador con `Autorizar compras`
  ve una acción para registrarla antes de solicitar libros. También puede
  abrirla desde el historial cuando carece del permiso de solicitar.
- El formulario de registro es una pantalla operativa adicional sin frame
  equivalente en Figma. Se comprobó en navegador el aviso, el formulario y
  la cancelación con 100002, sin guardar monto. No se afirma paridad visual
  de este estado ni de la pantalla de compras completa.

## Prioridad de la lista de espera: revisión del 17 de noviembre de 2026

- Consultados los frames `2465:101339` (devolución con espera) y
  `2447:114653` (lista de espera), que presentan aviso al primero y
  prioridad sobre la copia devuelta. La vista ya mostraba el estado
  `Notificado`, pero la regla de préstamo permitía que otro usuario tomara
  la única copia libre.
- La base ahora protege la cantidad de copias apartadas para usuarios
  `Notificado`, y el catálogo y la lista muestran solo las copias libres.
  Una prueba transaccional confirmó rechazo al tercero y préstamo al primero.
  No se alteró la composición visual de las pantallas ni se repitió una
  comparación de píxeles en este cambio; el cotejo visual previo sigue siendo
  parcial. El correo al usuario y la asignación de una clave específica de
  ejemplar siguen pendientes.

## Edición directa de acervo: cotejo del 17 de noviembre de 2026

- Frame `2010:25664`: con `L000129`, la tarjeta principal mantiene
  `(276,240;1132×490)` y la sinopsis comienza en y=746 a 1440 × 960.
  «Estante / fila», «Condición» y «Número de copias» aparecen en sus lugares
  y operan sobre los ejemplares reales. Se comprobó el aviso «Cambio
  pendiente» al seleccionar otra ubicación y el paso de 2 a 3 copias y vuelta
  a 2 sin guardar. A 390 px no hay desbordamiento horizontal.
- La app permite cambios conjuntos solo si las copias físicas activas están
  disponibles y comparten ubicación y condición. `L000129` cumple aunque sus
  tipos de uso difieren: estos se conservan y se elige uno para copias nuevas.
  `L000128` tiene préstamos y condiciones distintas, por lo que el formulario
  muestra el resumen de solo lectura y enlaza a la gestión individual. Si no
  hay copias, se puede elegir ubicación para añadir la primera.
- El control menos no retira copias ya registradas: la baja de un ejemplar
  requiere motivo y conserva historial. El servidor valida de nuevo el estado
  y guarda ficha, cambios conjuntos y altas nuevas en una transacción. La
  prueba PostgreSQL de este recorrido se revirtió. El ejemplo de Figma usa
  clave `B...`; PostgreSQL conserva `L...`. Falta probar un guardado HTTP real
  en un entorno de prueba y no se declara paridad literal de todos los datos.

## Baja exitosa de perfil: cotejo del 17 de noviembre de 2026

- Frame `2009:21611`: el diálogo de confirmación quedó en 700×280 px y
  presenta la advertencia de cero usuarios, la nota de bitácora y los botones
  Eliminar perfil/Cancelar de 154/140×48 px en ese orden. El trigger
  `trg_bit_perfiles` registra la modificación. Se abrió en una vista temporal
  y se comprobó Cancelar sin llamar a la API de baja.
- Frame `2009:21621`: el resultado tiene título y=96, aviso
  `(276,136;1132×96)`, tarjeta «Información de la operación»
  `(276,248;1132×114)` y acciones en y=378 a 1440 × 960. La pantalla se
  comprobó con una vista temporal que llama al mismo método de presentación.
  A 390 px no hubo desbordamiento y «Volver» restauró la lista mediante el
  controlador. No se dio de baja ningún perfil durante la prueba.
- Figma dice que el perfil desaparece de la lista y muestra una bitácora con
  fecha y hora. La app conserva los perfiles inactivos en la lista para
  permitir su reactivación. Aunque el trigger registra el cambio, la respuesta
  de baja no devuelve esa entrada ni su fecha y hora; el resultado muestra
  solo nombre, funciones y administrador conocidos. Falta comprobar el flujo
  con una baja real de un perfil sin usuarios.

## Alta exitosa de perfil: cotejo del 17 de noviembre de 2026

- Frame `2009:20649`: después del alta, la aplicación muestra encabezado,
  aviso «Nuevo perfil disponible» `(276,176;1132×96)`, tarjeta «Registro de
  la operación» `(276,288;1132×154)` y acciones en y=458 a 1440 × 960.
  «Asignar a usuario» abre el formulario correspondiente y «Volver a perfiles»
  restaura la lista. Se comprobó la disposición con una vista temporal que
  invocó el método real, sin crear registros en PostgreSQL.
- El nombre, estatus, funciones, fecha y clave del administrador provienen de
  la operación y la sesión. La base guarda fecha, pero no hora de alta; se
  muestra solo la fecha, distinta de la hora ilustrativa del frame. Falta
  verificar este resultado con una operación de alta real.

## Otros rechazos al modificar perfil: cotejo del 17 de noviembre de 2026

- Frames `2008:16840`, `2008:17470` y `2008:17785`: perfil inactivo o
  inexistente, jerarquía superior y tipo institucional incompatible comparten
  aviso `(276,136;1132×96)`, operación `(276,248;1132×114)` y acciones en
  y=378 a 1440 × 960. La vista de rechazo usa esa estructura y la causa
  correspondiente del servidor; el tipo y perfil incompatibles se describen
  con los datos realmente elegidos. A 390 px no hay desbordamiento horizontal.
- Se cotejaron en páginas temporales que invocaron el mismo método de vista,
  eliminadas después. El formulario real impide normalmente elegir perfiles
  inactivos o superiores; no se enviaron operaciones de permisos para forzar
  esos errores. El servidor conserva la validación. Igual que el rechazo de
  perfil propio, la tarjeta no afirma una bitácora de intentos no confirmada.

## Rechazo del cambio de perfil propio: cotejo del 17 de noviembre de 2026

- Frame `2008:17155`: la salida de error usa título en y=96, aviso
  `(276,136;1132×96)`, tarjeta de operación `(276,248;1132×114)` y
  acciones en y=378 a 1440 × 960. El contenido muestra la clave real de la
  sesión y aclara que el perfil se conservó. «Volver» regresa a la consulta;
  «Ir al inicio» mantiene la navegación autorizada. A 390 px no hubo
  desbordamiento horizontal.
- La vista se comprobó con una página temporal que llamó al mismo método de
  vista y se eliminó después. En la app real se canceló la confirmación antes
  de intentar cambiar permisos; no se modificó la cuenta ni la base. El
  servidor ya rechaza el cambio de perfil propio. A diferencia de Figma, la
  tarjeta no afirma un registro de bitácora porque ese dato no llega en la
  respuesta del error.

## Excepción de acceso: cotejo del 17 de noviembre de 2026

- Los frames `2006:2999` (campos vacíos) y `2006:2024` (credenciales
  incorrectas) sitúan ambos errores dentro de `Ducky/Shell` con la leyenda
  «Administrador del sistema · Sesión activa». En la aplicación, estos errores
  ocurren antes de autenticar y permanecen en el formulario de acceso, cuyo
  frame principal `2006:941` sí fue cotejado. Copiar literalmente el shell
  afirmaría una sesión que no existe. Se registra esta diferencia de flujo;
  no se declara paridad de esos estados ni se habilita navegación protegida.

## Baja bloqueada de perfil: cotejo del 17 de noviembre de 2026

- Frame `2009:21287`: al intentar eliminar Lector, que tiene cinco usuarios
  activos reales, la app presenta el encabezado y el aviso en
  `(276,176;1132×96)`, cinco filas de 56 px desde y=288 y acciones en y=600
  a 1440 × 960. Las primeras tres filas contienen usuarios reales y la última
  resume dos adicionales. «Volver a perfiles» restaura la lista; «Modificar
  usuarios» abre Gestión de usuarios.
- El prototipo ilustra 124 usuarios y tres nombres distintos. La app usa el
  conteo y las identidades de PostgreSQL; el bloqueo no ejecuta la baja. Solo
  consulta nombres mediante el permiso existente «Gestionar usuarios». Un
  administrador con «Gestionar perfiles» sin ese permiso ve el conteo, pero
  no recibe nombres ni el acceso a Gestión de usuarios. A 390 px no hay
  desbordamiento horizontal.

## Nombre y funciones obligatorios: cotejo del 17 de noviembre de 2026

- Frames `2009:22905` y `2009:22580`: los dos errores de validación local
  reutilizan el resumen del perfil. En escritorio el aviso está en
  `(276,176;1132×96)`, la tarjeta en `(276,288;1132×178)` y las acciones en
  y=482, como ambos frames. El primero marca Nombre vacío y conserva la
  descripción y las funciones; el segundo muestra «Funciones / Ninguna
  seleccionada» y conserva internamente el nombre y la descripción.
- «Corregir perfil» devuelve el formulario completo sin perder los valores;
  se probó con nombre temporal y descripción, y luego se canceló sin guardar.
  Estas validaciones ocurren antes de la API. La captura utiliza el
  administrador y datos locales, no los valores ilustrativos del prototipo.

## Nombre de perfil duplicado: cotejo del 17 de noviembre de 2026

- Frame `2009:22255`: el intento real de registrar «Lector» volvió con error
  409, sin crear otro perfil. La app presenta el título y subtítulo del frame,
  aviso en `(276,176;1132×96)`, «Datos conservados» en
  `(276,288;1132×178)` y acciones en y=482 a 1440 × 960. El campo de nombre
  sigue marcado, la descripción se muestra de solo lectura y el control
  «Corregir perfil» recupera el formulario completo.
- Se comprobó que al corregir permanecen nombre, descripción y «Buscar libros»
  seleccionado. «Cancelar» vuelve a la lista sin dejar el aviso; a 390 px no
  hay desbordamiento horizontal. Los datos reales y la leyenda de sesión
  sustituyen los ilustrativos del frame.
- Al recargar se detectó una carrera: «Crear perfil» podía abrirse antes de
  recibir las funciones. Ahora Crear y Editar funciones se habilitan solo
  cuando el catálogo real se ha cargado; si falla la consulta permanecen
  deshabilitados.

## Modificación principal del perfil de usuario: cotejo del 16 de noviembre de 2026

- Frame `2008:15182`: con el usuario real `100002`, la ficha ocupa
  `(276,176;1132×490)` a 1440 × 960; las acciones comienzan en y=682 y
  miden 48 px. Se incorporó la tercera acción visible «Cambio que retira
  funciones» entre Guardar y Cancelar, con anchos 228/250/140 px.
- La acción muestra una vista previa de las funciones efectivamente retiradas
  por el perfil seleccionado. Con Administrador de biblioteca → Lector indicó
  cinco funciones y aclaró que no aplica el cambio hasta Guardar. Se cerró la
  vista previa sin modificar al usuario. La confirmación al guardar continúa
  bajo el controlador y la validación final del servidor.
- Los datos de Pamela Torres, clave `100002` y correo proceden de PostgreSQL;
  difieren del ejemplo Sofía Torres / `A001234` del frame. El estado inicial
  vacío y los estados de reactivación siguen como variantes, no como paridad
  literal de esta captura.

## Creación principal de perfil: cotejo del 16 de noviembre de 2026

- Frame `2009:20306`: a 1440 × 960, Datos del perfil quedó en
  `(276,176;1132×178)`, Funciones autorizadas en `(276,370;1132×306)` y
  Guardar/Cancelar en y=692 con 48 px de altura. Las seis funciones ocupan
  dos columnas; las etiquetas comienzan en x=313 y x=817. La selección usa
  casillas accesibles sin el cuadro visible que no aparece en la captura;
  una selección se resalta con el fondo azul del sistema.
- Las tres funciones reales adicionales siguen disponibles en un desplegable
  bajo las acciones. Se marcaron «Gestionar usuarios» y «Gestionar perfiles»
  sin guardar, y ambas casillas permanecieron seleccionadas. El formulario
  recoge también las selecciones adicionales. A 390 px no hubo desbordamiento
  horizontal. El ejemplo de nombre se alineó con «Ej. Alumno» de Figma.
- La solicitud principal de Tesorería (`2011:28537`) se volvió a cotejar con
  un libro en el borrador local: acciones y=176, tarjeta y=240/414 px.
  Presupuesto, folio y peticionario ilustrativos no se sustituyen por datos
  ficticios; el editor y el historial operativos permanecen bajo la vista.

## Consulta principal de libro activo: cotejo del 16 de noviembre de 2026

- Frame `2010:25317`: con el libro real `L000129`, las dos filas de acciones
  empiezan en y=176 y y=240. La tarjeta bibliográfica quedó en
  `(276,304;1132×386)`, la sinopsis en `(276,706;1132×194)` y el resumen
  en y=916 a 1440 × 960. Los seis datos de lectura y el conteo de dos copias
  proceden de PostgreSQL. A 390 px la ficha no desborda horizontalmente.
- «Disponibilidad en otra biblioteca» ocupa el lugar del cuarto botón del
  prototipo y, al pulsarlo, informa que no existe un catálogo externo
  conectado. No se afirma disponibilidad de otra institución. Cambiar
  condición continúa abriendo los ejemplares reales; las claves `L...`, el
  tema, la sinopsis y el número de copias difieren del ejemplo `B...`.
- Esta comparación corresponde a la ficha activa. Los estados de ficha
  creada, libro retirado y flujo de ejemplares conservan sus operaciones
  anteriores y no se declaran idénticos a este frame.

## Registro principal de usuario: cotejo del 16 de noviembre de 2026

- Frame `2007:5205`: a 1440 × 960 las tarjetas quedaron en
  `(276,176;1132×178)` y `(276,370;1132×282)`; las acciones empiezan en
  y=668, miden 48 px y sus botones 170/139 px. El orden Clave/Perfil y
  Clave/Nombre/Tipo/Correo conserva el prototipo. A 390 px el formulario no
  desborda. El selector cargó los perfiles reales y dejó Lector seleccionado.
- La captura de Figma ilustra una clave `A...` y datos personales ya
  consultados. El formulario inicia vacío y espera una clave válida de seis
  caracteres para consultar la institución; no se insertaron datos de ejemplo
  ni se registró un usuario durante esta comprobación. Se acredita la
  composición principal, no el resultado de alta.

## Gestión y lista principales de libros: cotejo del 16 de noviembre de 2026

- Frame `2010:23308`: la página administrativa quedó con recepción en
  y=176/48 px, lista en y=240/176 px y acciones en y=432 y y=492 a
  1440 × 960. Los botones tienen los anchos de 236, 235, 153, 258 y 153 px
  de la captura. La lista contiene siete fichas reales dentro del área de dos
  filas visibles; seleccionar `L000129` habilitó «Consultar ficha». El filtro
  administrativo sigue debajo, aunque no se dibuja en el frame. A 390 px el
  documento no desborda.
- Frame `2046:48434`: el listado activo quedó con tarjeta
  `(276,176;1132×306)`, filas desde y=241 con 176 px visibles y acciones
  desde y=498. Cinco libros reales permanecen disponibles mediante
  desplazamiento interno; el recuento dice «5 registros». En móvil las filas
  largas conservan su altura, el área visible crece a 320 px y la página no
  desborda. El PDF y la impresión siguen usando el conjunto de datos, no el
  número de filas visibles en pantalla.
- Figma ilustra dos títulos con claves `B...` y un Lector; la comprobación
  usó el administrador y claves `L...` de PostgreSQL. Se acredita la
  composición de las páginas principales, no la paridad literal de sus datos
  ni de sus estados de PDF/impresión.

## Gestión de usuarios, perfiles y catálogo del asistente: 16 de noviembre de 2026

- Frame `2007:4863`: a 1440 × 960 la tarjeta principal de usuarios quedó en
  `(276,176;1132×430)`, la lista en y=345 con 236 px de alto y las acciones
  en y=622 y y=682. La lista permite recorrer los nueve registros reales sin
  empujar los botones fuera de la composición del frame. Se seleccionó una
  cuenta inactiva y se comprobó que «Reactivar» se habilita, sin ejecutarlo.
  A 390 px no hay desbordamiento horizontal del documento.
- Frame `2009:19980`: la lista de perfiles quedó en y=176, con encabezado y
  cuatro filas de 56 px; las acciones comienzan en y=488 y miden 48 px. Los
  datos reales se presentan en una línea continua como en el prototipo. La
  fila sigue seleccionable; editar y eliminar se habilitan según el perfil.
  Los nombres, funciones y cantidades difieren de los ejemplos de Figma. A
  390 px la tabla se desplaza horizontalmente dentro de su contenedor.
- Frame `2483:76334`: se conservó la conversación principal y se cotejó la
  respuesta con la aplicación. Figma muestra una sola burbuja de respuesta;
  la consulta real «¿Qué libros hay?» ahora agrupa cinco títulos de
  PostgreSQL en una sola burbuja y desplaza al inicio de ella. La respuesta
  mantiene disponibilidad y ubicación reales, más el enlace a Buscar libros.
  La composición móvil de inicio se revisó a 390 px sin desbordamiento.
- Las 11 secciones principales tienen al menos un cotejo estructural y las
  composiciones principales de escritorio quedaron alineadas con sus frames.
  Este es el cierre del alcance visual principal acordado; no acredita
  coincidencia literal de los datos, estados secundarios ni integración con
  servicios externos. Las estimaciones porcentuales anteriores eran de
  planificación y no sustituyen un inventario completo frame por frame.

## Páginas principales de circulación: cotejo del 16 de noviembre de 2026

- Frames `2447:106950` y `2465:98968`: las acciones superiores de préstamos
  y devoluciones empiezan en y=176 y sus botones miden 48 px a 1440 × 960.
  Las filas principales miden 56 px como en Figma. En devoluciones, el aviso
  por un préstamo vencido real quedó en `(276,240;1132×96)`, el título en
  y=352 y la primera fila en y=396.
- En la BD local no hay solicitud pendiente de préstamo, por lo que la página
  de préstamos omite el aviso azul ilustrativo del frame. Con los tres
  préstamos activos reales, el título está en y=240 y la primera fila en
  y=284. El cambio de tamaño se aplica solo a las páginas base; al abrir
  «Registrar préstamo», el formulario conserva su separación previa.
  Préstamos y devoluciones no desbordan a 390 px. Claves `L...`, fechas y
  solicitantes reales sustituyen los ejemplos `B...` del prototipo.

## Portadas administrativas: cotejo del 16 de noviembre de 2026

- Frame `2006:1313`: a 1440 × 960, nombre en y=176, barra de compras
  `(276,216;1132×80)` y primera tarjeta de servicios
  `(276,312;1132×102)`. Las tarjetas mantienen 16 px entre ellas; iconos de
  24 px, textos desde x=348 y botones de 140 × 48 px en x=1123.
- Los siete accesos aparecen en el orden del frame para el administrador del
  sistema; la descripción de «Gestionar libros» se ajustó al texto del
  prototipo. El nombre proviene de la sesión real (`Diego Ramírez`) en lugar
  del ejemplo (`Alejandro Elias`). A 390 px no hay desbordamiento y los
  botones caben en las tarjetas.
- Frame `2043:46958`: la cuenta de Administrador de biblioteca `100002`
  mostró compras en y=216 y cinco servicios: usuarios, búsqueda, préstamos y
  asistente desde y=312, 430, 548 y 666. Coinciden orden y geometría del
  frame; el nombre `Pamela Torres` procede de la sesión.
- Frame `2043:47677`: la cuenta de Administrador del catálogo `100003`
  mostró solo Gestionar libros en y=216 y Buscar libros en y=334, como Figma.
  Antes aparecía una barra de compras porque la portada confundía acceso de
  lectura a órdenes de recepción con autorización para solicitar compras. Se
  retiró esa tarjeta para este perfil; el permiso de recepción y sus rutas se
  conservan. La descripción de libros de este perfil sigue el texto propio
  del frame. Su nombre real es `Katya Hernández`.

## Alta y edición principales de libros: cotejo del 16 de noviembre de 2026

- Frames `2010:23633` y `2010:25664`: a 1440 × 960, el alta quedó con
  acciones en y=176, tarjeta de datos `(276,240;1132×386)` y tarjeta de
  sinopsis desde y=642. Las tres filas de campos miden 88 px, los botones
  48 px y el selector de copias conserva la posición del prototipo.
- En el cotejo inicial de edición de `L000129`, la tarjeta de cuatro filas quedó en
  `(276,240;1132×490)` y sinopsis desde y=746. La fila adicional muestra
  `E-01 / F-02` y `Bueno` de los ejemplares vigentes reales. En esa revisión
  eran valores de lectura; la actualización posterior del 17 de noviembre
  habilitó su edición conjunta segura y el número de copias. No se guardó
  ningún cambio del libro en el cotejo visual. Alta y edición no desbordan a
  390 px. Las excepciones y la diferencia de claves se detallan arriba.

## Asistente principal: cotejo del 16 de noviembre de 2026

- Frames `2483:74914` y `2483:76334`: se compararon la conversación inicial
  y la respuesta de búsqueda con Figma y el navegador a 1440 × 960. La tarjeta
  inicial quedó en `(276,136;1132×212)`, la pregunta en
  `(276,364;1132×88)`, las sugerencias en `(276,468;1132×172)` y el regreso
  comienza en y=656 con 48 px de altura. El texto de la burbuja usa cuerpo de
  16/24 px como el prototipo.
- «¿Cómo encuentro un libro?» mostró la respuesta y el enlace a Buscar libros.
  «¿Qué libros hay?» consultó el catálogo real, mostró cinco libros con clave,
  formato, disponibilidad y ubicación, y ahora deja visible el mismo enlace.
  Los títulos y existencias provienen de PostgreSQL, no de la maqueta.
  A 390 px el documento no desbordó horizontalmente.
- Este cotejo cierra la comparación de estructura de las 11 pantallas
  principales existentes. No acredita identidad pixel a pixel de todas ellas
  ni los estados secundarios. Siguen pendientes las diferencias de datos y
  flujos externos registradas abajo; se priorizan después de la cobertura
  principal acordada.

## Solicitud principal de compras: cotejo del 16 de noviembre de 2026

- Frame `2011:28537`: con un libro añadido al borrador local, la fila de
  acciones empieza en y=176 y la tarjeta mide (276, 240; 1132 × 414) a
  1440 × 960, como el prototipo. A 390 px no hay desbordamiento horizontal.
- El ejemplo de Figma presenta un folio, presupuesto y datos ilustrativos.
  La app deja «Solicitud en preparación» y «Sin registrar» hasta que existan
  un envío y presupuesto reales. La petición de usuario y el libro muestran
  claves y título existentes; los campos de edición están en el panel inferior.
  La ruta conserva el encabezado veraz «Solicitudes a Tesorería». Este cotejo
  acredita la distribución principal, no paridad literal de datos.

## Modificar perfil de usuario: cotejo del 16 de noviembre de 2026

- Frame `2008:15182`: tarjeta de ocho campos y acciones cotejadas en navegador
  a 1440 × 960 con datos reales de `800456` y `100002`. Tarjeta (276, 176;
  1132 × 490), acciones y=682. «a» produjo varias coincidencias; la selección
  abrió el perfil de `100002`. El cambio a Lector mostró la confirmación que
  avisa del cierre de sesión y se canceló sin modificar la base.
- Frames `2008:15538` y `2008:15863`: guiaron los resultados de actualización
  normal y con sesión cerrada. Falta cotejo visual con una operación real
  confirmada. La app no afirma envío de correo ni fecha/hora de bitácora porque
  esos datos no llegan en la respuesta de la API. La fuente institucional no
  proporciona teléfono, así que aparece «No registrado».
- A 390 px no hubo desbordamiento horizontal; no se reclama paridad móvil
  porque este flujo no tiene frame móvil específico en el prototipo.

## Baja de usuario: cotejo del 16 de noviembre de 2026

- Frames `2008:10356`, `2008:10701` y `2008:11028`: formulario completo,
  diálogo de confirmación y bloqueo por préstamos se compararon en Figma y
  navegador a 1440 × 960. La tarjeta del formulario mide (276, 176; 1132 ×
  426) y las acciones comienzan en y=618. El préstamo real de `621234` se
  mostró con la clave `L000128`, título y vencimiento que devuelve PostgreSQL.
  Se verificó el bloqueo de la baja propia de `100001` y se canceló la
  confirmación de `800456` sin modificarla.
- Frames `2008:10711` y `2008:11348`: se consultaron para construir éxito y
  bloqueo por deuda, pero no se declara cotejo visual con datos reales. No hay
  un usuario activo con deuda en la base local y no se creó una baja solo para
  capturar el resultado. El aviso por correo de la baja sigue pendiente; la
  interfaz lo dice expresamente aunque Figma lo ilustre como enviado.
- El selector muestra «Solicitud del usuario» como en Figma; la descripción
  almacenada sigue siendo «Solicitud». La clave de seis caracteres y los
  identificadores de libro `L...` se conservan según el esquema actual, frente
  a los siete caracteres y claves `B...` de la maqueta.

## Filtros vacíos e ISBN del 16 de noviembre de 2026

- Frame `2013:32267`: al pulsar Limpiar en escritorio, se comparó la tarjeta `(276,176;1132×386)` y las acciones en y=578 a 1440 × 960. Los seis filtros quedan vacíos; «Buscar sin filtros» presenta la validación y «Usar ejemplo por título» busca un título real. A 390 px se conservan los controles móviles con ancho de documento de 390 px.
- Frame `2013:31922`: «Ejemplo por ISBN» abre «Buscar por ISBN» con tarjeta en y=176 y los seis campos. El ISBN real `9786073206037` queda precargado para consultar o editar; el frame muestra el campo vacío, diferencia funcional explícita. Al pulsar Buscar se encontró `L000129`. La búsqueda pasó de ejemplo de un solo clic a revisión del filtro antes de enviarlo; esta nota reemplaza la descripción anterior de esa acción.

## Solicitud desde búsqueda del 16 de noviembre de 2026

- Frame `2013:32975`: la revisión de escritorio usa una lectura reciente de la ficha antes de mostrar disponibilidad, ubicaciones y solicitante. Con `L000129`, alerta `(276,176;1132×96)`, campos `(276,288;1132×88)` y acciones en y=392 a 1440 × 960. «Cancelar» devolvió resultados sin crear solicitud. El servidor mantiene la validación final al confirmar. El resultado móvil anterior conserva su flujo; este cotejo se refiere al escritorio.
- Frame `2217:51348`: se verificó visualmente una vista sintética temporal de éxito, eliminada sin escribir en BD. Alerta `(276,136;1132×96)`, tarjeta `(276,248;1132×114)` y acciones en y=378. A 390 px no hay desbordamiento horizontal. El aviso añade el folio real de la API al texto del prototipo, para dar al solicitante una referencia. El identificador `L...`, nombre y ubicaciones reales sustituyen los datos `B...` ilustrativos. No se afirma que se haya confirmado una solicitud real en esta revisión.

## Comprobación posterior a baja del 16 de noviembre de 2026

- Frame `2013:34951`: el libro real `L000134` retirado se comprobó mediante el detalle administrativo y una búsqueda activa de cero resultados. La barra «Ver ficha bibliográfica» quedó en `(276,176;1132×48)`, el aviso en `(276,240;1132×96)` y las acciones en y=352 a 1440 × 960, como el frame. `L000129` activo no produjo el estado de exclusión. Se recorrió el enlace desde el comprobante de baja de `L000134` hasta esta vista; no se dio de baja ningún libro durante el cotejo.
- La baja anterior de `L000134` no tiene motivo guardado, así que el aviso omite «por Dañado» del ejemplo. Claves y título provienen de PostgreSQL. El detalle administrativo requiere `Gestionar libros`; un parámetro de URL por sí solo no muestra la afirmación de baja. A 390 px la vista no desborda, sin reclamar paridad móvil porque no hay un frame móvil de este estado.

## Cotejo de estados de búsqueda del 16 de noviembre de 2026

- Frame `2013:34268`: con la ficha real `L000130`, cuya única copia figura Prestado, la tarjeta quedó en `(276,176;1132×450)` y «Modificar filtros» en y=642 a 1440 × 960. Los seis campos y el botón deshabilitado siguen el frame. Se añadió una consulta de solo lectura para la devolución activa más cercana. En la BD actual esa copia no tiene un préstamo Activo con vencimiento, así que se muestra «Sin fecha registrada»; es una inconsistencia pendiente de auditar, no una fecha estimada. A 390 px se conserva solo la tarjeta móvil, sin desbordamiento horizontal.
- Frame `2013:34608`: título, subtítulo, alerta `(276,176;1132×96)`, tarjeta `(276,288;1132×386)` y acciones en y=690 se cotejaron con «In» e ISBN «12@». Ambos campos se resaltan y «Corregir filtros» devuelve los valores al formulario; «Limpiar» los borra. En móvil sigue el estado propio de filtros inválidos. El frame marca «Clave: 12» como inválida; la API vigente permite búsqueda parcial por clave y se conserva esa función. La validación de ISBN del navegador ahora coincide con la del servidor respecto a la X mayúscula.
- Estos cotejos cubren los estados indicados; faltan otros recorridos y datos ilustrativos del prototipo. Las claves reales siguen `L...` frente a `B...` en Figma.

## Cotejo de búsqueda de escritorio del 16 de noviembre de 2026

- Frame `2013:32610`: se compararon captura de Figma y búsqueda real «Ingeniería» en navegador a 1440 × 960. La barra de ficha quedó en `(276,176;1132×48)`, la tarjeta física en `(276,240;1132×450)` y la digital en `(276,706;1132×346)`. Los campos físicos muestran clave/ISBN, autor, editorial/formato, estante/fila, disponibles y prestados; la tarjeta digital muestra clave/ISBN, autor/editorial, formato y enlace. «Modificar filtros» recupera el formulario con la consulta escrita. Se conserva acceso a la ficha en tarjetas posteriores. Las claves `L...`, libros y conteos proceden de PostgreSQL, distintos de los ejemplos `B...` del frame. El enlace digital almacenado aún no resuelve.
- Frame `2013:33925`: «Astronomía avanzada» produjo cero resultados reales. Alerta `(276,176;1132×96)`, filtros conservados `(276,288;1132×386)` y acciones en y=690. Se comprobaron «Modificar filtros» y «Limpiar filtros» sin escritura a la BD. A 390 px la búsqueda con resultados conservó la presentación móvil y ancho de documento de 390 px.
- Los estados de todos los ejemplares prestados (`2013:34268`) y filtros inválidos (`2013:34608`) se cotejaron en el bloque posterior de este mismo día. Siguen pendientes los demás estados secundarios de búsqueda. No se declara paridad integral.

## Cotejo adicional del 14 de noviembre de 2026

- El 16 de noviembre se cotejaron los frames `2447:114973` (alta registrada) y `2447:115623` (datos inválidos). El éxito se probó con datos sintéticos temporales eliminados: alerta `(276,176;1132×96)`, filas de 56 px desde y=288 y acciones en y=540 a 1440×960; el texto comunica la posición obtenida de la lista real sin afirmar correo enviado. Un error real de matrícula inválida respondió 400, dejó los datos escritos y marcó el campo afectado. La vista de éxito a 390 px no desbordó. La aplicación no dispone de envío automático de correo a la persona en espera.
- Frames `2447:114653` y `2447:115298`: se cotejaron la lista consultada y el alta de espera con la cuenta de prueba en navegador. La lista empieza en x=276, y=176 y conserva filas de 56 px; muestra datos reales, fecha sin hora y acciones bajo las filas. El filtro aparece al entrar o con «Consultar otro libro», porque la app debe poder buscar varios títulos. Cancelar el alta recupera la lista anterior. La tarjeta de alta mide `(276,176;1132×176)` y las acciones comienzan en y=368 a 1440×960. A 390 px no hay desbordamiento horizontal. El ejemplo de Figma usa claves `B...` y usuarios distintos de los registros locales `L...`.
- Frames `2465:100993`, `2465:101339`, `2465:101690` y `2465:102038`: se cotejaron los comprobantes de devolución normal, lista de espera, ejemplar dañado y multa con vistas sintéticas temporales a 1440 × 960, eliminadas después. La tarjeta normal quedó en `(276,176;1132×386)` y la de multa en `(276,176;1132×282)`, seguidas por alertas de 96 px y acciones a y=690 en el caso normal. Los campos salen del préstamo y de la transacción reales. Un ejemplar dañado ahora pasa a `En revisión`, fuera de disponibilidad, sin mover la lista de espera; la migración aditiva `003_devolucion_danados` se aplicó en local y se verificó con rollback. El usuario en espera aparece como `Notificado` en el sistema, sin afirmar correo enviado ni reserva de ejemplar, porque esas entregas del frame no están implementadas.
- Frame `2483:82757`: el aviso de multa por atraso usa tarjeta de seis datos y acciones del prototipo; la API crea una notificación interna única con estado `Pendiente`. El resultado dice «Entrega pendiente» hasta contar con envío y acuse externos, a diferencia del ejemplo de Figma «Recibida por Tesorería». Se cotejó la vista en escritorio y a 390 px sin desbordamiento; el flujo de BD se probó con rollback. La ruta queda protegida por permiso `Devoluciones`.
- Frame `2447:114653`: el enlace «Ver lista de espera» de la devolución pasa la clave del libro y abre la consulta correspondiente; conserva el permiso `Préstamos` del servidor. El frame usa libros `B...`; la app consulta las claves `L...` actuales.
- Frames `2483:78618`, `2483:78692`, `2483:78766`, `2483:78916`, `2483:78990`, `2483:79064` y `2483:79138`: se cotejaron las siete respuestas móviles restantes a 390 px. La estructura común mantiene las burbujas, formulario y sugerencias sin desbordamiento. La respuesta de búsqueda ahora menciona los seis filtros reales y ofrece «Ir a Buscar libros» entre las sugerencias y el regreso, como el frame `2483:78766`; la acción desaparece al preguntar otra cosa. Los frames de ejemplo repiten la pregunta de duración aun cuando muestran respuestas distintas; la app presenta la pregunta seleccionada. El texto de plataformas refleja la web adaptable existente, y la respuesta de perfil usa los permisos de la sesión real. El contenido de FAQ de PostgreSQL sigue siendo su fuente, por lo que no se declara identidad literal con cada frase ilustrativa.
- Frames `2046:48434`, `2046:48455` y `2046:48477`: se cotejaron las capturas de listado, vista previa y preparación de impresión con el navegador a 1440 × 960. Las filas compactas, tarjeta, barra de vista previa, documento y panel lateral siguen la composición de Figma; los botones de la lista usan sus anchos de 226/202/153 px. La descarga produce un PDF real A4 generado desde el catálogo, probado con los cinco libros activos; la impresión abre el diálogo del sistema. El recorrido completo también se verificó a 390 px sin desplazamiento horizontal. El prototipo usa dos libros ilustrativos `B...` y muestra una impresora y controles de páginas simulados; la app usa datos `L...` reales y pide seleccionar destino/páginas en el diálogo, por lo que esos detalles no son idénticos.
- Frame `2044:48055`: la portada real del perfil Lector ya tenía Buscar libros, Asistente Ducky y Listado de libros en el orden de Figma, con la descripción y el nombre reales. Se ajustaron las tarjetas a las coordenadas del frame de 1440 × 960: primera tarjeta `(276,216;1132×102)`, icono `(301,241;24×24)`, texto `(349,241;750×52)` y botón `(1123,241;140×48)`; las otras tarjetas conservan separación de 16 px. Se verificó la navegación visual en 390 px sin desplazamiento horizontal. El menú lateral muestra solo las funciones autorizadas, aunque el frame ilustrativo contiene todas las rutas.
- Frames `2483:78478`, `2483:78544` y `2483:78843`: el asistente móvil usa marca, título, subtítulo, tarjeta de conversación, campo, botón y dos grupos de sugerencias a 390 px como Figma. El usuario y la respuesta ocupan burbujas separadas; la respuesta no repite la pregunta y las fuentes de reglas compartidas se presentan de forma compacta. Se cotejaron en navegador el estado inicial, una respuesta de préstamos y una pregunta sin coincidencia; esta última ofrece los temas disponibles como el prototipo. Las otras siete respuestas móviles se cotejaron después, según el registro anterior.
- En móvil, «Volver a Buscar libros» lleva a la búsqueda; en escritorio se mantiene «Volver al inicio». La API y los permisos del asistente siguen siendo los mismos.

## Cotejo adicional del 13 de noviembre de 2026

- Frames `2483:80899`, `2483:81248`, `2483:81588`, `2483:81913` y `2483:82244`: la boleta ofrece revisión del correo registrado, envío con PDF y confirmación solo cuando Resend acepta la petición; el PDF se genera desde el préstamo confirmado y el servidor no acepta destinatarios arbitrarios. Se cotejaron en navegador a 1440 × 960 la revisión del correo, la confirmación y el formulario de WhatsApp con datos temporales, que se eliminaron. El servidor consultó un préstamo activo real sin enviar correo ni alterar la BD. El remitente de prueba `onboarding@resend.dev` solo permite entregas a la cuenta autorizada del propietario hasta verificar un dominio.
- WhatsApp conserva el formulario de diez dígitos y el estado de error del prototipo. Sin una integración de WhatsApp Business no existe confirmación automática de entrega: el usuario descarga el PDF, abre un mensaje preparado y lo adjunta manualmente. La pantalla final indica «pendiente de envío manual» en vez del «Enviado» de Figma; esta diferencia evita afirmar una entrega inexistente.
- Frames móviles `2258:48820`, `2258:48824`, `2258:48828`, `2258:48832`, `2258:48836` y `2258:48848`: la ficha física/digital, ubicación, ejemplar prestado y resultado de solicitud usan pantallas completas a 390 px y datos de API. Se cotejaron visualmente las seis vistas y la navegación entre ellas con datos sintéticos; la consulta real de PostgreSQL devolvió cuatro ubicaciones para el mapa. Los libros usan claves reales `L...`; el mapa presenta las zonas registradas, sin inventar las zonas `S-01` a `S-04` del ejemplo de Figma. La solicitud muestra folio y «ejemplar por asignar» porque la API reserva el título, no una copia específica. Dos toques rápidos no crean dos solicitudes.
- El frame `2258:48832` contiene una página ilustrativa de lectura. La BD local enlaza `L000132` a `biblioteca.ducky.edu.mx`, nombre que no resuelve; por eso la app ofrece el enlace registrado y no finge mostrar el contenido de un PDF. Hace falta una URL real o un archivo autorizado para completar esa pantalla funcionalmente.
- Frames móviles `2258:48816`, `2258:48840` y `2258:48844`: resultados, ausencia de coincidencias y filtros inválidos ahora usan pantallas móviles propias. Las tarjetas de resultados quedaron a (24, 204; 342 × 218) y (24, 438; 342 × 218) a 390 px, como en Figma; «Modificar búsqueda», «Cambiar filtros» y «Corregir búsqueda» vuelven al formulario conservando lo escrito. Se verificaron los tres estados y el retorno en navegador con datos temporales. El texto de ISBN inválido difiere porque la base acepta ISBN de 10 o 13 caracteres y la búsqueda parcial existente no se restringió a 13 dígitos.
- Frame móvil `2258:48812`: se midió la página local a 390 × 1028 en navegador. Marca, título, subtítulo, dos acciones, seis campos y botones quedaron en las mismas coordenadas principales del frame: marca (24, 24), primer campo (24, 268), último campo (24, 788), Buscar (24, 892) y Limpiar (24, 956). Se ocultó la barra superior solo en esta vista móvil y se ajustaron fuente, márgenes y separaciones; el menú lateral permanece disponible en otras páginas.
- Frames `2447:108630` y `2447:108979`: registro/boleta de préstamo presentan folio, usuario, libro, ejemplar, fechas, disponibilidad y multa diaria obtenidos del préstamo real. Autorizar una solicitud ahora conduce al mismo recibo que el registro directo. Se cotejaron visualmente ambos estados con una vista sintética temporal eliminada; la consulta SQL y el flujo de autorización se probaron con rollback o dobles de la API. No se registró un préstamo real para esa captura.
- Los diez estados móviles de búsqueda ya tienen cotejo por pantalla. Siguen pendientes estados secundarios de acceso, usuarios, compras y circulación, así como la compatibilidad de claves `B...` de Figma con `L...` de PostgreSQL. La paridad se acredita únicamente para los estados y medidas indicados arriba.

## Revisión del 13 de noviembre de 2026

### Acceso

- Frames `2006:941` y `2198:48700`: cotejo visual del acceso y el diálogo de perfiles. El selector ya estaba implementado y la API sigue rechazando perfiles ajenos a la cuenta. Se ajustaron las medidas de la página a las coordenadas del frame original de 1440 × 960: logo (48, 48; 504 × 430), encabezado institucional (48, 502), título de acceso (680, 212), campos (680, 308) y acción principal (680, 524). Se verificó el diálogo y una vista móvil de 390 px sin comparar esta última con un frame móvil específico. Las cuentas de ejemplo muestran las claves reales de la base, distintas de las ilustrativas de Figma; no se afirma paridad de todos los estados de acceso.

### Búsqueda

- Frame `2013:31577`: los seis filtros y las acciones ya estaban conectados. La pantalla de 1440 × 960 se ajustó a las coordenadas del prototipo: accesos (276, 176), tarjeta (276, 240; 1132 × 386), campos (301, 305) y acciones (276, 642). Se comprobó en navegador que «Ejemplo por ISBN» encuentra una ficha real y «Limpiar filtros» borra los resultados. La clave ilustrativa `B...` de Figma sigue siendo `L...` en PostgreSQL; los estados secundarios y móviles tienen cotejos separados y no se declaran idénticos en este bloque.

### Compras y Tesorería

- Frames `2261:48852` y `2261:48856`: recepción con encabezado, orden autorizada, título, ISBN, cantidad, condición inicial y acción de confirmar; resultado con folio/cantidad, siguiente paso y navegación a ficha o catálogo. La app mantiene un selector de ubicación necesario para registrar ejemplares físicos. Se cotejó en navegador el estado vacío real y se compararon la orden y los resultados con datos sintéticos sin modificar la base. Si la orden contiene un título nuevo, la acción abre el formulario de ficha con sus datos; si contiene fichas existentes, enlaza la primera ficha y muestra las etiquetas reales. El prototipo ilustra una sola orden y no representa la selección de ubicación ni órdenes con varios títulos; no se afirma paridad exacta para esos casos.
- Frames `2011:28537`, `2011:28878`, `2257:48827`, `2011:29200` y `2011:29522`: la solicitud inicial muestra acciones, campos de contexto y resumen de libros; el formulario ampliado permanece en «Ver solicitud / agregar más». La revisión es una vista reversible y el resultado/consulta muestran datos reales de la orden. Se cotejaron en navegador con un borrador no enviado y una solicitud anterior.
- Frame `2011:29860`: el intento de revisar sin libros presenta la alerta de solicitud no enviada, conserva presupuesto/destinatario y los datos parciales de título/peticionario, y permite regresar a añadir. Se verificó visualmente y sin crear una orden. `2011:30194` y `2257:48831` son recorridos ilustrativos del prototipo que no tienen todavía una fuente de peticiones de usuarios conectada; siguen pendientes.
- La base no tiene presupuesto para el mes actual de la revisión; por eso «Enviar a Tesorería» queda deshabilitado en la revisión. La aplicación registra órdenes internas dirigidas a Tesorería, sin integración de correo o sistema externo. El texto del resultado lo aclara. No se afirma paridad de los demás estados alternos ni del diseño móvil.

### Modificación y baja de libros

- Frames `2010:26016`, `2010:26334`, `2010:26657` y `2010:26667`: se compararon las cuatro vistas con la app en navegador. La edición presenta resultado, ubicación real, sinopsis y copias. La baja muestra motivo y descripción, requiere confirmación reversible y presenta la salida del catálogo. El resultado se cotejó con un libro ya retirado; el diálogo se canceló sin modificar otro libro activo.
- El motivo y operador ahora se guardan en `bajas_libro` en la misma transacción que cambia el estatus. La migración `002_bajas_libro` es aditiva y se aplicó en local. Los libros retirados antes de ella no tienen motivo histórico registrado; la vista no inventa uno.
- El frame de modificación enseña una ubicación y condición concretas, mientras un libro real puede tener varias. La app resume los ejemplares reales y conserva la tabla detallada en la ficha. Las claves siguen `L...` por el esquema actual, frente a `B...` del diseño. No se afirma paridad completa.

### Continuación: éxito de usuario y alta de catálogo

- Frame `2007:5551`: se implementó el encabezado, alerta de alta, tarjeta de datos institucionales, registro de operación y acciones. La contraseña temporal necesaria para el primer acceso aparece en una tarjeta adicional después de las acciones. La base guarda solo fecha (sin hora) y datos institucionales replicados, así que la operación muestra la fecha real y no repite la afirmación del prototipo de que esos datos no se duplican. Se cotejó visualmente con una vista temporal sintética; no se creó un usuario real.
- Frames `2010:23976`, `2010:24662` y `2010:25002`: la creación de ficha muestra los datos guardados y conduce a una revisión antes de llamar a la API de alta. La revisión usa ejemplares reales para ubicación, condición y disponibilidad; si no hay copias etiquetadas, bloquea la confirmación y ofrece ir a etiquetar. La operación terminada presenta el resultado y las acciones del prototipo. Se comprobaron las tres vistas, cancelación y confirmación con una vista sintética sin escribir en la base; el controlador y su ruta de reintento tienen pruebas automatizadas.
- Continúan pendientes las claves `B...` frente a `L...`, edición directa de ubicación/condición desde el formulario de libro y el cotejo integral de compras, errores y móvil. No se afirma paridad total.
- Frames `2010:24321` y `2010:25317`: la ficha para etiquetado ya muestra los seis datos y la clave real al pie. «Continuar al alta» abre la revisión; una ficha sin ejemplares queda bloqueada con enlace directo a etiquetar. La consulta de un libro activo usa tarjeta bibliográfica, sinopsis y resumen de disponibilidad como el frame; los metadatos adicionales y las acciones por ejemplar siguen accesibles en un panel desplegable. «Cambiar condición» abre ese panel y enfoca una copia concreta. Se comprobó en navegador con libros reales sin mutar datos.
- La acción «Disponibilidad en otra biblioteca» del frame `2010:25317` continúa pendiente: la base y API actuales no tienen registros de acervos externos. No se muestra un control que aparentaría funcionar sin fuente de datos.

- Se consultaron los frames `2007:5205` (registrar usuario), `2007:5551` (registro exitoso), `2009:19980` (perfiles), `2009:20306` (crear perfil), `2010:23633` (registrar ficha) y `2010:25664` (modificar libro), y se compararon con la app local.
- Registro de usuario: orden y agrupación de Clave/Perfil y datos institucionales, breadcrumb y separación vertical ajustados al frame `2007:5205`. Se comprobó en navegador que la consulta institucional presenta Clave, Nombre, Tipo y Correo en ese orden, y que Lector queda como perfil inicial.
- Perfiles: la lista usa filas seleccionables de 56 px, cinco columnas y acciones globales bajo la lista; la creación presenta Datos del perfil y seis funciones principales en dos columnas. Se verificaron lista, selección, edición, cancelación y creación en navegador sin guardar cambios de prueba. Otras tres funciones reales permanecen en «Funciones adicionales».
- **No hay paridad completa.** El éxito del registro `2007:5551` aún presenta la contraseña temporal necesaria para acceder y no coincide exactamente con el frame. La composición principal de los formularios de libro `2010:23633` y `2010:25664` se cotejó el 16 de noviembre, pero el prototipo supone claves `B...` y edición directa de ubicación/condición, mientras PostgreSQL usa claves `L...` y contratos de libro/ejemplar separados. Estas diferencias requieren una decisión de datos antes de afirmar equivalencia funcional.
- No se han cotejado todos los estados de error, las compras, las diez vistas móviles ni el resto de fotogramas de las secciones 00–10. La alineación se acredita por pantalla y estado comprobados, no por el prototipo completo.
- Fichas `2010:23633` y `2010:25664`: se alinearon las acciones superiores, el orden visual de Clave/ISBN/Título/Autor/Tema/Editorial, el bloque «Sinopsis y ejemplares» y el control de copias. La app muestra la clave real `L...` en edición y anuncia que se genera al guardar en creación. Los campos adicionales operativos se mantienen bajo las dos tarjetas del prototipo. Se verificaron creación, sinopsis de ejemplo, cambio a Digital y edición en navegador sin guardar. Sigue pendiente la edición de ubicación y condición de ejemplar tal como aparece en Figma; el formulario actual edita la ficha bibliográfica y la base separa ejemplares.

| Sección de Figma | Estado antes de esta revisión | Diferencia comprobada |
| --- | --- | --- |
| 00 Acceso y sesión (`2006:941`) | Parcial | Acceso y selector de perfil cotejados en escritorio. Faltan estados alternos y contraste con un frame móvil específico. |
| 01 Administrador del sistema (`2006:1313`) | Parcial | Portada principal cotejada a 1440 × 960: barra de compras, siete tarjetas, iconos y botones siguen las coordenadas del frame. Nombre y permisos son datos reales; quedan estados secundarios. |
| 02 Biblioteca: usuarios y compras (`2043:46958`, `2007:4863`, `2011:28537`) | Parcial | Portada de biblioteca, gestión principal de usuarios y compra principal cotejadas. Quedan diferencias de estados y acciones secundarias. |
| 03 Catálogo (`2043:47677`, `2010:23308`) | Parcial | Portada de catálogo con dos tarjetas cotejada; fichas y catálogo principales revisados. Quedan estados y edición de ejemplares. |
| 04 Lector (`2044:48055`, `2046:48434`, `2046:48455`, `2046:48477`) | Parcial | Inicio, listado, PDF e impresión cotejados en escritorio; listado y recorrido también a 390 px. Los libros y la impresora simulados en Figma difieren de los datos y el diálogo reales. |
| 05 Consulta compartida (`2013:31577`) | Parcial | La búsqueda principal tiene seis filtros en dos columnas y los accesos del frame; faltan otros estados de resultado y cotejo móvil completo. |
| 06 Circulación conservada (`2014:35297`) | Parcial | Solicitud, autorización, devolución y espera funcionan; faltan cotejos de estados secundarios. |
| 07 App móvil (`2258:48812`) | Parcial | Los diez estados tienen interfaz y navegación a 390 px. Ubicación usa zonas reales y el lector requiere un PDF/URL válido; no hay paridad de contenido ilustrativo. |
| 08 Préstamo (`2447:106950`) | Parcial | Registro, renovación, espera, impresión y envío por correo con PDF funcionan. WhatsApp requiere adjuntar y enviar manualmente; faltan estados secundarios. |
| 09 Devolución (`2465:98968`, `2465:100993`, `2465:101339`, `2465:101690`, `2465:102038`, `2483:82757`) | Parcial | Cuatro comprobantes y el aviso de multa cotejados; la copia dañada queda en revisión. Los correos de espera y el envío/acuse de Tesorería siguen pendientes de integración externa. |
| 10 Asistente (`2483:74914`) | Parcial | Estructura principal y respuesta de búsqueda cotejadas en escritorio; ocho preguntas y diez estados móviles ya revisados. La consulta real de catálogo enlaza Buscar libros; faltan sus detalles visuales y otros estados secundarios. |

La referencia visual mantiene Manrope, colores `#142B45`, `#F5F7FA`, `#DCE3EC`, sidebar de 244 px y contenido con margen de 32 px a 1440 × 960. Los logos locales Ducky y FlowBit coinciden visualmente con las imágenes originales del diseño. Los perfiles y permisos reales siguen validándose en el servidor aunque algunos fotogramas ilustrativos del Figma muestren navegación no autorizada.

Orden de trabajo: alinear shell, login, inicio y búsqueda; después completar los flujos 08 y 09 con las reglas existentes y verificar sus estados; por último cotejar todos los estados secundarios y las vistas móviles. Cada avance debe identificar los nodos de Figma revisados, pruebas y diferencias restantes en `CAMBIOS_Y_PLAN.txt`.

## Avance local del 11 de noviembre de 2026

- Se cotejaron visualmente en navegador los frames `2006:941`, `2198:48700`, `2006:1313`, `2013:31577`, `2258:48812`, `2447:106950`, `2447:107284`, `2447:108277`, `2465:98968` y `2465:100295`. Acceso, inicio y búsqueda ahora usan su distribución, textos y acciones principales; la búsqueda móvil tiene una presentación propia.
- Los frames `2447:112316`, `2447:114653` y `2447:115298` guiaron renovación y lista de espera. El registro directo, la renovación y la devolución usan prevalidación reversible y confirmación transaccional. Los registros de espera se limitan a libros activos sin copias disponibles.
- La pantalla `devoluciones.html` sigue los frames `2465:98968`, `2465:99306` y `2465:100295`. El navegador verificó la revisión de una devolución vencida y el cálculo simulado de multa, sin registrar una devolución real.
- Se implementaron los flujos de libro perdido, consulta de multas y registro de pagos desde los frames `2465:102377`, `2465:103366`, `2465:104054` y `2465:104703`. La pérdida tiene revisión reversible y confirmación transaccional; el pago registra el folio de Tesorería y cambia el estado de la multa mediante el trigger existente. El navegador verificó la revisión de una pérdida y las pantallas de multas y pago sin confirmar cambios reales.
- **Aún no hay paridad completa.** Faltan recibos/avisos secundarios, comparación de estados de error, y cotejo visual detallado de usuarios, perfiles, catálogo, compras y asistente. El prototipo omite la captura del tipo de cambio; la aplicación la solicita porque la regla SQL calcula la reposición en MXN desde el último precio en USD y no existe una fuente automática de tipo de cambio verificada.
- «Avisar adeudos» y «reportar pérdida» crean avisos internos en la base de datos. No hay integración de envío real a Tesorería ni Servicios Escolares; la interfaz y la demostración deben distinguir registro interno de entrega externa.
- Gestión de usuarios (`2007:4863`) se cotejó en escritorio: filtros del mismo ancho, lista de filas de 56 px y acciones globales bajo la tarjeta. La selección de una fila habilita consultar, dar de baja o reactivar según su estado; los identificadores y nombres son datos reales de PostgreSQL.
- Gestionar libros (`2010:23308`) se cotejó en navegador: acceso a recepción, filas compactas con clave, ISBN, autor, editorial y condición, y acciones debajo como en el frame. La lista desplaza todos los registros reales dentro de la altura de las dos filas de ejemplo; seleccionar uno habilita consultar su ficha. El filtro administrativo previo permanece cerrado bajo las acciones para consultar fichas creadas o retiradas sin perder esa función.
- Asistente (`2483:74914`) se cotejó en navegador: conversación inicial, pregunta, ocho sugerencias en dos grupos y regreso al inicio. Las cinco preguntas adicionales del prototipo tienen respuestas explícitas sobre la aplicación; las tres preguntas de reglas conservan sus respuestas y fuentes vigentes en PostgreSQL. No se ofrece información de préstamos personales en esta versión.
- Figma ilustra matrículas de siete caracteres y ejemplares que comienzan con `B`; el esquema existente acepta claves de usuario de seis caracteres y ejemplares `L...`. Los formularios usan ejemplos válidos para la base actual. Cambiar identificadores exige una migración compatible y revisión de todos los contratos; queda pendiente.
