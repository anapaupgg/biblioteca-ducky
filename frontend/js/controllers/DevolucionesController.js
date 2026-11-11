/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Coordina consulta y devolución de ejemplares.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, abrir, buscar, devolver.    */
/* Reuse Instructions: la vista maneja DOM; el modelo maneja API. */
/******************************************************************/

const devoluciones_controller =
{
    ejemplar: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar({
            activo: 'prestamos', migas: 'Devoluciones', funciones: ['Devoluciones']
        });
        if (!usuario) return;
        devoluciones_view.enlazar({
            abrir: () => this.abrir(),
            volver: () => this.volver(),
            buscar: (id) => this.buscar(id),
            devolver: (condicion) => this.devolver(condicion),
            pendiente: () => devoluciones_view.mensaje('info', 'Próximo flujo',
                'Este flujo se está alineando con el prototipo de Figma.')
        });
        await this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            devoluciones_view.activos(await circulacion_model.activos());
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudieron cargar los préstamos', error.message);
        }
    },

    abrir: function ()
    {
        this.ejemplar = null;
        devoluciones_view.mostrar('buscar-devolucion');
    },

    volver: async function ()
    {
        this.ejemplar = null;
        devoluciones_view.mostrar('devoluciones');
        await this.cargar();
    },

    buscar: async function (id)
    {
        try
        {
            const datos = await circulacion_model.validar_devolucion({
                id_ejemplar: id, condicion: 'Bueno'
            });
            this.ejemplar = id;
            devoluciones_view.mostrar('revisar-devolucion');
            devoluciones_view.revision(datos);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se puede devolver el ejemplar', error.message);
        }
    },

    devolver: async function (condicion)
    {
        if (!this.ejemplar) return;
        try
        {
            const datos = await circulacion_model.devolver({
                id_ejemplar: this.ejemplar, condicion
            });
            this.ejemplar = null;
            devoluciones_view.recibo(datos);
            devoluciones_view.mostrar('recibo-devolucion');
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudo confirmar la devolución', error.message);
        }
    }
};
