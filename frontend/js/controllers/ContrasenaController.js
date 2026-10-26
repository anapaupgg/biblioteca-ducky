/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   contrasena_controller.iniciar() */
/*   contrasena_controller.guardar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const contrasena_controller =
{
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'inicio',
            migas: 'Cambiar contraseña'
        });
        if (!usuario) return;
        contrasena_view.enlazar(
        {
            guardar: (...argumentos) => this.guardar(...argumentos)
        });
    },

    guardar: async function ()
    {
        const datos = contrasena_view.datos();
        ui.limpiar();
        if (datos.nueva.length < 8)
        {
            contrasena_view.marcar(['nueva']);
            return contrasena_view.mensaje('error', 'La contraseña debe tener al menos 8 caracteres');
        }
        if (datos.nueva !== datos.confirmacion)
        {
            contrasena_view.marcar(['nueva', 'confirmacion']);
            return contrasena_view.mensaje('error', 'Las contraseñas no coinciden');
        }
        try
        {
            await auth_model.cambiar_contrasena(datos.actual, datos.nueva, datos.confirmacion);
            const usuario = session.get();
            usuario.es_temporal = false;
            session.actualizar_usuario(usuario);
            contrasena_view.mensaje('ok', 'Contraseña actualizada', 'Te llevamos al inicio…');
            setTimeout(() =>
            {
                window.location.href = 'inicio.html';
            }, 1200);
        }
        catch (error)
        {
            contrasena_view.marcar(error.campos);
            contrasena_view.mensaje('error', error.message);
        }
    }
};
