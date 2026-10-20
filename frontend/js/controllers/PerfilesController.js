/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of perfiles.html. Create profiles with */
/*              their functions, edit functions, delete (blocked  */
/*              while users are assigned) and reactivate.         */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PerfilesController.iniciar()        - Layout + data          */
/*   PerfilesController.cargar()         - Profiles list          */
/*   PerfilesController.abrir(perfil)    - Show create/edit form  */
/*   PerfilesController.guardar(perfil)  - Validate and save      */
/*   PerfilesController.eliminar(perfil) - Confirm and delete     */
/*   PerfilesController.reactivar(p)     - Reactivate             */
/******************************************************************/

const PerfilesController =
{
    funciones: [],

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'perfiles', migas: 'Perfiles y permisos', funciones: ['Gestionar perfiles'] });
        if (!usuario) return;
        document.getElementById('btn-nuevo').addEventListener('click', () => this.abrir(null));
        try { this.funciones = await PerfilModel.funciones(); }
        catch (error) { PerfilesView.mensaje('error', error.message); }
        this.cargar();
    },

    cargar: async function()
    {
        try
        {
            PerfilesView.tabla(await PerfilModel.listar(),
            {
                editar: (p) => this.abrir(p),
                eliminar: (p) => this.eliminar(p),
                reactivar: (p) => this.reactivar(p)
            });
        }
        catch (error) { PerfilesView.mensaje('error', error.message); }
    },

    abrir: function(perfil)
    {
        PerfilesView.mensaje();
        PerfilesView.formulario(this.funciones, perfil);
        document.getElementById('form-perfil').addEventListener('submit', (e) => { e.preventDefault(); this.guardar(perfil); });
        document.getElementById('btn-cancelar').addEventListener('click', () => PerfilesView.cerrar_formulario());
    },

    guardar: async function(perfil)
    {
        const datos = PerfilesView.datos();
        Ui.limpiar();
        PerfilesView.marcar_funciones(false);
        if (!datos.nombre)
        {
            Ui.marcar(['nombre']);
            return PerfilesView.mensaje('error', 'El nombre del perfil es obligatorio');
        }
        if (datos.funciones.length === 0)
        {
            PerfilesView.marcar_funciones(true);
            return PerfilesView.mensaje('error', 'Selecciona al menos una función');
        }
        try
        {
            const r = perfil ? await PerfilModel.actualizar(perfil.id, datos) : await PerfilModel.crear(datos);
            PerfilesView.cerrar_formulario();
            PerfilesView.mensaje('ok', r.mensaje, 'Funciones: ' + r.perfil.funciones.join(', ') +
                '. Ya puedes asignarlo en Gestión de usuarios.');
            this.cargar();
        }
        catch (error)
        {
            Ui.marcar(error.campos);
            PerfilesView.mensaje('error', error.message);
        }
    },

    eliminar: async function(perfil)
    {
        PerfilesView.mensaje();
        if (perfil.usuarios > 0)
        {
            return PerfilesView.mensaje('error', 'No puede eliminarse un perfil con usuarios asignados',
                'El perfil ' + perfil.nombre + ' tiene ' + perfil.usuarios + ' usuario(s) activo(s). Reasígnalos primero.');
        }
        const ok = await Ui.dialogo({ titulo: 'Eliminar el perfil ' + perfil.nombre, texto: 'El perfil quedará Inactivo y no podrá asignarse a nuevos usuarios.', confirmar: 'Eliminar perfil', peligro: true });
        if (!ok) return;
        try
        {
            const r = await PerfilModel.dar_baja(perfil.id);
            PerfilesView.mensaje('ok', r.mensaje);
            this.cargar();
        }
        catch (error) { PerfilesView.mensaje('error', error.message); }
    },

    reactivar: async function(perfil)
    {
        try
        {
            await PerfilModel.reactivar(perfil.id);
            PerfilesView.mensaje('ok', 'Perfil ' + perfil.nombre + ' reactivado');
            this.cargar();
        }
        catch (error) { PerfilesView.mensaje('error', error.message); }
    }
};
