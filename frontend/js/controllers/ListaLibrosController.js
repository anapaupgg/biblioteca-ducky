/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   lista_libros_controller.iniciar() */
/*   lista_libros_controller.cargar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const lista_libros_controller =
{
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'lista',
            migas: 'Lista de libros',
            funciones: ['Buscar libros']
        });
        if (!usuario) return;
        lista_libros_view.enlazar(async () =>
        {
            if (await this.cargar()) lista_libros_view.mensaje('ok',
                'Lista de libros actualizada');
        });
        this.cargar();
    },

    cargar: async function ()
    {
        let fallo = true;
        lista_libros_view.bloquear(true, true);
        lista_libros_view.mensaje();
        try
        {
            lista_libros_view.tabla(await busqueda_model.listado());
            fallo = false;
            return true;
        }
        catch (error)
        {
            lista_libros_view.vaciar();
            lista_libros_view.mensaje('error', error.message);
            return false;
        }
        finally
        {
            lista_libros_view.bloquear(fallo, false);
        }
    }
};
