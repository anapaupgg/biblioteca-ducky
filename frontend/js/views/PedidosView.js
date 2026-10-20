/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: View of pedidos.html: new order (lines),          */
/*              order review, order status, book reception        */
/*              (the monthly budget is shown as reference).       */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   PedidosView.activar(tab)                  - Highlight tab    */
/*   PedidosView.estadisticas(presupuesto)     - Budget counters  */
/*   PedidosView.nueva(catalogo, lineas, ...)  - New order form   */
/*   PedidosView.linea()                       - Line values      */
/*   PedidosView.historial(lista, acciones)    - Sent orders      */
/*   PedidosView.detalle(p, acciones)          - Order dialog     */
/*   PedidosView.recepcion(lista, ubic, cb)    - Reception        */
/******************************************************************/

const PedidosView =
{
    activar: function(tab) { document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab)); },

    ocultar_tabs: function(tabs) { tabs.forEach((t) => { const b = document.querySelector('.tab[data-tab="' + t + '"]'); if (b) b.classList.add('hidden'); }); },

    estadisticas: function(p)
    {
        document.getElementById('stats').innerHTML = p
            ? '<div class="stat"><span>Presupuesto ' + Ui.esc(p.periodo) + '</span><strong>' + Ui.dinero(p.monto_autorizado) + '</strong></div>' +
              '<div class="stat"><span>Comprometido</span><strong>' + Ui.dinero(p.comprometido) + '</strong></div>' +
              '<div class="stat"><span>Saldo disponible</span><strong>' + Ui.dinero(p.saldo) + '</strong></div>'
            : '<div class="stat"><span>Presupuesto del mes</span><strong>Sin registrar</strong></div>';
    },

    nueva: function(catalogo, lineas, saldo, acciones)
    {
        const total = lineas.reduce((s, l) => s + l.cantidad * l.costo_unitario, 0);
        document.getElementById('panel').innerHTML =
            '<div class="card"><h2>Agregar libro a la solicitud</h2><form id="form-linea" novalidate><div class="grid-3">' +
            '<div class="field span-2"><label for="id_libro">Libro del catálogo (opcional)</label><select id="id_libro">' +
                Ui.opciones(catalogo, 'id_libro', (l) => l.id_libro + ' · ' + l.titulo, '', 'Título nuevo (no está en el catálogo)') + '</select></div>' +
            '<div class="field"><label for="peticionario">Petición de usuario (clave)</label><input id="peticionario" maxlength="6" placeholder="Ej. 700123"></div>' +
            '<div class="field"><label for="titulo">Título</label><input id="titulo" placeholder="Ej. Diseño de bases de datos"></div>' +
            '<div class="field"><label for="autores">Autor(es)</label><input id="autores" placeholder="Ej. Carlos Coronel"></div>' +
            '<div class="field"><label for="isbn">ISBN</label><input id="isbn" maxlength="17" placeholder="Ej. 9786074818785"></div>' +
            '<div class="field"><label for="editorial">Editorial</label><input id="editorial" placeholder="Ej. Cengage Learning"></div>' +
            '<div class="field"><label for="cantidad">Cantidad</label><input id="cantidad" type="number" min="1" value="1"></div>' +
            '<div class="field"><label for="costo_unitario">Costo unitario estimado (MXN)</label><input id="costo_unitario" type="number" min="0" step="0.01" placeholder="Ej. 950"></div>' +
            '</div><div class="actions" style="margin-bottom:0"><button class="btn" type="submit">Agregar libro</button>' +
            '<button class="btn" type="button" id="btn-ejemplo">Cargar petición de ejemplo</button></div></form></div>' +

            '<div class="card"><h2>Solicitud a Tesorería · ' + lineas.length + ' libro(s)</h2><div id="tabla-lineas"></div>' +
            '<p style="margin-top:12px"><strong>Total estimado: ' + Ui.dinero(total) + '</strong>' +
            (saldo !== null ? ' · Saldo del mes: ' + Ui.dinero(saldo) + (total > saldo ? ' <span class="badge badge-error">Rebasa el presupuesto</span>' : '') : '') + '</p>' +
            '<div class="actions" style="margin-bottom:0"><button class="btn btn-primary" id="btn-enviar"' + (lineas.length ? '' : ' disabled') + '>Revisar y enviar a Tesorería</button>' +
            '<button class="btn" id="btn-vaciar"' + (lineas.length ? '' : ' disabled') + '>Cancelar solicitud</button></div></div>';

        Ui.tabla('tabla-lineas',
        [
            { titulo: '#',        valor: (l) => String(lineas.indexOf(l) + 1) },
            { titulo: 'Título',   valor: (l) => '<strong>' + Ui.esc(l.titulo) + '</strong>' + (l.id_libro ? '<div class="small muted">' + Ui.esc(l.id_libro) + ' · en catálogo</div>' : '<div class="small muted">Título nuevo</div>') },
            { titulo: 'Autor',    valor: (l) => Ui.esc(l.autores || '—') },
            { titulo: 'ISBN',     valor: (l) => Ui.esc(l.isbn || '—') },
            { titulo: 'Cantidad', valor: (l) => String(l.cantidad) },
            { titulo: 'Subtotal', valor: (l) => Ui.dinero(l.cantidad * l.costo_unitario) },
            { titulo: 'Peticionario', valor: (l) => Ui.esc(l.peticionario || '—') },
            { titulo: '',         valor: (l) => '<button class="btn btn-sm" data-quitar="' + lineas.indexOf(l) + '">Quitar</button>' }
        ], lineas, { vacio: 'Agrega al menos un libro' });

        document.getElementById('form-linea').addEventListener('submit', (e) => { e.preventDefault(); acciones.agregar(); });
        document.getElementById('btn-ejemplo').addEventListener('click', acciones.ejemplo);
        document.getElementById('btn-enviar').addEventListener('click', acciones.enviar);
        document.getElementById('btn-vaciar').addEventListener('click', acciones.vaciar);
        document.getElementById('id_libro').addEventListener('change', (e) => acciones.elegir_libro(e.target.value));
        document.querySelectorAll('[data-quitar]').forEach((b) => b.addEventListener('click', () => acciones.quitar(Number(b.dataset.quitar))));
    },

    linea: function()
    {
        const d = Ui.leer(['id_libro', 'titulo', 'autores', 'isbn', 'editorial', 'cantidad', 'costo_unitario', 'peticionario']);
        d.cantidad = Number(d.cantidad);
        d.costo_unitario = d.costo_unitario === '' ? NaN : Number(d.costo_unitario);
        return d;
    },

    llenar_linea: function(valores) { Object.entries(valores).forEach(([k, v]) => { const el = document.getElementById(k); if (el) el.value = v; }); },

    historial: function(lista, puede_responder, acciones)
    {
        Ui.tabla('panel',
        [
            { titulo: 'Folio',     valor: (p) => '<strong>' + Ui.esc(p.folio) + '</strong>' },
            { titulo: 'Enviada',   valor: (p) => Ui.fecha_hora(p.fecha_envio) + '<div class="small muted">' + Ui.esc(p.solicitante) + '</div>' },
            { titulo: 'Libros',    valor: (p) => p.lineas + ' título(s) · ' + p.ejemplares + ' ejemplar(es)' },
            { titulo: 'Total',     valor: (p) => Ui.dinero(p.total) },
            { titulo: 'Estatus',   valor: (p) => Ui.badge(p.estatus) + (p.fecha_recepcion ? '<div class="small muted">recibido ' + Ui.fecha(p.fecha_recepcion) + '</div>' : '') },
            { titulo: '',          valor: (p) => '<div class="row-actions"><button class="btn btn-sm" data-ver="' + p.id_pedido + '">Consultar</button>' +
                (puede_responder && p.estatus === 'Enviado' ? '<button class="btn btn-sm btn-primary" data-resp="' + p.id_pedido + '" data-e="Autorizado">Autorizada</button>' +
                    '<button class="btn btn-sm btn-danger" data-resp="' + p.id_pedido + '" data-e="Rechazado">Rechazada</button>' : '') + '</div>' }
        ], lista, { vacio: 'Aún no se han enviado solicitudes' });
        document.querySelectorAll('[data-ver]').forEach((b) => b.addEventListener('click', () => acciones.ver(Number(b.dataset.ver))));
        document.querySelectorAll('[data-resp]').forEach((b) => b.addEventListener('click', () => acciones.responder(Number(b.dataset.resp), b.dataset.e)));
    },

    detalle: function(d)
    {
        const p = d.pedido;
        const dialogo = Ui.dialogo(
        {
            titulo: 'Solicitud ' + p.folio + ' · ' + p.estatus,
            texto: 'Destinatario: Tesorería · Presupuesto ' + p.periodo + ' · Enviada ' + Ui.fecha_hora(p.fecha_envio) + ' por ' + p.solicitante,
            cuerpo: '<div id="detalle-lineas"></div><p><strong>Total: ' + Ui.dinero(p.total) + '</strong></p>',
            confirmar: 'Cerrar', cancelar: false
        });
        Ui.tabla('detalle-lineas',
        [
            { titulo: 'Título',   valor: (l) => Ui.esc(l.titulo_solicitado) + '<div class="small muted">' + Ui.esc(l.autores || '') + '</div>' },
            { titulo: 'Cant.',    valor: (l) => String(l.cantidad) },
            { titulo: 'Subtotal', valor: (l) => Ui.dinero(l.subtotal) }
        ], d.lineas);
        return dialogo;
    },

    recepcion: function(pendientes, ubicaciones, puede_recibir, recibir)
    {
        if (!pendientes.length)
        {
            document.getElementById('panel').innerHTML = '<div class="empty">No hay solicitudes autorizadas por Tesorería pendientes de recibir</div>';
            return;
        }
        document.getElementById('panel').innerHTML = pendientes.map((d) =>
            '<div class="card"><h2>Orden ' + Ui.esc(d.pedido.folio) + ' · Autorizada por Tesorería</h2>' +
            d.lineas.map((l) => '<p>' + Ui.esc(l.titulo_solicitado) + (l.autores ? ' · ' + Ui.esc(l.autores) : '') + '<br><span class="small muted">' +
                (l.isbn_solicitado ? 'ISBN ' + Ui.esc(l.isbn_solicitado) + ' · ' : '') + l.cantidad + ' ejemplar(es) · ' +
                (l.id_libro ? 'se etiquetan en ' + Ui.esc(l.id_libro) : 'título nuevo: requiere crear su ficha') + '</span></p>').join('') +
            '<p class="small muted">Responsable de la solicitud: ' + Ui.esc(d.pedido.solicitante) + '</p>' +
            (puede_recibir
                ? '<div class="grid-2"><div class="field"><label for="ubic-' + d.pedido.id_pedido + '">Ubicación de los ejemplares</label><select id="ubic-' + d.pedido.id_pedido + '">' +
                  Ui.opciones(ubicaciones, 'id', 'etiqueta', '', 'Selecciona la ubicación') + '</select></div></div>' +
                  '<div class="actions" style="margin-bottom:0"><button class="btn btn-primary" data-recibir="' + d.pedido.id_pedido + '">Confirmar recepción</button></div>'
                : '<p class="small muted">La recepción la confirma el Administrador del catálogo.</p>') + '</div>').join('');
        document.querySelectorAll('[data-recibir]').forEach((b) => b.addEventListener('click', () =>
            recibir(Number(b.dataset.recibir), document.getElementById('ubic-' + b.dataset.recibir).value)));
    },

    recibido: function(r)
    {
        const nuevos = r.sin_ficha.map((l) => '<a class="btn btn-sm" href="libro_form.html?titulo=' + encodeURIComponent(l.titulo_solicitado) +
            '&isbn=' + encodeURIComponent(l.isbn_solicitado || '') + '&editorial=' + encodeURIComponent(l.editorial || '') +
            '&autores=' + encodeURIComponent(l.autores || '') + '">Crear ficha: ' + Ui.esc(l.titulo_solicitado) + '</a>').join(' ');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Recepción confirmada</strong><span>' +
            (r.ejemplares.length ? 'Ejemplares etiquetados: ' + Ui.esc(r.ejemplares.join(', ')) + '. ' : '') +
            (r.sin_ficha.length ? 'Faltan fichas para ' + r.sin_ficha.length + ' título(s) nuevo(s).' : '') + '</span></div>' +
            (nuevos ? '<div class="actions">' + nuevos + '</div>' : '');
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};
