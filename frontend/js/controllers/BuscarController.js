/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controlador de buscar.html.                       */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   BuscarController.iniciar()     - Layout + events             */
/*   BuscarController.buscar()      - Validate and search         */
/*   BuscarController.solicitar(l)  - Loan request                */
/*   BuscarController.ficha(l)      - Public ficha                */
/******************************************************************/

const BuscarController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'buscar', migas: 'Buscar libros', funciones: ['Buscar libros'] });
        if (!usuario) return;
        document.getElementById('form-buscar').addEventListener('submit', (e) => { e.preventDefault(); this.buscar(); });
        document.getElementById('btn-limpiar').addEventListener('click', () => BuscarView.limpiar_filtros());

        const q = Ui.param('q');
        if (q) { document.getElementById('titulo').value = q; this.buscar(); }
        else document.getElementById('titulo').focus();
    },

    buscar: async function()
    {
        const filtros = BuscarView.filtros();
        Ui.limpiar();
        const usados = Object.values(filtros).filter(Boolean);
        if (usados.length === 0)
        {
            return BuscarView.mensaje('error', 'Escribe al menos un filtro de búsqueda');
        }
        const cortos = ['titulo', 'autor', 'tema', 'editorial'].filter((c) => filtros[c] && filtros[c].length < 3);
        if (filtros.isbn && !/^[0-9X-]+$/i.test(filtros.isbn)) cortos.push('isbn');
        if (cortos.length)
        {
            Ui.marcar(cortos);
            document.getElementById('resultados').innerHTML = '';
            return BuscarView.mensaje('error', 'Verifica los filtros marcados', 'Los textos requieren al menos 3 caracteres y el ISBN solo números.');
        }
        try
        {
            BuscarView.resultados(await BusquedaModel.buscar(filtros), filtros,
                { solicitar: (l) => this.solicitar(l), ficha: (l) => this.ficha(l) });
        }
        catch (error) { Ui.mostrar_error(error, 'mensaje'); }
    },

    solicitar: async function(libro)
    {
        try
        {
            await BuscarView.solicitud(await BusquedaModel.solicitar(libro.id_libro));
            this.buscar();
        }
        catch (error)
        {
            Ui.toast('error', 'No se registró la solicitud', error.message);
        }
    },

    ficha: async function(libro)
    {
        try { BuscarView.ficha(await BusquedaModel.ficha(libro.id_libro)); }
        catch (error) { Ui.toast('error', error.message); }
    }
};
