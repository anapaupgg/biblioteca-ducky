/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web */
/* Name: Equipo FlowBit */
/* Date: 2026-10-26 */
/* Description: Vista: presentación, captura y eventos de la página. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: */
/*   pedidos_view.enlazar(acciones) */
/*   pedidos_view.activar(tab) */
/*   pedidos_view.ocultar_tabs(tabs) */
/*   pedidos_view.estadisticas(elemento_4) */
/*   pedidos_view.nueva(catalogo, lineas, saldo, acciones) */
/*   pedidos_view.linea() */
/*   pedidos_view.llenar_linea(valores) */
/*   pedidos_view.historial(lista, puede_responder, acciones) */
/*   pedidos_view.detalle(datos_2) */
/*   pedidos_view.recepcion(pendientes, ubicaciones, puede_recibir, recibir) */
/*   pedidos_view.recibido(resultado) */
/*   pedidos_view.mensaje(tipo, titulo, texto) */
/******************************************************************/

/******************************************************************/
/* Reuse Instructions */
/* Cargar después de ui y antes del controlador de la página. */
/* Acciones: objeto de callbacks; datos: objetos/arrays de los modelos. */
/* No invocar API ni decidir permisos aquí. Mostrar texto con escape. */
/******************************************************************/

const pedidos_view =
{
    /* enlazar(acciones): callbacks del controlador; llamar una vez por página. */
    enlazar: function (acciones)
    {
        document.querySelectorAll('.tab').forEach((elemento) => elemento.addEventListener('click',
        () => acciones.mostrar(elemento.dataset.tab)));
    },

    activar: function (tab)
    {
        document.querySelectorAll('.tab').forEach((elemento_2) => elemento_2.classList.toggle(
            'active', elemento_2.dataset.tab === tab));
    },

    ocultar_tabs: function (tabs)
    {
        tabs.forEach((elemento_3) =>
        {
            const boton = document.querySelector('.tab[data-tab="' + elemento_3 + '"]');
            if (boton) boton.classList.add('hidden');
        });
    },

    estadisticas: function (elemento_4)
    {
        document.getElementById('stats').innerHTML = elemento_4 ?
            '<div class="stat"><span>Presupuesto ' + ui.esc(elemento_4.periodo) + '</span><strong>' +
            ui.dinero(elemento_4.monto_autorizado) + '</strong></div>' +
            '<div class="stat"><span>Comprometido</span><strong>' + ui.dinero(elemento_4
            .comprometido) + '</strong></div>' +
            '<div class="stat"><span>Saldo disponible</span><strong>' + ui.dinero(elemento_4.saldo) +
            '</strong></div>' :
            '<div class="stat"><span>Presupuesto del mes</span><strong>Sin registrar</strong></div>';
    },

    nueva: function (catalogo, lineas, saldo, acciones)
    {
        const total = lineas.reduce((registro, linea) => registro + linea.cantidad * linea
            .costo_unitario, 0);
        document.getElementById('panel').innerHTML =
            '<div class="card"><h2>Agregar libro a la solicitud</h2><form id="form-linea" novalidate><div class="grid-3">' +
            '<div class="field span-2"><label for="id_libro">Libro del catálogo (opcional)</label><select id="id_libro">' +
            ui.opciones(catalogo, 'id_libro', (linea_2) => linea_2.id_libro + ' · ' + linea_2.titulo,
                '', 'Título nuevo (no está en el catálogo)') + '</select></div>' +
            '<div class="field"><label for="peticionario">Petición de usuario (clave)</label><input id="peticionario" maxlength="6" placeholder="Ej. 700123"></div>' +
            '<div class="field"><label for="titulo">Título</label><input id="titulo" placeholder="Ej. Diseño de bases de datos"></div>' +
            '<div class="field"><label for="autores">Autor(es)</label><input id="autores" placeholder="Ej. Carlos Coronel"></div>' +
            '<div class="field"><label for="isbn">ISBN</label><input id="isbn" maxlength="17" placeholder="Ej. 9786074818785"></div>' +
            '<div class="field"><label for="editorial">Editorial</label><input id="editorial" placeholder="Ej. Cengage Learning"></div>' +
            '<div class="field"><label for="cantidad">Cantidad</label><input id="cantidad" type="number" min="1" value="1"></div>' +
            '<div class="field"><label for="costo_unitario">Costo unitario estimado (MXN)</label><input id="costo_unitario" type="number" min="0" step="0.01" placeholder="Ej. 950"></div>' +
            '</div><div class="actions" style="margin-bottom:0"><button class="btn" type="submit">Agregar libro</button>' +
            '<button class="btn" type="button" id="btn-ejemplo">Cargar petición de ejemplo</button></div></form></div>' +

            '<div class="card"><h2>Solicitud a Tesorería · ' + lineas.length +
            ' libro(s)</h2><div id="tabla-lineas"></div>' +
            '<p style="margin-top:12px"><strong>Total estimado: ' + ui.dinero(total) + '</strong>' +
            (saldo !== null ? ' · Saldo del mes: ' + ui.dinero(saldo) + (total > saldo ?
                ' <span class="badge badge-error">Rebasa el presupuesto</span>' : '') : '') + '</p>' +
            '<div class="actions" style="margin-bottom:0"><button class="btn btn-primary" id="btn-enviar"' +
            (lineas.length ? '' : ' disabled') + '>Revisar y enviar a Tesorería</button>' +
            '<button class="btn" id="btn-vaciar"' + (lineas.length ? '' : ' disabled') +
            '>Cancelar solicitud</button></div></div>';

        ui.tabla('tabla-lineas',
            [
            {
                titulo: '#',
                valor: (linea_3) => String(lineas.indexOf(linea_3) + 1)
            },
            {
                titulo: 'Título',
                valor: (linea_4) => '<strong>' + ui.esc(linea_4.titulo) + '</strong>' + (
                    linea_4.id_libro ? '<div class="small muted">' + ui.esc(linea_4
                        .id_libro) + ' · en catálogo</div>' :
                    '<div class="small muted">Título nuevo</div>')
            },
            {
                titulo: 'Autor',
                valor: (linea_5) => ui.esc(linea_5.autores || '—')
            },
            {
                titulo: 'ISBN',
                valor: (linea_6) => ui.esc(linea_6.isbn || '—')
            },
            {
                titulo: 'Cantidad',
                valor: (linea_7) => String(linea_7.cantidad)
            },
            {
                titulo: 'Subtotal',
                valor: (linea_8) => ui.dinero(linea_8.cantidad * linea_8.costo_unitario)
            },
            {
                titulo: 'Peticionario',
                valor: (linea_9) => ui.esc(linea_9.peticionario || '—')
            },
            {
                titulo: '',
                valor: (linea_10) => '<button class="btn btn-sm" data-quitar="' + lineas
                    .indexOf(linea_10) + '">Quitar</button>'
            }], lineas,
            {
                vacio: 'Agrega al menos un libro'
            });

        document.getElementById('form-linea').addEventListener('submit', (elemento_5) =>
        {
            elemento_5.preventDefault();
            acciones.agregar();
        });
        document.getElementById('btn-ejemplo').addEventListener('click', acciones.ejemplo);
        document.getElementById('btn-enviar').addEventListener('click', acciones.enviar);
        document.getElementById('btn-vaciar').addEventListener('click', acciones.vaciar);
        document.getElementById('id_libro').addEventListener('change', (elemento_6) => acciones
            .elegir_libro(elemento_6.target.value));
        document.querySelectorAll('[data-quitar]').forEach((boton_2) => boton_2.addEventListener(
            'click', () => acciones.quitar(Number(boton_2.dataset.quitar))));
    },

    linea: function ()
    {
        const datos = ui.leer(['id_libro', 'titulo', 'autores', 'isbn', 'editorial', 'cantidad',
            'costo_unitario', 'peticionario'
        ]);
        datos.cantidad = Number(datos.cantidad);
        datos.costo_unitario = datos.costo_unitario === '' ? NaN : Number(datos.costo_unitario);
        return datos;
    },

    llenar_linea: function (valores)
    {
        Object.entries(valores).forEach(([clave, valor]) =>
        {
            const elemento_7 = document.getElementById(clave);
            if (elemento_7) elemento_7.value = valor;
        });
    },

    historial: function (lista, puede_responder, acciones)
    {
        ui.tabla('panel',
            [
            {
                titulo: 'Folio',
                valor: (elemento_8) => '<strong>' + ui.esc(elemento_8.folio) + '</strong>'
            },
            {
                titulo: 'Enviada',
                valor: (elemento_9) => ui.fecha_hora(elemento_9.fecha_envio) +
                    '<div class="small muted">' + ui.esc(elemento_9.solicitante) + '</div>'
            },
            {
                titulo: 'Libros',
                valor: (elemento_10) => elemento_10.lineas + ' título(s) · ' + elemento_10
                    .ejemplares + ' ejemplar(es)'
            },
            {
                titulo: 'Total',
                valor: (elemento_11) => ui.dinero(elemento_11.total)
            },
            {
                titulo: 'Estatus',
                valor: (elemento_12) => ui.badge(elemento_12.estatus) + (elemento_12
                    .fecha_recepcion ? '<div class="small muted">recibido ' + ui.fecha(
                        elemento_12.fecha_recepcion) + '</div>' : '')
            },
            {
                titulo: '',
                valor: (elemento_13) =>
                    '<div class="row-actions"><button class="btn btn-sm" data-ver="' +
                    elemento_13.id_pedido + '">Consultar</button>' +
                    (puede_responder && elemento_13.estatus === 'Enviado' ?
                        '<button class="btn btn-sm btn-primary" data-resp="' + elemento_13
                        .id_pedido + '" data-e="Autorizado">Autorizada</button>' +
                        '<button class="btn btn-sm btn-danger" data-resp="' + elemento_13
                        .id_pedido + '" data-e="Rechazado">Rechazada</button>' : '') +
                    '</div>'
            }], lista,
            {
                vacio: 'Aún no se han enviado solicitudes'
            });
        document.querySelectorAll('[data-ver]').forEach((boton_3) => boton_3.addEventListener('click',
            () => acciones.ver(Number(boton_3.dataset.ver))));
        document.querySelectorAll('[data-resp]').forEach((boton_4) => boton_4.addEventListener(
            'click', () => acciones.responder(Number(boton_4.dataset.resp), boton_4.dataset.e)
            ));
    },

    detalle: function (datos_2)
    {
        const elemento_14 = datos_2.pedido;
        const dialogo = ui.dialogo(
        {
            titulo: 'Solicitud ' + elemento_14.folio + ' · ' + elemento_14.estatus,
            texto: 'Destinatario: Tesorería · Presupuesto ' + elemento_14.periodo +
                ' · Enviada ' + ui.fecha_hora(elemento_14.fecha_envio) + ' por ' + elemento_14
                .solicitante,
            cuerpo: '<div id="detalle-lineas"></div><p><strong>Total: ' + ui.dinero(
                elemento_14.total) + '</strong></p>',
            confirmar: 'Cerrar',
            cancelar: false
        });
        ui.tabla('detalle-lineas',
            [
            {
                titulo: 'Título',
                valor: (linea_11) => ui.esc(linea_11.titulo_solicitado) +
                    '<div class="small muted">' + ui.esc(linea_11.autores || '') + '</div>'
            },
            {
                titulo: 'Cant.',
                valor: (linea_12) => String(linea_12.cantidad)
            },
            {
                titulo: 'Subtotal',
                valor: (linea_13) => ui.dinero(linea_13.subtotal)
            }], datos_2.lineas);
        return dialogo;
    },

    recepcion: function (pendientes, ubicaciones, puede_recibir, recibir)
    {
        if (!pendientes.length)
        {
            document.getElementById('panel').innerHTML =
                '<div class="empty">No hay solicitudes autorizadas por Tesorería pendientes de recibir</div>';
            return;
        }
        document.getElementById('panel').innerHTML = pendientes.map((datos_3) =>
            '<div class="card"><h2>Orden ' + ui.esc(datos_3.pedido.folio) +
            ' · Autorizada por Tesorería</h2>' +
            datos_3.lineas.map((linea_14) => '<p>' + ui.esc(linea_14.titulo_solicitado) + (
                    linea_14.autores ? ' · ' + ui.esc(linea_14.autores) : '') +
                '<br><span class="small muted">' +
                (linea_14.isbn_solicitado ? 'ISBN ' + ui.esc(linea_14.isbn_solicitado) + ' · ' :
                    '') + linea_14.cantidad + ' ejemplar(es) · ' +
                (linea_14.id_libro ? 'se etiquetan en ' + ui.esc(linea_14.id_libro) :
                    'título nuevo: requiere crear su ficha') + '</span></p>').join('') +
            '<p class="small muted">Responsable de la solicitud: ' + ui.esc(datos_3.pedido
                .solicitante) + '</p>' +
            (puede_recibir ?
                '<div class="grid-2"><div class="field"><label for="ubic-' + datos_3.pedido
                .id_pedido + '">Ubicación (solo ejemplares físicos)</label><select id="ubic-' + datos_3
                .pedido.id_pedido + '">' +
                ui.opciones(ubicaciones, 'id', 'etiqueta', '', 'Selecciona la ubicación') +
                '</select></div></div>' +
                '<div class="actions" style="margin-bottom:0"><button class="btn btn-primary" data-recibir="' +
                datos_3.pedido.id_pedido + '">Confirmar recepción</button></div>' :
                '<p class="small muted">La recepción la confirma el Administrador del catálogo.</p>'
                ) + '</div>').join('');
        document.querySelectorAll('[data-recibir]').forEach((boton_5) => boton_5.addEventListener(
            'click', () =>
            recibir(Number(boton_5.dataset.recibir), document.getElementById('ubic-' + boton_5
                .dataset.recibir).value)));
    },

    recibido: function (resultado)
    {
        const nuevos = resultado.sin_ficha.map((linea_15) =>
            '<a class="btn btn-sm" href="libro_form.html?titulo=' + encodeURIComponent(linea_15
                .titulo_solicitado) +
            '&isbn=' + encodeURIComponent(linea_15.isbn_solicitado || '') + '&editorial=' +
            encodeURIComponent(linea_15.editorial || '') +
            '&autores=' + encodeURIComponent(linea_15.autores || '') + '">Crear ficha: ' + ui.esc(
                linea_15.titulo_solicitado) + '</a>').join(' ');
        document.getElementById('mensaje').innerHTML =
            '<div class="alert alert-ok"><strong>Recepción confirmada</strong><span>' +
            (resultado.ejemplares.length ? 'Ejemplares etiquetados: ' + ui.esc(resultado.ejemplares
                .join(', ')) + '. ' : '') +
            (resultado.sin_ficha.length ? 'Faltan fichas para ' + resultado.sin_ficha.length +
                ' título(s) nuevo(s).' : '') + '</span></div>' +
            (nuevos ? '<div class="actions">' + nuevos + '</div>' : '');
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
