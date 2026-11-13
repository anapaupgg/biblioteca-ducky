/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-13                                               */
/* Description: Estados móviles de ficha, ubicación y lectura.   */
/******************************************************************/

/******************************************************************/
/* Listing Contents: iniciar, activo, mostrar, resultados, ficha, */
/* ubicacion, no_disponible, digital, lector y solicitud.          */
/* Reuse Instructions: cargar después de BuscarView y antes del   */
/* controlador. Recibe datos de la API; escapa todo texto externo. */
/* Los callbacks coordinan navegación y escrituras desde el      */
/* controlador; esta vista no llama a la API.                     */
/******************************************************************/

const buscar_movil_view =
{
    acciones: {},

    iniciar: function (acciones)
    {
        this.acciones = acciones;
        document.getElementById('detalle-movil').addEventListener('click', (evento) =>
        {
            const boton = evento.target.closest('[data-accion-movil]');
            const accion = boton && boton.dataset.accionMovil;
            if (accion && this.acciones[accion]) this.acciones[accion]();
        });
    },

    activo: function ()
    {
        return window.matchMedia('(max-width: 600px)').matches ||
            document.body.classList.contains('search-mobile-preview');
    },

    mostrar: function (tipo, titulo, subtitulo, volver, contenido)
    {
        document.body.classList.remove('search-results-mobile', 'search-state-mobile',
            'search-state-empty', 'search-state-invalid');
        document.body.classList.add('search-detail-mobile');
        document.getElementById('detalle-movil').dataset.estado = tipo;
        document.getElementById('titulo-detalle-movil').textContent = titulo;
        document.getElementById('subtitulo-detalle-movil').textContent = subtitulo;
        const boton = document.getElementById('btn-volver-detalle-movil');
        boton.classList.toggle('hidden', !volver);
        if (volver)
        {
            boton.textContent = volver.texto;
            boton.dataset.accionMovil = volver.accion;
        }
        document.getElementById('contenido-detalle-movil').innerHTML = contenido;
        window.scrollTo(0, 0);
    },

    resultados: function ()
    {
        document.body.classList.remove('search-detail-mobile');
        document.body.classList.add('search-results-mobile');
        window.scrollTo(0, 0);
    },

    ficha: function (datos)
    {
        const libro = datos.libro;
        if (libro.formato === 'Digital') return this.digital(datos);
        const prestados = datos.ejemplares.filter((copia) => copia.estatus === 'Prestado').length;
        const ubicables = datos.ejemplares.some((copia) => copia.ubicacion);
        const total = Number(libro.ejemplares || datos.ejemplares.length);
        const disponibles = Number(libro.disponibles_prestamo || 0);
        const boton = (texto, accion, principal) => '<button class="btn' +
            (principal ? ' btn-primary' : '') + '" type="button" data-accion-movil="' +
            accion + '">' + texto + '</button>';
        const contenido = '<h2>' + ui.esc(libro.titulo) + '</h2>' +
            '<p>' + ui.esc(libro.autores || '—') + '<br>ISBN ' + ui.esc(libro.isbn) +
            '<br>' + ui.esc(libro.editorial) + ' · Tema: ' + ui.esc(libro.tema) +
            '<br>Clave: ' + ui.esc(libro.id_libro) + '</p>' +
            '<strong>Sinopsis</strong><p>' + ui.esc(libro.sinopsis || 'Sin sinopsis.') +
            '</p><p class="search-mobile-availability">' + total +
            (total === 1 ? ' copia · ' : ' copias · ') + disponibles +
            (disponibles === 1 ? ' disponible · ' : ' disponibles · ') + prestados +
            (prestados === 1 ? ' prestada' : ' prestadas') + '</p>' +
            (ubicables ? boton('Ver ubicación', 'ubicacion', true) : '') +
            (disponibles > 0 ? boton('Solicitar préstamo', 'solicitar', false) : '') +
            (prestados > 0 ? boton('Ver ejemplar prestado', 'prestado', false) : '');
        this.mostrar('ficha', 'Ficha del libro', 'Información bibliográfica y disponibilidad.',
            { texto: 'Volver a resultados', accion: 'resultados' }, contenido);
    },

    ubicacion: function (datos)
    {
        const copias = datos.ejemplares.filter((copia) => copia.ubicacion);
        const disponible = copias.find((copia) => copia.estatus === 'Disponible' &&
            copia.tipo_uso === 'Préstamo externo');
        const copia = disponible || copias[0];
        if (!copia) return this.ficha(datos);
        const zonas = datos.ubicaciones?.length ? datos.ubicaciones.map((zona) =>
            zona.seccion + ' · ' + zona.estante + ' / ' + zona.fila) :
            [...new Set(copias.map((registro) => registro.ubicacion))];
        const contenido = '<h2>Ubicación: ' + ui.esc(copia.ubicacion) + '</h2>' +
            '<p class="search-mobile-location-copy">Ejemplar ' + ui.esc(copia.id_ejemplar) +
            ' · ' + ui.esc(copia.condicion) + '<br>Ubicación: ' +
            ui.esc(copia.ubicacion) + '</p>' +
            '<div class="card search-mobile-location-zones"><h2>Zona de estanterías</h2>' +
            zonas.map((zona) => '<div class="search-mobile-zone' +
                (zona === copia.ubicacion ? ' selected' : '') + '">' + ui.esc(zona) +
                '</div>').join('') + '</div>' +
            '<p class="search-mobile-note">Consulta la señalización y localiza el estante ' +
            'y la fila indicados arriba.</p>' +
            (disponible ? '<button class="btn btn-primary" type="button" ' +
                'data-accion-movil="solicitar">Solicitar este ejemplar</button>' : '');
        this.mostrar('ubicacion', 'Ubicación en biblioteca', datos.libro.id_libro,
            { texto: 'Volver a la ficha', accion: 'ficha' }, contenido);
    },

    no_disponible: function (datos)
    {
        const copia = datos.ejemplares.find((registro) => registro.estatus === 'Prestado');
        if (!copia) return this.ficha(datos);
        const contenido = '<h2>' + ui.esc(datos.libro.titulo) + '</h2><p>Ejemplar ' +
            ui.esc(copia.id_ejemplar) + '<br>Estado: ' + ui.esc(copia.estatus) +
            '<br>Devolución prevista: ' + ui.esc(ui.fecha(copia.disponible_desde)) + '</p>' +
            '<p class="search-mobile-unavailable">Este ejemplar no está disponible para ' +
            'préstamo.</p><button class="btn" type="button" disabled>Préstamo no disponible' +
            '</button><button class="btn" type="button" data-accion-movil="ficha">' +
            'Consultar otras copias</button>';
        this.mostrar('no-disponible', 'Sin ejemplares disponibles',
            'Consulta la fecha prevista de devolución.',
            { texto: 'Volver a resultados', accion: 'resultados' }, contenido);
    },

    digital: function (datos)
    {
        const libro = datos.libro;
        const contenido = '<h2>' + ui.esc(libro.titulo) + '</h2><p>' +
            ui.esc(libro.autores || '—') + ' · ' + ui.esc(libro.editorial) +
            '<br>ISBN ' + ui.esc(libro.isbn) + '<br>Clave: ' + ui.esc(libro.id_libro) +
            ' · Formato: Digital</p><strong>Sinopsis</strong><p>' +
            ui.esc(libro.sinopsis || 'Sin sinopsis.') + '</p>' +
            '<p class="search-mobile-availability">Disponible en línea</p>' +
            '<button class="btn btn-primary" type="button" data-accion-movil="lector">' +
            'Abrir libro digital</button>';
        this.mostrar('digital', 'Libro digital', 'Disponible para consulta en línea.',
            { texto: 'Volver a resultados', accion: 'resultados' }, contenido);
    },

    lector: function (datos)
    {
        const libro = datos.libro;
        let enlace = null;
        try
        {
            const url = new URL(libro.enlace_digital, window.location.origin);
            if (url.protocol === 'https:' || url.origin === window.location.origin) enlace = url.href;
        }
        catch
        {
            enlace = null;
        }
        const contenido = '<h2>' + ui.esc(libro.titulo) + '</h2>' +
            '<p class="search-mobile-note">Consulta el recurso digital de la ficha.</p>' +
            '<div class="card search-mobile-reader-card"><h2>Recurso digital</h2>' +
            '<p>El contenido se obtiene del enlace registrado para este libro.</p>' +
            (enlace ? '<a class="btn btn-primary" href="' + ui.esc(enlace) +
                '" target="_blank" rel="noopener noreferrer">Abrir recurso</a>' :
                '<p>El enlace de consulta no está disponible.</p>') + '</div>';
        this.mostrar('lector', 'Consulta digital', 'Vista de lectura del libro digital.',
            { texto: 'Cerrar lectura', accion: 'ficha' }, contenido);
    },

    solicitud: function (resultado, datos)
    {
        const contenido = '<p>' + ui.esc(datos.libro.titulo) + '<br>Folio ' +
            ui.esc(resultado.folio) + '<br>Estado: Solicitud pendiente de atención</p>' +
            '<p class="search-mobile-note">La solicitud no confirma la entrega física ' +
            'del libro. El personal asignará un ejemplar disponible.</p>' +
            '<button class="btn btn-primary" type="button" data-accion-movil="ficha">' +
            'Volver a la ficha</button><button class="btn" type="button" ' +
            'data-accion-movil="buscar-otro">Buscar otro libro</button>';
        this.mostrar('solicitud', 'Solicitud registrada',
            'Presenta esta solicitud al personal de biblioteca.', null, contenido);
    }
};
