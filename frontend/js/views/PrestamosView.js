/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-30                                               */
/* Description: Presentación y eventos de préstamos.              */
/******************************************************************/

/******************************************************************/
/* Listing Contents: configurar, mios, pendientes, mensaje.       */
/* Reuse Instructions: cargar después de ui; callbacks reciben    */
/* folio y ejemplar. Todos los datos externos se escapan.        */
/******************************************************************/

const prestamos_view =
{
    configurar: function (ver_mios, ver_pendientes)
    {
        document.getElementById('panel-mios').classList.toggle('hidden', !ver_mios);
        document.getElementById('panel-pendientes').classList.toggle('hidden', !ver_pendientes);
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
