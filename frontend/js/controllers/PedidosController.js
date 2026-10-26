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
    puede_recibir: false,

    iniciar: async function ()
    {
        const usuario = await layout.montar(
        {
            activo: 'pedidos',
            migas: 'Solicitudes a Tesorería',
            funciones: ['Préstamos', 'Gestionar libros']
        });
        if (!usuario) return;
        this.puede_solicitar = usuario.funciones.includes('Préstamos');
        this.puede_recibir = usuario.funciones.includes('Gestionar libros');
        if (!this.puede_solicitar) pedidos_view.ocultar_tabs(['nueva']);

        pedidos_view.enlazar(
        {
            mostrar: (...argumentos) => this.mostrar(...argumentos)
        });
        try
        {
            this.catalogo = usuario.funciones.includes('Buscar libros') ? await busqueda_model
                .listado() : [];
        }
        catch (error_2)
        {
            this.catalogo = [];
        }

        const inicial = window.location.hash === '#recepcion' || !this.puede_solicitar ? 'recepcion' :
            'nueva';
        this.mostrar(inicial);
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
                pedidos_view.historial(await pedido_model.listar(), this.puede_solicitar,
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
        pedidos_view.nueva(this.catalogo, this.lineas, this.presupuesto ? this.presupuesto.saldo :
            null,
            {
                agregar: () => this.agregar(),
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
        if (!(linea_2.cantidad > 0)) vacios.push('cantidad');
        if (!(linea_2.costo_unitario >= 0)) vacios.push('costo_unitario');
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
        const total = this.lineas.reduce((registro, linea_3) => registro + linea_3.cantidad * linea_3
            .costo_unitario, 0);
        const ok = await ui.dialogo(
        {
            titulo: 'Revisar orden de compra',
            texto: this.lineas.length + ' título(s) · total estimado ' + ui.dinero(total) +
                '. Destinatario: Tesorería.' +
                (this.presupuesto ? ' Saldo del mes: ' + ui.dinero(this.presupuesto.saldo) +
                    '.' : ' No hay presupuesto registrado este mes.'),
            confirmar: 'Enviar a Tesorería'
        });
        if (!ok) return;
        try
        {
            const resultado = await pedido_model.crear(this.lineas);
            this.lineas = [];
            pedidos_view.mensaje('ok', 'Solicitud enviada a Tesorería · ' + resultado.pedido.folio,
                resultado.lineas.length + ' título(s) · ' + ui.dinero(resultado.pedido.total));
            this.mostrar('historial');
        }
        catch (error)
        {
            pedidos_view.mensaje('error', 'No se envió la solicitud', error.message);
        }
    },

    ver: async function (id)
    {
        try
        {
            pedidos_view.detalle(await pedido_model.detalle(id));
        }
        catch (error)
        {
            pedidos_view.mensaje('error', error.message);
        }
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
