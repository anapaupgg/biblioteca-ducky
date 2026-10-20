/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controlador de usuario_editar.html.               */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   UsuarioEditarController.iniciar()    - Layout, ?clave=       */
/*   UsuarioEditarController.consultar()  - Load the user         */
/*   UsuarioEditarController.guardar()    - Change profile        */
/*   UsuarioEditarController.reactivar()  - Reactivate            */
/******************************************************************/

const UsuarioEditarController =
{
    perfiles: [],
    usuario: null,

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'usuarios', migas: 'Gestión de usuarios / Modificar', funciones: ['Gestionar usuarios'] });
        if (!usuario) return;

        document.getElementById('btn-buscar').addEventListener('click', () => this.consultar());
        document.getElementById('buscar-clave').addEventListener('keydown', (e) => { if (e.key === 'Enter') this.consultar(); });

        try { this.perfiles = (await UsuarioModel.catalogos()).perfiles; }
        catch (error) { UsuarioEditarView.mensaje('error', error.message); }

        const clave = Ui.param('clave');
        if (clave)
        {
            document.getElementById('buscar-clave').value = clave;
            this.consultar();
        }
    },

    consultar: async function()
    {
        const clave = UsuarioEditarView.clave();
        UsuarioEditarView.mensaje();
        if (!/^[A-Za-z0-9]{6}$/.test(clave))
        {
            UsuarioEditarView.vacio();
            return UsuarioEditarView.mensaje('error', 'Verifica la Clave capturada', 'La matrícula o nómina tiene 6 caracteres.');
        }
        try
        {
            this.usuario = await UsuarioModel.detalle(clave);
            UsuarioEditarView.detalle(this.usuario, this.perfiles);
            const guardar = document.getElementById('btn-guardar');
            const reactivar = document.getElementById('btn-reactivar');
            if (guardar) guardar.addEventListener('click', () => this.guardar());
            if (reactivar) reactivar.addEventListener('click', () => this.reactivar());
        }
        catch (error)
        {
            UsuarioEditarView.vacio();
            UsuarioEditarView.mensaje('error', error.message);
        }
    },

    guardar: async function()
    {
        const id_perfil = UsuarioEditarView.perfil_elegido();
        const destino = this.perfiles.find((p) => p.id === id_perfil);
        const retira = destino && (this.usuario.funciones || []).some((f) => !destino.funciones.includes(f));
        if (retira)
        {
            const ok = await Ui.dialogo(
            {
                titulo: 'El cambio retirará funciones',
                texto: 'El nuevo perfil quita funciones a ' + this.usuario.nombre + '. Si tiene una sesión activa, se cerrará.',
                confirmar: 'Continuar'
            });
            if (!ok) return;
        }
        try
        {
            const r = await UsuarioModel.cambiar_perfil(this.usuario.clave, id_perfil);
            UsuarioEditarView.mensaje('ok', r.mensaje, r.usuario.nombre + ' ahora tiene el perfil ' + r.usuario.perfil + '.');
            this.consultar_silencioso();
        }
        catch (error) { UsuarioEditarView.mensaje('error', error.message); }
    },

    reactivar: async function()
    {
        try
        {
            const r = await UsuarioModel.reactivar(this.usuario.clave, UsuarioEditarView.perfil_elegido());
            UsuarioEditarView.mensaje('ok', r.mensaje, r.usuario.nombre + ' vuelve a estar Activo.');
            this.consultar_silencioso();
        }
        catch (error) { UsuarioEditarView.mensaje('error', error.message); }
    },

    /* Reload the user keeping the success message on screen */
    consultar_silencioso: async function()
    {
        const mensaje = document.getElementById('mensaje').innerHTML;
        await this.consultar();
        document.getElementById('mensaje').innerHTML = mensaje;
    }
};
