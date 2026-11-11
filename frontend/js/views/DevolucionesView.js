/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-11                                               */
/* Description: Presentación y eventos de devoluciones.           */
/******************************************************************/

/******************************************************************/
/* Listing Contents: enlazar, mostrar, activos, revision, recibo. */
/* Reuse Instructions: datos externos escapados; callbacks del    */
/* controlador hacen el trabajo de red.                           */
/******************************************************************/

const devoluciones_view =
{
    enlazar: function (acciones)
    {
        document.getElementById('btn-registrar-devolucion').addEventListener('click', acciones.abrir);
        document.getElementById('btn-cancelar-devolucion').addEventListener('click', acciones.volver);
        document.getElementById('btn-volver-devolucion').addEventListener('click', acciones.abrir);
        document.getElementById('form-buscar-devolucion').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.buscar(document.getElementById('devolucion-ejemplar').value.trim().toUpperCase());
        });
        document.getElementById('btn-devolver-bueno').addEventListener('click', () => acciones.devolver('Bueno'));
        document.getElementById('btn-devolver-danado').addEventListener('click', () => acciones.devolver('Dañado'));
        document.getElementById('btn-reportar-perdido').addEventListener('click', acciones.abrir_perdida);
        document.getElementById('btn-multas-pagos').addEventListener('click', acciones.abrir_multas);
        document.getElementById('btn-cancelar-perdida').addEventListener('click', acciones.volver);
        document.getElementById('btn-volver-perdida').addEventListener('click', acciones.abrir_perdida);
        document.getElementById('form-buscar-perdida').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.validar_perdida(this.datos_perdida());
        });
        document.getElementById('btn-confirmar-perdida').addEventListener('click', acciones.confirmar_perdida);
        document.getElementById('btn-abrir-pago').addEventListener('click', acciones.abrir_pago);
        document.getElementById('btn-avisar-adeudos').addEventListener('click', acciones.avisar_adeudos);
        document.getElementById('btn-volver-multas').addEventListener('click', acciones.volver);
        document.getElementById('btn-cancelar-pago').addEventListener('click', acciones.abrir_multas);
        document.getElementById('form-pago').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.registrar_pago({
                folio_multa: document.getElementById('pago-multa').value.trim(),
                folio_tesoreria: document.getElementById('pago-tesoreria').value.trim()
            });
        });
    },

    datos_perdida: function ()
    {
        return {
            id_ejemplar: document.getElementById('perdida-ejemplar').value.trim().toUpperCase(),
            tipo_cambio: document.getElementById('perdida-cambio').value.trim()
        };
    },

    mostrar: function (modo)
    {
        ['devoluciones', 'buscar-devolucion', 'revisar-devolucion', 'recibo-devolucion',
            'perdida', 'revisar-perdida', 'multas', 'pago']
            .forEach((panel) => document.getElementById('panel-' + panel)
                .classList.toggle('hidden', panel !== modo));
        const textos = {
            devoluciones: ['Devolución de libros',
                'Recibe ejemplares, calcula multas por atraso y avisa a la lista de espera.'],
            'buscar-devolucion': ['Registrar devolución',
                '1. Escanea o captura la clave del ejemplar → 2. Revisa el préstamo → 3. Confirma la condición del libro.'],
            'revisar-devolucion': ['Revisar devolución',
                '2. Revisa el préstamo → 3. Confirma la condición en que se recibe el libro.'],
            'recibo-devolucion': ['Devolución registrada', 'Entrega el comprobante al solicitante.'],
            perdida: ['Reportar libro perdido',
                'Registra la pérdida de un ejemplar prestado y genera la multa de reposición.'],
            'revisar-perdida': ['Confirmar pérdida',
                'La multa usa el precio de la última compra y el tipo de cambio confirmado.'],
            multas: ['Multas y pagos',
                'Las multas se pagan en Tesorería; aquí se registra el folio del comprobante.'],
            pago: ['Registrar pago de multa',
                'Captura el folio de la multa y el folio del comprobante de Tesorería.']
        };
        document.getElementById('titulo-devolucion').textContent = textos[modo][0];
        document.getElementById('descripcion-devolucion').textContent = textos[modo][1];
        document.querySelector('.breadcrumb').textContent = 'Biblioteca / ' +
            (['multas', 'pago'].includes(modo) ? 'Multas' : 'Devoluciones');
        ui.alerta('mensaje');
    },

    activos: function (lista)
    {
        const destino = document.getElementById('prestamos-por-devolver');
        destino.innerHTML = '<div class="circulation-row">Folio · Solicitante · Libro · Ejemplar · Vence · Estado</div>' +
            (lista.length ? lista.map((prestamo) => '<div class="circulation-row">PRE-' +
                ui.esc(prestamo.id_prestamo) + ' · ' + ui.esc(prestamo.solicitante) + ' · ' +
                ui.esc(prestamo.titulo) + ' · ' + ui.esc(prestamo.id_ejemplar) + ' · ' +
                ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
                (prestamo.fecha_vencimiento < ui.hoy() ? 'Vencido' : 'Activo') + '</div>').join('') :
                '<div class="circulation-row muted">No hay préstamos activos.</div>');
        const vencido = lista.find((prestamo) => prestamo.fecha_vencimiento < ui.hoy());
        document.getElementById('aviso-vencido').innerHTML = vencido ?
            '<div class="alert alert-info"><strong>Un préstamo vencido</strong><span>' +
            ui.esc(vencido.solicitante) + ' debe ' + ui.esc(vencido.titulo) + ' desde el ' +
            ui.fecha(vencido.fecha_vencimiento) + '. Al recibirlo se generará una multa por atraso.</span></div>' : '';
    },

    revision: function (datos)
    {
        const prestamo = datos.prestamo;
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-devolucion').innerHTML = [
            campo('Solicitante', prestamo.solicitante + ' · ' + prestamo.clave_usuario),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Fecha de préstamo', ui.fecha(prestamo.fecha_prestamo)),
            campo('Vencimiento', ui.fecha(prestamo.fecha_vencimiento)),
            campo('Fecha de devolución', ui.fecha(ui.hoy()))
        ].join('');
        const vencido = prestamo.fecha_vencimiento < ui.hoy();
        document.getElementById('titulo-devolucion').textContent = vencido ?
            'Devolución con atraso' : 'Devolución a tiempo';
        const aviso = document.getElementById('aviso-devolucion');
        aviso.className = 'alert ' + (vencido ? 'alert-warning' : 'alert-ok');
        aviso.innerHTML = '<strong>' + (vencido ? 'Entrega con atraso' : 'Entrega dentro del plazo') +
            '</strong><span>' + (vencido ?
                (datos.resultado.multa ? 'La multa por atraso será de ' +
                    ui.dinero(datos.resultado.multa.monto) + ' al confirmar.' :
                    'Se calculará la multa por atraso al confirmar.') :
                'No se genera multa por atraso.') + '</span>';
    },

    recibo: function (datos)
    {
        const prestamo = datos.prestamo;
        const resultado = datos.resultado;
        document.getElementById('recibo-devolucion').innerHTML = '<h2>Devolución DEV-' +
            ui.esc(resultado.id_devolucion) + '</h2><p><strong>Préstamo:</strong> PRE-' +
            ui.esc(prestamo.id_prestamo) + '</p><p><strong>Libro:</strong> ' +
            ui.esc(prestamo.titulo) + '</p><p><strong>Ejemplar:</strong> ' +
            ui.esc(prestamo.id_ejemplar) + '</p><p><strong>Condición:</strong> ' +
            ui.esc(resultado.condicion_recibida) + '</p>' + (resultado.multa ?
                '<p><strong>Multa pendiente:</strong> ' + ui.dinero(resultado.multa.monto) + '</p>' :
                '<p>Sin multa por atraso.</p>');
    },

    revision_perdida: function (datos)
    {
        const prestamo = datos.prestamo;
        const multa = datos.multa;
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-perdida').innerHTML = [
            campo('Solicitante', prestamo.solicitante + ' · ' + prestamo.clave_usuario),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Precio de última compra', '$' + Number(multa.precio_usd_aplicado).toFixed(2) + ' USD'),
            campo('Tipo de cambio', '$' + multa.tipo_cambio + ' MXN por dólar'),
            campo('Multa de reposición', ui.dinero(multa.monto))
        ].join('');
    },

    recibo_perdida: function (datos)
    {
        document.getElementById('recibo-devolucion').innerHTML =
            '<h2>Pérdida registrada · MUL-' + ui.esc(datos.multa.id_multa) + '</h2>' +
            '<p><strong>Ejemplar:</strong> ' + ui.esc(datos.prestamo.id_ejemplar) + '</p>' +
            '<p><strong>Multa de reposición:</strong> ' + ui.dinero(datos.multa.monto) + '</p>' +
            '<p>Se registraron avisos para Tesorería y Servicios Escolares.</p>';
        document.getElementById('titulo-devolucion').textContent = 'Pérdida registrada';
        document.getElementById('descripcion-devolucion').textContent =
            'El ejemplar y el préstamo quedaron marcados como perdidos.';
    },

    multas: function (lista)
    {
        document.getElementById('lista-multas').innerHTML =
            '<div class="circulation-row">Folio · Usuario · Concepto · Monto · Tesorería · Estado</div>' +
            (lista.length ? lista.map((multa) =>
                '<div class="circulation-row">MUL-' + ui.esc(multa.id_multa) + ' · ' +
                ui.esc(multa.usuario) + ' · ' + ui.esc(multa.clave_usuario) + ' · ' +
                ui.esc(multa.tipo) + (multa.dias_retraso ? ' · ' +
                    ui.esc(multa.dias_retraso) + ' días' : '') + ' · ' +
                ui.dinero(multa.monto) + ' · ' +
                ui.esc(multa.tesoreria || 'Sin envío registrado') + ' · ' +
                ui.esc(multa.estatus) + (multa.folio_tesoreria ? ' · ' +
                    ui.esc(multa.folio_tesoreria) : '') + '</div>').join('') :
                '<div class="circulation-row muted">No hay multas registradas.</div>');
    },

    recibo_pago: function (registro)
    {
        document.getElementById('recibo-devolucion').innerHTML =
            '<h2>Pago registrado</h2><p><strong>Multa:</strong> MUL-' +
            ui.esc(registro.id_multa) + '</p><p><strong>Folio de Tesorería:</strong> ' +
            ui.esc(registro.folio_tesoreria) + '</p>';
        document.getElementById('titulo-devolucion').textContent = 'Pago registrado';
        document.getElementById('descripcion-devolucion').textContent =
            'El pago quedó asociado a la multa en el sistema.';
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
