/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of usuarios.html. Lists users with     */
/*              live filters and runs "Dar de baja" and           */
/*              "Reactivar" (rules are validated by the backend). */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuariosController.iniciar()       - Layout, catalogs, list  */
/*   UsuariosController.cargar()        - Query with filters      */
/*   UsuariosController.baja(usuario)   - Baja flow               */
/*   UsuariosController.reactivar(u)    - Reactivation flow       */
/******************************************************************/

const UsuariosController =
{
    catalogos: null,

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'usuarios', migas: 'Gestión de usuarios', funciones: ['Gestionar usuarios'] });
        if (!usuario) return;

        let espera = null;
        document.getElementById('q').addEventListener('input', () => { clearTimeout(espera); espera = setTimeout(() => this.cargar(), 250); });
        document.getElementById('estatus').addEventListener('change', () => this.cargar());

        try { this.catalogos = await UsuarioModel.catalogos(); }
        catch (error) { UsuariosView.mensaje('error', error.message); }
        this.cargar();
    },

    cargar: async function()
    {
        try
        {
            const usuarios = await UsuarioModel.listar(UsuariosView.filtros());
            UsuariosView.tabla(usuarios, { baja: (u) => this.baja(u), reactivar: (u) => this.reactivar(u) });
        }
        catch (error) { UsuariosView.mensaje('error', error.message); }
    },

    baja: async function(usuario)
    {
        UsuariosView.mensaje();
        let respuesta = null;
        const ok = await UsuariosView.dialogo_baja(usuario, this.catalogos.motivos, async (id_motivo, comentario) =>
        {
            if (!id_motivo) throw Object.assign(new Error('Selecciona el motivo de baja'), { campos: ['id_motivo'] });
            respuesta = await UsuarioModel.dar_baja(usuario.clave, Number(id_motivo), comentario);
        });
        if (ok)
        {
            UsuariosView.mensaje('ok', respuesta.mensaje, usuario.nombre + ' (' + usuario.clave + ') quedó Inactivo y sus sesiones se cerraron.');
            this.cargar();
        }
    },

    reactivar: async function(usuario)
    {
        UsuariosView.mensaje();
        let respuesta = null;
        const ok = await UsuariosView.dialogo_reactivar(usuario, this.catalogos.perfiles, async (id_perfil) =>
        {
            respuesta = await UsuarioModel.reactivar(usuario.clave, Number(id_perfil));
        });
        if (ok)
        {
            UsuariosView.mensaje('ok', respuesta.mensaje, usuario.nombre + ' vuelve a estar Activo con el perfil ' + respuesta.usuario.perfil + '.');
            this.cargar();
        }
    }
};
