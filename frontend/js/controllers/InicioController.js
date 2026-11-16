/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   inicio_controller.iniciar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const SERVICIOS = [
{
    id: 'pedidos',
    titulo: 'Solicitudes de compra a Tesorería',
    texto: 'Peticiones de usuarios dentro del presupuesto mensual.',
    url: 'pedidos.html',
    icono: 'cart',
    boton: 'Abrir solicitudes',
    funciones: ['Solicitar compras', 'Autorizar compras']
},
{
    id: 'usuarios',
    titulo: 'Gestión de usuarios',
    texto: 'Alta, baja, modificación y reactivación.',
    url: 'usuarios.html',
    icono: 'usuarios',
    funciones: ['Gestionar usuarios']
},
{
    id: 'perfiles',
    titulo: 'Perfiles y permisos',
    texto: 'Funciones autorizadas y administración de perfiles.',
    url: 'perfiles.html',
    icono: 'lock',
    funciones: ['Gestionar perfiles']
},
{
    id: 'libros',
    titulo: 'Gestionar libros',
    texto: 'Fichas, catálogo, solicitudes y listados.',
    url: 'libros.html',
    icono: 'book',
    funciones: ['Gestionar libros']
},
{
    id: 'buscar',
    titulo: 'Buscar libros',
    texto: 'Encuentra títulos, ubicación y disponibilidad.',
    url: 'buscar.html',
    icono: 'search',
    funciones: ['Buscar libros']
},
{
    id: 'prestamos',
    titulo: 'Préstamo de libros',
    texto: 'Registra préstamos, devoluciones, multas y lista de espera.',
    url: 'prestamos.html',
    icono: 'retorno',
    funciones: ['Préstamos']
},
{
    id: 'chatbot',
    titulo: 'Asistente Ducky',
    texto: 'Conoce el sistema y resuelve dudas de préstamos, multas y búsqueda.',
    url: 'chatbot.html',
    icono: 'document',
    funciones: ['Chatbot']
},
{
    id: 'lista',
    titulo: 'Listado de libros',
    texto: 'Visualiza un listado de los libros disponibles y formatos.',
    url: 'lista_libros.html',
    icono: 'document',
    funciones: ['Buscar libros'],
    solo_lector: true
}];

const inicio_controller =
{
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'inicio',
            migas: 'Inicio'
        });
        if (!usuario) return;

        inicio_view.saludo(usuario);
        const es_lector = usuario.perfil === 'Lector';
        const es_catalogo = usuario.perfil === 'Administrador del catálogo';
        inicio_view.perfil_lector(es_lector);
        inicio_view.descripcion(es_lector ?
            'Servicios de consulta para alumnos, profesores y colaboradores.' :
            'Selecciona un servicio de tu perfil.');
        const servicios_visibles = SERVICIOS.filter((registro) =>
            (!registro.solo_lector || es_lector) &&
            registro.funciones.some((filtro) => usuario.funciones.includes(filtro)) &&
            !(es_catalogo && registro.id === 'chatbot')).map((registro) => (
        {
            ...registro,
            texto: es_catalogo && registro.id === 'libros' ?
                'Recepción, fichas, catálogo y listados.' : registro.texto
        }));
        inicio_view.servicios(servicios_visibles);

    }
};
