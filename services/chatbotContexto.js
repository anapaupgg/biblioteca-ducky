/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-20 */
/* Description: Información pública del proyecto y de sus flujos. */
/* Listing Contents: temas y responder_temas(consulta). */
/* Reuse Instructions: consulta normalizada; devuelve hasta tres respuestas. */
/* Las fuentes describen el proyecto. No incluir datos de cuentas ni secretos. */
/******************************************************************/

const APP = 'Funciones de Biblioteca Ducky';
const PROYECTO = 'Propuesta de negocio · Flow Bit';

const temas = [
    {
        pregunta: '¿Se venden libros?',
        patron: /\b(venta|ventas|vender|venden|revender|carrito de venta)\b/,
        respuesta: 'La aplicación no vende libros al público. El módulo de compras registra solicitudes internas a Tesorería para adquirir libros para el acervo. Los lectores pueden consultar y solicitar préstamos.',
        fuente: APP
    },
    {
        pregunta: '¿Qué certificación busca el proyecto?',
        patron: /\b(certificacion|certificaciones|certificarse|certificad[oa]s?|norma iso|iso\s*9001|iso)\b/,
        respuesta: 'La propuesta busca facilitar la trazabilidad de procesos como apoyo para una futura certificación ISO 9001:2015. Es una meta del proyecto. No contamos con evidencia de que la certificación se haya obtenido.',
        fuente: PROYECTO
    },
    {
        pregunta: '¿Cómo funcionan las compras?',
        patron: /\b(tesoreria|compras?|adquisicion|presupuestos?|pedidos?)\b/,
        respuesta: 'Biblioteca prepara la solicitud con títulos, cantidades y costos. El sistema verifica el presupuesto y genera un folio. El personal registra la autorización o el rechazo de Tesorería y el perfil de catálogo recibe los ejemplares autorizados. La aplicación lleva el registro interno de la compra.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo solicito o registro un préstamo?',
        patron: /\b(solicit(?:ar|o|ud)|pedir|pido|registr(?:ar|o)|sacar|tramitar|pasos|proceso|hacer)\b.*\bprestamos?\b|\b(como|donde)\b.*\bprestamos?\b|\bprestamos?\b.*\b(solicit(?:ar|o|ud)|registro|pasos|proceso)\b/,
        respuesta: 'Como lector, abre Buscar libros, elige un título y pulsa Solicitar préstamo cuando esté disponible. El personal confirma la entrega. Para registrar un préstamo en mostrador, biblioteca abre Préstamos → Registrar préstamo, captura la matrícula o nómina y la clave del ejemplar, valida y confirma.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo se devuelve un libro?',
        patron: /\b(devolucion(?:es)?|devolver|devuelvo|devuelve|entregar de vuelta)\b/,
        respuesta: 'El personal abre Préstamos → Devoluciones → Registrar devolución y captura la clave del ejemplar. Después revisa el préstamo, indica el estado del libro y confirma. La app registra la devolución y comprueba si corresponde una multa o si hay lista de espera.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo se renueva un préstamo?',
        patron: /\b(renovar|renuevo|renovacion(?:es)?|extender)\b/,
        respuesta: 'El personal entra a Préstamos → Renovar préstamo, identifica el préstamo y valida la nueva fecha. La renovación depende de que el préstamo siga siendo elegible y de los límites del tipo de usuario.',
        fuente: APP
    },
    {
        pregunta: '¿Qué pasa si un libro no está disponible?',
        patron: /\b(lista de espera|sin (?:existencias|ejemplares)|no (?:esta|hay) disponible|reserv(?:a|ar|ado|acion))\b/,
        respuesta: 'Cuando un libro activo se queda sin ejemplares disponibles para préstamo, el personal puede registrar al lector en la lista de espera. Al quedar una copia disponible, la app da prioridad al primer lector notificado.',
        fuente: APP
    },
    {
        pregunta: '¿Qué pasa si pierdo o daño un libro?',
        patron: /\b(perdi|pierdo|perdido|perdida|danado|dano|danar|rompi|reponer|reposicion)\b/,
        respuesta: 'Comunícate con biblioteca. El personal registra la pérdida o la condición del ejemplar en Devoluciones y revisa el cargo que corresponde. Un ejemplar devuelto con daño puede quedar en revisión antes de volver a circular.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo pago o registro una multa?',
        patron: /\b(pago|pagar|liquidar|registrar|folio)\b.*\b(multas?|adeudos?)\b|\b(multas?|adeudos?)\b.*\b(pago|pagar|liquidar|registrar|folio)\b/,
        respuesta: 'El pago se realiza en Tesorería. El personal de biblioteca consulta la multa y registra el folio de Tesorería para actualizar su estado en la app.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo recupero mi contraseña?',
        patron: /\b(olvide|olvidada|restablecer|recuperar|cambiar|resetear)\b.*\b(contrasena|clave de acceso|acceso)\b|\bcontrasena\b.*\b(olvide|perdida|recuperar|restablecer)\b/,
        respuesta: 'En el inicio de sesión, pulsa ¿Olvidaste tu contraseña? y usa el correo registrado. Si el envío está habilitado, recibirás un enlace temporal. Para cambiarla durante una sesión, usa Cambiar contraseña.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo se administran usuarios y perfiles?',
        patron: /\b(perfiles|permisos|registro de usuarios|alta de usuarios?|registrar (?:un )?usuario|baja de usuarios?|administrador(?:es)?)\b/,
        respuesta: 'El administrador del sistema gestiona perfiles y permisos. El personal autorizado puede registrar usuarios, asignar un perfil y cambiar el estado de una cuenta. Cada sesión muestra las acciones que su perfil tiene permitidas.',
        fuente: APP
    },
    {
        pregunta: '¿Cuál es la diferencia entre guardar la ficha y dar de alta?',
        patron: /\b(fichas? bibliograficas?|etiquet(?:a|ado|ar)|dar de alta|alta en catalogo|estante|fila)\b/,
        respuesta: 'La ficha guarda datos como título, autor e ISBN. Cada ejemplar físico recibe una etiqueta y una ubicación. Dar de alta en catálogo activa el título para que aparezca en la búsqueda. La ficha de consulta muestra ubicación y disponibilidad.',
        fuente: APP
    },
    {
        pregunta: '¿Cómo obtengo un PDF del catálogo?',
        patron: /\b(pdf|imprim(?:ir|e)|impresion|exportar|listado)\b/,
        respuesta: 'En Buscar libros → Listado de libros puedes generar y descargar el PDF del acervo activo o preparar la salida para impresión. Si quieres la boleta de un préstamo, el personal puede imprimirla desde el recibo de la operación.',
        fuente: APP
    },
    {
        pregunta: '¿Quién es el Product Owner?',
        patron: /\b(product owner|dueno del producto)\b/,
        respuesta: 'En la presentación del proyecto, el Product Owner de Biblioteca Ducky es el Dr. Felipe de Jesús Rodríguez García.',
        fuente: 'Presentación final · Equipo y roles'
    },
    {
        pregunta: '¿Cómo se construyó Biblioteca Ducky?',
        patron: /\b(mvc|postgresql|postgres|tecnologias?|arquitectura|bases? de datos|node(?: js)?|express|scrum|sprints?|figma|flow bit|flowbit|equipo|quien(?:es)? (?:hizo|creo|desarrollo))\b/,
        respuesta: 'Flow Bit desarrolló el proyecto con Scrum y usó Figma para el prototipo. La aplicación web usa HTML, CSS y JavaScript en el navegador. Node.js y Express ejecutan los controladores y modelos, y PostgreSQL guarda catálogo, cuentas y operaciones. El código sigue MVC.',
        fuente: PROYECTO
    },
    {
        pregunta: '¿Para qué sirve la aplicación?',
        patron: /\b(objetivo|alcance|sirve|proposito|problema|funcionalidades|que incluye|que hace (?:la|el))\b/,
        respuesta: 'Biblioteca Ducky permite consultar el acervo y administrar usuarios, compras, préstamos, devoluciones, multas y lista de espera en una biblioteca universitaria. El asistente orienta sobre sus funciones y reglas.',
        fuente: APP
    },
    {
        pregunta: '¿Desde dónde puedo acceder?',
        patron: /\b(plataforma(?:s)?|celular|movil|navegador(?:es)?|android|ios|instalar)\b/,
        respuesta: 'La versión actual funciona en un navegador de escritorio o móvil. La interfaz se adapta a pantallas pequeñas y necesita acceso al servidor de la biblioteca.',
        fuente: APP
    },
    {
        pregunta: '¿Dónde consulto un libro digital?',
        patron: /\b(pdf digital|recurso en linea|leer en linea|abrir (?:el )?libro digital|enlace digital)\b/,
        respuesta: 'Abre la ficha del libro digital en Buscar libros y usa su enlace si el catálogo tiene un recurso válido. Algunos enlaces del entorno de demostración son ilustrativos.',
        fuente: APP
    }
];

function responder_temas(consulta)
{
    return temas.filter(({ patron }) => patron.test(consulta)).slice(0, 3).map((tema) =>
    ({
        pregunta: tema.pregunta,
        respuesta: tema.respuesta,
        fuentes: [tema.fuente]
    }));
}

module.exports = { temas, responder_temas };
