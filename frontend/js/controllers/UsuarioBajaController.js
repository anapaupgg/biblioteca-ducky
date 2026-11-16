/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-11-16 */
/* Description: Controlador cliente del flujo de baja de usuarios. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   usuario_baja_controller.iniciar() */
/*   usuario_baja_controller.consultar() */
/*   usuario_baja_controller.validar() */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de UsuarioModel y UsuarioBajaView; iniciar una vez. */
/* La validación GET es informativa; POST confirma con reglas del servidor. */
/* No muestra confirmación de avisos externos que no se hayan enviado. */
/******************************************************************/

const usuario_baja_controller =
{
    motivos: [],
    administrador: null,
    validando: false,
    version_consulta: 0,

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
        usuario_baja_view.enlazar(
        {
            consultar: () => this.consultar(),
            validar: () => this.validar()
        });
        try
        {
            this.motivos = (await usuario_model.catalogos()).motivos;
            usuario_baja_view.motivos(this.motivos);
        }
        catch (error)
        {
            usuario_baja_view.mensaje('error', 'No se cargaron los motivos', error.message);
        }
        const clave = ui.param('clave');
        if (clave)
        {
            usuario_baja_view.poner_clave(clave);
            this.consultar();
        }
    },

    consultar: async function ()
    {
        const version = ++this.version_consulta;
        const clave = usuario_baja_view.datos().clave;
        usuario_baja_view.usuario(null);
        usuario_baja_view.mensaje();
        if (!/^[A-Za-z0-9]{6}$/.test(clave))
        {
            if (clave) usuario_baja_view.mensaje('error', 'Verifica la Clave capturada',
                'La matrícula o nómina tiene 6 caracteres.');
            return;
        }
        try
        {
            const usuario = await usuario_model.detalle(clave);
            if (version !== this.version_consulta) return;
            usuario_baja_view.usuario(usuario);
        }
        catch (error)
        {
            if (version !== this.version_consulta) return;
            usuario_baja_view.mensaje('error', error.message);
        }
    },

    validar: async function ()
    {
        if (this.validando) return;
        const datos = usuario_baja_view.datos();
        ui.limpiar();
        usuario_baja_view.mensaje();
        const campos = [];
        if (!/^[A-Za-z0-9]{6}$/.test(datos.clave)) campos.push('clave');
        const motivo = this.motivos.find((registro) => String(registro.id) === datos.id_motivo);
        if (!motivo) campos.push('id_motivo');
        if (motivo?.descripcion === 'Otro' && !datos.comentario.trim()) campos.push('comentario');
        if (campos.length)
        {
            ui.marcar(campos);
            usuario_baja_view.mensaje('error', 'Completa los datos de la baja',
                'Verifica la Clave, el motivo y la descripción cuando sea Otro.');
            return;
        }
        this.validando = true;
        try
        {
            const validacion = await usuario_model.validar_baja(datos.clave);
            usuario_baja_view.usuario(validacion.usuario);
            if (validacion.estado !== 'listo')
            {
                usuario_baja_view.resultado(validacion, () => usuario_baja_view.formulario());
                return;
            }
            let respuesta;
            const confirmado = await usuario_baja_view.confirmar(validacion.usuario, async () =>
            {
                respuesta = await usuario_model.dar_baja(datos.clave,
                    Number(datos.id_motivo), datos.comentario.trim());
            });
            if (confirmado) usuario_baja_view.exito(respuesta, motivo.descripcion,
                this.administrador);
        }
        catch (error)
        {
            usuario_baja_view.mensaje('error', error.message);
        }
        finally
        {
            this.validando = false;
        }
    }
};
