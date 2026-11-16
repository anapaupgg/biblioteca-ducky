/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-16                                               */
/* Description: Presentación y eventos de devoluciones.           */
/******************************************************************/

/******************************************************************/
/* Listing Contents: enlazar, mostrar, activos, revision, recibo, */
/* recibo_aviso.                                                  */
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
        document.getElementById('btn-registrar-aviso-multa').addEventListener('click', acciones.aviso_multa);
        document.getElementById('btn-otra-devolucion').addEventListener('click', acciones.abrir);
        document.getElementById('btn-registrar-pago-aviso').addEventListener('click', acciones.abrir_pago);
        document.getElementById('btn-ver-multas-aviso').addEventListener('click', acciones.abrir_multas);
        document.getElementById('btn-volver-recibo-devolucion').addEventListener('click', acciones.volver);
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

    preparar_pago: function (id_multa)
    {
        document.getElementById('pago-multa').value = id_multa ? 'MUL-' + id_multa : '';
    },

    mostrar: function (modo)
    {
        document.body.classList.toggle('circulation-main', modo === 'devoluciones');
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
        const folio = 'DEV-' + String(resultado.fecha_devolucion).slice(0, 4) + '-' +
            String(resultado.id_devolucion).padStart(4, '0');
        const multa = resultado.multa;
        const danado = resultado.estatus_ejemplar === 'En revisión';
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const campos = multa ? [
            campo('Solicitante', prestamo.solicitante + ' · ' + prestamo.clave_usuario),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Multa', 'MUL-' + multa.id_multa + ' · ' + ui.dinero(multa.monto) +
                ' · ' + multa.estatus),
            ...(danado ? [campo('Condición', resultado.condicion_recibida)] : [])
        ] : [
            campo('Folio', folio),
            campo('Solicitante', prestamo.solicitante + ' · ' + prestamo.clave_usuario),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Condición', resultado.condicion_recibida),
            campo(resultado.espera ? 'Lista de espera' : 'Multa', resultado.espera ?
                resultado.espera.nombre + ' · ' + resultado.espera.clave_usuario +
                    ' · Notificado' : 'Sin multa por atraso')
        ];
        document.getElementById('recibo-devolucion').innerHTML =
            '<h2>Comprobante de devolución' + (multa ? ' · ' + ui.esc(folio) : '') +
            '</h2><div class="grid-2 return-receipt-grid">' + campos.join('') + '</div>';
        document.getElementById('titulo-devolucion').textContent = multa ?
            'Devolución con multa registrada' : 'Devolución registrada';
        document.getElementById('descripcion-devolucion').textContent =
            'Registro confirmado · ' + ui.fecha(resultado.fecha_devolucion) +
            (danado ? '. El ejemplar está en revisión del catálogo.' :
                resultado.espera ? '. La lista de espera avanzó en el sistema.' :
                    '. El ejemplar ya aparece disponible en el catálogo.');
        const aviso = document.getElementById('aviso-recibo-devolucion');
        aviso.className = 'alert ' + (multa || danado ? 'alert-warning' :
            resultado.espera ? '' : 'alert-ok');
        aviso.innerHTML = multa ? '<strong>Multa generada' +
            (danado ? ' y ejemplar en revisión' : '') + '</strong><span>' +
            ui.esc(prestamo.solicitante) + ' debe ' + ui.dinero(multa.monto) +
            '. Registra un aviso interno para Tesorería; la entrega externa queda pendiente.' +
            (danado ? ' La copia dañada no estará disponible hasta su reparación o baja.</span>' :
                '</span>') :
            danado ? '<strong>Ejemplar en revisión</strong><span>El ejemplar dañado no se presta ni avanza la lista de espera. El administrador del catálogo puede registrar su reparación o baja.</span>' :
                resultado.espera ? '<strong>Lista de espera actualizada</strong><span>' +
                    ui.esc(resultado.espera.nombre) +
                    ' pasó a Notificado en el sistema. El contacto externo aún debe realizarse.</span>' :
                    '<strong>Ejemplar disponible</strong><span>El préstamo se cerró y el ejemplar regresó al catálogo.</span>';
        this.acciones_recibo(multa ? ['aviso', 'volver'] : resultado.espera ?
            ['espera', 'otra'] : ['volver', 'otra'], multa ? 'aviso' :
            resultado.espera ? 'espera' : 'volver');
        document.getElementById('btn-ver-espera-devolucion').href = 'prestamos.html?espera=' +
            encodeURIComponent(prestamo.id_libro);
    },

    acciones_recibo: function (visibles, principal)
    {
        const acciones = { aviso: 'btn-registrar-aviso-multa',
            espera: 'btn-ver-espera-devolucion', otra: 'btn-otra-devolucion',
            pago: 'btn-registrar-pago-aviso', multas: 'btn-ver-multas-aviso',
            volver: 'btn-volver-recibo-devolucion' };
        Object.entries(acciones).forEach(([nombre, id]) =>
        {
            const boton = document.getElementById(id);
            boton.classList.toggle('hidden', !visibles.includes(nombre));
            boton.classList.toggle('btn-primary', nombre === principal);
            boton.classList.toggle('receipt-action-primary', nombre === principal);
        });
    },

    recibo_aviso: function (aviso)
    {
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const folio = 'NOT-' + String(aviso.fecha_creacion).slice(0, 4) + '-' +
            String(aviso.id_notificacion).padStart(4, '0');
        const recibido = aviso.estatus === 'Recibida';
        const enviado = aviso.estatus === 'Enviada';
        const estado = recibido ? 'Recibida por Tesorería' : enviado ?
            'Enviada a Tesorería' : 'Pendiente de entrega externa';
        document.getElementById('recibo-devolucion').innerHTML =
            '<h2>Notificación a Tesorería · ' + ui.esc(folio) + '</h2>' +
            '<div class="grid-2 return-receipt-grid">' + [
                campo('Multa', 'MUL-' + aviso.id_multa),
                campo('Usuario', aviso.usuario + ' · ' + aviso.clave_usuario),
                campo('Concepto', aviso.tipo + ' · ' + aviso.dias_retraso +
                    ' días × ' + ui.dinero(aviso.tarifa_diaria_aplicada)),
                campo('Monto', ui.dinero(aviso.monto)),
                campo('Registrada', ui.fecha_hora(aviso.fecha_creacion)),
                campo('Estado', estado)
            ].join('') + '</div>';
        document.getElementById('titulo-devolucion').textContent =
            recibido ? 'Multa recibida por Tesorería' : enviado ?
                'Multa enviada a Tesorería' : 'Aviso de multa registrado para Tesorería';
        document.getElementById('descripcion-devolucion').textContent =
            'Registro interno · ' + ui.fecha_hora(aviso.fecha_creacion) +
            (recibido ? '. Recepción confirmada en el sistema.' : enviado ?
                '. Envío registrado; falta acuse de recepción.' :
                '. Aún no hay confirmación de entrega externa.');
        const aviso_estado = document.getElementById('aviso-recibo-devolucion');
        aviso_estado.className = 'alert ' + (recibido ? 'alert-ok' : 'alert-warning');
        aviso_estado.innerHTML = recibido ?
            '<strong>Recepción confirmada</strong><span>Cuando el usuario pague, registra el folio de su comprobante.</span>' :
            enviado ? '<strong>Acuse pendiente</strong><span>El envío quedó registrado, pero Tesorería aún no confirma recepción.</span>' :
                '<strong>Entrega pendiente</strong><span>El aviso quedó registrado en el sistema. Tesorería no ha confirmado recepción; cuando el usuario pague, registra el folio de su comprobante.</span>';
        this.acciones_recibo(['pago', 'multas', 'volver'], 'pago');
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
        document.getElementById('aviso-recibo-devolucion').className = 'hidden';
        this.acciones_recibo(['volver'], 'volver');
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
        document.getElementById('aviso-recibo-devolucion').className = 'hidden';
        this.acciones_recibo(['volver'], 'volver');
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
