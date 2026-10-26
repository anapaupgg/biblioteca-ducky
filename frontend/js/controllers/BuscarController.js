/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   buscar_controller.iniciar() */
/*   buscar_controller.buscar() */
/*   buscar_controller.solicitar(libro) */
/*   buscar_controller.ficha(libro) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const buscar_controller =
{
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'buscar',
            migas: 'Buscar libros',
            funciones: ['Buscar libros']
        });
        if (!usuario) return;
        buscar_view.enlazar(
        {
            buscar: (...argumentos) => this.buscar(...argumentos)
        });

        const consulta = ui.param('q');
        if (consulta)
        {
            buscar_view.titulo(consulta);
            this.buscar();
        }
        else buscar_view.enfocar();
    },

    buscar: async function ()
    {
        const filtros = buscar_view.filtros();
        ui.limpiar();
        buscar_view.vaciar();
        buscar_view.mensaje();
        const usados = Object.values(filtros).filter(Boolean);
        if (usados.length === 0)
        {
            return buscar_view.mensaje('error', 'Escribe al menos un filtro de búsqueda');
        }
        const cortos = ['titulo', 'autor', 'tema', 'editorial'].filter((campo) => filtros[campo] &&
            filtros[campo].length < 3);
        if (filtros.isbn && !/^[0-9X-]+$/i.test(filtros.isbn)) cortos.push('isbn');
        if (cortos.length)
        {
            ui.marcar(cortos);
            buscar_view.vaciar();
            return buscar_view.mensaje('error', 'Verifica los filtros marcados',
                'Los textos requieren al menos 3 caracteres y el ISBN solo números.');
        }
        try
        {
            buscar_view.resultados(await busqueda_model.buscar(filtros), filtros,
            {
                solicitar: (libro_2) => this.solicitar(libro_2),
                ficha: (libro_3) => this.ficha(libro_3)
            });
        }
        catch (error)
        {
            ui.mostrar_error(error, 'mensaje');
        }
    },

    solicitar: async function (libro)
    {
        try
        {
            await buscar_view.solicitud(await busqueda_model.solicitar(libro.id_libro));
            this.buscar();
        }
        catch (error)
        {
            ui.toast('error', 'No se registró la solicitud', error.message);
        }
    },

    ficha: async function (libro)
    {
        try
        {
            buscar_view.ficha(await busqueda_model.ficha(libro.id_libro));
        }
        catch (error)
        {
            ui.toast('error', error.message);
        }
    }
};
