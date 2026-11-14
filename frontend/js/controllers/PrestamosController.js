/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Coordina vistas y modelo cliente de préstamos.    */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, cargar, validar, registrar,         */
/* autorizar, abrir_boleta y volver_recibo.                        */
/* Reuse Instructions: iniciar una vez; permisos visuales vienen  */
/* de la sesión, la API los comprueba de nuevo.                    */
/******************************************************************/

const prestamos_controller =
{
    libro_espera_consultado: null,
    funciones: [],
    datos_pendientes: null,
    renovacion_pendiente: null,
    prestamo_actual: null,
    enviando_correo: false,
    numero_whatsapp: null,

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
            registrar_espera: (datos) => this.registrar_espera(datos),
            abrir_boleta: () => this.abrir_boleta(),
            volver_recibo: () => this.volver_recibo(),
            abrir_correo: () => this.abrir_correo(),
            enviar_correo: () => this.enviar_correo(),
            abrir_whatsapp: () => this.abrir_whatsapp(),
            preparar_whatsapp: (numero) => this.preparar_whatsapp(numero),
            abrir_mensaje_whatsapp: () => this.abrir_mensaje_whatsapp(),
            descargar_boleta: () => this.descargar_boleta()
        });
        await this.cargar();
        const libro_espera = prestamos_view.entrada_espera();
        if (libro_espera && this.funciones.includes('Préstamos'))
        {
            this.abrir_espera();
            prestamos_view.prellenar_espera(libro_espera);
            await this.consultar_espera(libro_espera);
        }
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
        this.prestamo_actual = null;
        this.numero_whatsapp = null;
        prestamos_view.mostrar('registrar');
        prestamos_view.enfocar_registro();
    },

    volver: async function ()
    {
        this.datos_pendientes = null;
        this.renovacion_pendiente = null;
        this.prestamo_actual = null;
        this.numero_whatsapp = null;
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
            this.prestamo_actual = null;
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
        if (this.libro_espera_consultado)
        {
            prestamos_view.prellenar_espera(this.libro_espera_consultado);
            return this.consultar_espera(this.libro_espera_consultado);
        }
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
            const datos = await prestamo_model.espera(id_libro);
            this.libro_espera_consultado = id_libro;
            prestamos_view.lista_espera(datos);
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
            this.prestamo_actual = prestamo;
            prestamos_view.mostrar('recibo');
            prestamos_view.recibo(prestamo);
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
            this.prestamo_actual = prestamo;
            prestamos_view.mostrar('recibo');
            prestamos_view.recibo(prestamo);
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo autorizar el préstamo', error.message);
            await this.cargar();
        }
    },

    abrir_boleta: function ()
    {
        if (!this.prestamo_actual)
        {
            prestamos_view.imprimir();
            return;
        }
        prestamos_view.mostrar('boleta');
        prestamos_view.boleta(this.prestamo_actual);
    },

    volver_recibo: function ()
    {
        if (!this.prestamo_actual) return;
        prestamos_view.mostrar('recibo');
        prestamos_view.recibo(this.prestamo_actual);
    },

    abrir_correo: function ()
    {
        if (!this.prestamo_actual) return;
        prestamos_view.mostrar('correo');
        prestamos_view.correo(this.prestamo_actual);
    },

    enviar_correo: async function ()
    {
        if (!this.prestamo_actual || this.enviando_correo) return;
        this.enviando_correo = true;
        prestamos_view.enviando_correo(true);
        try
        {
            await prestamo_model.enviar_boleta(this.prestamo_actual.id_prestamo);
            prestamos_view.mostrar('correo-enviado');
            prestamos_view.correo_enviado(this.prestamo_actual);
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo enviar la boleta', error.message);
        }
        finally
        {
            this.enviando_correo = false;
            prestamos_view.enviando_correo(false);
        }
    },

    abrir_whatsapp: function ()
    {
        if (!this.prestamo_actual) return;
        prestamos_view.error_whatsapp(false);
        prestamos_view.mostrar('whatsapp');
    },

    preparar_whatsapp: async function (numero)
    {
        if (!this.prestamo_actual) return;
        if (!/^\d{10}$/.test(numero))
        {
            prestamos_view.error_whatsapp(true);
            return;
        }
        prestamos_view.error_whatsapp(false);
        try
        {
            const pdf = await prestamo_model.descargar_boleta(this.prestamo_actual.id_prestamo);
            prestamos_view.descargar_pdf(pdf, this.prestamo_actual.folio_prestamo);
            this.numero_whatsapp = numero;
            prestamos_view.mostrar('whatsapp-preparado');
            prestamos_view.whatsapp_preparado(this.prestamo_actual, numero);
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo preparar la boleta', error.message);
        }
    },

    abrir_mensaje_whatsapp: function ()
    {
        if (!this.prestamo_actual || !this.numero_whatsapp) return;
        prestamos_view.abrir_mensaje_whatsapp(this.numero_whatsapp, this.prestamo_actual);
    },

    descargar_boleta: async function ()
    {
        if (!this.prestamo_actual) return;
        try
        {
            const pdf = await prestamo_model.descargar_boleta(this.prestamo_actual.id_prestamo);
            prestamos_view.descargar_pdf(pdf, this.prestamo_actual.folio_prestamo);
        }
        catch (error)
        {
            prestamos_view.mensaje('error', 'No se pudo descargar la boleta', error.message);
        }
    }
};
