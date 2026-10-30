/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Coordina vistas y modelo cliente de préstamos.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, autorizar.                   */
/* Reuse Instructions: iniciar una vez; permisos visuales vienen  */
/* de la sesión, la API los comprueba de nuevo.                    */
/******************************************************************/

const prestamos_controller =
{
    funciones: [],

    iniciar: async function ()
    {
        const usuario = await layout.montar({
            activo: 'prestamos',
            migas: 'Préstamos',
            funciones: ['Buscar libros', 'Préstamos']
        });
        if (!usuario) return;
        this.funciones = usuario.funciones;
        prestamos_view.configurar(this.funciones.includes('Buscar libros'),
            this.funciones.includes('Préstamos'));
        await this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            const [mios, pendientes] = await Promise.all([
                this.funciones.includes('Buscar libros') ? prestamo_model.mios() : null,
                this.funciones.includes('Préstamos') ? prestamo_model.pendientes() : null
            ]);
            if (mios) prestamos_view.mios(mios);
            if (pendientes) prestamos_view.pendientes(pendientes,
                (folio, id_ejemplar) => this.autorizar(folio, id_ejemplar));
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudieron cargar los préstamos', error.message);
        }
    },

    autorizar: async function (folio, id_ejemplar)
    {
        try
        {
            const prestamo = await prestamo_model.autorizar(folio, id_ejemplar);
            prestamos_view.mensaje('ok', 'Préstamo autorizado',
                'Préstamo ' + prestamo.id_prestamo + ' · vence ' + ui.fecha(prestamo.fecha_vencimiento));
            await this.cargar();
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo autorizar el préstamo', error.message);
            await this.cargar();
        }
    }
};
