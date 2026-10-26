/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
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
    funciones: ['Préstamos']
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
    texto: 'Recepción, fichas, catálogo y listados.',
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
    id: 'lista',
    titulo: 'Listado de libros',
    texto: 'Visualiza un listado de los libros disponibles y formatos.',
    url: 'lista_libros.html',
    icono: 'document',
    funciones: ['Buscar libros']
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
        inicio_view.servicios(SERVICIOS.filter((registro) => !registro.funciones || registro.funciones
            .some((filtro) => usuario.funciones.includes(filtro))));

    }
};
