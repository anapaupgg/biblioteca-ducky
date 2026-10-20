/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Controller of pedidos.html. The librarian builds  */
/*              the order line by line (kept in memory until it   */
/*              is sent), records Tesorería's answer; the catalog */
/*              administrator confirms the reception.             */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PedidosController.iniciar()        - Layout, role, tabs      */
/*   PedidosController.mostrar(tab)     - Load a tab              */
/*   PedidosController.agregar()        - Add a line              */
/*   PedidosController.enviar()         - Review and send         */
/*   PedidosController.responder(id, e) - Tesorería answer        */
/*   PedidosController.recibir(id, u)   - Book reception          */
/******************************************************************/

const PedidosController =
{
    lineas: [],
    catalogo: [],
    presupuesto: null,
    puede_solicitar: false,
    puede_recibir: false,

    iniciar: async function()
    {
        const usuario = await Layout.montar({ activo: 'pedidos', migas: 'Solicitudes a Tesorería', funciones: ['Préstamos', 'Gestionar libros'] });
        if (!usuario) return;
        this.puede_solicitar = usuario.funciones.includes('Préstamos') || usuario.funciones.includes('Gestionar perfiles');
        this.puede_recibir = usuario.funciones.includes('Gestionar libros');
        if (!this.puede_solicitar) PedidosView.ocultar_tabs(['nueva']);

        document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => this.mostrar(t.dataset.tab)));
        try { this.catalogo = usuario.funciones.includes('Buscar libros') ? await BusquedaModel.listado() : []; } catch (e) { this.catalogo = []; }

        const inicial = window.location.hash === '#recepcion' || !this.puede_solicitar ? 'recepcion' : 'nueva';
        this.mostrar(inicial);
    },

    cargar_presupuesto: async function()
    {
        const lista = await PedidoModel.presupuestos();
        const mes = Ui.hoy().slice(0, 7);
        this.presupuesto = lista.find((p) => p.periodo === mes) || null;
        PedidosView.estadisticas(this.presupuesto);
        return lista;
    },

    mostrar: async function(tab)
    {
        PedidosView.activar(tab);
        try
        {
            await this.cargar_presupuesto();
            if (tab === 'nueva') this.dibujar_nueva();
            if (tab === 'historial')
            {
                PedidosView.historial(await PedidoModel.listar(), this.puede_solicitar,
                    { ver: (id) => this.ver(id), responder: (id, e) => this.responder(id, e) });
            }
            if (tab === 'recepcion')
            {
                const autorizados = (await PedidoModel.listar()).filter((p) => p.estatus === 'Autorizado');
                const detalles = await Promise.all(autorizados.map((p) => PedidoModel.detalle(p.id_pedido)));
                const ubicaciones = this.puede_recibir ? (await LibroModel.catalogos()).ubicaciones : [];
                PedidosView.recepcion(detalles, ubicaciones, this.puede_recibir, (id, u) => this.recibir(id, u));
            }
        }
        catch (error) { PedidosView.mensaje('error', error.message); }
    },

    dibujar_nueva: function()
    {
        PedidosView.nueva(this.catalogo, this.lineas, this.presupuesto ? this.presupuesto.saldo : null,
        {
            agregar: () => this.agregar(),
            quitar: (i) => { this.lineas.splice(i, 1); this.dibujar_nueva(); },
            vaciar: () => { this.lineas = []; this.dibujar_nueva(); PedidosView.mensaje('info', 'Solicitud cancelada: no se realizaron cambios'); },
            enviar: () => this.enviar(),
            ejemplo: () => PedidosView.llenar_linea({ id_libro: '', titulo: 'Diseño de bases de datos', autores: 'Carlos Coronel', isbn: '9786074818785',
                                                      editorial: 'Cengage Learning', cantidad: 2, costo_unitario: 1250, peticionario: '700123' }),
            elegir_libro: (id) =>
            {
                const libro = this.catalogo.find((l) => l.id_libro === id);
                if (libro) PedidosView.llenar_linea({ titulo: libro.titulo, autores: libro.autores || '', editorial: libro.editorial, isbn: '' });
            }
        });
    },

    agregar: function()
    {
        const l = PedidosView.linea();
        Ui.limpiar();
        const vacios = [];
        if (!l.titulo) vacios.push('titulo');
        if (!(l.cantidad > 0)) vacios.push('cantidad');
        if (!(l.costo_unitario >= 0)) vacios.push('costo_unitario');
        if (l.isbn && !/^([0-9]{9}[0-9X]|[0-9]{13})$/.test(l.isbn.replace(/-/g, ''))) vacios.push('isbn');
        if (vacios.length)
        {
            Ui.marcar(vacios);
            return PedidosView.mensaje('error', 'Completa los campos obligatorios', 'Título, cantidad y costo estimado; el ISBN debe tener 10 o 13 dígitos.');
        }
        PedidosView.mensaje();
        this.lineas.push(l);
        this.dibujar_nueva();
    },

    enviar: async function()
    {
        if (!this.lineas.length) return PedidosView.mensaje('error', 'Agrega al menos un libro');
        const total = this.lineas.reduce((s, l) => s + l.cantidad * l.costo_unitario, 0);
        const ok = await Ui.dialogo(
        {
            titulo: 'Revisar orden de compra',
            texto: this.lineas.length + ' título(s) · total estimado ' + Ui.dinero(total) + '. Destinatario: Tesorería.' +
                   (this.presupuesto ? ' Saldo del mes: ' + Ui.dinero(this.presupuesto.saldo) + '.' : ' No hay presupuesto registrado este mes.'),
            confirmar: 'Enviar a Tesorería'
        });
        if (!ok) return;
        try
        {
            const r = await PedidoModel.crear(this.lineas);
            this.lineas = [];
            PedidosView.mensaje('ok', 'Solicitud enviada a Tesorería · ' + r.pedido.folio, r.lineas.length + ' título(s) · ' + Ui.dinero(r.pedido.total));
            this.mostrar('historial');
        }
        catch (error) { PedidosView.mensaje('error', 'No se envió la solicitud', error.message); }
    },

    ver: async function(id)
    {
        try { PedidosView.detalle(await PedidoModel.detalle(id)); }
        catch (error) { PedidosView.mensaje('error', error.message); }
    },

    responder: async function(id, estatus)
    {
        const ok = await Ui.dialogo({ titulo: 'Registrar respuesta de Tesorería', texto: 'La solicitud quedará como ' + estatus + '.' +
            (estatus === 'Rechazado' ? ' Se libera el presupuesto comprometido.' : ' El catálogo podrá confirmar la recepción.'), confirmar: 'Registrar', peligro: estatus === 'Rechazado' });
        if (!ok) return;
        try { const r = await PedidoModel.estatus(id, estatus); PedidosView.mensaje('ok', r.mensaje); this.mostrar('historial'); }
        catch (error) { PedidosView.mensaje('error', error.message); }
    },

    recibir: async function(id, id_ubicacion)
    {
        try
        {
            const r = await PedidoModel.recibir(id, Number(id_ubicacion) || null);
            await this.mostrar('recepcion');
            PedidosView.recibido(r);
        }
        catch (error) { PedidosView.mensaje('error', error.message); }
    }
};
