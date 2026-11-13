/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Controlador cliente: coordina modelo, vista y validaciones. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   pedidos_controller.iniciar() */
/*   pedidos_controller.cargar_presupuesto() */
/*   pedidos_controller.mostrar(tab) */
/*   pedidos_controller.dibujar_nueva() */
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

    cargar_presupuesto: async function ()
    {
        const lista = await pedido_model.presupuestos();
        const mes = ui.hoy().slice(0, 7);
        this.presupuesto = lista.find((elemento) => elemento.periodo === mes) || null;
        pedidos_view.estadisticas(this.presupuesto);
        return lista;
    },

    mostrar: async function (tab)
    {
        pedidos_view.activar(tab);
        try
        {
            await this.cargar_presupuesto();
            if (tab === 'nueva') this.dibujar_nueva();
            if (tab === 'historial')
            {
                pedidos_view.historial(await pedido_model.listar(), this.puede_autorizar,
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
                pedidos_view.recepcion(detalles, ubicaciones, this.puede_recibir, (id, usuario_2) =>
                    this.recibir(id, usuario_2));
            }
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
        }
    },

    dibujar_nueva: function ()
    {
        pedidos_view.nueva(this.catalogo, this.lineas, this.presupuesto,
            {
                agregar: () => this.agregar(),
                mostrar: (tab) => this.mostrar(tab),
                quitar: (indice) =>
                {
                    this.lineas.splice(indice, 1);
                    this.dibujar_nueva();
                },
                vaciar: () =>
                {
                    this.lineas = [];
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
                    if (libro) pedidos_view.llenar_linea(
                    {
                        titulo: libro.titulo,
                        autores: libro.autores || '',
                        editorial: libro.editorial,
                        isbn: ''
                    });
                }
            });
    },

    agregar: function ()
    {
        const linea_2 = pedidos_view.linea();
        ui.limpiar();
        const vacios = [];
        if (!linea_2.titulo) vacios.push('titulo');
        if (!Number.isInteger(linea_2.cantidad) || linea_2.cantidad <= 0) vacios.push('cantidad');
        if (!Number.isFinite(linea_2.costo_unitario) || linea_2.costo_unitario < 0) vacios.push('costo_unitario');
        if (linea_2.isbn && !/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(linea_2.isbn.replace(/-/g, '')))
            vacios.push('isbn');
        if (vacios.length)
        {
            ui.marcar(vacios);
            return pedidos_view.mensaje('error', 'Completa los campos obligatorios',
                'Título, cantidad y costo estimado; el ISBN debe tener 10 o 13 dígitos.');
        }
        pedidos_view.mensaje();
        this.lineas.push(linea_2);
        this.dibujar_nueva();
    },

    enviar: async function ()
    {
        if (!this.lineas.length) return pedidos_view.mensaje('error', 'Agrega al menos un libro');
        pedidos_view.revision(this.lineas, this.presupuesto,
        {
            editar: () => this.mostrar('nueva'),
            confirmar: () => this.confirmar_envio()
        });
    },

    confirmar_envio: async function ()
    {
        if (this.procesando_envio) return;
        const total = this.lineas.reduce((suma, linea) => suma + linea.cantidad *
            linea.costo_unitario, 0);
        if (!this.lineas.length || !this.presupuesto || total > this.presupuesto.saldo)
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
        try
        {
            const resultado_3 = await pedido_model.recibir(id, Number(id_ubicacion) || null);
            await this.mostrar('recepcion');
            pedidos_view.recibido(resultado_3);
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
        }
    }
};
