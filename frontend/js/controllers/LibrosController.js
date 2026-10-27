/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-27 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libros_controller.iniciar() */
/*   libros_controller.cargar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const libros_controller =
{
    // Descarta respuestas de filtros anteriores que terminan más tarde.
    version_consulta: 0,
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'libros',
            migas: 'Gestionar libros',
            funciones: ['Gestionar libros']
        });
        if (!usuario) return;

        libros_view.enlazar(
        {
            cargar: (...argumentos) => this.cargar(...argumentos)
        });
        this.cargar();
    },

    cargar: async function ()
    {
        const version = ++this.version_consulta;
        try
        {
            const filtros = libros_view.filtros();
            const libros = await libro_model.listar(filtros);
            if (version !== this.version_consulta) return;
            if (!filtros.q && !filtros.estatus) libros_view.estadisticas(libros);
            libros_view.tabla(libros, (libro) =>
            {
                window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(libro
                    .id_libro);
            });
        }
        catch (error)
        {
            if (version !== this.version_consulta) return;
            ui.toast('error', error.message);
        }
    }
};
