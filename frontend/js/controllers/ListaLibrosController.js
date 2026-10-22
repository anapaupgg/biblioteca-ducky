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
            if (await this.cargar()) ListaLibrosView.mensaje('ok', 'Lista de libros actualizada');
        });
        this.cargar();
    },

    cargar: async function()
    {
        const imprimir = document.getElementById('btn-imprimir');
        const actualizar = document.getElementById('btn-actualizar');
        imprimir.disabled = true;
        actualizar.disabled = true;
        ListaLibrosView.mensaje();
        try
        {
            ListaLibrosView.tabla(await BusquedaModel.listado());
            imprimir.disabled = false;
            return true;
        }
        catch (error)
        {
            document.getElementById('tabla').textContent = '';
            document.getElementById('generado').textContent = '';
            ListaLibrosView.mensaje('error', error.message);
            return false;
        }
        finally { actualizar.disabled = false; }
    }
};
