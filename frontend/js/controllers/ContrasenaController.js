/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of cambiar_contrasena.html. A user     */
/*              with a temporary password must change it before   */
/*              using any other screen (Layout redirects here).   */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   ContrasenaController.iniciar()  - Mount layout, bind form    */
/*   ContrasenaController.guardar()  - Validate and save          */
/******************************************************************/

const ContrasenaController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'inicio', migas: 'Cambiar contraseña' });
        if (!usuario) return;
        document.getElementById('form-contrasena').addEventListener('submit', (e) => { e.preventDefault(); this.guardar(); });
    },

    guardar: async function()
    {
        const datos = ContrasenaView.datos();
        Ui.limpiar();
        if (datos.nueva.length < 8)
        {
            ContrasenaView.marcar(['nueva']);
            return ContrasenaView.mensaje('error', 'La contraseña debe tener al menos 8 caracteres');
        }
        if (datos.nueva !== datos.confirmacion)
        {
            ContrasenaView.marcar(['nueva', 'confirmacion']);
            return ContrasenaView.mensaje('error', 'Las contraseñas no coinciden');
        }
        try
        {
            await AuthModel.cambiar_contrasena(datos.actual, datos.nueva, datos.confirmacion);
            const usuario = Session.get();
            usuario.es_temporal = false;
            Session.actualizar_usuario(usuario);
            ContrasenaView.mensaje('ok', 'Contraseña actualizada', 'Te llevamos al inicio…');
            setTimeout(() => { window.location.href = 'inicio.html'; }, 1200);
        }
        catch (error)
        {
            ContrasenaView.marcar(error.campos);
            ContrasenaView.mensaje('error', error.message);
        }
    }
};
