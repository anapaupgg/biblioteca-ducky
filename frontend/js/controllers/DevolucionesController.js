/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-16                                               */
/* Description: Coordina consulta y devolución de ejemplares.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, abrir, buscar, devolver,    */
/* aviso_multa.                                                   */
/* Reuse Instructions: la vista maneja DOM; el modelo maneja API. */
/******************************************************************/

const devoluciones_controller =
{
    ejemplar: null,
    perdida_pendiente: null,
    multa_actual: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar({
            activo: 'prestamos', migas: 'Devoluciones', funciones: ['Devoluciones']
        });
        if (!usuario) return;
        devoluciones_view.enlazar({
            abrir: () => this.abrir(),
            volver: () => this.volver(),
            buscar: (id) => this.buscar(id),
            devolver: (condicion) => this.devolver(condicion),
            aviso_multa: () => this.aviso_multa(),
            abrir_perdida: () => this.abrir_perdida(),
            validar_perdida: (datos) => this.validar_perdida(datos),
            confirmar_perdida: () => this.confirmar_perdida(),
            abrir_multas: () => this.abrir_multas(),
            abrir_pago: () => this.abrir_pago(),
            registrar_pago: (datos) => this.registrar_pago(datos),
            avisar_adeudos: () => this.avisar_adeudos()
        });
        devoluciones_view.mostrar('devoluciones');
        await this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            devoluciones_view.activos(await circulacion_model.activos());
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudieron cargar los préstamos', error.message);
        }
    },

    abrir: function ()
    {
        this.ejemplar = null;
        this.multa_actual = null;
        devoluciones_view.mostrar('buscar-devolucion');
    },

    abrir_perdida: function ()
    {
        this.perdida_pendiente = null;
        this.multa_actual = null;
        devoluciones_view.mostrar('perdida');
    },

    validar_perdida: async function (datos)
    {
        try
        {
            const resultado = await circulacion_model.validar_perdida(datos);
            this.perdida_pendiente = datos;
            devoluciones_view.mostrar('revisar-perdida');
            devoluciones_view.revision_perdida(resultado);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se puede reportar la pérdida', error.message);
        }
    },

    confirmar_perdida: async function ()
    {
        if (!this.perdida_pendiente) return;
        const datos = this.perdida_pendiente;
        this.perdida_pendiente = null;
        try
        {
            const resultado = await circulacion_model.confirmar_perdida(datos);
            devoluciones_view.mostrar('recibo-devolucion');
            devoluciones_view.recibo_perdida(resultado);
        }
        catch (error)
        {
            this.perdida_pendiente = datos;
            devoluciones_view.mensaje('error', 'No se pudo confirmar la pérdida', error.message);
        }
    },

    abrir_multas: async function ()
    {
        this.multa_actual = null;
        devoluciones_view.mostrar('multas');
        try
        {
            devoluciones_view.multas(await circulacion_model.multas());
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudieron cargar las multas', error.message);
        }
    },

    abrir_pago: function ()
    {
        devoluciones_view.preparar_pago(this.multa_actual);
        devoluciones_view.mostrar('pago');
    },

    aviso_multa: async function ()
    {
        if (!this.multa_actual) return;
        try
        {
            const aviso = await circulacion_model.aviso_multa(this.multa_actual);
            devoluciones_view.mostrar('recibo-devolucion');
            devoluciones_view.recibo_aviso(aviso);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudo registrar el aviso', error.message);
        }
    },

    registrar_pago: async function (datos)
    {
        try
        {
            const registro = await circulacion_model.registrar_pago(datos);
            devoluciones_view.mostrar('recibo-devolucion');
            devoluciones_view.recibo_pago(registro);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudo registrar el pago', error.message);
        }
    },

    avisar_adeudos: async function ()
    {
        try
        {
            const resultado = await circulacion_model.avisar_adeudos();
            devoluciones_view.mensaje('ok', 'Avisos registrados',
                resultado.total + ' aviso(s) nuevos para Servicios Escolares.');
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudieron registrar avisos', error.message);
        }
    },

    volver: async function ()
    {
        this.ejemplar = null;
        this.multa_actual = null;
        devoluciones_view.mostrar('devoluciones');
        await this.cargar();
    },

    buscar: async function (id)
    {
        try
        {
            const datos = await circulacion_model.validar_devolucion({
                id_ejemplar: id, condicion: 'Bueno'
            });
            this.ejemplar = id;
            devoluciones_view.mostrar('revisar-devolucion');
            devoluciones_view.revision(datos);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se puede devolver el ejemplar', error.message);
        }
    },

    devolver: async function (condicion)
    {
        if (!this.ejemplar) return;
        try
        {
            const datos = await circulacion_model.devolver({
                id_ejemplar: this.ejemplar, condicion
            });
            this.ejemplar = null;
            this.multa_actual = datos.resultado.multa?.id_multa || null;
            devoluciones_view.mostrar('recibo-devolucion');
            devoluciones_view.recibo(datos);
        }
        catch (error)
        {
            devoluciones_view.mensaje('error', 'No se pudo confirmar la devolución', error.message);
        }
    }
};
