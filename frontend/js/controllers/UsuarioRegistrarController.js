/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_registrar_controller.iniciar() */
/*   usuario_registrar_controller.consultar() */
/*   usuario_registrar_controller.registrar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const usuario_registrar_controller =
{
    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'usuarios',
            migas: 'Gestión de usuarios / Registrar usuario',
            funciones: ['Gestionar usuarios']
        });
        if (!usuario) return;

        try
        {
            usuario_registrar_view.perfiles((await usuario_model.catalogos()).perfiles);
        }
        catch (error)
        {
            usuario_registrar_view.mensaje('error', error.message);
        }

        usuario_registrar_view.enlazar(
        {
            consultar: (...argumentos) => this.consultar(...argumentos),
            registrar: (...argumentos) => this.registrar(...argumentos)
        });
    },

    consultar: async function ()
    {
        const
        {
            clave
        } = usuario_registrar_view.datos();
        usuario_registrar_view.mensaje();
        ui.limpiar();
        usuario_registrar_view.institucional(null);
        if (!clave) return;
        try
        {
            const persona = await usuario_model.institucion(clave);
            usuario_registrar_view.institucional(persona);
            if (!persona.vigente) usuario_registrar_view.mensaje('warning',
                'La Clave no está vigente en la institución');
            else if (persona.registrado) usuario_registrar_view.mensaje('warning',
                'La Clave ya existe en el sistema (' + persona.estatus_biblioteca + ')');
        }
        catch (error)
        {
            ui.mostrar_error(error, 'mensaje', 'Usuario no registrado');
        }
    },

    registrar: async function ()
    {
        const datos = usuario_registrar_view.datos();
        ui.limpiar();
        const vacios = ['clave', 'id_perfil'].filter((campo) => !datos[campo]);
        if (vacios.length)
        {
            ui.marcar(vacios);
            return usuario_registrar_view.mensaje('error',
                'Usuario no registrado: verifica los campos marcados');
        }
        try
        {
            usuario_registrar_view.exito(await usuario_model.crear(datos.clave, Number(datos
                .id_perfil)));
        }
        catch (error)
        {
            ui.mostrar_error(error, 'mensaje', 'Usuario no registrado');
        }
    }
};
