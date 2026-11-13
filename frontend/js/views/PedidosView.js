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
/*   pedidos_view.enviada(datos, puede_solicitar) */
/*   pedidos_view.consulta(datos, puede_solicitar) */
/*   pedidos_view.revision(lineas, presupuesto, acciones) */
/*   pedidos_view.vacia(presupuesto, parcial, acciones) */
/*   pedidos_view.borrador_parcial() */
/*   pedidos_view.recepcion(pendientes, ubicaciones, puede_recibir, recibir) */
/*   pedidos_view.bloquear_recepcion(id, bloqueado) */
/*   pedidos_view.recibido(resultado, detalle) */
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
    pagina: function (titulo, descripcion)
    {
        document.querySelector('.page-header h1').textContent = titulo;
        document.querySelector('.page-header p').textContent = descripcion;
        document.getElementById('stats').classList.add('hidden');
        document.querySelector('.tabs').classList.add('hidden');
        ui.alerta('mensaje');
    },

    enviada: function (datos, puede_solicitar)
    {
        const pedido = datos.pedido;
        this.pagina('Solicitud enviada a Tesorería',
            pedido.folio + ' · ' + ui.fecha_hora(pedido.fecha_envio) + '.');
        document.getElementById('panel').innerHTML =
            '<div class="alert alert-ok" role="status"><strong>Solicitud registrada</strong>' +
            '<span>Destino: Tesorería · Estado: ' + ui.esc(pedido.estatus) +
            '. Puedes consultar su estado y los libros solicitados. El registro es interno.</span></div>' +
            '<div class="actions purchase-result-actions"><a class="btn btn-primary" href="pedidos.html?modo=consulta&id=' +
            encodeURIComponent(pedido.id_pedido) + '">Consultar solicitud</a>' +
            (puede_solicitar ? '<a class="btn" href="pedidos.html">Nueva solicitud</a>' : '') +
            '<a class="btn" href="inicio.html">Volver a Inicio</a></div>';
    },

    consulta: function (datos, puede_solicitar)
    {
        const pedido = datos.pedido;
        const lectura = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor || '—') +
            '</div></div>';
        this.pagina('Consultar solicitud a Tesorería',
            pedido.folio + ' · ' + pedido.estatus + '.');
        document.getElementById('panel').innerHTML =
            '<div class="card"><h2>Estado de la solicitud</h2><div class="grid-2">' +
            lectura('Estado', pedido.estatus) +
            lectura('Fecha', ui.fecha_hora(pedido.fecha_envio)) +
            lectura('Destinatario', 'Tesorería') +
            lectura('Presupuesto relacionado', pedido.periodo) + '</div></div>' +
            '<div class="card"><h2>Libros incluidos en la solicitud</h2>' +
            (datos.lineas.length ? datos.lineas.map((linea) =>
                '<p>' + ui.esc(linea.titulo_solicitado) + ' · ' + linea.cantidad +
                ' ejemplar(es) · ' + ui.dinero(linea.subtotal) + '</p>').join('') :
                '<p>Aún no hay libros registrados.</p>') + '</div>' +
            '<div class="actions"><a class="btn btn-primary" href="inicio.html">Volver a Inicio</a>' +
            (puede_solicitar ? '<a class="btn" href="pedidos.html">Crear otra solicitud</a>' :
                '<a class="btn" href="pedidos.html">Volver a solicitudes</a>') + '</div>';
    },

    revision: function (lineas, presupuesto, acciones)
    {
        const total = lineas.reduce((suma, linea) => suma + linea.cantidad *
            linea.costo_unitario, 0);
        const hay_presupuesto = Boolean(presupuesto && total <= presupuesto.saldo);
        this.pagina('Revisar solicitud de compra',
            'Verifica los títulos y cantidades antes de enviar la solicitud a Tesorería.');
        document.getElementById('panel').innerHTML =
            '<div class="actions actions-top"><button class="btn" id="editar-solicitud">' +
            'Editar solicitud</button><button class="btn btn-primary" id="confirmar-envio"' +
            (hay_presupuesto ? '' : ' disabled') + '>Enviar a Tesorería</button></div>' +
            '<p><strong>Destino: Tesorería · Presupuesto de ' +
            ui.esc(presupuesto?.periodo || 'mes sin registrar') + ': ' +
            (presupuesto ? ui.dinero(presupuesto.monto_autorizado) : 'Sin registrar') +
            '</strong></p>' +
            '<p class="small muted">La solicitud registra una petición de adquisición; no realiza un pago.</p>' +
            '<div class="card"><h2>Libros de la solicitud</h2>' +
            lineas.map((linea) => '<p>' + ui.esc(linea.titulo) + ' · ' +
                ui.esc(linea.autores || '—') + ' · ' + linea.cantidad +
                ' ejemplar(es) · ' + ui.dinero(linea.cantidad * linea.costo_unitario) +
                '</p>').join('') + '<p><strong>Total estimado: ' + ui.dinero(total) +
            '</strong></p></div>' +
            (hay_presupuesto ? '' : '<div class="alert alert-warning" role="status">' +
                '<strong>Presupuesto no disponible</strong><span>Registra presupuesto mensual ' +
                'suficiente antes de enviar.</span></div>');
        document.getElementById('editar-solicitud').addEventListener('click', acciones.editar);
        document.getElementById('confirmar-envio').addEventListener('click', acciones.confirmar);
    },

    vacia: function (presupuesto, parcial, acciones)
    {
        this.pagina('Agrega al menos un libro', 'No se envió una solicitud vacía.');
        document.getElementById('panel').innerHTML =
            '<div class="alert alert-error" role="alert"><strong>Solicitud no enviada</strong>' +
            '<span>Se conserva el presupuesto, la petición de usuario y el destinatario.</span></div>' +
            '<div class="card"><h2>Datos conservados</h2><div class="grid-2">' +
            '<div class="field"><span class="label">Destinatario</span><div class="readonly">Tesorería</div></div>' +
            '<div class="field"><span class="label">Presupuesto mensual</span><div class="readonly">' +
            (presupuesto ? ui.esc(presupuesto.periodo) + ' · ' +
                ui.dinero(presupuesto.monto_autorizado) : 'Sin registrar') + '</div></div>' +
            '<div class="field"><span class="label">Libro solicitado</span>' +
            '<div class="readonly purchase-empty-book">' + ui.esc(parcial.titulo || '') +
            '</div></div><div class="field"><span class="label">Petición de usuario</span>' +
            '<div class="readonly">' + ui.esc(parcial.peticionario || '—') +
            '</div></div></div></div>' +
            '<div class="actions"><button class="btn btn-primary" id="anadir-libro-vacio">' +
            'Añadir libro</button><button class="btn" id="cancelar-vacio">Cancelar</button></div>';
        document.getElementById('anadir-libro-vacio').addEventListener('click', acciones.anadir);
        document.getElementById('cancelar-vacio').addEventListener('click', acciones.cancelar);
    },

    borrador_parcial: function ()
    {
        return {
            titulo: document.getElementById('titulo')?.value || '',
            peticionario: document.getElementById('peticionario')?.value || ''
        };
    },

    abrir_formulario: function ()
    {
        document.getElementById('detalle-solicitud').open = true;
        document.getElementById('titulo').focus();
    },

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
        document.getElementById('stats').classList.toggle('hidden', tab !== 'historial');
        document.querySelector('.tabs').classList.toggle('hidden', tab !== 'historial');
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

    nueva: function (catalogo, lineas, presupuesto, acciones)
    {
        document.querySelector('.page-header h1').textContent = 'Solicitar libros a Tesorería';
        document.querySelector('.page-header p').textContent =
            'Consolida las peticiones de usuarios dentro del presupuesto mensual.';
        const saldo = presupuesto ? presupuesto.saldo : null;
        const total = lineas.reduce((registro, linea) => registro + linea.cantidad * linea
            .costo_unitario, 0);
        const primera = lineas[0];
        const resumen = lineas.length ? lineas.map((linea) =>
            '<div class="purchase-summary-row">' + ui.esc(linea.titulo) + ' · ' +
            ui.esc(linea.autores || '—') + ' · ' + ui.esc(linea.isbn || '—') + ' · ' +
            linea.cantidad + '</div>').join('') :
            '<p class="small muted">Aún no has agregado libros. Selecciona «Ver solicitud / agregar más» para comenzar.</p>';
        document.getElementById('panel').innerHTML =
            '<div class="actions actions-top"><button class="btn" id="btn-ver-solicitud">' +
            'Ver solicitud / agregar más</button><button class="btn btn-primary" id="btn-revisar-top"' +
            '>Revisar solicitud</button>' +
            '<button class="btn" id="btn-cancelar-top">Cancelar</button></div>' +
            '<div class="card"><h2>Solicitud en preparación</h2><div class="grid-2">' +
            '<div class="field"><span class="label">Destinatario</span><div class="readonly">Tesorería</div></div>' +
            '<div class="field"><span class="label">Presupuesto mensual</span><div class="readonly">' +
            (presupuesto ? ui.esc(presupuesto.periodo) + ' · ' +
                ui.dinero(presupuesto.monto_autorizado) : 'Sin registrar') +
            '</div></div></div><div class="grid-2 purchase-summary-fields">' +
            '<div class="field"><span class="label">Petición de usuario</span><div class="readonly">' +
            ui.esc(primera?.peticionario || 'Aún sin peticionario') + '</div></div>' +
            '<div class="field"><span class="label">Libro solicitado</span><div class="readonly">' +
            ui.esc(primera?.titulo || 'Aún sin libros') + '</div></div></div>' +
            '<div class="purchase-summary-row">Título · Autor · ISBN · Cantidad</div>' +
            resumen + '</div>' +
            '<div class="actions"><button class="btn" id="btn-ejemplo">' +
            'Cargar petición de ejemplo</button></div>' +
            '<details class="card purchase-operational" id="detalle-solicitud"><summary>' +
            'Agregar o editar libros de la solicitud</summary>' +
            '<h2>Agregar libro a la solicitud</h2><form id="form-linea" novalidate><div class="grid-3">' +
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
            '</div><div class="actions" style="margin-bottom:0"><button class="btn" type="submit">Agregar libro</button></div></form>' +

            '<div class="card"><h2>Solicitud a Tesorería · ' + lineas.length +
            ' libro(s)</h2><div id="tabla-lineas"></div>' +
            '<p style="margin-top:12px"><strong>Total estimado: ' + ui.dinero(total) + '</strong>' +
            (saldo !== null ? ' · Saldo del mes: ' + ui.dinero(saldo) + (total > saldo ?
                ' <span class="badge badge-error">Rebasa el presupuesto</span>' : '') : '') + '</p>' +
            '<div class="actions" style="margin-bottom:0"><button class="btn btn-primary" id="btn-enviar"' +
            '>Revisar y enviar a Tesorería</button>' +
            '<button class="btn" id="btn-vaciar"' + (lineas.length ? '' : ' disabled') +
            '>Cancelar solicitud</button></div></div></details>' +
            '<details class="purchase-other-actions"><summary>Historial y recepción</summary>' +
            '<div class="actions"><button class="btn" id="btn-historial">Solicitudes enviadas</button>' +
            '<button class="btn" id="btn-recepcion">Recepción de libros</button></div></details>';

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
        document.getElementById('btn-ejemplo').addEventListener('click', () =>
        {
            document.getElementById('detalle-solicitud').open = true;
            acciones.ejemplo();
            document.getElementById('titulo').focus();
        });
        document.getElementById('btn-ver-solicitud').addEventListener('click', () =>
        {
            document.getElementById('detalle-solicitud').open = true;
            document.getElementById('titulo').focus();
        });
        document.getElementById('btn-revisar-top').addEventListener('click', acciones.enviar);
        document.getElementById('btn-cancelar-top').addEventListener('click', acciones.vaciar);
        document.getElementById('btn-historial').addEventListener('click', () => acciones.mostrar('historial'));
        document.getElementById('btn-recepcion').addEventListener('click', () => acciones.mostrar('recepcion'));
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
        this.pagina('Recepción de libros adquiridos',
            'Administrador del catálogo · Recibe los ejemplares y registra su ficha.');
        if (!pendientes.length)
        {
            document.getElementById('panel').innerHTML =
                '<div class="actions actions-top"><a class="btn" href="libros.html">Volver al catálogo</a></div>' +
                '<div class="empty">No hay solicitudes autorizadas por Tesorería pendientes de recibir</div>';
            return;
        }
        document.getElementById('panel').innerHTML =
            '<div class="actions actions-top"><a class="btn" href="libros.html">Volver al catálogo</a></div>' +
            pendientes.map((datos_3) =>
            '<div class="card"><h2>Orden ' + ui.esc(datos_3.pedido.folio) +
            ' · Autorizada por Tesorería</h2>' +
            datos_3.lineas.map((linea_14) => '<p>' + ui.esc(linea_14.titulo_solicitado) + (
                    linea_14.autores ? ' · ' + ui.esc(linea_14.autores) : '') +
                '<br><span class="small muted">' +
                (linea_14.isbn_solicitado ? 'ISBN ' + ui.esc(linea_14.isbn_solicitado) + ' · ' :
                    '') + linea_14.cantidad + ' ejemplar(es) por recibir · Condición inicial: Bueno · ' +
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

    bloquear_recepcion: function (id, bloqueado)
    {
        const boton = document.querySelector('[data-recibir="' + id + '"]');
        if (boton) boton.disabled = bloqueado;
    },

    recibido: function (resultado, detalle)
    {
        this.pagina('Recepción registrada',
            resultado.sin_ficha.length ? 'Los títulos nuevos están pendientes de catalogación.' :
                'La recepción quedó registrada y los ejemplares fueron etiquetados.');
        const enlace_ficha = (linea_15) => 'libro_form.html?titulo=' + encodeURIComponent(linea_15
            .titulo_solicitado) +
            '&isbn=' + encodeURIComponent(linea_15.isbn_solicitado || '') + '&editorial=' +
            encodeURIComponent(linea_15.editorial || '') +
            '&autores=' + encodeURIComponent(linea_15.autores || '');
        const nuevos = resultado.sin_ficha.map((linea_15) =>
            '<a class="btn btn-sm" href="' + enlace_ficha(linea_15) + '">Crear ficha: ' + ui.esc(
                linea_15.titulo_solicitado) + '</a>').join(' ');
        const cantidad = detalle.lineas.reduce((suma, linea) => suma + linea.cantidad, 0);
        const primera_ficha = detalle.lineas.find((linea) => linea.id_libro)?.id_libro;
        document.getElementById('panel').innerHTML =
            '<h2 class="purchase-received-heading">Orden ' + ui.esc(detalle.pedido.folio) +
            ' · ' + cantidad + ' ejemplar(es) recibidos</h2>' +
            '<p>Siguiente paso: ' + (resultado.sin_ficha.length ?
                'capturar la ficha bibliográfica de los títulos nuevos y dar de alta los ejemplares.' :
                'consultar las fichas bibliográficas y verificar los ejemplares etiquetados.') +
            '</p>' +
            (resultado.ejemplares.length ? '<p class="small muted">Etiquetas creadas: ' +
                ui.esc(resultado.ejemplares.join(', ')) + '</p>' : '') +
            (resultado.sin_ficha.length > 1 ? '<div class="actions">' + nuevos + '</div>' : '') +
            '<div class="actions"><a class="btn btn-primary" href="' +
            (resultado.sin_ficha.length ? enlace_ficha(resultado.sin_ficha[0]) :
                primera_ficha ? 'libro_detalle.html?id=' + encodeURIComponent(primera_ficha) :
                    'libros.html') +
            '">' + (resultado.sin_ficha.length ? 'Registrar ficha bibliográfica' :
                'Consultar ficha bibliográfica') + '</a>' +
            '<a class="btn" href="libros.html">Volver al catálogo</a></div>';
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
