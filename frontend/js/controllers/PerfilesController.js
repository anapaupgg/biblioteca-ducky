/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   perfiles_controller.iniciar() */
/*   perfiles_controller.cargar() */
/*   perfiles_controller.abrir(perfil) */
/*   perfiles_controller.guardar(perfil) */
/*   perfiles_controller.eliminar(perfil) */
/*   perfiles_controller.volver_lista() */
/*   perfiles_controller.reactivar(perfil) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const perfiles_controller =
{
    funciones: [],
    puede_gestionar_usuarios: false,
    administrador: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'perfiles',
            migas: 'Perfiles y permisos',
            funciones: ['Gestionar perfiles']
        });
        if (!usuario) return;
        this.administrador = usuario;
        this.puede_gestionar_usuarios = usuario.funciones.includes('Gestionar usuarios');
        perfiles_view.enlazar({
            crear: () => this.abrir(null),
            editar: (perfil) => this.abrir(perfil),
            eliminar: (perfil) => this.eliminar(perfil),
            reactivar: (perfil) => this.reactivar(perfil)
        });
        try
        {
            this.funciones = await perfil_model.funciones();
            perfiles_view.funciones_disponibles(this.funciones.length > 0);
        }
        catch (error)
        {
            perfiles_view.funciones_disponibles(false);
            perfiles_view.mensaje('error', error.message);
        }
        this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            perfiles_view.tabla(await perfil_model.listar());
        }
        catch (error)
        {
            perfiles_view.mensaje('error', error.message);
        }
    },

    abrir: function (perfil)
    {
        perfiles_view.mensaje();
        perfiles_view.formulario(this.funciones, perfil);
        perfiles_view.enlazar_formulario(() => this.guardar(perfil));
    },

    guardar: async function (perfil)
    {
        const datos = perfiles_view.datos();
        ui.limpiar();
        perfiles_view.marcar_funciones(false);
        if (!datos.nombre)
        {
            ui.marcar(['nombre']);
            return perfiles_view.nombre_obligatorio();
        }
        if (datos.funciones.length === 0)
        {
            perfiles_view.marcar_funciones(true);
            return perfiles_view.funciones_obligatorias();
        }
        try
        {
            const resultado = perfil ? await perfil_model.actualizar(perfil.id, datos) :
                await perfil_model.crear(datos);
            if (perfil)
            {
                perfiles_view.cerrar_formulario();
                perfiles_view.mensaje('ok', resultado.mensaje, 'Funciones: ' +
                    resultado.perfil.funciones.join(', ') +
                    '. Ya puedes asignarlo en Gestión de usuarios.');
                this.cargar();
            }
            else perfiles_view.exito_creacion(resultado.perfil, this.administrador,
                () => this.volver_lista());
        }
        catch (error)
        {
            ui.marcar(error.campos);
            if (!perfil && error.message === 'Nombre de perfil duplicado')
                perfiles_view.nombre_duplicado(datos.nombre);
            else perfiles_view.mensaje('error', error.message);
        }
    },

    eliminar: async function (perfil)
    {
        perfiles_view.mensaje();
        if (perfil.usuarios > 0)
        {
            let usuarios = null;
            if (this.puede_gestionar_usuarios)
            {
                try
                {
                    const activos = await usuario_model.listar({ estatus: 'Activo' });
                    usuarios = activos.filter((usuario) => usuario.id_perfil === perfil.id);
                }
                catch (error)
                {
                    usuarios = null;
                }
            }
            perfiles_view.bloqueo_eliminacion(perfil, usuarios,
                this.puede_gestionar_usuarios, () => this.volver_lista());
            return;
        }
        const ok = await ui.dialogo(
        {
            titulo: 'Eliminar el perfil ' + perfil.nombre,
            texto: 'No tiene usuarios asignados (0). El perfil dejará de estar disponible ' +
                'para futuras asignaciones.',
            cuerpo: '<p class="small muted">La eliminación queda registrada en bitácora.</p>',
            confirmar: 'Eliminar perfil',
            peligro: true,
            amplio: true,
            principal_primero: true
        });
        if (!ok) return;
        try
        {
            await perfil_model.dar_baja(perfil.id);
            perfiles_view.exito_eliminacion(perfil, this.administrador,
                () => this.volver_lista());
        }
        catch (error)
        {
            perfiles_view.mensaje('error', error.message);
        }
    },

    volver_lista: function ()
    {
        perfiles_view.volver_lista();
        this.cargar();
    },

    reactivar: async function (perfil)
    {
        try
        {
            await perfil_model.reactivar(perfil.id);
            perfiles_view.mensaje('ok', 'Perfil ' + perfil.nombre + ' reactivado');
            this.cargar();
        }
        catch (error)
        {
            perfiles_view.mensaje('error', error.message);
        }
    }
};
