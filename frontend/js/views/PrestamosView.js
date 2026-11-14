/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Presentación y eventos de préstamos.              */
/******************************************************************/

/******************************************************************/
/* Listing Contents: configurar, enlazar, mostrar, activos,       */
/* validacion, recibo, boleta, mios, pendientes y mensaje.         */
/* Reuse Instructions: cargar después de ui; callbacks reciben    */
/* folio y ejemplar. Todos los datos externos se escapan.        */
/******************************************************************/

const prestamos_view =
{
    configurar: function (ver_mios, ver_pendientes, ver_devoluciones)
    {
        document.getElementById('panel-mios').classList.toggle('hidden', !ver_mios || ver_pendientes);
        document.getElementById('panel-personal').classList.toggle('hidden', !ver_pendientes);
        document.getElementById('panel-pendientes').classList.add('hidden');
        document.getElementById('enlace-devoluciones').classList.toggle('hidden', !ver_devoluciones);
        if (ver_mios && !ver_pendientes)
        {
            document.getElementById('titulo-prestamos').textContent = 'Mis préstamos';
            document.getElementById('descripcion-prestamos').textContent =
                'Consulta tus préstamos y solicitudes de libros.';
        }
    },

    enlazar: function (acciones)
    {
        document.getElementById('btn-registrar-prestamo').addEventListener('click', acciones.abrir_registro);
        document.getElementById('btn-renovar-prestamo').addEventListener('click', acciones.abrir_renovacion);
        document.getElementById('btn-lista-espera').addEventListener('click', acciones.abrir_espera);
        document.getElementById('btn-cancelar-registro').addEventListener('click', acciones.volver);
        document.getElementById('btn-volver-registro').addEventListener('click', acciones.abrir_registro);
        document.getElementById('btn-volver-prestamos').addEventListener('click', acciones.volver);
        document.getElementById('btn-cancelar-renovacion').addEventListener('click', acciones.volver);
        document.getElementById('btn-volver-renovacion').addEventListener('click', acciones.abrir_renovacion);
        document.getElementById('form-renovar').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.validar_renovacion({
                id_ejemplar: document.getElementById('renovar-ejemplar').value.trim().toUpperCase()
            });
        });
        document.getElementById('btn-confirmar-renovacion').addEventListener('click', acciones.renovar);
        document.getElementById('btn-volver-espera').addEventListener('click', acciones.volver);
        document.getElementById('btn-agregar-espera').addEventListener('click', acciones.abrir_agregar_espera);
        document.getElementById('btn-cancelar-espera').addEventListener('click', acciones.abrir_espera);
        document.getElementById('form-consultar-espera').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.consultar_espera(document.getElementById('espera-libro').value.trim().toUpperCase());
        });
        document.getElementById('form-agregar-espera').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.registrar_espera({
                clave_usuario: document.getElementById('espera-usuario').value.trim(),
                id_libro: document.getElementById('espera-libro-registro').value.trim().toUpperCase()
            });
        });
        document.getElementById('btn-atender-solicitud').addEventListener('click', () =>
        {
            document.getElementById('panel-pendientes').classList.remove('hidden');
            document.getElementById('panel-pendientes').scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('form-registrar-prestamo').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.validar(this.datos_registro());
        });
        document.getElementById('btn-confirmar-registro').addEventListener('click', acciones.confirmar);
        document.getElementById('btn-imprimir-recibo').addEventListener('click', acciones.abrir_boleta);
        document.getElementById('btn-imprimir-boleta').addEventListener('click', () => this.imprimir());
        document.getElementById('btn-volver-recibo').addEventListener('click', acciones.volver_recibo);
        document.getElementById('btn-otro-prestamo').addEventListener('click', acciones.abrir_registro);
        document.getElementById('btn-correo-boleta').addEventListener('click', acciones.abrir_correo);
        document.getElementById('btn-whatsapp-boleta').addEventListener('click', acciones.abrir_whatsapp);
        document.getElementById('btn-enviar-correo').addEventListener('click', acciones.enviar_correo);
        document.getElementById('btn-volver-correo').addEventListener('click', acciones.volver_recibo);
        document.getElementById('btn-volver-correo-enviado').addEventListener('click', acciones.volver);
        document.getElementById('btn-whatsapp-correo-enviado').addEventListener('click', acciones.abrir_whatsapp);
        document.getElementById('btn-imprimir-correo-enviado').addEventListener('click', acciones.abrir_boleta);
        document.getElementById('btn-cancelar-whatsapp').addEventListener('click', acciones.volver_recibo);
        document.getElementById('btn-volver-whatsapp-preparado').addEventListener('click', acciones.volver);
        document.getElementById('btn-abrir-whatsapp-preparado').addEventListener('click', acciones.abrir_mensaje_whatsapp);
        document.getElementById('btn-correo-whatsapp-preparado').addEventListener('click', acciones.abrir_correo);
        document.getElementById('btn-descargar-whatsapp-preparado').addEventListener('click', acciones.descargar_boleta);
        document.getElementById('form-whatsapp-boleta').addEventListener('submit', (evento) =>
        {
            evento.preventDefault();
            acciones.preparar_whatsapp(document.getElementById('numero-whatsapp-boleta').value.trim());
        });
    },

    datos_registro: function ()
    {
        return {
            clave_usuario: document.getElementById('prestamo-usuario').value.trim(),
            id_ejemplar: document.getElementById('prestamo-ejemplar').value.trim().toUpperCase()
        };
    },

    enfocar_registro: function ()
    {
        document.getElementById('prestamo-usuario').focus();
    },

    mostrar: function (modo)
    {
        ['personal', 'registrar', 'validacion', 'recibo', 'boleta', 'correo', 'correo-enviado',
            'whatsapp', 'whatsapp-preparado', 'renovar', 'renovacion-validada',
            'espera', 'agregar-espera'].forEach((panel) =>
            document.getElementById('panel-' + panel).classList.toggle('hidden', panel !== modo));
        document.body.classList.toggle('boleta-imprimible', modo === 'boleta');
        document.getElementById('panel-mios').classList.add('hidden');
        document.getElementById('panel-pendientes').classList.add('hidden');
        const titulos = {
            personal: ['Préstamo de libros',
                'Registra préstamos, renovaciones y solicitudes de lista de espera.'],
            registrar: ['Registrar préstamo',
                '1. Identifica al solicitante y el ejemplar → 2. Valida → 3. Confirma y entrega el recibo.'],
            validacion: ['Préstamo autorizado',
                '2. Condiciones verificadas → 3. Confirma el préstamo y entrega el recibo.'],
            recibo: ['Préstamo registrado', 'Entrega el recibo al solicitante.'],
            boleta: ['Recibo para entrega',
                'Vista previa de impresión · Biblioteca Universidad Ducky.'],
            correo: ['Enviar boleta por correo', 'Revisa el destinatario antes de enviar la boleta.'],
            'correo-enviado': ['Boleta enviada por correo', 'Resend aceptó el correo del solicitante.'],
            whatsapp: ['Enviar boleta por WhatsApp',
                'Captura el celular del solicitante para preparar la boleta.'],
            'whatsapp-preparado': ['Boleta preparada para WhatsApp',
                'Completa el envío desde la aplicación de WhatsApp.'],
            renovar: ['Renovar préstamo',
                'Busca el préstamo activo con la clave del ejemplar y confirma el nuevo vencimiento.'],
            'renovacion-validada': ['Renovación autorizada',
                'Revisa el préstamo y confirma el nuevo vencimiento.'],
            espera: ['Lista de espera', 'Se avisa en orden cuando se devuelve un ejemplar.'],
            'agregar-espera': ['Agregar a lista de espera',
                'Registra al usuario cuando todos los ejemplares del libro están prestados.']
        };
        document.getElementById('titulo-prestamos').textContent = titulos[modo][0];
        document.getElementById('descripcion-prestamos').textContent = titulos[modo][1];
        ui.alerta('mensaje');
    },

    activos: function (lista)
    {
        const destino = document.getElementById('prestamos-activos');
        const cabecera = '<div class="circulation-row">Folio · Solicitante · Libro · Ejemplar · Vence · Estado</div>';
        destino.innerHTML = cabecera + (lista.length ? lista.map((prestamo) =>
            '<div class="circulation-row">PRE-' + ui.esc(prestamo.id_prestamo) + ' · ' +
            ui.esc(prestamo.solicitante) + ' · ' + ui.esc(prestamo.titulo) + ' · ' +
            ui.esc(prestamo.id_ejemplar) + ' · ' + ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
            (prestamo.fecha_vencimiento < ui.hoy() ? 'Vencido' : 'Activo') +
            (prestamo.renovaciones ? ' · ' + ui.esc(prestamo.renovaciones) + ' renovación(es)' : '') +
            '</div>').join('') : '<div class="circulation-row muted">No hay préstamos activos.</div>');
    },

    aviso_solicitud: function (solicitudes)
    {
        const destino = document.getElementById('aviso-solicitud');
        if (!solicitudes.length)
        {
            destino.innerHTML = '';
            return;
        }
        const primera = solicitudes[0];
        destino.innerHTML = '<div class="alert alert-info"><strong>Solicitud pendiente desde Buscar libros</strong>' +
            '<span>' + ui.esc(primera.usuario) + ' (' + ui.esc(primera.clave_usuario) +
            ') solicitó ' + ui.esc(primera.titulo) + '. ' +
            (primera.ejemplares.length ? 'Ejemplar disponible: ' +
                ui.esc(primera.ejemplares[0].id_ejemplar) + '.' :
                'No hay ejemplares disponibles.') + '</span></div>';
    },

    validacion: function (prestamo)
    {
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-validacion').innerHTML = [
            campo('Solicitante', prestamo.solicitante),
            campo('Matrícula o nómina', prestamo.clave_usuario),
            campo('Tipo de usuario', prestamo.tipo_usuario + ' · máximo ' +
                prestamo.max_ejemplares + ' libro(s)'),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Ubicación', (prestamo.ubicacion || 'Sin ubicación') + ' · ' + prestamo.tipo_uso),
            campo('Fecha de préstamo', ui.fecha(prestamo.fecha_prestamo)),
            campo('Vencimiento', ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
                prestamo.dias_prestamo + ' días hábiles')
        ].join('');
        document.getElementById('aviso-validacion').innerHTML =
            '<strong>Préstamo autorizado</strong><span>Usuario y ejemplar disponibles. ' +
            'Confirma la entrega para registrar el préstamo.</span>';
    },

    recibo: function (prestamo)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const folio = prestamo.folio_prestamo || 'PRE-' + prestamo.id_prestamo;
        document.getElementById('recibo-prestamo').innerHTML =
            '<h2>Recibo de préstamo</h2><div class="grid-2">' +
            campo('Folio', folio) + campo('Solicitante', prestamo.solicitante) +
            campo('Libro', prestamo.titulo) + campo('Ejemplar', prestamo.id_ejemplar) +
            campo('Fecha de préstamo', ui.fecha(prestamo.fecha_prestamo)) +
            campo('Vencimiento', ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
                prestamo.dias_prestamo + ' días hábiles') + '</div>';
        document.getElementById('descripcion-prestamos').textContent =
            'Registro confirmado · ' + ui.fecha(prestamo.fecha_prestamo) +
            '. La disponibilidad del libro se actualizó.';
        const disponibles = Number(prestamo.ejemplares_disponibles);
        const total = Number(prestamo.ejemplares_total);
        const resumen = Number.isFinite(disponibles) && Number.isFinite(total) &&
            prestamo.ejemplares_disponibles !== undefined && prestamo.ejemplares_total !== undefined ?
            ui.esc(prestamo.titulo) + ' queda con ' + disponibles + ' de ' + total +
                ' ejemplares disponibles. Entrega el recibo al usuario.' :
            'El préstamo quedó registrado. Entrega el recibo al usuario.';
        document.getElementById('aviso-entrega').innerHTML =
            '<strong>Ejemplar entregado</strong><span>' + resumen + '</span>';
        document.getElementById('aviso-entrega').classList.remove('hidden');
        document.getElementById('btn-otro-prestamo').classList.remove('hidden');
        document.getElementById('btn-imprimir-recibo').textContent = 'Imprimir boleta';
        document.getElementById('btn-correo-boleta').classList.remove('hidden');
        document.getElementById('btn-whatsapp-boleta').classList.remove('hidden');
    },

    boleta: function (prestamo)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        const folio = prestamo.folio_prestamo || 'PRE-' + prestamo.id_prestamo;
        document.getElementById('boleta-prestamo').innerHTML =
            '<h2>Recibo de préstamo</h2><div class="grid-2">' +
            campo('Folio', folio) + campo('Solicitante', prestamo.solicitante) +
            campo('Matrícula o nómina', prestamo.clave_usuario) +
            campo('Libro', prestamo.titulo) + campo('Ejemplar', prestamo.id_ejemplar) +
            campo('Vencimiento', ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
                prestamo.dias_prestamo + ' días hábiles') + '</div>';
        document.getElementById('aviso-boleta').innerHTML =
            '<strong>Recuerda la fecha de vencimiento</strong><span>Cada día natural de atraso ' +
            'genera una multa de ' + ui.dinero(prestamo.multa_diaria) +
            '. Puedes renovar el préstamo antes de que venza.</span>';
    },

    imprimir: function ()
    {
        window.print();
    },

    correo: function (prestamo)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-correo-boleta').innerHTML =
            campo('Folio', prestamo.folio_prestamo) +
            campo('Solicitante', prestamo.solicitante) +
            campo('Destinatario', prestamo.correo || 'Sin correo registrado') +
            campo('Asunto', 'Boleta de préstamo · Biblioteca Ducky') +
            campo('Adjunto', 'Boleta de préstamo en PDF') +
            campo('Vencimiento', ui.fecha(prestamo.fecha_vencimiento) + ' · ' +
                prestamo.dias_prestamo + ' días hábiles');
        document.getElementById('btn-enviar-correo').disabled = !prestamo.correo;
    },

    correo_enviado: function (prestamo)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-correo-enviado').innerHTML =
            campo('Folio', prestamo.folio_prestamo) +
            campo('Solicitante', prestamo.solicitante) +
            campo('Medio', 'Correo institucional') + campo('Estado', 'Enviado');
    },

    enviando_correo: function (enviando)
    {
        const boton = document.getElementById('btn-enviar-correo');
        boton.disabled = enviando;
        boton.textContent = enviando ? 'Enviando…' : 'Enviar boleta';
    },

    error_whatsapp: function (mostrar)
    {
        document.getElementById('error-whatsapp-boleta').classList.toggle('hidden', !mostrar);
        document.getElementById('numero-whatsapp-boleta').setAttribute('aria-invalid', String(mostrar));
    },

    whatsapp_preparado: function (prestamo, numero)
    {
        const campo = (etiqueta, valor) => '<div class="field"><span class="label">' +
            ui.esc(etiqueta) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-whatsapp-preparado').innerHTML =
            campo('Folio', prestamo.folio_prestamo) +
            campo('Solicitante', prestamo.solicitante) +
            campo('WhatsApp', numero) + campo('Estado', 'Pendiente de envío manual');
    },

    descargar_pdf: function (contenido, folio)
    {
        const url = URL.createObjectURL(contenido);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'Boleta-' + folio + '.pdf';
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    },

    abrir_mensaje_whatsapp: function (numero, prestamo)
    {
        const mensaje = 'Biblioteca Ducky: boleta ' + prestamo.folio_prestamo +
            '. El préstamo de ' + prestamo.titulo + ' vence el ' +
            ui.fecha(prestamo.fecha_vencimiento) + '. Adjuntaré el PDF de la boleta.';
        return window.open('https://wa.me/52' + numero + '?text=' + encodeURIComponent(mensaje),
            '_blank', 'noopener,noreferrer');
    },

    renovacion: function (datos)
    {
        const prestamo = datos.prestamo;
        const resultado = datos.resultado;
        const campo = (titulo, valor) => '<div class="field"><span class="label">' +
            ui.esc(titulo) + '</span><div class="readonly">' + ui.esc(valor) + '</div></div>';
        document.getElementById('datos-renovacion').innerHTML = [
            campo('Solicitante', prestamo.solicitante + ' · ' + prestamo.clave_usuario),
            campo('Libro', prestamo.titulo),
            campo('Ejemplar', prestamo.id_ejemplar),
            campo('Vencimiento anterior', ui.fecha(resultado.vencimiento_anterior)),
            campo('Nuevo vencimiento', ui.fecha(resultado.vencimiento_nuevo)),
            campo('Renovaciones', (prestamo.renovaciones + 1) + ' de ' + prestamo.max_renovaciones)
        ].join('');
        document.getElementById('aviso-renovacion').innerHTML = '<strong>Renovación autorizada</strong>' +
            '<span>La base de datos verificó el máximo permitido para este usuario.</span>';
    },

    recibo_renovacion: function (datos)
    {
        document.getElementById('titulo-prestamos').textContent = 'Renovación registrada';
        document.getElementById('descripcion-prestamos').textContent =
            'Entrega el comprobante con el nuevo vencimiento.';
        document.getElementById('recibo-prestamo').innerHTML = '<h2>Renovación registrada</h2>' +
            '<p><strong>Préstamo:</strong> PRE-' + ui.esc(datos.prestamo.id_prestamo) +
            '</p><p><strong>Libro:</strong> ' + ui.esc(datos.prestamo.titulo) +
            '</p><p><strong>Nuevo vencimiento:</strong> ' +
            ui.fecha(datos.resultado.vencimiento_nuevo) + '</p>';
        document.getElementById('aviso-entrega').classList.add('hidden');
        document.getElementById('btn-otro-prestamo').classList.add('hidden');
        document.getElementById('btn-imprimir-recibo').textContent = 'Imprimir comprobante';
        document.getElementById('btn-correo-boleta').classList.add('hidden');
        document.getElementById('btn-whatsapp-boleta').classList.add('hidden');
    },

    lista_espera: function (datos)
    {
        const destino = document.getElementById('lista-espera');
        document.getElementById('descripcion-prestamos').textContent = datos.libro.titulo + ' · ' +
            datos.libro.id_libro + ' · ' + datos.libro.disponibles + ' de ' + datos.libro.total +
            ' ejemplares disponibles. Se avisa en orden cuando se devuelve un ejemplar.';
        destino.innerHTML = '<div class="circulation-row">Posición · Clave · Nombre · Fecha de solicitud · Estado</div>' +
            (datos.solicitudes.length ? datos.solicitudes.map((registro, indice) =>
                '<div class="circulation-row">' + (indice + 1) + ' · ' +
                ui.esc(registro.clave_usuario) + ' · ' + ui.esc(registro.nombre) + ' · ' +
                ui.fecha_hora(registro.fecha_registro) + ' · ' + ui.esc(registro.estatus) +
                '</div>').join('') :
                '<div class="circulation-row muted">Aún no hay solicitudes en espera.</div>');
    },

    libro_espera: function ()
    {
        return document.getElementById('espera-libro').value.trim().toUpperCase();
    },

    entrada_espera: function ()
    {
        const id = new URLSearchParams(window.location.search).get('espera');
        return id && /^[A-Z0-9]{7}$/.test(id) ? id : null;
    },

    prellenar_espera: function (id_libro)
    {
        document.getElementById('espera-libro').value = id_libro;
    },

    preparar_espera: function ()
    {
        document.getElementById('espera-libro-registro').value = this.libro_espera();
    },

    mios: function (datos)
    {
        ui.tabla('mis-prestamos', [
            { titulo: 'Libro', valor: (prestamo) => ui.esc(prestamo.titulo) },
            { titulo: 'Ejemplar', valor: (prestamo) => ui.esc(prestamo.id_ejemplar) },
            { titulo: 'Inicio', valor: (prestamo) => ui.fecha(prestamo.fecha_prestamo) },
            { titulo: 'Vence', valor: (prestamo) => ui.fecha(prestamo.fecha_vencimiento) },
            { titulo: 'Estado', valor: (prestamo) => prestamo.fecha_vencimiento < ui.hoy() ?
                ui.badge('Vencido') : ui.badge(prestamo.estatus) }
        ], datos.prestamos, { vacio: 'No tienes préstamos activos' });
        ui.tabla('mis-solicitudes', [
            { titulo: 'Folio', valor: (solicitud) => ui.esc(solicitud.folio) },
            { titulo: 'Libro', valor: (solicitud) => ui.esc(solicitud.titulo) },
            { titulo: 'Fecha', valor: (solicitud) => ui.fecha_hora(solicitud.fecha_solicitud) },
            { titulo: 'Estado', valor: (solicitud) => ui.badge(solicitud.estatus) }
        ], datos.solicitudes, { vacio: 'Todavía no tienes solicitudes de préstamo' });
    },

    pendientes: function (solicitudes, al_autorizar)
    {
        ui.tabla('solicitudes-pendientes', [
            { titulo: 'Folio', valor: (solicitud) => ui.esc(solicitud.folio) },
            { titulo: 'Usuario', valor: (solicitud) => ui.esc(solicitud.usuario) +
                '<div class="small muted">' + ui.esc(solicitud.clave_usuario) + '</div>' },
            { titulo: 'Libro', valor: (solicitud) => ui.esc(solicitud.titulo) },
            { titulo: 'Fecha', valor: (solicitud) => ui.fecha_hora(solicitud.fecha_solicitud) },
            { titulo: 'Autorizar', valor: (solicitud) =>
                solicitud.ejemplares.length ?
                    '<div class="row-actions"><label for="ejemplar-' +
                    ui.esc(solicitud.folio) + '">Ejemplar</label><select id="ejemplar-' +
                    ui.esc(solicitud.folio) + '" data-ejemplar="' + ui.esc(solicitud.folio) +
                    '">' + solicitud.ejemplares.map((ejemplar) => '<option value="' +
                    ui.esc(ejemplar.id_ejemplar) + '">' + ui.esc(ejemplar.id_ejemplar) +
                    '</option>').join('') + '</select><button class="btn btn-sm btn-primary" data-autorizar="' +
                    ui.esc(solicitud.folio) + '">Autorizar préstamo</button></div>' :
                    '<span class="muted">Sin ejemplares disponibles</span>' }
        ], solicitudes, { vacio: 'No hay solicitudes pendientes' });
        document.querySelectorAll('[data-autorizar]').forEach((boton) =>
            boton.addEventListener('click', async () =>
            {
                const folio = Number(boton.dataset.autorizar);
                const seleccion = document.querySelector('[data-ejemplar="' + folio + '"]');
                if (!seleccion) return;
                const id_ejemplar = seleccion.value;
                const confirmo = await ui.dialogo({
                    titulo: 'Autorizar préstamo ' + folio,
                    texto: 'Confirma que entregaste el ejemplar ' + id_ejemplar +
                        ' al usuario en mostrador. Se registrará el préstamo y la fecha de vencimiento.',
                    confirmar: 'Confirmar entrega'
                });
                if (confirmo) al_autorizar(folio, id_ejemplar);
            }));
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
