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

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'perfiles',
            migas: 'Perfiles y permisos',
            funciones: ['Gestionar perfiles']
        });
        if (!usuario) return;
        perfiles_view.enlazar(() => this.abrir(null));
        try
        {
            this.funciones = await perfil_model.funciones();
        }
        catch (error)
        {
            perfiles_view.mensaje('error', error.message);
        }
        this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            perfiles_view.tabla(await perfil_model.listar(),
            {
                editar: (perfil_2) => this.abrir(perfil_2),
                eliminar: (perfil_3) => this.eliminar(perfil_3),
                reactivar: (perfil_4) => this.reactivar(perfil_4)
            });
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
            return perfiles_view.mensaje('error', 'El nombre del perfil es obligatorio');
        }
        if (datos.funciones.length === 0)
        {
            perfiles_view.marcar_funciones(true);
            return perfiles_view.mensaje('error', 'Selecciona al menos una función');
        }
        try
        {
            const resultado = perfil ? await perfil_model.actualizar(perfil.id, datos) :
                await perfil_model.crear(datos);
            perfiles_view.cerrar_formulario();
            perfiles_view.mensaje('ok', resultado.mensaje, 'Funciones: ' + resultado.perfil.funciones
                .join(', ') +
                '. Ya puedes asignarlo en Gestión de usuarios.');
            this.cargar();
        }
        catch (error)
        {
            ui.marcar(error.campos);
            perfiles_view.mensaje('error', error.message);
        }
    },

    eliminar: async function (perfil)
    {
        perfiles_view.mensaje();
        if (perfil.usuarios > 0)
        {
            return perfiles_view.mensaje('error',
                'No puede eliminarse un perfil con usuarios asignados',
                'El perfil ' + perfil.nombre + ' tiene ' + perfil.usuarios +
                ' usuario(s) activo(s). Reasígnalos primero.');
        }
        const ok = await ui.dialogo(
        {
            titulo: 'Eliminar el perfil ' + perfil.nombre,
            texto: 'El perfil quedará Inactivo y no podrá asignarse a nuevos usuarios.',
            confirmar: 'Eliminar perfil',
            peligro: true
        });
        if (!ok) return;
        try
        {
            const resultado_2 = await perfil_model.dar_baja(perfil.id);
            perfiles_view.mensaje('ok', resultado_2.mensaje);
            this.cargar();
        }
        catch (error)
        {
            perfiles_view.mensaje('error', error.message);
        }
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
