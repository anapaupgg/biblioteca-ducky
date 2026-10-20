/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of libros.html (Gestionar libros).     */
/******************************************************************/

const LibrosController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'libros', migas: 'Gestionar libros', funciones: ['Gestionar libros'] });
        if (!usuario) return;

        let espera = null;
        document.getElementById('q').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => this.cargar(), 250); });
        document.getElementById('estatus').addEventListener('change', () => this.cargar());
        this.cargar();
    },

    cargar: async function()
    {
        try
        {
            const filtros = LibrosView.filtros();
            const libros = await LibroModel.listar(filtros);
            if (!filtros.q && !filtros.estatus) LibrosView.estadisticas(libros);
            LibrosView.tabla(libros, (l) => { window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(l.id_libro); });
        }
        catch (error) { Ui.toast('error', error.message); }
    }
};
