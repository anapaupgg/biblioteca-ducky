/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Coordina listado, PDF y preparación de impresión. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, vista_pdf, impresion,       */
/* descargar.                                                     */
/* Reuse Instructions: iniciar una vez después de modelo y vista; */
/* el servidor verifica Buscar libros en cada petición.          */
/******************************************************************/

const lista_libros_controller =
{
    disponible: false,
    descargando: false,

    iniciar: async function ()
    {
        const usuario = await layout.montar({
            activo: 'lista',
            migas: 'Lista de libros',
            funciones: ['Buscar libros']
        });
        if (!usuario) return;
        lista_libros_view.enlazar({
            listado: () => lista_libros_view.mostrar('listado'),
            vista_pdf: () => this.vista_pdf(),
            impresion: () => this.impresion(),
            descargar: () => this.descargar()
        });
        await this.cargar();
    },

    cargar: async function ()
    {
        this.disponible = false;
        lista_libros_view.bloquear(true);
        lista_libros_view.vaciar();
        lista_libros_view.mostrar('listado');
        try
        {
            const libros = await busqueda_model.listado();
            lista_libros_view.tabla(libros);
            this.disponible = true;
        }
        catch (error)
        {
            lista_libros_view.mensaje('error', 'No se pudo cargar el listado', error.message);
        }
        finally
        {
            lista_libros_view.bloquear(!this.disponible);
        }
    },

    vista_pdf: function ()
    {
        if (this.disponible) lista_libros_view.mostrar('pdf');
    },

    impresion: function ()
    {
        if (this.disponible) lista_libros_view.mostrar('impresion');
    },

    descargar: async function ()
    {
        if (!this.disponible || this.descargando) return;
        this.descargando = true;
        try
        {
            lista_libros_view.descargar_pdf(await busqueda_model.listado_pdf());
        }
        catch (error)
        {
            lista_libros_view.mensaje('error', 'No se pudo descargar el PDF', error.message);
        }
        finally
        {
            this.descargando = false;
        }
    }
};
