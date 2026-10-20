/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controlador de usuario_registrar.html.            */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuarioRegistrarController.iniciar()     - Layout + profiles */
/*   UsuarioRegistrarController.consultar()   - Institution data  */
/*   UsuarioRegistrarController.registrar()   - POST /usuarios    */
/******************************************************************/

const UsuarioRegistrarController =
{
    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'usuarios', migas: 'Gestión de usuarios / Registrar usuario', funciones: ['Gestionar usuarios'] });
        if (!usuario) return;

        try { UsuarioRegistrarView.perfiles((await UsuarioModel.catalogos()).perfiles); }
        catch (error) { UsuarioRegistrarView.mensaje('error', error.message); }

        document.getElementById('clave').addEventListener('change', () => this.consultar());
        document.getElementById('form-usuario').addEventListener('submit', (e) => { e.preventDefault(); this.registrar(); });
        document.getElementById('clave').focus();
    },

    consultar: async function()
    {
        const { clave } = UsuarioRegistrarView.datos();
        UsuarioRegistrarView.mensaje();
        Ui.limpiar();
        UsuarioRegistrarView.institucional(null);
        if (!clave) return;
        try
        {
            const persona = await UsuarioModel.institucion(clave);
            UsuarioRegistrarView.institucional(persona);
            if (!persona.vigente) UsuarioRegistrarView.mensaje('warning', 'La Clave no está vigente en la institución');
            else if (persona.registrado) UsuarioRegistrarView.mensaje('warning', 'La Clave ya existe en el sistema (' + persona.estatus_biblioteca + ')');
        }
        catch (error) { Ui.mostrar_error(error, 'mensaje', 'Usuario no registrado'); }
    },

    registrar: async function()
    {
        const datos = UsuarioRegistrarView.datos();
        Ui.limpiar();
        const vacios = ['clave', 'id_perfil'].filter((c) => !datos[c]);
        if (vacios.length)
        {
            Ui.marcar(vacios);
            return UsuarioRegistrarView.mensaje('error', 'Usuario no registrado: verifica los campos marcados');
        }
        try
        {
            UsuarioRegistrarView.exito(await UsuarioModel.crear(datos.clave, Number(datos.id_perfil)));
        }
        catch (error) { Ui.mostrar_error(error, 'mensaje', 'Usuario no registrado'); }
    }
};
