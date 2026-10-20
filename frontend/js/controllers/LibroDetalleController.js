/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of libro_detalle.html: alta en         */
/*              catálogo, labeling copies, condition change, copy */
/*              baja and retirement of the book.                  */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   LibroDetalleController.iniciar()      - Layout + load        */
/*   LibroDetalleController.cargar()       - Draw the ficha       */
/*   LibroDetalleController.alta()         - Activo en catálogo   */
/*   LibroDetalleController.ejemplares()   - Label copies         */
/*   LibroDetalleController.condicion(e)   - Change condition/use */
/*   LibroDetalleController.baja(e)        - Copy baja            */
/*   LibroDetalleController.retirar()      - Book baja            */
/******************************************************************/

const LibroDetalleController =
{
    id: null,
    ficha: null,
    catalogos: null,

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'libros', migas: 'Gestionar libros / Consultar libro', funciones: ['Gestionar libros'] });
        if (!usuario) return;
        this.id = Ui.param('id');
        if (Ui.param('ok') === 'editado') LibroDetalleView.mensaje('ok', 'Libro modificado exitosamente');
        try { this.catalogos = await LibroModel.catalogos(); } catch (e) { /* loaded on demand */ }
        this.cargar();
    },

    cargar: async function()
    {
        try
        {
            this.ficha = await LibroModel.detalle(this.id);
            LibroDetalleView.ficha(this.ficha,
            {
                alta: () => this.alta(), ejemplares: () => this.ejemplares(), retirar: () => this.retirar(),
                condicion: (e) => this.condicion(e), baja: (e) => this.baja(e)
            });
        }
        catch (error) { LibroDetalleView.mensaje('error', error.message); }
    },

    ejecutar: async function(promesa)
    {
        try
        {
            const r = await promesa;
            LibroDetalleView.mensaje('ok', r.mensaje);
            this.cargar();
        }
        catch (error) { LibroDetalleView.mensaje('error', error.message); }
    },

    alta: function() { this.ejecutar(LibroModel.activar(this.id)); },

    ejemplares: async function()
    {
        let r = null;
        const ok = await LibroDetalleView.dialogo_ejemplares(this.ficha.libro.formato === 'Digital', this.catalogos,
            async (datos) => { r = await LibroModel.agregar_ejemplares(this.id, datos); });
        if (ok) { LibroDetalleView.mensaje('ok', r.mensaje); this.cargar(); }
    },

    condicion: async function(ejemplar)
    {
        let r = null;
        const ok = await LibroDetalleView.dialogo_condicion(ejemplar, this.catalogos, this.ficha.libro.formato === 'Digital',
            async (datos) => { r = await LibroModel.actualizar_ejemplar(ejemplar.id_ejemplar, datos); });
        if (ok) { LibroDetalleView.mensaje('ok', r.mensaje, 'Ejemplar ' + ejemplar.id_ejemplar); this.cargar(); }
    },

    baja: async function(ejemplar)
    {
        let r = null;
        const ok = await LibroDetalleView.dialogo_baja(ejemplar, this.catalogos.motivos, async (id_motivo, descripcion) =>
        {
            if (!id_motivo) throw Object.assign(new Error('Selecciona el motivo de baja'), { campos: ['id_motivo'] });
            r = await LibroModel.baja_ejemplar(ejemplar.id_ejemplar, { id_motivo: Number(id_motivo), descripcion: descripcion });
        });
        if (ok) { LibroDetalleView.mensaje('ok', r.mensaje); this.cargar(); }
    },

    retirar: async function()
    {
        const ok = await Ui.dialogo(
        {
            titulo: 'Confirmar baja del libro',
            texto: '"' + this.ficha.libro.titulo + '" dejará de aparecer en las búsquedas. El historial se conserva.',
            confirmar: 'Dar de baja libro', peligro: true
        });
        if (ok) this.ejecutar(LibroModel.retirar(this.id));
    }
};
