/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_editar_controller.iniciar() */
/*   usuario_editar_controller.consultar() */
/*   usuario_editar_controller.guardar() */
/*   usuario_editar_controller.reactivar() */
/*   usuario_editar_controller.consultar_silencioso() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const usuario_editar_controller =
{
    perfiles: [],
    usuario: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'usuarios',
            migas: 'Gestión de usuarios / Modificar',
            funciones: ['Gestionar usuarios']
        });
        if (!usuario) return;

        usuario_editar_view.enlazar(
        {
            consultar: (...argumentos) => this.consultar(...argumentos)
        });

        try
        {
            this.perfiles = (await usuario_model.catalogos()).perfiles;
        }
        catch (error)
        {
            usuario_editar_view.mensaje('error', error.message);
        }

        const clave = ui.param('clave');
        if (clave)
        {
            usuario_editar_view.poner_clave(clave);
            this.consultar();
        }
    },

    consultar: async function ()
    {
        const clave = usuario_editar_view.clave();
        usuario_editar_view.mensaje();
        if (!/^[A-Za-z0-9]{6}$/.test(clave))
        {
            usuario_editar_view.vacio();
            return usuario_editar_view.mensaje('error', 'Verifica la Clave capturada',
                'La matrícula o nómina tiene 6 caracteres.');
        }
        try
        {
            this.usuario = await usuario_model.detalle(clave);
            usuario_editar_view.detalle(this.usuario, this.perfiles);
            usuario_editar_view.enlazar_detalle(
            {
                guardar: () => this.guardar(),
                reactivar: () => this.reactivar()
            });
        }
        catch (error)
        {
            usuario_editar_view.vacio();
            usuario_editar_view.mensaje('error', error.message);
        }
    },

    guardar: async function ()
    {
        const id_perfil = usuario_editar_view.perfil_elegido();
        const destino = this.perfiles.find((elemento) => elemento.id === id_perfil);
        const retira = destino && (this.usuario.funciones || []).some((filtro) => !destino.funciones
            .includes(filtro));
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
        try
        {
            const resultado = await usuario_model.cambiar_perfil(this.usuario.clave, id_perfil);
            usuario_editar_view.mensaje('ok', resultado.mensaje, resultado.usuario.nombre +
                ' ahora tiene el perfil ' + resultado.usuario.perfil + '.');
            this.consultar_silencioso();
        }
        catch (error)
        {
            usuario_editar_view.mensaje('error', error.message);
        }
    },

    reactivar: async function ()
    {
        try
        {
            const resultado_2 = await usuario_model.reactivar(this.usuario.clave, usuario_editar_view
                .perfil_elegido());
            usuario_editar_view.mensaje('ok', resultado_2.mensaje, resultado_2.usuario.nombre +
                ' vuelve a estar Activo.');
            await this.consultar_silencioso();
            await ui.dialogo(
            {
                titulo: 'Nueva contraseña temporal',
                texto: 'Contraseña temporal: ' + resultado_2.contrasena_temporal +
                    '. Entrégala al usuario por un medio privado. Deberá cambiarla al iniciar sesión. El envío por correo aún no está configurado.',
                confirmar: 'Entendido',
                cancelar: false
            });
        }
        catch (error)
        {
            usuario_editar_view.mensaje('error', error.message);
        }
    },

    /* Reload the user keeping the success message on screen */
    consultar_silencioso: async function ()
    {
        const mensaje = usuario_editar_view.conservar_mensaje();
        await this.consultar();
        usuario_editar_view.restaurar_mensaje(mensaje);
    }
};
