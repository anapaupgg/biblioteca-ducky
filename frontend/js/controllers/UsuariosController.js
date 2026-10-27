/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-27 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuarios_controller.iniciar() */
/*   usuarios_controller.cargar() */
/*   usuarios_controller.asegurar_catalogos() */
/*   usuarios_controller.baja(usuario) */
/*   usuarios_controller.reactivar(usuario) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const usuarios_controller =
{
    // Descarta respuestas de filtros anteriores que terminan más tarde.
    version_consulta: 0,
    catalogos: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'usuarios',
            migas: 'Gestión de usuarios',
            funciones: ['Gestionar usuarios']
        });
        if (!usuario) return;

        usuarios_view.enlazar(
        {
            cargar: (...argumentos) => this.cargar(...argumentos)
        });

        await this.asegurar_catalogos();
        this.cargar();
    },

    asegurar_catalogos: async function ()
    {
        if (this.catalogos) return true;
        try
        {
            this.catalogos = await usuario_model.catalogos();
            return true;
        }
        catch (error)
        {
            usuarios_view.mensaje('error', 'No se cargaron los perfiles y motivos', error.message);
            return false;
        }
    },

    cargar: async function ()
    {
        const version = ++this.version_consulta;
        try
        {
            const usuarios = await usuario_model.listar(usuarios_view.filtros());
            if (version !== this.version_consulta) return;
            usuarios_view.tabla(usuarios,
            {
                baja: (usuario_2) => this.baja(usuario_2),
                reactivar: (usuario_3) => this.reactivar(usuario_3)
            });
        }
        catch (error)
        {
            if (version !== this.version_consulta) return;
            usuarios_view.mensaje('error', error.message);
        }
    },

    baja: async function (usuario)
    {
        usuarios_view.mensaje();
        if (!await this.asegurar_catalogos()) return;
        let respuesta = null;
        const ok = await usuarios_view.dialogo_baja(usuario, this.catalogos.motivos, async (id_motivo,
            comentario) =>
        {
            if (!id_motivo) throw Object.assign(new Error('Selecciona el motivo de baja'),
            {
                campos: ['id_motivo']
            });
            respuesta = await usuario_model.dar_baja(usuario.clave, Number(id_motivo),
                comentario);
        });
        if (ok)
        {
            usuarios_view.mensaje('ok', respuesta.mensaje, usuario.nombre + ' (' + usuario.clave +
                ') quedó Inactivo y sus sesiones se cerraron.');
            this.cargar();
        }
    },

    reactivar: async function (usuario)
    {
        usuarios_view.mensaje();
        if (!await this.asegurar_catalogos()) return;
        let respuesta = null;
        const ok = await usuarios_view.dialogo_reactivar(usuario, this.catalogos.perfiles, async (
            id_perfil) =>
        {
            respuesta = await usuario_model.reactivar(usuario.clave, Number(id_perfil));
        });
        if (ok)
        {
            usuarios_view.mensaje('ok', respuesta.mensaje, usuario.nombre +
                ' vuelve a estar Activo con el perfil ' + respuesta.usuario.perfil + '.');
            this.cargar();
        }
    }
};
