/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Home controller. Picks the services authorized    */
/*              to the profile.                                   */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   SERVICIOS                     - Catalog of services          */
/*   InicioController.iniciar()    - Mount layout and services    */
/******************************************************************/

const SERVICIOS =
[
    { id: 'pedidos',     titulo: 'Solicitudes de compra a Tesorería', texto: 'Peticiones de usuarios dentro del presupuesto mensual.', url: 'pedidos.html', icono: 'cart', funciones: ['Préstamos'] },
    { id: 'usuarios',    titulo: 'Gestión de usuarios',  texto: 'Alta, baja, modificación y reactivación.',        url: 'usuarios.html',    icono: 'usuarios', funciones: ['Gestionar usuarios'] },
    { id: 'perfiles',    titulo: 'Perfiles y permisos',  texto: 'Funciones autorizadas y administración de perfiles.', url: 'perfiles.html', icono: 'lock',   funciones: ['Gestionar perfiles'] },
    { id: 'libros',      titulo: 'Gestionar libros',     texto: 'Recepción, fichas, catálogo y listados.',         url: 'libros.html',      icono: 'book',     funciones: ['Gestionar libros'] },
    { id: 'buscar',      titulo: 'Buscar libros',        texto: 'Encuentra títulos, ubicación y disponibilidad.',  url: 'buscar.html',      icono: 'search',   funciones: ['Buscar libros'] },
    { id: 'lista',       titulo: 'Listado de libros',    texto: 'Visualiza un listado de los libros disponibles y formatos.', url: 'lista_libros.html', icono: 'document', funciones: ['Buscar libros'] }
];

const InicioController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'inicio', migas: 'Inicio' });
        if (!usuario) return;

        InicioView.saludo(usuario);
        InicioView.servicios(SERVICIOS.filter((s) => !s.funciones || s.funciones.some((f) => usuario.funciones.includes(f))));

    }
};
