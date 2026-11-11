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
        document.getElementById('btn-reportar-perdido').addEventListener('click', acciones.pendiente);
        document.getElementById('btn-multas-pagos').addEventListener('click', acciones.pendiente);
    },

    mostrar: function (modo)
    {
        ['devoluciones', 'buscar-devolucion', 'revisar-devolucion', 'recibo-devolucion']
            .forEach((panel) => document.getElementById('panel-' + panel)
                .classList.toggle('hidden', panel !== modo));
        const textos = {
            devoluciones: ['Devolución de libros',
                'Recibe ejemplares, calcula multas por atraso y avisa a la lista de espera.'],
            'buscar-devolucion': ['Registrar devolución',
                '1. Escanea o captura la clave del ejemplar → 2. Revisa el préstamo → 3. Confirma la condición del libro.'],
            'revisar-devolucion': ['Revisar devolución',
                '2. Revisa el préstamo → 3. Confirma la condición en que se recibe el libro.'],
            'recibo-devolucion': ['Devolución registrada', 'Entrega el comprobante al solicitante.']
        };
        document.getElementById('titulo-devolucion').textContent = textos[modo][0];
        document.getElementById('descripcion-devolucion').textContent = textos[modo][1];
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
                (datos.resultado.multa ? 'La multa por atraso será de $' +
                    ui.esc(datos.resultado.multa.monto) + ' MXN al confirmar.' :
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
                '<p><strong>Multa pendiente:</strong> $' + ui.esc(resultado.multa.monto) + '</p>' :
                '<p>Sin multa por atraso.</p>');
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
