/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_detalle_controller.iniciar() */
/*   libro_detalle_controller.cargar() */
/*   libro_detalle_controller.ejecutar(promesa) */
/*   libro_detalle_controller.alta() */
/*   libro_detalle_controller.ejemplares() */
/*   libro_detalle_controller.condicion(ejemplar) */
/*   libro_detalle_controller.baja(ejemplar) */
/*   libro_detalle_controller.retirar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const libro_detalle_controller =
{
    id: null,
    ficha: null,
    catalogos: null,
    modo: null,
    procesando_alta: false,

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'libros',
            migas: 'Gestionar libros',
            funciones: ['Gestionar libros']
        });
        if (!usuario) return;
        this.id = ui.param('id');
        this.modo = ui.param('modo');
        if (ui.param('ok') === 'editado') libro_detalle_view.mensaje('ok',
            'Libro modificado exitosamente');
        try
        {
            this.catalogos = await libro_model.catalogos();
        }
        catch (error_2)
        {
            /* loaded on demand */ }
        this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            this.ficha = await libro_model.detalle(this.id);
            if (this.modo === 'etiquetado')
            {
                libro_detalle_view.etiquetado(this.ficha);
                return;
            }
            if (this.modo === 'resultado' && this.ficha.libro.estatus === 'Activo en catálogo')
            {
                libro_form_view.alta_completada(this.ficha);
                return;
            }
            if (this.modo === 'alta')
            {
                if (this.ficha.libro.estatus === 'Activo en catálogo')
                {
                    libro_form_view.alta_completada(this.ficha);
                    return;
                }
                libro_form_view.confirmar_alta(this.ficha, () => this.confirmar_alta(),
                    () => window.location.href = 'libro_detalle.html?id=' +
                        encodeURIComponent(this.id));
                return;
            }
            libro_detalle_view.ficha(this.ficha,
            {
                alta: () => this.alta(),
                ejemplares: () => this.ejemplares(),
                retirar: () => this.retirar(),
                condicion: (elemento) => this.condicion(elemento),
                baja: (elemento_2) => this.baja(elemento_2)
            });
            if (this.modo === 'ejemplares') libro_detalle_view.mostrar_ejemplares();
        }
        catch (error)
        {
            libro_detalle_view.mensaje('error', error.message);
        }
    },

    ejecutar: async function (promesa)
    {
        try
        {
            const resultado = await promesa;
            libro_detalle_view.mensaje('ok', resultado.mensaje);
            this.cargar();
        }
        catch (error)
        {
            libro_detalle_view.mensaje('error', error.message);
        }
    },

    alta: function ()
    {
        window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(this.id) +
            '&modo=alta';
    },

    confirmar_alta: async function ()
    {
        if (this.procesando_alta) return;
        this.procesando_alta = true;
        libro_form_view.bloquear_alta(true);
        try
        {
            await libro_model.activar(this.id);
            window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(this.id) +
                '&modo=resultado';
        }
        catch (error)
        {
            libro_form_view.error_alta(error.message);
            libro_form_view.bloquear_alta(false);
        }
        finally
        {
            this.procesando_alta = false;
        }
    },

    ejemplares: async function ()
    {
        let resultado_2 = null;
        const ok = await libro_detalle_view.dialogo_ejemplares(this.ficha.libro.formato === 'Digital',
            this.catalogos,
            async (datos) =>
            {
                resultado_2 = await libro_model.agregar_ejemplares(this.id, datos);
            });
        if (ok)
        {
            libro_detalle_view.mensaje('ok', resultado_2.mensaje);
            this.cargar();
        }
    },

    condicion: async function (ejemplar)
    {
        let resultado_3 = null;
        const ok = await libro_detalle_view.dialogo_condicion(ejemplar, this.catalogos, this.ficha
            .libro.formato === 'Digital',
            async (datos) =>
            {
                resultado_3 = await libro_model.actualizar_ejemplar(ejemplar.id_ejemplar,
                    datos);
            });
        if (ok)
        {
            libro_detalle_view.mensaje('ok', resultado_3.mensaje, 'Ejemplar ' + ejemplar.id_ejemplar);
            this.cargar();
        }
    },

    baja: async function (ejemplar)
    {
        let resultado_4 = null;
        const ok = await libro_detalle_view.dialogo_baja(ejemplar, this.catalogos.motivos, async (
            id_motivo, descripcion) =>
        {
            if (!id_motivo) throw Object.assign(new Error('Selecciona el motivo de baja'),
            {
                campos: ['id_motivo']
            });
            resultado_4 = await libro_model.baja_ejemplar(ejemplar.id_ejemplar,
            {
                id_motivo: Number(id_motivo),
                descripcion: descripcion
            });
        });
        if (ok)
        {
            libro_detalle_view.mensaje('ok', resultado_4.mensaje);
            this.cargar();
        }
    },

    retirar: async function ()
    {
        const ok = await ui.dialogo(
        {
            titulo: 'Confirmar baja del libro',
            texto: '"' + this.ficha.libro.titulo +
                '" dejará de aparecer en las búsquedas. El historial se conserva.',
            confirmar: 'Dar de baja libro',
            peligro: true
        });
        if (ok) this.ejecutar(libro_model.retirar(this.id));
    }
};
