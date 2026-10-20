/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-10-20                                               */
/* Description: Vista de buscar.html.                             */
/******************************************************************/

/******************************************************************/
/* Listing Contents:                                              */
/*   BuscarView.filtros()               - Filter values           */
/*   BuscarView.limpiar_filtros()       - Clear filters           */
/*   BuscarView.resultados(lista, acc)  - Result cards            */
/*   BuscarView.ficha(f)                - Public ficha dialog     */
/*   BuscarView.solicitud(r)            - Request confirmation    */
/******************************************************************/

const FILTROS_BUSQUEDA = ['titulo', 'autor', 'tema', 'clave', 'isbn', 'editorial'];

const BuscarView =
{
    filtros: function() { return Ui.leer(FILTROS_BUSQUEDA); },

    limpiar_filtros: function()
    {
        FILTROS_BUSQUEDA.forEach((id) => { document.getElementById(id).value = ''; });
        Ui.limpiar();
        document.getElementById('resultados').innerHTML = '';
        Ui.alerta('mensaje');
        document.getElementById('titulo').focus();
    },

    resultados: function(lista, filtros, acciones)
    {
        const resumen = Object.entries(filtros).filter(([, v]) => v).map(([k, v]) => k + ': ' + v).join(' · ');
        if (lista.length === 0)
        {
            document.getElementById('resultados').innerHTML = '';
            Ui.alerta('mensaje', 'warning', 'No se encontraron coincidencias', 'Revisa los filtros (' + resumen + ') o intenta con menos datos.');
            return;
        }
        Ui.alerta('mensaje', 'info', 'Resultados de búsqueda', resumen + ' · ' + lista.length + ' resultado(s) activos.');

        const lectura = (t, v) => '<div class="field"><span class="label">' + t + '</span><div class="readonly">' + Ui.esc(v) + '</div></div>';
        document.getElementById('resultados').innerHTML = lista.map((l, i) =>
        {
            const digital = l.formato === 'Digital';
            let acciones_html = '<button class="btn" data-ficha="' + i + '">Ver ficha bibliográfica</button>';
            if (digital) acciones_html = '<a class="btn btn-primary" href="' + Ui.esc(l.enlace_digital) + '" target="_blank" rel="noopener">Consultar en línea</a>' + acciones_html;
            else if (l.disponibles_prestamo > 0) acciones_html = '<button class="btn btn-primary" data-solicitar="' + i + '">Solicitar préstamo</button>' + acciones_html;

            return '<div class="card"><h2>' + Ui.esc(l.titulo) + (digital ? ' · Recurso en línea' : '') + '</h2><div class="grid-2">' +
                lectura('Clave / ISBN', l.id_libro + ' / ' + l.isbn) + lectura('Autor', l.autores || '—') +
                lectura('Editorial / formato', l.editorial + ' / ' + l.formato) + lectura('Tema', l.tema) +
                (digital ? lectura('Enlace', l.enlace_digital) :
                    lectura('Ubicación (estante / fila)', l.ubicaciones || '—') +
                    lectura('Disponibles para préstamo', l.disponibles_prestamo + ' de ' + l.ejemplares + (l.prestados ? ' · ' + l.prestados + ' prestado(s)' : ''))) +
                '</div>' + (!digital && l.disponibles_prestamo === 0
                    ? '<div class="alert alert-warning"><strong>Todos los ejemplares están prestados o reservados</strong><span>Consulta la ficha para ver cuándo se devuelve cada ejemplar.</span></div>' : '') +
                '<div class="actions" style="margin-bottom:0">' + acciones_html + '</div></div>';
        }).join('');

        const en = (attr, fn) => document.querySelectorAll('[' + attr + ']').forEach((b) =>
            b.addEventListener('click', () => fn(lista[Number(b.getAttribute(attr))])));
        en('data-solicitar', acciones.solicitar);
        en('data-ficha', acciones.ficha);
    },

    ficha: function(f)
    {
        const l = f.libro;
        const dialogo = Ui.dialogo(
        {
            titulo: l.titulo,
            texto: (l.autores || '') + ' · ' + l.editorial + ' · ' + (l.anio_publicacion || '') + (l.edicion ? ' · ' + l.edicion + ' edición' : ''),
            cuerpo: '<p>' + Ui.esc(l.sinopsis || 'Sin sinopsis.') + '</p><div id="ficha-ejemplares"></div>',
            confirmar: 'Cerrar', cancelar: false
        });
        /* The dialog is already in the DOM: draw its copies table */
        Ui.tabla('ficha-ejemplares',
        [
            { titulo: 'Ejemplar',  valor: (e) => Ui.esc(e.id_ejemplar) },
            { titulo: 'Ubicación', valor: (e) => Ui.esc(e.ubicacion || 'En línea') },
            { titulo: 'Uso',       valor: (e) => Ui.esc(e.tipo_uso) },
            { titulo: 'Estatus',   valor: (e) => Ui.badge(e.estatus) + (e.disponible_desde ? '<div class="small muted">vuelve ' + Ui.fecha(e.disponible_desde) + '</div>' : '') }
        ], f.ejemplares);
        return dialogo;
    },

    solicitud: function(r)
    {
        return Ui.dialogo(
        {
            titulo: 'Solicitud registrada',
            texto: r.mensaje,
            cuerpo: '<div class="alert alert-ok"><strong>Folio ' + Ui.esc(r.folio) + ' · ' + Ui.esc(r.libro) + '</strong>' +
                    '<span>' + Ui.fecha_hora(r.fecha) + '. El bibliotecario confirmará tu préstamo al entregarte el libro.</span></div>',
            confirmar: 'Entendido', cancelar: false
        });
    },

    mensaje: function(tipo, titulo, texto) { Ui.alerta('mensaje', tipo, titulo, texto); }
};
