/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   pedidos_controller.iniciar() */
/*   pedidos_controller.periodo_actual() */
/*   pedidos_controller.cargar_presupuesto(version) */
/*   pedidos_controller.abrir_presupuesto() */
/*   pedidos_controller.guardar_presupuesto() */
/*   pedidos_controller.mostrar(tab) */
/*   pedidos_controller.dibujar_nueva(abrir) */
/*   pedidos_controller.total_centavos() */
/*   pedidos_controller.agregar() */
/*   pedidos_controller.enviar() */
/*   pedidos_controller.ver(id) */
/*   pedidos_controller.abrir_detalle(modo, id) */
/*   pedidos_controller.confirmar_envio() */
/*   pedidos_controller.responder(id, estatus) */
/*   pedidos_controller.recibir(id, id_ubicacion) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de modelos y vista; iniciar() una vez por página. */
/* Los callbacks reciben datos de la vista; errores se presentan por ella. */
/* La autorización definitiva se verifica en el servidor. */
/******************************************************************/

const pedidos_controller =
{
    lineas: [],
    catalogo: [],
    presupuesto: null,
    puede_solicitar: false,
    puede_autorizar: false,
    puede_recibir: false,
    procesando_envio: false,
    procesando_recepcion: false,
    procesando_presupuesto: false,
    tab_actual: 'historial',
    version_vista: 0,
    parcial: null,
    formato_periodo: new Intl.DateTimeFormat('sv-SE',
        { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit' }),

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'pedidos',
            migas: 'Solicitudes a Tesorería',
            funciones: ['Solicitar compras', 'Autorizar compras', 'Gestionar libros']
        });
        if (!usuario) return;
        this.puede_solicitar = usuario.funciones.includes('Solicitar compras');
        this.puede_autorizar = usuario.funciones.includes('Autorizar compras');
        this.puede_recibir = usuario.funciones.includes('Gestionar libros');
        if (!this.puede_solicitar) pedidos_view.ocultar_tabs(['nueva']);

        pedidos_view.enlazar(
        {
            mostrar: (...argumentos) => this.mostrar(...argumentos)
        });
        const modo = ui.param('modo');
        const id = Number(ui.param('id'));
        if (['enviada', 'consulta'].includes(modo) && Number.isInteger(id) && id > 0)
        {
            await this.abrir_detalle(modo, id);
            return;
        }
        try
        {
            this.catalogo = usuario.funciones.includes('Buscar libros') ? await busqueda_model
                .listado() : [];
        }
        catch (error_2)
        {
            this.catalogo = [];
        }

        const inicial = this.puede_recibir && window.location.hash === '#recepcion' ?
            'recepcion' : this.puede_solicitar ? 'nueva' : 'historial';
        this.mostrar(inicial);
    },

    abrir_detalle: async function (modo, id)
    {
        try
        {
            const datos = await pedido_model.detalle(id);
            if (modo === 'enviada') pedidos_view.enviada(datos, this.puede_solicitar);
            else pedidos_view.consulta(datos, this.puede_solicitar);
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
        }
    },

    periodo_actual: function ()
    {
        return this.formato_periodo.format(new Date());
    },

    cargar_presupuesto: async function (version)
    {
        const lista = await pedido_model.presupuestos();
        if (version !== this.version_vista) return;
        const mes = this.periodo_actual();
        this.presupuesto = lista.find((elemento) => elemento.periodo === mes) || null;
        pedidos_view.estadisticas(this.presupuesto, this.puede_autorizar,
            () => this.abrir_presupuesto());
        return lista;
    },

    mostrar: async function (tab)
    {
        const version = ++this.version_vista;
        this.tab_actual = tab;
        pedidos_view.activar(tab);
        try
        {
            await this.cargar_presupuesto(version);
            if (version !== this.version_vista) return;
            if (tab === 'nueva') this.dibujar_nueva();
            if (tab === 'historial')
            {
                const pedidos = await pedido_model.listar();
                if (version !== this.version_vista) return;
                pedidos_view.historial(pedidos, this.puede_autorizar,
                {
                    ver: (id) => this.ver(id),
                    responder: (id, elemento_2) => this.responder(id, elemento_2)
                });
            }
            if (tab === 'recepcion')
            {
                const autorizados = (await pedido_model.listar()).filter((elemento_3) => elemento_3
                    .estatus === 'Autorizado');
                const detalles = await Promise.all(autorizados.map((elemento_4) => pedido_model
                    .detalle(elemento_4.id_pedido)));
                const ubicaciones = this.puede_recibir ? (await libro_model.catalogos()).ubicaciones :
                    [];
                if (version !== this.version_vista) return;
                pedidos_view.recepcion(detalles, ubicaciones, this.puede_recibir, (id, usuario_2) =>
                    this.recibir(id, usuario_2));
            }
        }
        catch (error)
        {
            if (version === this.version_vista) pedidos_view.mensaje('error', error.message);
        }
    },

    /* Redibuja la solicitud y restaura una captura que todavía no es un renglón. */
    dibujar_nueva: function (abrir = false)
    {
        pedidos_view.nueva(this.catalogo, this.lineas, this.presupuesto,
            this.puede_autorizar,
            {
                registrar_presupuesto: () => this.abrir_presupuesto(),
                agregar: () => this.agregar(),
                mostrar: (tab) =>
                {
                    this.parcial = pedidos_view.borrador_parcial();
                    this.mostrar(tab);
                },
                quitar: (indice) =>
                {
                    this.parcial = pedidos_view.borrador_parcial();
                    this.lineas.splice(indice, 1);
                    this.dibujar_nueva(true);
                },
                vaciar: () =>
                {
                    this.lineas = [];
                    this.parcial = null;
                    this.dibujar_nueva();
                    pedidos_view.mensaje('info',
                        'Solicitud cancelada: no se realizaron cambios');
                },
                enviar: () => this.enviar(),
                ejemplo: () => pedidos_view.llenar_linea(
                {
                    id_libro: '',
                    titulo: 'Diseño de bases de datos',
                    autores: 'Carlos Coronel',
                    isbn: '9786074818785',
                    editorial: 'Cengage Learning',
                    cantidad: 2,
                    costo_unitario: 1250,
                    peticionario: '700123'
                }),
                elegir_libro: (id) =>
                {
                    const libro = this.catalogo.find((linea) => linea.id_libro === id);
                    pedidos_view.llenar_linea(
                    {
                        titulo: libro?.titulo || '',
                        autores: libro?.autores || '',
                        editorial: libro?.editorial || '',
                        isbn: libro?.isbn || ''
                    });
                }
            }, this.total_centavos());
        if (this.parcial) pedidos_view.llenar_linea(this.parcial);
        if (abrir || this.parcial) pedidos_view.abrir_formulario();
        this.parcial = null;
    },

    total_centavos: function ()
    {
        return this.lineas.reduce((suma, linea) =>
            suma + linea.cantidad * Math.round(linea.costo_unitario * 100), 0);
    },

    abrir_presupuesto: function ()
    {
        if (!this.puede_autorizar || this.presupuesto) return;
        if (this.tab_actual === 'nueva') this.parcial = pedidos_view.borrador_parcial();
        pedidos_view.presupuesto_formulario(this.periodo_actual(),
        {
            guardar: () => this.guardar_presupuesto(),
            cancelar: () => this.mostrar(this.tab_actual)
        });
    },

    guardar_presupuesto: async function ()
    {
        if (this.procesando_presupuesto || !this.puede_autorizar || this.presupuesto) return;
        const entrada = pedidos_view.monto_presupuesto();
        if (!/^(?:0|[1-9][0-9]{0,9})(?:\.[0-9]{1,2})?$/.test(entrada) ||
            Number(entrada) <= 0)
        {
            return pedidos_view.mensaje('error',
                'Captura un monto mayor a cero con máximo dos decimales');
        }
        const confirmado = await ui.dialogo(
        {
            titulo: 'Registrar presupuesto mensual',
            texto: 'Se registrarán ' + ui.dinero(Number(entrada)) +
                ' para el mes actual. Este monto no se podrá reemplazar desde esta pantalla.',
            confirmar: 'Registrar presupuesto'
        });
        if (!confirmado) return;
        this.procesando_presupuesto = true;
        pedidos_view.bloquear_presupuesto(true);
        try
        {
            await pedido_model.crear_presupuesto(entrada);
            await this.mostrar(this.tab_actual);
            pedidos_view.mensaje('ok', 'Presupuesto mensual registrado');
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
            pedidos_view.bloquear_presupuesto(false);
        }
        finally
        {
            this.procesando_presupuesto = false;
        }
    },

    agregar: function ()
    {
        const linea_2 = pedidos_view.linea();
        ui.limpiar();
        const invalidos = [];
        if (!linea_2.titulo || linea_2.titulo.length > 150) invalidos.push('titulo');
        if (linea_2.editorial?.length > 100) invalidos.push('editorial');
        if (linea_2.autores?.split(',').some((autor) => autor.trim().length > 100))
            invalidos.push('autores');
        if (!Number.isInteger(linea_2.cantidad) || linea_2.cantidad <= 0 ||
            linea_2.cantidad > 2147483647) invalidos.push('cantidad');
        const costo = linea_2.costo_unitario;
        if (!Number.isFinite(costo) || costo < 0 || costo > 9999999999.99 ||
            Number(costo.toFixed(2)) !== costo) invalidos.push('costo_unitario');
        linea_2.isbn = (linea_2.isbn || '').replace(/[-\s]/g, '').toUpperCase();
        if (linea_2.isbn && !/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(linea_2.isbn))
            invalidos.push('isbn');
        if (invalidos.length)
        {
            ui.marcar(invalidos);
            return pedidos_view.mensaje('error', 'Revisa los campos marcados',
                'Indica un título de hasta 150 caracteres, una cantidad entera positiva y un costo ' +
                'con hasta dos decimales. Cada autor y la editorial admiten 100 caracteres. ' +
                'El ISBN opcional debe ser de 10 o 13 caracteres.');
        }
        pedidos_view.mensaje();
        this.lineas.push(linea_2);
        this.dibujar_nueva(true);
    },

    enviar: async function ()
    {
        if (!this.lineas.length)
        {
            this.parcial = pedidos_view.borrador_parcial();
            pedidos_view.vacia(this.presupuesto, this.parcial,
            {
                anadir: () =>
                {
                    pedidos_view.activar('nueva');
                    this.dibujar_nueva(true);
                },
                cancelar: () =>
                {
                    this.parcial = null;
                    pedidos_view.activar('nueva');
                    this.dibujar_nueva();
                }
            });
            return;
        }
        const captura = pedidos_view.borrador_parcial();
        const pendiente = Object.entries(captura).some(([campo, valor]) =>
            campo === 'cantidad' ? valor !== '1' : Boolean(valor));
        if (pendiente)
        {
            pedidos_view.abrir_formulario();
            return pedidos_view.mensaje('warning', 'Hay un libro sin agregar',
                'Agrega el libro a la solicitud o limpia los campos antes de revisar.');
        }
        pedidos_view.revision(this.lineas, this.presupuesto,
        {
            editar: () => this.mostrar('nueva'),
            confirmar: () => this.confirmar_envio()
        }, this.total_centavos());
    },

    confirmar_envio: async function ()
    {
        if (this.procesando_envio) return;
        if (!this.lineas.length || !this.presupuesto ||
            this.total_centavos() > Math.round(this.presupuesto.saldo * 100))
            return pedidos_view.mensaje('error', 'No hay presupuesto suficiente para enviar');
        this.procesando_envio = true;
        try
        {
            const resultado = await pedido_model.crear(this.lineas);
            this.lineas = [];
            window.location.href = 'pedidos.html?modo=enviada&id=' +
                encodeURIComponent(resultado.pedido.id_pedido);
        }
        catch (error)
        {
            pedidos_view.mensaje('error', 'No se envió la solicitud', error.message);
        }
        finally
        {
            this.procesando_envio = false;
        }
    },

    ver: async function (id)
    {
        window.location.href = 'pedidos.html?modo=consulta&id=' + encodeURIComponent(id);
    },

    responder: async function (id, estatus)
    {
        const ok = await ui.dialogo(
        {
            titulo: 'Registrar respuesta de Tesorería',
            texto: 'La solicitud quedará como ' + estatus + '.' +
                (estatus === 'Rechazado' ? ' Se libera el presupuesto comprometido.' :
                    ' El catálogo podrá confirmar la recepción.'),
            confirmar: 'Registrar',
            peligro: estatus === 'Rechazado'
        });
        if (!ok) return;
        try
        {
            const resultado_2 = await pedido_model.estatus(id, estatus);
            pedidos_view.mensaje('ok', resultado_2.mensaje);
            this.mostrar('historial');
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
        }
    },

    recibir: async function (id, id_ubicacion)
    {
        if (this.procesando_recepcion) return;
        this.procesando_recepcion = true;
        pedidos_view.bloquear_recepcion(id, true);
        try
        {
            const detalle = await pedido_model.detalle(id);
            const resultado_3 = await pedido_model.recibir(id, Number(id_ubicacion) || null);
            pedidos_view.recibido(resultado_3, detalle);
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
            pedidos_view.bloquear_recepcion(id, false);
        }
        finally
        {
            this.procesando_recepcion = false;
        }
    }
};
