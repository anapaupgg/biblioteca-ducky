/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   libro_form_controller.iniciar() */
/*   libro_form_controller.guardar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const OBLIGATORIOS_LIBRO = ['titulo', 'isbn', 'autores', 'editorial', 'tema'];

const libro_form_controller =
{
    id: null,
    creado_id: null,
    creado_datos: null,
    creado_resultado: null,
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
        libro_form_view.enlazar(
        {
            guardar: (...argumentos) => this.guardar(...argumentos)
        });
        libro_form_view.ajustar_formato();

        try
        {
            libro_form_view.catalogos(await libro_model.catalogos());
            if (this.id) libro_form_view.modo_edicion(await libro_model.detalle(this.id));
            ['titulo', 'isbn', 'editorial', 'autores'].forEach((campo) =>
            {
                if (ui.param(campo)) libro_form_view.completar(campo, ui.param(campo));
            });
        }
        catch (error)
        {
            libro_form_view.mensaje('error', error.message);
        }
    },

    guardar: async function ()
    {
        const datos = libro_form_view.datos();
        ui.limpiar();
        const vacios = OBLIGATORIOS_LIBRO.filter((campo_2) => !datos[campo_2]);
        if (!this.id && datos.copias > 0 && datos.formato === 'Físico' && !datos.id_ubicacion) vacios
            .push('id_ubicacion');
        if (vacios.length)
        {
            ui.marcar(vacios);
            return libro_form_view.mensaje('error', 'Completa los datos obligatorios',
                'Revisa los campos marcados.');
        }
        try
        {
            if (this.id)
            {
                await libro_model.actualizar(this.id, datos);
                window.location.href = 'libro_detalle.html?id=' + encodeURIComponent(this.id) +
                    '&ok=editado';
            }
            else
            {
                const resultado = await libro_model.crear(datos);
                this.creado_id = resultado.id_libro;
                this.creado_datos = datos;
                this.creado_resultado = resultado;
                libro_form_view.creado(resultado, datos, () => this.preparar_alta());
            }
        }
        catch (error)
        {
            ui.mostrar_error(error, 'mensaje');
        }
    },

    preparar_alta: async function ()
    {
        try
        {
            const ficha = await libro_model.detalle(this.creado_id);
            libro_form_view.confirmar_alta(ficha, () => this.confirmar_alta(),
                () => libro_form_view.creado(this.creado_resultado, this.creado_datos,
                    () => this.preparar_alta()));
        }
        catch (error)
        {
            libro_form_view.error_preparar_alta(error.message);
        }
    },

    confirmar_alta: async function ()
    {
        if (this.procesando_alta) return;
        this.procesando_alta = true;
        libro_form_view.bloquear_alta(true);
        try
        {
            libro_form_view.alta_completada(await libro_model.activar(this.creado_id));
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
    }
};
