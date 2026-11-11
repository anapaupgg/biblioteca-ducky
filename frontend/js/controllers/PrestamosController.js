/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Coordina vistas y modelo cliente de préstamos.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, validar, registrar,         */
/* autorizar.                                                      */
/* Reuse Instructions: iniciar una vez; permisos visuales vienen  */
/* de la sesión, la API los comprueba de nuevo.                    */
/******************************************************************/

const prestamos_controller =
{
    funciones: [],
    datos_pendientes: null,
    renovacion_pendiente: null,

    iniciar: async function ()
    {
        const usuario = await layout.montar({
            activo: 'prestamos',
            migas: 'Préstamos',
            funciones: ['Buscar libros', 'Préstamos']
        });
        if (!usuario) return;
        this.funciones = usuario.funciones;
        prestamos_view.configurar(this.funciones.includes('Buscar libros'),
            this.funciones.includes('Préstamos'), this.funciones.includes('Devoluciones'));
        prestamos_view.enlazar({
            abrir_registro: () => this.abrir_registro(),
            abrir_renovacion: () => this.abrir_renovacion(),
            volver: () => this.volver(),
            validar: (datos) => this.validar(datos),
            confirmar: () => this.registrar(),
            validar_renovacion: (datos) => this.validar_renovacion(datos),
            renovar: () => this.renovar(),
            abrir_espera: () => this.abrir_espera(),
            abrir_agregar_espera: () => this.abrir_agregar_espera(),
            consultar_espera: (id) => this.consultar_espera(id),
            registrar_espera: (datos) => this.registrar_espera(datos)
        });
        await this.cargar();
    },

    cargar: async function ()
    {
        try
        {
            const [mios, pendientes, activos] = await Promise.all([
                this.funciones.includes('Buscar libros') ? prestamo_model.mios() : null,
                this.funciones.includes('Préstamos') ? prestamo_model.pendientes() : null,
                this.funciones.includes('Préstamos') ? prestamo_model.activos() : null
            ]);
            if (mios) prestamos_view.mios(mios);
            if (pendientes)
            {
                prestamos_view.pendientes(pendientes,
                    (folio, id_ejemplar) => this.autorizar(folio, id_ejemplar));
                prestamos_view.aviso_solicitud(pendientes);
            }
            if (activos) prestamos_view.activos(activos);
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudieron cargar los préstamos', error.message);
        }
    },

    abrir_registro: function ()
    {
        this.datos_pendientes = null;
        prestamos_view.mostrar('registrar');
        prestamos_view.enfocar_registro();
    },

    volver: async function ()
    {
        this.datos_pendientes = null;
        this.renovacion_pendiente = null;
        prestamos_view.mostrar('personal');
        await this.cargar();
    },

    abrir_renovacion: function ()
    {
        this.renovacion_pendiente = null;
        prestamos_view.mostrar('renovar');
    },

    validar_renovacion: async function (datos)
    {
        try
        {
            const resultado = await prestamo_model.validar_renovacion(datos);
            this.renovacion_pendiente = datos;
            prestamos_view.renovacion(resultado);
            prestamos_view.mostrar('renovacion-validada');
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se puede renovar el préstamo', error.message);
        }
    },

    renovar: async function ()
    {
        if (!this.renovacion_pendiente) return;
        const datos = this.renovacion_pendiente;
        this.renovacion_pendiente = null;
        try
        {
            const resultado = await prestamo_model.renovar(datos);
            prestamos_view.mostrar('recibo');
            prestamos_view.recibo_renovacion(resultado);
        }
        catch (error)
        {
            this.renovacion_pendiente = datos;
            prestamos_view.mensaje('error', 'No se pudo confirmar la renovación', error.message);
        }
    },

    abrir_espera: function ()
    {
        prestamos_view.mostrar('espera');
    },

    abrir_agregar_espera: function ()
    {
        prestamos_view.preparar_espera();
        prestamos_view.mostrar('agregar-espera');
    },

    consultar_espera: async function (id_libro)
    {
        try
        {
            prestamos_view.lista_espera(await prestamo_model.espera(id_libro));
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo consultar la lista de espera', error.message);
        }
    },

    registrar_espera: async function (datos)
    {
        try
        {
            await prestamo_model.registrar_espera(datos);
            prestamos_view.mostrar('espera');
            await this.consultar_espera(datos.id_libro);
            prestamos_view.mensaje('ok', 'Solicitud registrada',
                'Se avisará al usuario cuando haya un ejemplar disponible.');
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo registrar en la lista', error.message);
        }
    },

    validar: async function (datos)
    {
        try
        {
            const prestamo = await prestamo_model.validar(datos);
            this.datos_pendientes = datos;
            prestamos_view.validacion(prestamo);
            prestamos_view.mostrar('validacion');
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se puede registrar el préstamo', error.message);
        }
    },

    registrar: async function ()
    {
        if (!this.datos_pendientes) return;
        const datos = this.datos_pendientes;
        this.datos_pendientes = null;
        try
        {
            const prestamo = await prestamo_model.registrar(datos);
            prestamos_view.recibo(prestamo);
            prestamos_view.mostrar('recibo');
        }
        catch (error)
        {
            this.datos_pendientes = datos;
            prestamos_view.mensaje('error', 'No se pudo confirmar el préstamo', error.message);
        }
    },

    autorizar: async function (folio, id_ejemplar)
    {
        try
        {
            const prestamo = await prestamo_model.autorizar(folio, id_ejemplar);
            prestamos_view.mensaje('ok', 'Préstamo autorizado',
                'Préstamo ' + prestamo.id_prestamo + ' · vence ' + ui.fecha(prestamo.fecha_vencimiento));
            await this.cargar();
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo autorizar el préstamo', error.message);
            await this.cargar();
        }
    }
};
