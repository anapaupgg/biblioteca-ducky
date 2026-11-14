/******************************************************************/
/* Program Assignment: Biblioteca Ducky - Sistema web             */
/* Name: Equipo FlowBit                                           */
/* Date: 2026-11-14                                               */
/* Description: Listado, vista previa y preparación de impresión. */
/******************************************************************/

/******************************************************************/
/* Listing Contents: enlazar, bloquear, vaciar, tabla, mostrar,   */
/* descargar_pdf, mensaje.                                        */
/* Reuse Instructions: cargar después de ui; recibir filas de    */
/* catálogo activo ordenadas. No consultar la API desde la vista. */
/******************************************************************/

const lista_libros_view =
{
    enlazar: function (acciones)
    {
        document.getElementById('btn-generar-pdf').addEventListener('click', acciones.vista_pdf);
        document.getElementById('btn-preparar-impresion').addEventListener('click', acciones.impresion);
        document.getElementById('btn-volver-listado').addEventListener('click', acciones.listado);
        document.getElementById('btn-descargar-pdf').addEventListener('click', acciones.descargar);
        document.getElementById('btn-preparar-desde-pdf').addEventListener('click', acciones.impresion);
        document.getElementById('btn-volver-desde-impresion').addEventListener('click', acciones.listado);
        document.getElementById('btn-cancelar-impresion').addEventListener('click', acciones.vista_pdf);
        document.getElementById('btn-imprimir').addEventListener('click', () => window.print());
        document.getElementById('btn-cambiar-impresora').addEventListener('click', () => window.print());
    },

    bloquear: function (bloqueado)
    {
        ['btn-generar-pdf', 'btn-preparar-impresion', 'btn-descargar-pdf',
            'btn-preparar-desde-pdf', 'btn-imprimir'].forEach((id) =>
            { document.getElementById(id).disabled = bloqueado; });
    },

    vaciar: function ()
    {
        ['tabla', 'generado', 'documento-listado', 'documento-impresion'].forEach((id) =>
            { document.getElementById(id).textContent = ''; });
    },

    tabla: function (libros)
    {
        const registro = (libro) => [libro.titulo, libro.autores || '—', libro.tema || '—',
            libro.id_libro, libro.isbn || '—', libro.editorial || '—',
            libro.condicion || 'Sin ejemplares'].map(ui.esc).join(' · ');
        const filas = libros.map((libro) => '<div class="catalog-list-row">' +
            registro(libro) + '</div>').join('');
        document.getElementById('tabla').innerHTML =
            '<div class="catalog-list-row">Título · Autor · Tema · Clave · ISBN · Editorial · Condición</div>' +
            (filas || '<div class="catalog-list-row muted">No hay libros activos.</div>');
        document.getElementById('generado').textContent = libros.length + ' registros';

        const fecha = new Date().toLocaleDateString('es-MX', { day: 'numeric',
            month: 'long', year: 'numeric' });
        const contenido = '<h2>UNIVERSIDAD DUCKY</h2>' +
            '<p>Biblioteca universitaria · Listado de libros</p>' +
            '<p class="small muted">' + ui.esc(fecha) + ' · Orden: título ascendente</p>' +
            (libros.map((libro) => '<div class="catalog-document-book"><strong>' +
                ui.esc(libro.titulo) + '</strong><span>' + ui.esc(libro.autores || 'Sin autor') +
                ' · ISBN ' + ui.esc(libro.isbn || '—') + '</span><span>' +
                ui.esc(libro.tema || '—') + ' · ' + ui.esc(libro.editorial || '—') +
                ' · ' + ui.esc(libro.id_libro) + ' · ' +
                ui.esc(libro.condicion || 'Sin ejemplares') + '</span></div>').join('') ||
                '<p>No hay libros activos.</p>') +
            '<p class="small muted">' + libros.length + ' registros</p>';
        document.getElementById('documento-listado').innerHTML = contenido;
        document.getElementById('documento-impresion').innerHTML = contenido;
    },

    mostrar: function (modo)
    {
        document.getElementById('panel-listado').classList.toggle('hidden', modo !== 'listado');
        document.getElementById('panel-pdf').classList.toggle('hidden', modo !== 'pdf');
        document.getElementById('panel-impresion').classList.toggle('hidden', modo !== 'impresion');
        const titulos = {
            listado: ['Lista de libros', 'Lista organizada del acervo · acervo activo'],
            pdf: ['Vista previa del PDF', 'Listado del acervo · acervo activo · Título ascendente'],
            impresion: ['Preparar impresión', 'Listado del acervo · acervo activo · Título ascendente']
        };
        document.getElementById('titulo-listado').textContent = titulos[modo][0];
        document.getElementById('descripcion-listado').textContent = titulos[modo][1];
        document.body.classList.toggle('listado-imprimible', modo === 'impresion');
        ui.alerta('mensaje');
        window.scrollTo(0, 0);
    },

    descargar_pdf: function (contenido)
    {
        const url = URL.createObjectURL(contenido);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = 'Listado-biblioteca.pdf';
        enlace.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    },

    mensaje: function (tipo, titulo, texto)
    {
        ui.alerta('mensaje', tipo, titulo, texto);
    }
};
