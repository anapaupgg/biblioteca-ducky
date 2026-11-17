/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Controlador cliente del cambio de perfil de usuario. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_editar_controller.iniciar() */
/*   usuario_editar_controller.consultar(clave_explicita) */
/*   usuario_editar_controller.guardar() */
/*   usuario_editar_controller.explicar_retiro() */
/*   usuario_editar_controller.reactivar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de UsuarioModel y UsuarioEditarView; iniciar una vez. */
/* El servidor valida el perfil, la jerarquía y las sesiones al guardar. */
/******************************************************************/

const usuario_editar_controller =
{
    perfiles: [],
    usuario: null,
    administrador: null,
    version_consulta: 0,
    guardando: false,

    iniciar: async function ()
    {
        const administrador = await layout.montar(
        {
            activo: 'usuarios',
            migas: 'Gestión de usuarios',
            funciones: ['Gestionar usuarios']
        });
        if (!administrador) return;
        this.administrador = administrador;
        usuario_editar_view.enlazar(
        {
            consultar: (clave) => this.consultar(clave),
            guardar: () => this.guardar(),
            explicar_retiro: () => this.explicar_retiro(),
            reactivar: () => this.reactivar()
        });
        try
        {
            this.perfiles = (await usuario_model.catalogos()).perfiles;
        }
        catch (error)
        {
            usuario_editar_view.mensaje('error', 'No se cargaron los perfiles', error.message);
        }
        const clave = ui.param('clave');
        if (clave)
        {
            usuario_editar_view.poner_clave(clave);
            this.consultar(clave);
        }
    },

    consultar: async function (clave_explicita)
    {
        const version = ++this.version_consulta;
        const termino = String(clave_explicita || usuario_editar_view.clave()).trim();
        usuario_editar_view.mensaje();
        if (!termino)
        {
            this.usuario = null;
            usuario_editar_view.vacio();
            usuario_editar_view.mensaje('error', 'Escribe una Clave o Nombre');
            return;
        }
        try
        {
            let clave = clave_explicita || '';
            if (!clave)
            {
                const usuarios = await usuario_model.listar({ q: termino });
                if (version !== this.version_consulta) return;
                if (usuarios.length === 0) throw new Error('Usuario no encontrado');
                if (usuarios.length > 1)
                {
                    this.usuario = null;
                    usuario_editar_view.coincidencias(usuarios);
                    return;
                }
                clave = usuarios[0].clave;
            }
            const usuario = await usuario_model.detalle(clave);
            if (version !== this.version_consulta) return;
            this.usuario = usuario;
            usuario_editar_view.detalle(usuario, this.perfiles);
        }
        catch (error)
        {
            if (version !== this.version_consulta) return;
            this.usuario = null;
            usuario_editar_view.vacio();
            usuario_editar_view.mensaje('error', error.message);
        }
    },

    guardar: async function ()
    {
        if (this.guardando || !this.usuario) return;
        const id_perfil = usuario_editar_view.perfil_elegido();
        const destino = this.perfiles.find((perfil) => perfil.id === id_perfil);
        if (!destino || !destino.asignable || id_perfil === this.usuario.id_perfil)
        {
            usuario_editar_view.mensaje('error', 'Elige un perfil nuevo disponible');
            return;
        }
        const anterior = this.usuario.perfil;
        const retira = (this.usuario.funciones || []).some((funcion) =>
            !destino.funciones.includes(funcion));
        this.guardando = true;
        try
        {
            if (retira)
            {
                const ok = await ui.dialogo(
                {
                    titulo: 'El cambio retirará funciones',
                    texto: 'El nuevo perfil quita funciones a ' + this.usuario.nombre +
                        '. Si tiene una sesión activa, se cerrará.',
                    confirmar: 'Continuar'
                });
                if (!ok) return;
            }
            const resultado = await usuario_model.cambiar_perfil(this.usuario.clave, id_perfil);
            usuario_editar_view.mensaje();
            usuario_editar_view.exito({ usuario: resultado.usuario, perfil_anterior: anterior,
                administrador: this.administrador, retira });
        }
        catch (error)
        {
            if (error.message === 'No puede modificar su propio perfil')
                usuario_editar_view.error_propio(this.usuario);
            else usuario_editar_view.mensaje('error', error.message);
        }
        finally
        {
            this.guardando = false;
        }
    },

    explicar_retiro: async function ()
    {
        const id_perfil = usuario_editar_view.perfil_elegido();
        const destino = this.perfiles.find((perfil) => perfil.id === id_perfil);
        const funciones_actuales = this.usuario?.funciones || [];
        const retiradas = destino ? funciones_actuales.filter((funcion) =>
            !destino.funciones.includes(funcion)) : [];
        const texto = !this.usuario || !destino ?
            'Busca un usuario y elige un nuevo perfil para ver qué funciones perdería.' :
            retiradas.length ?
                'El perfil ' + destino.nombre + ' retiraría estas funciones: ' +
                retiradas.join(', ') + '. El cambio solo se aplicará al guardar.' :
                'El perfil ' + destino.nombre + ' no retira funciones a ' +
                this.usuario.nombre + '. El cambio solo se aplicará al guardar.';
        await ui.dialogo({ titulo: 'Cambio que retira funciones', texto,
            confirmar: 'Entendido', cancelar: false });
    },

    reactivar: async function ()
    {
        if (!this.usuario || this.usuario.estatus === 'Activo') return;
        try
        {
            const clave = this.usuario.clave;
            const resultado = await usuario_model.reactivar(clave,
                usuario_editar_view.perfil_elegido() || this.usuario.id_perfil);
            await this.consultar(clave);
            usuario_editar_view.mensaje('ok', resultado.mensaje,
                resultado.usuario.nombre + ' vuelve a estar Activo.');
            await ui.dialogo(
            {
                titulo: 'Nueva contraseña temporal',
                texto: 'Contraseña temporal: ' + resultado.contrasena_temporal +
                    '. Entrégala al usuario por un medio privado. Deberá cambiarla al iniciar sesión. El envío por correo aún no está configurado.',
                confirmar: 'Entendido',
                cancelar: false
            });
        }
        catch (error)
        {
            usuario_editar_view.mensaje('error', error.message);
        }
    }
};
