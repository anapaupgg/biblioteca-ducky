/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controlador de lista_libros.html.                 */
/******************************************************************/

const ListaLibrosController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'lista', migas: 'Lista de libros', funciones: ['Buscar libros'] });
        if (!usuario) return;
        document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
        document.getElementById('btn-actualizar').addEventListener('click', async () =>
        {
            await this.cargar();
            ListaLibrosView.mensaje('ok', 'Lista de libros actualizada');
        });
        this.cargar();
    },

    cargar: async function()
    {
        try { ListaLibrosView.tabla(await BusquedaModel.listado()); }
        catch (error) { ListaLibrosView.mensaje('error', error.message); }
    }
};
